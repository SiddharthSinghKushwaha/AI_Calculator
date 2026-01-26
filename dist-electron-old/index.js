"use strict";var b=Object.defineProperty;var S=(n,e,t)=>e in n?b(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var T=(n,e,t)=>S(n,typeof e!="symbol"?e+"":e,t);const i=require("electron"),l=require("path"),R=require("sql.js"),a=require("fs");class v{constructor(e){T(this,"db",null);T(this,"dbPath");T(this,"SQL",null);const t=l.join(e,"data");a.existsSync(t)||a.mkdirSync(t,{recursive:!0}),this.dbPath=l.join(t,"calculator.db")}async initialize(){if(this.SQL=await R({locateFile:e=>`https://sql.js.org/dist/${e}`}),a.existsSync(this.dbPath)){const e=a.readFileSync(this.dbPath);this.db=new this.SQL.Database(e)}else this.db=new this.SQL.Database;this.createTables(),this.runMigrations(),this.saveDatabase(),this.createBackup()}saveDatabase(){if(!this.db)return;const e=this.db.export(),t=Buffer.from(e);a.writeFileSync(this.dbPath,t)}createTables(){this.db&&(this.db.run(`
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
    `),this.initializeDefaultSettings(),this.saveDatabase())}initializeDefaultSettings(){if(!this.db)return;const e=[{key:"theme",value:"system"},{key:"scatteredKeypad",value:"false"},{key:"calculationMode",value:"standard"}];for(const t of e)this.db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",[t.key,t.value]);this.saveDatabase()}runMigrations(){var r,c;if(!this.db)return;const t=((c=(r=this.db.exec("SELECT MAX(version) as version FROM migrations")[0])==null?void 0:r.values[0])==null?void 0:c[0])||0,s=1;t<s&&(this.db.run("INSERT OR IGNORE INTO migrations (version) VALUES (?)",[s]),this.saveDatabase())}createBackup(){try{const e=l.join(l.dirname(this.dbPath),"backups");a.existsSync(e)||a.mkdirSync(e,{recursive:!0});const t=new Date().toISOString().split("T")[0],s=l.join(e,`calculator-${t}.db`);!a.existsSync(s)&&a.existsSync(this.dbPath)&&a.copyFileSync(this.dbPath,s),this.cleanOldBackups(e)}catch(e){console.error("Backup failed:",e)}}cleanOldBackups(e){try{a.readdirSync(e).filter(s=>s.startsWith("calculator-")&&s.endsWith(".db")).map(s=>({name:s,path:l.join(e,s),mtime:a.statSync(l.join(e,s)).mtime.getTime()})).sort((s,r)=>r.mtime-s.mtime).slice(7).forEach(s=>{a.unlinkSync(s.path)})}catch(t){console.error("Failed to clean old backups:",t)}}addHistory(e){var s,r;if(!this.db)throw new Error("Database not initialized");return this.db.run(`
      INSERT INTO history (expression, result, mode, timestamp, is_pinned)
      VALUES (?, ?, ?, ?, ?)
    `,[e.expression,e.result,e.mode,e.timestamp,e.is_pinned||0]),this.saveDatabase(),((r=(s=this.db.exec("SELECT last_insert_rowid() as id")[0])==null?void 0:s.values[0])==null?void 0:r[0])||0}getHistory(e=100,t=0){if(!this.db)return[];const s=this.db.exec(`
      SELECT * FROM history
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `,[e,t]);if(!s[0])return[];const r=s[0].columns;return s[0].values.map(E=>{const d={};return r.forEach((h,m)=>{d[h]=E[m]}),d})}searchHistory(e,t=100){if(!this.db)return[];const s=`%${e}%`,r=this.db.exec(`
      SELECT * FROM history
      WHERE expression LIKE ? OR result LIKE ?
      ORDER BY timestamp DESC
      LIMIT ?
    `,[s,s,t]);if(!r[0])return[];const c=r[0].columns;return r[0].values.map(d=>{const h={};return c.forEach((m,p)=>{h[m]=d[p]}),h})}togglePin(e){this.db&&(this.db.run(`
      UPDATE history
      SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END
      WHERE id = ?
    `,[e]),this.saveDatabase())}deleteHistory(e){this.db&&(this.db.run("DELETE FROM history WHERE id = ?",[e]),this.saveDatabase())}clearAllHistory(){this.db&&(this.db.run("DELETE FROM history"),this.saveDatabase())}getSetting(e){if(!this.db)return null;const t=this.db.exec("SELECT value FROM settings WHERE key = ?",[e]);return!t[0]||!t[0].values[0]?null:t[0].values[0][0]}setSetting(e,t){this.db&&(this.db.run(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `,[e,t]),this.saveDatabase())}getAllSettings(){if(!this.db)return{};const e=this.db.exec("SELECT key, value FROM settings");if(!e[0])return{};const t={};return e[0].values.forEach(s=>{t[s[0]]=s[1]}),t}setMemory(e,t){this.db&&(this.db.run(`
      INSERT OR REPLACE INTO memory (slot_name, value, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `,[e,t]),this.saveDatabase())}getMemory(e){if(!this.db)return null;const t=this.db.exec("SELECT value FROM memory WHERE slot_name = ?",[e]);return!t[0]||!t[0].values[0]?null:t[0].values[0][0]}clearMemory(e){this.db&&(this.db.run("DELETE FROM memory WHERE slot_name = ?",[e]),this.saveDatabase())}getAllMemory(){if(!this.db)return[];const e=this.db.exec("SELECT * FROM memory ORDER BY created_at DESC");if(!e[0])return[];const t=e[0].columns;return e[0].values.map(r=>{const c={};return t.forEach((E,d)=>{c[E]=r[d]}),c})}close(){this.db&&(this.saveDatabase(),this.db.close(),this.db=null)}}function f(n){i.ipcMain.handle("history:add",async(e,t)=>n.addHistory(t)),i.ipcMain.handle("history:get",async(e,t,s)=>n.getHistory(t,s)),i.ipcMain.handle("history:search",async(e,t,s)=>n.searchHistory(t,s)),i.ipcMain.handle("history:togglePin",async(e,t)=>(n.togglePin(t),!0)),i.ipcMain.handle("history:delete",async(e,t)=>(n.deleteHistory(t),!0)),i.ipcMain.handle("history:clear",async()=>(n.clearAllHistory(),!0)),i.ipcMain.handle("settings:get",async(e,t)=>n.getSetting(t)),i.ipcMain.handle("settings:set",async(e,t,s)=>(n.setSetting(t,s),!0)),i.ipcMain.handle("settings:getAll",async()=>n.getAllSettings()),i.ipcMain.handle("memory:set",async(e,t,s)=>(n.setMemory(t,s),!0)),i.ipcMain.handle("memory:get",async(e,t)=>n.getMemory(t)),i.ipcMain.handle("memory:clear",async(e,t)=>(n.clearMemory(t),!0)),i.ipcMain.handle("memory:getAll",async()=>n.getAllMemory())}i.app.disableHardwareAcceleration();let o=null;const I=process.env.NODE_ENV==="development"||!i.app.isPackaged;let u=null;function y(){o=new i.BrowserWindow({width:1200,height:800,minWidth:800,minHeight:600,webPreferences:{preload:l.join(__dirname,"preload/index.js"),contextIsolation:!0,nodeIntegration:!1},show:!1,backgroundColor:"#1a1a1a",title:"Advanced Calculator",autoHideMenuBar:!0}),I?(o.loadURL("http://localhost:3000"),o.webContents.openDevTools()):o.loadFile(l.join(__dirname,"../../dist/index.html")),o.once("ready-to-show",()=>{o==null||o.show()}),o.on("closed",()=>{o=null})}i.app.whenReady().then(async()=>{u=new v(i.app.getPath("userData")),await u.initialize(),f(u),y(),i.app.on("activate",()=>{i.BrowserWindow.getAllWindows().length===0&&y()})});i.app.on("window-all-closed",()=>{process.platform!=="darwin"&&(u&&u.close(),i.app.quit())});i.app.on("before-quit",()=>{u&&u.close()});
