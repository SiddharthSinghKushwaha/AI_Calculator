import { app, BrowserWindow } from 'electron'
import path from 'path'
import { DatabaseManager } from './database/DatabaseManager'
import { registerIpcHandlers } from './ipc/handlers'

// Disable GPU acceleration for better compatibility
app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Database instance
let dbManager: DatabaseManager | null = null

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
        backgroundColor: '#1a1a1a',
        title: 'Advanced Calculator',
        autoHideMenuBar: true,
    })

    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show()
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.whenReady().then(async () => {
    try {
        console.log('App ready, initializing database...')

        // Initialize database
        dbManager = new DatabaseManager(app.getPath('userData'))
        await dbManager.initialize()

        console.log('Database initialized successfully')

        // Register IPC handlers
        registerIpcHandlers(dbManager)

        console.log('IPC handlers registered')

        // Create window
        createWindow()

        console.log('Window created')

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow()
            }
        })
    } catch (error) {
        console.error('Initialization error:', error)
        const { dialog } = require('electron')
        dialog.showErrorBox('Initialization Error', `Failed to initialize application:\n${error}`)
        app.quit()
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (dbManager) {
            dbManager.close()
        }
        app.quit()
    }
})

app.on('before-quit', () => {
    if (dbManager) {
        dbManager.close()
    }
})
