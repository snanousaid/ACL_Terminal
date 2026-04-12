import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface WifiConnectOptions {
  ssid: string
  password: string
  mode: 'dhcp' | 'static'
  ip?: string
  prefix?: string
  gateway?: string
  dns?: string
}

export interface EthernetOptions {
  iface: string
  mode: 'dhcp' | 'static'
  ip?: string
  prefix?: string
  gateway?: string
  dns?: string
}

// Custom APIs for renderer
const api = {
  getNetworkInfo: (): Promise<{
    hostname: string
    wifiIP: string
    wifiMac: string
    wifiInterface: string
    wifiSsid: string | null
    wifiMode: string | null
    ethernetIP: string
    ethernetMac: string
    ethernetInterface: string
    ethernetMode: string | null
  }> => ipcRenderer.invoke('get-network-info'),

  scanWifi: (): Promise<{
    success: boolean
    networks: { ssid: string; signal: number; security: string }[]
    error?: string
  }> => ipcRenderer.invoke('scan-wifi'),

  connectWifi: (opts: WifiConnectOptions): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('connect-wifi', opts),

  setEthernet: (opts: EthernetOptions): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('set-ethernet', opts)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
