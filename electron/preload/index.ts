import { contextBridge, ipcRenderer } from 'electron'

interface HistoryEntry {
    id?: number
    expression: string
    result: string
    mode: 'standard' | 'scientific' | 'programmer'
    timestamp: number
    is_pinned: number
    created_at?: string
}

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // History API
    addHistory: (entry: HistoryEntry) => ipcRenderer.invoke('history:add', entry),
    getHistory: (limit: number, offset: number) => ipcRenderer.invoke('history:get', limit, offset),
    searchHistory: (query: string, limit: number) => ipcRenderer.invoke('history:search', query, limit),
    togglePin: (id: number) => ipcRenderer.invoke('history:togglePin', id),
    deleteHistory: (id: number) => ipcRenderer.invoke('history:delete', id),
    clearHistory: () => ipcRenderer.invoke('history:clear'),

    // Settings API
    getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
    setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAllSettings: () => ipcRenderer.invoke('settings:getAll'),

    // Memory API
    setMemory: (slot: string, value: string) => ipcRenderer.invoke('memory:set', slot, value),
    getMemory: (slot: string) => ipcRenderer.invoke('memory:get', slot),
    clearMemory: (slot: string) => ipcRenderer.invoke('memory:clear', slot),
    getAllMemory: () => ipcRenderer.invoke('memory:getAll'),
})
