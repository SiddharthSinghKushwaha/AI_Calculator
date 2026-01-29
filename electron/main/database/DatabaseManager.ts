import initSqlJs, { Database } from 'sql.js'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export interface HistoryEntry {
    id?: number
    expression: string
    result: string
    mode: 'standard' | 'scientific' | 'programmer'
    timestamp: number
    is_pinned: number
    session_id?: number
    created_at?: string
}

export interface Setting {
    key: string
    value: string
    updated_at?: string
}

export interface MemorySlot {
    slot_name: string
    value: string
    created_at?: string
}

export interface Session {
    id?: number
    name: string
    created_at?: string
    is_default: number
}

export interface Variable {
    id?: number
    session_id: number
    name: string
    value: string
    created_at?: string
}

export class DatabaseManager {
    private db: Database | null = null
    private dbPath: string
    private SQL: any = null

    constructor(userDataPath: string) {
        const dbDir = path.join(userDataPath, 'data')
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true })
        }
        this.dbPath = path.join(dbDir, 'calculator.db')
    }

    async initialize(): Promise<void> {
        // Initialize SQL.js with local WASM file
        let wasmBuffer: Buffer;
        try {
            if (app.isPackaged) {
                // In production, resources are in resources/app.asar/dist/assets
                wasmBuffer = fs.readFileSync(path.join(__dirname, '../dist/assets/sql-wasm.wasm'))
            } else {
                // In development, use the wasm file from node_modules
                // __dirname is dist-electron, so we go up one level to project root
                const projectRoot = path.join(__dirname, '..')
                const wasmPath = path.join(projectRoot, 'node_modules/sql.js/dist/sql-wasm.wasm')
                wasmBuffer = fs.readFileSync(wasmPath)
            }
        } catch (error) {
            console.error('Failed to load WASM file:', error)
            // Fallback to trying multiple locations
            if (app.isPackaged) {
                try {
                    wasmBuffer = fs.readFileSync(path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'assets', 'sql-wasm.wasm'))
                } catch (e) {
                    throw error
                }
            } else {
                // Try public/assets as last resort
                try {
                    const publicPath = path.join(__dirname, '../../public/assets/sql-wasm.wasm')
                    wasmBuffer = fs.readFileSync(publicPath)
                } catch (e) {
                    throw error
                }
            }
        }

        // Convert the Node.js Buffer to an ArrayBuffer suitable for sql.js
        const wasmArrayBuffer = Uint8Array.from(wasmBuffer).buffer;

        this.SQL = await initSqlJs({
            wasmBinary: wasmArrayBuffer
        });

        // Load existing database or create new one
        if (fs.existsSync(this.dbPath)) {
            const buffer = fs.readFileSync(this.dbPath)
            this.db = new this.SQL.Database(buffer)
        } else {
            this.db = new this.SQL.Database()
        }

        this.createTables()
        this.runMigrations()
        this.saveDatabase()
        this.createBackup()
    }

    private saveDatabase(): void {
        if (!this.db) return
        const data = this.db.export()
        const buffer = Buffer.from(data)
        fs.writeFileSync(this.dbPath, buffer)
    }

    private createTables(): void {
        if (!this.db) return

        // Sessions table
        this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

        this.db.run(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expression TEXT NOT NULL,
        result TEXT NOT NULL,
        mode TEXT NOT NULL CHECK(mode IN ('standard', 'scientific', 'programmer')),
        timestamp INTEGER NOT NULL,
        is_pinned INTEGER DEFAULT 0,
        session_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
      )
    `)

        this.db.run(`CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC)`)
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_history_pinned ON history(is_pinned) WHERE is_pinned = 1`)
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_history_session ON history(session_id)`)

        this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

        this.db.run(`
      CREATE TABLE IF NOT EXISTS memory (
        slot_name TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

        this.db.run(`
      CREATE TABLE IF NOT EXISTS variables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, name),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `)

        this.db.run(`CREATE INDEX IF NOT EXISTS idx_variables_session ON variables(session_id)`)

        this.db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

        this.initializeDefaultSettings()
        this.initializeDefaultSession()
        this.saveDatabase()
    }

    private initializeDefaultSettings(): void {
        if (!this.db) return

        const defaults = [
            { key: 'theme', value: 'system' },
            { key: 'scatteredKeypad', value: 'false' },
            { key: 'calculationMode', value: 'standard' },
            { key: 'numberFormat', value: 'international' },
            { key: 'ghostMode', value: 'false' },
        ]

        for (const setting of defaults) {
            this.db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, [setting.key, setting.value])
        }

        this.saveDatabase()
    }

    private initializeDefaultSession(): void {
        if (!this.db) return

        // Create default session if it doesn't exist
        this.db.run(`INSERT OR IGNORE INTO sessions (id, name, is_default) VALUES (1, 'Default', 1)`)
        this.saveDatabase()
    }

    private runMigrations(): void {
        if (!this.db) return

        const result = this.db.exec('SELECT MAX(version) as version FROM migrations')
        const currentVersion = result[0]?.values[0]?.[0] as number || 0
        const targetVersion = 2

        // Migration 1: Initial schema (already applied in createTables)
        if (currentVersion < 1) {
            this.db.run('INSERT OR IGNORE INTO migrations (version) VALUES (1)')
        }

        // Migration 2: Add sessions and variables
        if (currentVersion < 2) {
            // Check if session_id column exists in history table
            const tableInfo = this.db.exec("PRAGMA table_info(history)")
            const hasSessionId = tableInfo[0]?.values.some((row: any) => row[1] === 'session_id')

            if (!hasSessionId) {
                // Add session_id column to existing history table
                this.db.run('ALTER TABLE history ADD COLUMN session_id INTEGER')

                // Update existing history entries to use default session (id=1)
                this.db.run('UPDATE history SET session_id = 1 WHERE session_id IS NULL')
            }

            this.db.run('INSERT OR IGNORE INTO migrations (version) VALUES (2)')
            this.saveDatabase()
        }
    }

    private createBackup(): void {
        try {
            const backupDir = path.join(path.dirname(this.dbPath), 'backups')
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true })
            }

            const date = new Date().toISOString().split('T')[0]
            const backupPath = path.join(backupDir, `calculator-${date}.db`)

            if (!fs.existsSync(backupPath) && fs.existsSync(this.dbPath)) {
                fs.copyFileSync(this.dbPath, backupPath)
            }

            this.cleanOldBackups(backupDir)
        } catch (error) {
            console.error('Backup failed:', error)
        }
    }

    private cleanOldBackups(backupDir: string): void {
        try {
            const files = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('calculator-') && f.endsWith('.db'))
                .map(f => ({
                    name: f,
                    path: path.join(backupDir, f),
                    mtime: fs.statSync(path.join(backupDir, f)).mtime.getTime()
                }))
                .sort((a, b) => b.mtime - a.mtime)

            files.slice(7).forEach(file => {
                fs.unlinkSync(file.path)
            })
        } catch (error) {
            console.error('Failed to clean old backups:', error)
        }
    }

    addHistory(entry: HistoryEntry): number {
        if (!this.db) throw new Error('Database not initialized')

        this.db.run(`
      INSERT INTO history (expression, result, mode, timestamp, is_pinned, session_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [entry.expression, entry.result, entry.mode, entry.timestamp, entry.is_pinned || 0, entry.session_id || null])

        this.saveDatabase()

        const result = this.db.exec('SELECT last_insert_rowid() as id')
        return result[0]?.values[0]?.[0] as number || 0
    }

    getHistory(limit: number = 100, offset: number = 0, sessionId?: number): HistoryEntry[] {
        if (!this.db) return []

        let query = 'SELECT * FROM history'
        const params: any[] = []

        if (sessionId !== undefined) {
            query += ' WHERE session_id = ?'
            params.push(sessionId)
        }

        query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?'
        params.push(limit, offset)

        const result = this.db.exec(query, params)

        if (!result[0]) return []

        const columns = result[0].columns
        const values = result[0].values

        return values.map((row: any) => {
            const obj: any = {}
            columns.forEach((col: string, idx: number) => {
                obj[col] = row[idx]
            })
            return obj as HistoryEntry
        })
    }

    searchHistory(query: string, limit: number = 100): HistoryEntry[] {
        if (!this.db) return []

        const searchTerm = `%${query}%`
        const result = this.db.exec(`
      SELECT * FROM history
      WHERE expression LIKE ? OR result LIKE ?
      ORDER BY timestamp DESC
      LIMIT ?
    `, [searchTerm, searchTerm, limit])

        if (!result[0]) return []

        const columns = result[0].columns
        const values = result[0].values

        return values.map((row: any) => {
            const obj: any = {}
            columns.forEach((col: string, idx: number) => {
                obj[col] = row[idx]
            })
            return obj as HistoryEntry
        })
    }

    togglePin(id: number): void {
        if (!this.db) return

        this.db.run(`
      UPDATE history
      SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END
      WHERE id = ?
    `, [id])

        this.saveDatabase()
    }

    deleteHistory(id: number): void {
        if (!this.db) return
        this.db.run('DELETE FROM history WHERE id = ?', [id])
        this.saveDatabase()
    }

    clearAllHistory(): void {
        if (!this.db) return
        this.db.run('DELETE FROM history')
        this.saveDatabase()
    }

    getSetting(key: string): string | null {
        if (!this.db) return null

        const result = this.db.exec('SELECT value FROM settings WHERE key = ?', [key])
        if (!result[0] || !result[0].values[0]) return null

        return result[0].values[0][0] as string
    }

    setSetting(key: string, value: string): void {
        if (!this.db) return

        this.db.run(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, [key, value])

        this.saveDatabase()
    }

    getAllSettings(): Record<string, string> {
        if (!this.db) return {}

        const result = this.db.exec('SELECT key, value FROM settings')
        if (!result[0]) return {}

        const settings: Record<string, string> = {}
        result[0].values.forEach((row: any) => {
            settings[row[0] as string] = row[1] as string
        })

        return settings
    }

    setMemory(slot: string, value: string): void {
        if (!this.db) return

        this.db.run(`
      INSERT OR REPLACE INTO memory (slot_name, value, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, [slot, value])

        this.saveDatabase()
    }

    getMemory(slot: string): string | null {
        if (!this.db) return null

        const result = this.db.exec('SELECT value FROM memory WHERE slot_name = ?', [slot])
        if (!result[0] || !result[0].values[0]) return null

        return result[0].values[0][0] as string
    }

    clearMemory(slot: string): void {
        if (!this.db) return
        this.db.run('DELETE FROM memory WHERE slot_name = ?', [slot])
        this.saveDatabase()
    }

    getAllMemory(): MemorySlot[] {
        if (!this.db) return []

        const result = this.db.exec('SELECT * FROM memory ORDER BY created_at DESC')
        if (!result[0]) return []

        const columns = result[0].columns
        const values = result[0].values

        return values.map((row: any) => {
            const obj: any = {}
            columns.forEach((col: string, idx: number) => {
                obj[col] = row[idx]
            })
            return obj as MemorySlot
        })
    }

    // Session Management
    createSession(name: string): number {
        if (!this.db) throw new Error('Database not initialized')

        this.db.run('INSERT INTO sessions (name, is_default) VALUES (?, 0)', [name])
        this.saveDatabase()

        const result = this.db.exec('SELECT last_insert_rowid() as id')
        return result[0]?.values[0]?.[0] as number || 0
    }

    getSessions(): Session[] {
        if (!this.db) return []

        const result = this.db.exec('SELECT * FROM sessions ORDER BY is_default DESC, created_at ASC')
        if (!result[0]) return []

        const columns = result[0].columns
        const values = result[0].values

        return values.map((row: any) => {
            const obj: any = {}
            columns.forEach((col: string, idx: number) => {
                obj[col] = row[idx]
            })
            return obj as Session
        })
    }

    renameSession(id: number, newName: string): void {
        if (!this.db) return
        this.db.run('UPDATE sessions SET name = ? WHERE id = ?', [newName, id])
        this.saveDatabase()
    }

    deleteSession(id: number): void {
        if (!this.db) return

        // Don't allow deleting the default session
        const result = this.db.exec('SELECT is_default FROM sessions WHERE id = ?', [id])
        if (result[0]?.values[0]?.[0] === 1) {
            throw new Error('Cannot delete default session')
        }

        // Delete the session (CASCADE will delete associated variables)
        this.db.run('DELETE FROM sessions WHERE id = ?', [id])
        this.saveDatabase()
    }

    // Variable Management
    setVariable(sessionId: number, name: string, value: string): void {
        if (!this.db) return

        this.db.run(`
      INSERT OR REPLACE INTO variables (session_id, name, value, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [sessionId, name, value])

        this.saveDatabase()
    }

    getVariables(sessionId: number): Variable[] {
        if (!this.db) return []

        const result = this.db.exec('SELECT * FROM variables WHERE session_id = ? ORDER BY created_at ASC', [sessionId])
        if (!result[0]) return []

        const columns = result[0].columns
        const values = result[0].values

        return values.map((row: any) => {
            const obj: any = {}
            columns.forEach((col: string, idx: number) => {
                obj[col] = row[idx]
            })
            return obj as Variable
        })
    }

    deleteVariable(id: number): void {
        if (!this.db) return
        this.db.run('DELETE FROM variables WHERE id = ?', [id])
        this.saveDatabase()
    }

    clearVariables(sessionId: number): void {
        if (!this.db) return
        this.db.run('DELETE FROM variables WHERE session_id = ?', [sessionId])
        this.saveDatabase()
    }

    close(): void {
        if (this.db) {
            this.saveDatabase()
            this.db.close()
            this.db = null
        }
    }
}
