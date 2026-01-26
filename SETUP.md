# Advanced Calculator - Setup Instructions

## Quick Start

### 1. Restart Your Terminal/IDE
After installing Node.js, you need to restart your terminal or IDE for the PATH changes to take effect.

### 2. Verify Node.js Installation
Open a new terminal and run:
```powershell
node --version
npm --version
```

Both commands should display version numbers.

### 3. Navigate to Project Directory
```powershell
cd "c:\Users\DELL\Desktop\Code More\DesktopApp\advanced-calculator"
```

### 4. Install Dependencies
```powershell
npm install
```

This will install all required packages. It may take a few minutes.

### 5. Run in Development Mode
```powershell
npm run dev
```

The calculator application will open in a window. Any changes you make to the code will hot-reload.

### 6. Build Windows Installer
```powershell
npm run build:win
```

This creates a Windows installer in the `dist` folder:
- File: `Advanced Calculator-Setup-1.0.0.exe`
- Size: ~200-250 MB (includes all dependencies)

## Installer Features

The generated installer will:
- ✅ Let users choose installation directory
- ✅ Create Start Menu shortcut
- ✅ Create Desktop shortcut
- ✅ Install without requiring administrator privileges
- ✅ Properly uninstall while keeping user data

## Testing the Application

1. **Basic Calculation**: Try `2 + 2 * 3` and press Enter (should give 8)
2. **Scientific Mode**: Switch to Scientific, try `sin(0.5)`
3. **History**: Check the left panel for saved calculations
4. **Scattered Keypad**: Go to Settings (⚙️), enable "Scattered Keypad", restart
5. **Theme**: Change theme in Settings (Light/Dark/System)
6. **Search**: Use the search box in History panel

## Troubleshooting

### "npm is not recognized"
- You need to restart your terminal after installing Node.js
- Close and reopen PowerShell/Command Prompt
- Close and reopen VS Code if using its terminal

### Build Errors
If you encounter errors during `npm install`:
1. Delete the `node_modules` folder
2. Run `npm install` again
3. Make sure you have a stable internet connection

### Database Errors
The database is created automatically in:
`C:\Users\DELL\AppData\Roaming\AdvancedCalculator\data\`

If you encounter issues, delete this folder and restart the app.

## File Structure

```
advanced-calculator/
├── dist/                  # Built files (created after npm run build)
├── electron/              # Electron main process
│   ├── main/             # Main process logic
│   └── preload/          # Preload scripts
├── src/                   # React application
│   ├── components/       # UI components
│   ├── engine/          # Calculation logic
│   └── App.tsx          # Main app
├── public/               # Static assets
├── resources/            # App icons (for installer)
├── package.json          # Dependencies
└── README.md            # Full documentation
```

## Next Steps

1. **Run the App**: `npm run dev`
2. **Make Changes**: Edit files in `src/` folder
3. **Test Features**: Try all calculation modes and features
4. **Build Installer**: `npm run build:win` when ready
5. **Distribute**: Share the `.exe` installer with others

## Additional Resources

- Full documentation: See `README.md`
- Architecture details: See `.gemini/antigravity/brain/.../architecture.md`
- Implementation plan: See `.gemini/antigravity/brain/.../implementation_plan.md`

---

**Need Help?**
If you encounter any issues, check the main README.md file or the troubleshooting section above.
