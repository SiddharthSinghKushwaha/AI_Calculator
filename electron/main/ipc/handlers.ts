import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { DatabaseManager, HistoryEntry } from '../database/DatabaseManager'

export function registerIpcHandlers(dbManager: DatabaseManager) {
    // History handlers
    ipcMain.handle('history:add', async (_event: IpcMainInvokeEvent, entry: HistoryEntry) => {
        return dbManager.addHistory(entry)
    })

    ipcMain.handle('history:get', async (_event: IpcMainInvokeEvent, limit: number, offset: number) => {
        return dbManager.getHistory(limit, offset)
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
}
