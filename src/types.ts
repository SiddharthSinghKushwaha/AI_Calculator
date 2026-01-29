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

export type CalculationMode = 'standard' | 'scientific' | 'programmer'

export type Theme = 'light' | 'dark' | 'system'

export type NumberFormat = 'international' | 'indian'

export interface Settings {
    theme: Theme
    scatteredKeypad: boolean
    calculationMode: CalculationMode
    numberFormat?: NumberFormat
    ghostMode?: boolean
}

declare global {
    interface Window {
        electronAPI: {
            // History
            addHistory: (entry: HistoryEntry) => Promise<number>
            getHistory: (limit: number, offset: number, sessionId?: number) => Promise<HistoryEntry[]>
            searchHistory: (query: string, limit: number) => Promise<HistoryEntry[]>
            togglePin: (id: number) => Promise<boolean>
            deleteHistory: (id: number) => Promise<boolean>
            clearHistory: () => Promise<boolean>

            // Settings
            getSetting: (key: string) => Promise<string | null>
            setSetting: (key: string, value: string) => Promise<boolean>
            getAllSettings: () => Promise<Record<string, string>>

            // Memory
            setMemory: (slot: string, value: string) => Promise<boolean>
            getMemory: (slot: string) => Promise<string | null>
            clearMemory: (slot: string) => Promise<boolean>
            getAllMemory: () => Promise<MemorySlot[]>

            // Sessions
            createSession: (name: string) => Promise<number>
            getSessions: () => Promise<Session[]>
            renameSession: (id: number, newName: string) => Promise<boolean>
            deleteSession: (id: number) => Promise<boolean>

            // Variables
            setVariable: (sessionId: number, name: string, value: string) => Promise<boolean>
            getVariables: (sessionId: number) => Promise<Variable[]>
            deleteVariable: (id: number) => Promise<boolean>
            clearVariables: (sessionId: number) => Promise<boolean>

            // Ghost Mode
            setGhostMode: (enabled: boolean) => Promise<boolean>
        }
    }
}

export { }

