import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron'
import { DatabaseManager, HistoryEntry } from '../database/DatabaseManager'

export function registerIpcHandlers(dbManager: DatabaseManager) {
    // History handlers
    ipcMain.handle('history:add', async (_event: IpcMainInvokeEvent, entry: HistoryEntry) => {
        return dbManager.addHistory(entry)
    })

    ipcMain.handle('history:get', async (_event: IpcMainInvokeEvent, limit: number, offset: number, sessionId?: number) => {
        return dbManager.getHistory(limit, offset, sessionId)
    })

    ipcMain.handle('history:search', async (_event: IpcMainInvokeEvent, query: string, limit: number) => {
        return dbManager.searchHistory(query, limit)
    })

    ipcMain.handle('history:togglePin', async (_event: IpcMainInvokeEvent, id: number) => {
        dbManager.togglePin(id)
        return true
    })

    ipcMain.handle('history:delete', async (_event: IpcMainInvokeEvent, id: number) => {
        dbManager.deleteHistory(id)
        return true
    })

    ipcMain.handle('history:clear', async () => {
        dbManager.clearAllHistory()
        return true
    })

    // Settings handlers
    ipcMain.handle('settings:get', async (_event: IpcMainInvokeEvent, key: string) => {
        return dbManager.getSetting(key)
    })

    ipcMain.handle('settings:set', async (_event: IpcMainInvokeEvent, key: string, value: string) => {
        dbManager.setSetting(key, value)
        return true
    })

    ipcMain.handle('settings:getAll', async () => {
        return dbManager.getAllSettings()
    })

    // Memory handlers
    ipcMain.handle('memory:set', async (_event: IpcMainInvokeEvent, slot: string, value: string) => {
        dbManager.setMemory(slot, value)
        return true
    })

    ipcMain.handle('memory:get', async (_event: IpcMainInvokeEvent, slot: string) => {
        return dbManager.getMemory(slot)
    })

    ipcMain.handle('memory:clear', async (_event: IpcMainInvokeEvent, slot: string) => {
        dbManager.clearMemory(slot)
        return true
    })

    ipcMain.handle('memory:getAll', async () => {
        return dbManager.getAllMemory()
    })

    // Session handlers
    ipcMain.handle('session:create', async (_event: IpcMainInvokeEvent, name: string) => {
        return dbManager.createSession(name)
    })

    ipcMain.handle('session:getAll', async () => {
        return dbManager.getSessions()
    })

    ipcMain.handle('session:rename', async (_event: IpcMainInvokeEvent, id: number, newName: string) => {
        dbManager.renameSession(id, newName)
        return true
    })

    ipcMain.handle('session:delete', async (_event: IpcMainInvokeEvent, id: number) => {
        try {
            dbManager.deleteSession(id)
            return true
        } catch (error) {
            return false
        }
    })

    // Variable handlers
    ipcMain.handle('variable:set', async (_event: IpcMainInvokeEvent, sessionId: number, name: string, value: string) => {
        dbManager.setVariable(sessionId, name, value)
        return true
    })

    ipcMain.handle('variable:getAll', async (_event: IpcMainInvokeEvent, sessionId: number) => {
        return dbManager.getVariables(sessionId)
    })

    ipcMain.handle('variable:delete', async (_event: IpcMainInvokeEvent, id: number) => {
        dbManager.deleteVariable(id)
        return true
    })

    ipcMain.handle('variable:clear', async (_event: IpcMainInvokeEvent, sessionId: number) => {
        dbManager.clearVariables(sessionId)
        return true
    })

    // Ghost mode handler
    ipcMain.handle('ghostMode:set', async (_event: IpcMainInvokeEvent, enabled: boolean) => {
        const windows = BrowserWindow.getAllWindows()
        if (windows.length > 0) {
            const mainWindow = windows[0]
            mainWindow.setAlwaysOnTop(enabled)
            mainWindow.setOpacity(enabled ? 0.75 : 1.0)
        }
        return true
    })
}
