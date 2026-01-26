# Advanced Calculator

A professional-grade desktop calculator application built with Electron, React, and TypeScript.

## 📥 Download & Install (For Users)

**No additional software is required.** You do **not** need Node.js installed to run this app.

1. Download the installer: `Advanced Calculator Setup 1.0.0.exe`
2. Run the installer.
   > ⚠️ **Note**: You may see a "Windows protected your PC" popup. This is normal for new apps that aren't digitally signed.
   > - Click **More info**
   > - Click **Run anyway**
3. The app will launch automatically.

## 🛠️ Development (For Developers)

If you want to modify the source code or build the app yourself, follow these steps.

### Prerequisites
- **Node.js 18** or higher (Required only for building)

### Setup & Build

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run in Development Mode**
   ```bash
   npm run dev
   ```

3. **Build for Windows**
   ```bash
   npm run build:win
   ```
   This creates an installer in the `release-build` folder.

## ✨ Features

- **Modes**: Standard, Scientific, and Programmer.
- **History**: Persistent history with search, pin, and delete.
- **Memory**: Multiple memory slots.
- **Scattered Keypad**: Optional randomized keypad for brain training.
- **Real-time Calculation**: Instant results as you type.
- **Theming**: Light/Dark mode support.

## Keyboard Shortcuts

- **Numbers & Operators**: Type directly
- **Enter**: Calculate / Commit result
- **Backspace**: Delete last character
- **Escape**: Clear expression
- **Ctrl+C**: Copy result
- **Ctrl+V**: Paste expression
- **Ctrl+,**: Open Settings

## Tech Stack

- **Electron** & **React** (TypeScript)
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **SQLite (sql.js)** for local data storage
- **Math.js** for calculation engine

## License

MIT License

