import { ElectronAPI } from '@electron-toolkit/preload'

export interface NetworkInfo {
  hostname: string
  wifiIP: string
  wifiMac: string
  wifiInterface: string
  ethernetIP: string
  ethernetMac: string
  ethernetInterface: string
}

export interface WifiNetwork {
  ssid: string
  signal: number
  security: string
}

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

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getNetworkInfo: () => Promise<NetworkInfo>
      scanWifi: () => Promise<{ success: boolean; networks: WifiNetwork[]; error?: string }>
      connectWifi: (opts: WifiConnectOptions) => Promise<{ success: boolean; error?: string }>
      setEthernet: (opts: EthernetOptions) => Promise<{ success: boolean; error?: string }>
    }
  }
}
