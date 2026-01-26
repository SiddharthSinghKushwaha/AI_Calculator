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
                wasmBuffer = fs.readFileSync(path.join(__dirname, '../../public/assets/sql-wasm.wasm'))
            }
        } catch (error) {
            console.error('Failed to load WASM file:', error)
            // Fallback to trying to find it in resources path if packaged
            if (app.isPackaged) {
                try {
                    wasmBuffer = fs.readFileSync(path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'assets', 'sql-wasm.wasm'))
                } catch (e) {
                    throw error
                }
            } else {
                throw error
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

        this.db.run(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expression TEXT NOT NULL,
        result TEXT NOT NULL,
        mode TEXT NOT NULL CHECK(mode IN ('standard', 'scientific', 'programmer')),
        timestamp INTEGER NOT NULL,
        is_pinned INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

        this.db.run(`CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC)`)
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_history_pinned ON history(is_pinned) WHERE is_pinned = 1`)

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
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

        this.initializeDefaultSettings()
        this.saveDatabase()
    }

    private initializeDefaultSettings(): void {
        if (!this.db) return

        const defaults = [
            { key: 'theme', value: 'system' },
            { key: 'scatteredKeypad', value: 'false' },
            { key: 'calculationMode', value: 'standard' },
        ]

        for (const setting of defaults) {
            this.db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, [setting.key, setting.value])
        }

        this.saveDatabase()
    }

    private runMigrations(): void {
        if (!this.db) return

        const result = this.db.exec('SELECT MAX(version) as version FROM migrations')
        const currentVersion = result[0]?.values[0]?.[0] as number || 0
        const targetVersion = 1

        if (currentVersion < targetVersion) {
            this.db.run('INSERT OR IGNORE INTO migrations (version) VALUES (?)', [targetVersion])
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
      INSERT INTO history (expression, result, mode, timestamp, is_pinned)
      VALUES (?, ?, ?, ?, ?)
    `, [entry.expression, entry.result, entry.mode, entry.timestamp, entry.is_pinned || 0])

        this.saveDatabase()

        const result = this.db.exec('SELECT last_insert_rowid() as id')
        return result[0]?.values[0]?.[0] as number || 0
    }

    getHistory(limit: number = 100, offset: number = 0): HistoryEntry[] {
        if (!this.db) return []

        const result = this.db.exec(`
      SELECT * FROM history
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `, [limit, offset])

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

    close(): void {
        if (this.db) {
            this.saveDatabase()
            this.db.close()
            this.db = null
        }
    }
}
