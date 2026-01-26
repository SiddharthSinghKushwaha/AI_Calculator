"use strict";var b=Object.defineProperty;var S=(a,e,t)=>e in a?b(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var T=(a,e,t)=>S(a,typeof e!="symbol"?e+"":e,t);const i=require("electron"),o=require("path"),R=require("sql.js"),r=require("fs");class f{constructor(e){T(this,"db",null);T(this,"dbPath");T(this,"SQL",null);const t=o.join(e,"data");r.existsSync(t)||r.mkdirSync(t,{recursive:!0}),this.dbPath=o.join(t,"calculator.db")}async initialize(){let e;try{i.app.isPackaged?e=r.readFileSync(o.join(__dirname,"../dist/assets/sql-wasm.wasm")):e=r.readFileSync(o.join(__dirname,"../../public/assets/sql-wasm.wasm"))}catch(t){if(console.error("Failed to load WASM file:",t),i.app.isPackaged)try{e=r.readFileSync(o.join(process.resourcesPath,"app.asar.unpacked","dist","assets","sql-wasm.wasm"))}catch{throw t}else throw t}if(this.SQL=await R({wasmBinary:e}),r.existsSync(this.dbPath)){const t=r.readFileSync(this.dbPath);this.db=new this.SQL.Database(t)}else this.db=new this.SQL.Database;this.createTables(),this.runMigrations(),this.saveDatabase(),this.createBackup()}saveDatabase(){if(!this.db)return;const e=this.db.export(),t=Buffer.from(e);r.writeFileSync(this.dbPath,t)}createTables(){this.db&&(this.db.run(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expression TEXT NOT NULL,
        result TEXT NOT NULL,
        mode TEXT NOT NULL CHECK(mode IN ('standard', 'scientific', 'programmer')),
        timestamp INTEGER NOT NULL,
        is_pinned INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),this.db.run("CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_history_pinned ON history(is_pinned) WHERE is_pinned = 1"),this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),this.db.run(`
      CREATE TABLE IF NOT EXISTS memory (
        slot_name TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),this.db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),this.initializeDefaultSettings(),this.saveDatabase())}initializeDefaultSettings(){if(!this.db)return;const e=[{key:"theme",value:"system"},{key:"scatteredKeypad",value:"false"},{key:"calculationMode",value:"standard"}];for(const t of e)this.db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",[t.key,t.value]);this.saveDatabase()}runMigrations(){var n,c;if(!this.db)return;const t=((c=(n=this.db.exec("SELECT MAX(version) as version FROM migrations")[0])==null?void 0:n.values[0])==null?void 0:c[0])||0,s=1;t<s&&(this.db.run("INSERT OR IGNORE INTO migrations (version) VALUES (?)",[s]),this.saveDatabase())}createBackup(){try{const e=o.join(o.dirname(this.dbPath),"backups");r.existsSync(e)||r.mkdirSync(e,{recursive:!0});const t=new Date().toISOString().split("T")[0],s=o.join(e,`calculator-${t}.db`);!r.existsSync(s)&&r.existsSync(this.dbPath)&&r.copyFileSync(this.dbPath,s),this.cleanOldBackups(e)}catch(e){console.error("Backup failed:",e)}}cleanOldBackups(e){try{r.readdirSync(e).filter(s=>s.startsWith("calculator-")&&s.endsWith(".db")).map(s=>({name:s,path:o.join(e,s),mtime:r.statSync(o.join(e,s)).mtime.getTime()})).sort((s,n)=>n.mtime-s.mtime).slice(7).forEach(s=>{r.unlinkSync(s.path)})}catch(t){console.error("Failed to clean old backups:",t)}}addHistory(e){var s,n;if(!this.db)throw new Error("Database not initialized");return this.db.run(`
      INSERT INTO history (expression, result, mode, timestamp, is_pinned)
      VALUES (?, ?, ?, ?, ?)
    `,[e.expression,e.result,e.mode,e.timestamp,e.is_pinned||0]),this.saveDatabase(),((n=(s=this.db.exec("SELECT last_insert_rowid() as id")[0])==null?void 0:s.values[0])==null?void 0:n[0])||0}getHistory(e=100,t=0){if(!this.db)return[];const s=this.db.exec(`
      SELECT * FROM history
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `,[e,t]);if(!s[0])return[];const n=s[0].columns;return s[0].values.map(E=>{const d={};return n.forEach((h,m)=>{d[h]=E[m]}),d})}searchHistory(e,t=100){if(!this.db)return[];const s=`%${e}%`,n=this.db.exec(`
      SELECT * FROM history
      WHERE expression LIKE ? OR result LIKE ?
      ORDER BY timestamp DESC
      LIMIT ?
    `,[s,s,t]);if(!n[0])return[];const c=n[0].columns;return n[0].values.map(d=>{const h={};return c.forEach((m,y)=>{h[m]=d[y]}),h})}togglePin(e){this.db&&(this.db.run(`
      UPDATE history
      SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END
      WHERE id = ?
    `,[e]),this.saveDatabase())}deleteHistory(e){this.db&&(this.db.run("DELETE FROM history WHERE id = ?",[e]),this.saveDatabase())}clearAllHistory(){this.db&&(this.db.run("DELETE FROM history"),this.saveDatabase())}getSetting(e){if(!this.db)return null;const t=this.db.exec("SELECT value FROM settings WHERE key = ?",[e]);return!t[0]||!t[0].values[0]?null:t[0].values[0][0]}setSetting(e,t){this.db&&(this.db.run(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `,[e,t]),this.saveDatabase())}getAllSettings(){if(!this.db)return{};const e=this.db.exec("SELECT key, value FROM settings");if(!e[0])return{};const t={};return e[0].values.forEach(s=>{t[s[0]]=s[1]}),t}setMemory(e,t){this.db&&(this.db.run(`
      INSERT OR REPLACE INTO memory (slot_name, value, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `,[e,t]),this.saveDatabase())}getMemory(e){if(!this.db)return null;const t=this.db.exec("SELECT value FROM memory WHERE slot_name = ?",[e]);return!t[0]||!t[0].values[0]?null:t[0].values[0][0]}clearMemory(e){this.db&&(this.db.run("DELETE FROM memory WHERE slot_name = ?",[e]),this.saveDatabase())}getAllMemory(){if(!this.db)return[];const e=this.db.exec("SELECT * FROM memory ORDER BY created_at DESC");if(!e[0])return[];const t=e[0].columns;return e[0].values.map(n=>{const c={};return t.forEach((E,d)=>{c[E]=n[d]}),c})}close(){this.db&&(this.saveDatabase(),this.db.close(),this.db=null)}}function v(a){i.ipcMain.handle("history:add",async(e,t)=>a.addHistory(t)),i.ipcMain.handle("history:get",async(e,t,s)=>a.getHistory(t,s)),i.ipcMain.handle("history:search",async(e,t,s)=>a.searchHistory(t,s)),i.ipcMain.handle("history:togglePin",async(e,t)=>(a.togglePin(t),!0)),i.ipcMain.handle("history:delete",async(e,t)=>(a.deleteHistory(t),!0)),i.ipcMain.handle("history:clear",async()=>(a.clearAllHistory(),!0)),i.ipcMain.handle("settings:get",async(e,t)=>a.getSetting(t)),i.ipcMain.handle("settings:set",async(e,t,s)=>(a.setSetting(t,s),!0)),i.ipcMain.handle("settings:getAll",async()=>a.getAllSettings()),i.ipcMain.handle("memory:set",async(e,t,s)=>(a.setMemory(t,s),!0)),i.ipcMain.handle("memory:get",async(e,t)=>a.getMemory(t)),i.ipcMain.handle("memory:clear",async(e,t)=>(a.clearMemory(t),!0)),i.ipcMain.handle("memory:getAll",async()=>a.getAllMemory())}i.app.disableHardwareAcceleration();let l=null;const I=process.env.NODE_ENV==="development"||!i.app.isPackaged;let u=null;function p(){l=new i.BrowserWindow({width:1200,height:800,minWidth:800,minHeight:600,webPreferences:{preload:o.join(__dirname,"preload/index.js"),contextIsolation:!0,nodeIntegration:!1},show:!1,backgroundColor:"#1a1a1a",title:"Advanced Calculator",autoHideMenuBar:!0}),I?(l.loadURL("http://localhost:3000"),l.webContents.openDevTools()):l.loadFile(o.join(__dirname,"../dist/index.html")),l.once("ready-to-show",()=>{l==null||l.show()}),l.on("closed",()=>{l=null})}i.app.whenReady().then(async()=>{try{u=new f(i.app.getPath("userData")),await u.initialize(),v(u),p(),i.app.on("activate",()=>{i.BrowserWindow.getAllWindows().length===0&&p()})}catch(a){const{dialog:e}=require("electron");e.showErrorBox("Initialization Error",`Failed to initialize application:
${a}`),i.app.quit()}});i.app.on("window-all-closed",()=>{process.platform!=="darwin"&&(u&&u.close(),i.app.quit())});i.app.on("before-quit",()=>{u&&u.close()});
