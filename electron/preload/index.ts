import { contextBridge, ipcRenderer } from 'electron'

interface HistoryEntry {
    id?: number
    expression: string
    result: string
    mode: 'standard' | 'scientific' | 'programmer'
    timestamp: number
    is_pinned: number
    session_id?: number
    created_at?: string
}

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // History API
    addHistory: (entry: HistoryEntry) => ipcRenderer.invoke('history:add', entry),
    getHistory: (limit: number, offset: number, sessionId?: number) => ipcRenderer.invoke('history:get', limit, offset, sessionId),
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

    // Session API
    createSession: (name: string) => ipcRenderer.invoke('session:create', name),
    getSessions: () => ipcRenderer.invoke('session:getAll'),
    renameSession: (id: number, newName: string) => ipcRenderer.invoke('session:rename', id, newName),
    deleteSession: (id: number) => ipcRenderer.invoke('session:delete', id),

    // Variable API
    setVariable: (sessionId: number, name: string, value: string) => ipcRenderer.invoke('variable:set', sessionId, name, value),
    getVariables: (sessionId: number) => ipcRenderer.invoke('variable:getAll', sessionId),
    deleteVariable: (id: number) => ipcRenderer.invoke('variable:delete', id),
    clearVariables: (sessionId: number) => ipcRenderer.invoke('variable:clear', sessionId),

    // Ghost Mode API
    setGhostMode: (enabled: boolean) => ipcRenderer.invoke('ghostMode:set', enabled),
})
