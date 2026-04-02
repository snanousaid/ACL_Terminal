import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const execFileAsync = promisify(execFile)
function createWindow(): void {
  // Create the browser window.
 
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 1024,
    show: true,
    autoHideMenuBar: true,
    title: 'VioWatch',
    resizable: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {

      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC : informations réseau réelles (os.networkInterfaces)
  ipcMain.handle('get-network-info', () => {
    const ifaces = os.networkInterfaces()
    const hostname = os.hostname()

    let wifiIP = 'Non disponible'
    let ethernetIP = 'Non disponible'
    let wifiMac = ''
    let ethernetMac = ''
    let wifiInterface = ''
    let ethernetInterface = ''

    for (const [name, addrs] of Object.entries(ifaces)) {
      if (!addrs) continue
      const ipv4 = addrs.find((a) => a.family === 'IPv4' && !a.internal)
      if (!ipv4) continue
      const n = name.toLowerCase()
      if (n.includes('wi-fi') || n.includes('wlan') || n.includes('wifi') || n.includes('wireless')) {
        wifiIP = ipv4.address
        wifiMac = ipv4.mac
        wifiInterface = name
      } else if (
        n.includes('ethernet') ||
        n.includes('eth') ||
        n.includes('local area connection') ||
        n.includes('enp') ||
        n.includes('ens')
      ) {
        ethernetIP = ipv4.address
        ethernetMac = ipv4.mac
        ethernetInterface = name
      }
    }

    return { hostname, wifiIP, wifiMac, wifiInterface, ethernetIP, ethernetMac, ethernetInterface }
  })

  // IPC : scan des réseaux Wi-Fi via nmcli
  ipcMain.handle('scan-wifi', async () => {
    try {
      const { stdout } = await execFileAsync('nmcli', [
        '--terse', '--fields', 'SSID,SIGNAL,SECURITY',
        'device', 'wifi', 'list', '--rescan', 'yes'
      ])
      const seen = new Set<string>()
      const networks = stdout
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          // nmcli --terse sépare par ':' et échappe '\:' dans les valeurs
          const parts = line.split(/(?<!\\):/)
          const ssid = parts[0]?.replace(/\\:/g, ':').trim() ?? ''
          const signal = parseInt(parts[1] ?? '0', 10)
          const security = parts[2]?.trim() ?? '--'
          return { ssid, signal, security }
        })
        .filter((n) => {
          if (!n.ssid || seen.has(n.ssid)) return false
          seen.add(n.ssid)
          return true
        })
        .sort((a, b) => b.signal - a.signal)
      return { success: true, networks }
    } catch (e) {
      return { success: false, networks: [], error: String(e) }
    }
  })

  // IPC : connexion Wi-Fi (DHCP ou statique)
  ipcMain.handle('connect-wifi', async (_, opts: {
    ssid: string; password: string; mode: 'dhcp' | 'static'
    ip?: string; prefix?: string; gateway?: string; dns?: string
  }) => {
    try {
      // Supprimer l'ancienne connexion pour ce SSID si elle existe
      await execFileAsync('nmcli', ['connection', 'delete', opts.ssid]).catch(() => null)

      // Connexion initiale (obtient une IP via DHCP d'abord)
      const connectArgs = ['device', 'wifi', 'connect', opts.ssid]
      if (opts.password) connectArgs.push('password', opts.password)
      await execFileAsync('nmcli', connectArgs)

      if (opts.mode === 'static') {
        const addr = `${opts.ip}/${opts.prefix ?? '24'}`
        await execFileAsync('nmcli', [
          'connection', 'modify', opts.ssid,
          'ipv4.method', 'manual',
          'ipv4.addresses', addr,
          'ipv4.gateway', opts.gateway ?? '',
          'ipv4.dns', opts.dns ?? ''
        ])
        await execFileAsync('nmcli', ['connection', 'up', opts.ssid])
      }

      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  // IPC : configuration Ethernet (DHCP ou statique)
  ipcMain.handle('set-ethernet', async (_, opts: {
    iface: string; mode: 'dhcp' | 'static'
    ip?: string; prefix?: string; gateway?: string; dns?: string
  }) => {
    try {
      // Trouver le nom de la connexion NetworkManager pour cette interface
      const { stdout } = await execFileAsync('nmcli', [
        '--terse', '--fields', 'NAME,DEVICE', 'connection', 'show'
      ])
      let connName = ''
      for (const line of stdout.split('\n').filter(Boolean)) {
        const parts = line.split(/(?<!\\):/)
        const name = parts[0]?.replace(/\\:/g, ':').trim() ?? ''
        const dev  = parts[1]?.replace(/\\:/g, ':').trim() ?? ''
        if (dev === opts.iface || name.toLowerCase().includes('wired') || name.toLowerCase().includes('ethernet')) {
          connName = name
          if (dev === opts.iface) break // correspondance exacte
        }
      }
      if (!connName) return { success: false, error: `Aucune connexion NM pour l'interface ${opts.iface}` }

      if (opts.mode === 'dhcp') {
        await execFileAsync('nmcli', [
          'connection', 'modify', connName,
          'ipv4.method', 'auto',
          'ipv4.addresses', '',
          'ipv4.gateway', '',
          'ipv4.dns', ''
        ])
      } else {
        const addr = `${opts.ip}/${opts.prefix ?? '24'}`
        await execFileAsync('nmcli', [
          'connection', 'modify', connName,
          'ipv4.method', 'manual',
          'ipv4.addresses', addr,
          'ipv4.gateway', opts.gateway ?? '',
          'ipv4.dns', opts.dns ?? ''
        ])
      }

      await execFileAsync('nmcli', ['connection', 'up', connName])
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
