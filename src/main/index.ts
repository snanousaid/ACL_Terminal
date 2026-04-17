import { app, shell, BrowserWindow, ipcMain, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// const API_BASE = 'http://localhost:80/api/v2'
const API_BASE = 'http://192.168.10.132:80/api/v2'

function apiGet(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = net.request(`${API_BASE}${path}`)
    let body = ''
    request.on('response', (res) => {
      res.on('data', (chunk) => {
        body += chunk.toString()
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch {
          resolve(body)
        }
      })
    })
    request.on('error', reject)
    request.end()
  })
}

function apiPost(path: string, data: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: 'POST',
      url: `${API_BASE}${path}`
    })
    request.setHeader('Content-Type', 'application/json')
    let body = ''
    request.on('response', (res) => {
      res.on('data', (chunk) => {
        body += chunk.toString()
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch {
          resolve(body)
        }
      })
    })
    request.on('error', reject)
    request.write(JSON.stringify(data))
    request.end()
  })
}

interface BackendNetworkInfo {
  hostname: string
  wifi: {
    interface: string
    ip: string | null
    mac: string | null
    ssid: string | null
    mode: string | null
  }
  ethernet: {
    interface: string | null
    ip: string | null
    mac: string | null
    mode: string | null
  }
}

interface WifiConnectOpts {
  ssid: string
  password: string
  mode: 'dhcp' | 'static'
  ip?: string
  prefix?: string
  gateway?: string
  dns?: string
}

interface EthernetOpts {
  iface: string
  mode: 'dhcp' | 'static'
  ip?: string
  prefix?: string
  gateway?: string
  dns?: string
}

function createWindow(): void {
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  // IPC : network info via backend API
  ipcMain.handle('get-network-info', async () => {
    try {
      const info = (await apiGet('/network/info')) as BackendNetworkInfo
      return {
        hostname: info.hostname,
        wifiIP: info.wifi?.ip || 'Non disponible',
        wifiMac: info.wifi?.mac || '',
        wifiInterface: info.wifi?.interface || '',
        wifiSsid: info.wifi?.ssid || null,
        wifiMode: info.wifi?.mode || null,
        ethernetIP: info.ethernet?.ip || 'Non disponible',
        ethernetMac: info.ethernet?.mac || '',
        ethernetInterface: info.ethernet?.interface || '',
        ethernetMode: info.ethernet?.mode || null
      }
    } catch {
      return {
        hostname: '—',
        wifiIP: 'Non disponible',
        wifiMac: '',
        wifiInterface: '',
        wifiSsid: null,
        wifiMode: null,
        ethernetIP: 'Non disponible',
        ethernetMac: '',
        ethernetInterface: '',
        ethernetMode: null
      }
    }
  })

  // IPC : scan WiFi via backend API
  ipcMain.handle('scan-wifi', async () => {
    try {
      const networks = (await apiGet('/network/scan')) as {
        ssid: string
        signal: number
        security: string
      }[]
      return { success: true, networks }
    } catch (e) {
      return { success: false, networks: [], error: String(e) }
    }
  })

  // IPC : connect WiFi via backend API
  ipcMain.handle(
    'connect-wifi',
    async (_, opts: WifiConnectOpts) => {
      try {
        const body =
          opts.mode === 'dhcp'
            ? { dhcp: true, ssid: opts.ssid, password: opts.password }
            : {
                dhcp: false,
                ssid: opts.ssid,
                password: opts.password,
                staticIp: opts.ip,
                mask: opts.prefix ?? '24',
                gw: opts.gateway,
                dnsPrimaryWifi: opts.dns
              }
        await apiPost('/network/wifi', body)
        return { success: true }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  )

  // IPC : configure Ethernet via backend API
  ipcMain.handle(
    'set-ethernet',
    async (_, opts: EthernetOpts) => {
      try {
        const body =
          opts.mode === 'dhcp'
            ? { dhcp: true }
            : {
                dhcp: false,
                staticIpEthern: opts.ip,
                maskEthern: opts.prefix ?? '24',
                gwEthern: opts.gateway,
                dnsPrimaryEthern: opts.dns
              }
        await apiPost('/network/ethernet', body)
        return { success: true }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  )

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
