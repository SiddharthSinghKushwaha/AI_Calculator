export interface HistoryEntry {
    id?: number
    expression: string
    result: string
    mode: 'standard' | 'scientific' | 'programmer'
    timestamp: number
    is_pinned: number
    created_at?: string
}

export interface MemorySlot {
    slot_name: string
    value: string
    created_at?: string
}

export type CalculationMode = 'standard' | 'scientific' | 'programmer'

export type Theme = 'light' | 'dark' | 'system'

export interface Settings {
    theme: Theme
    scatteredKeypad: boolean
    calculationMode: CalculationMode
}

declare global {
    interface Window {
        electronAPI: {
            // History
            addHistory: (entry: HistoryEntry) => Promise<number>
            getHistory: (limit: number, offset: number) => Promise<HistoryEntry[]>
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
        }
    }
}

export { }
