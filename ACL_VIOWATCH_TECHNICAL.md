# ACL VioWatch — Documentation Technique

Application desktop Electron pour la surveillance d'accès en temps réel. Affiche les événements badge (accordé/refusé) reçus via WebSocket depuis le backend `acl_controller`.

---

## Schéma des connexions

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEVICE LINUX (192.168.10.132)                │
│                                                                     │
│  ┌──────────────────────────────┐   ┌───────────────────────────┐  │
│  │      acl_controller          │   │      ACL VioWatch          │  │
│  │         (NestJS)             │   │       (Electron)           │  │
│  │                              │   │                            │  │
│  │  ┌────────────────────────┐  │   │  ┌─────────────────────┐  │  │
│  │  │   REST API             │  │   │  │   Main Process      │  │  │
│  │  │   port 80              │◄─┼───┼──│   (index.ts)        │  │  │
│  │  │   /api/v2/network/*    │  │   │  │   apiGet / apiPost  │  │  │
│  │  │   /api/v2/users/:id/   │  │   │  └──────────┬──────────┘  │  │
│  │  │     image (public)     │  │   │             │ IPC          │  │
│  │  └────────────────────────┘  │   │  ┌──────────▼──────────┐  │  │
│  │                              │   │  │   Preload           │  │  │
│  │  ┌────────────────────────┐  │   │  │   window.api.*      │  │  │
│  │  │   WebSocket Server     │  │   │  └──────────┬──────────┘  │  │
│  │  │   port 5000            │  │   │             │             │  │
│  │  │   socket.io            │──┼───┼──►  ┌───────▼──────────┐ │  │
│  │  │   topic: "event"       │  │   │     │   Renderer       │ │  │
│  │  └────────────────────────┘  │   │     │   (React)        │ │  │
│  │                              │   │     │   socket.ts      │ │  │
│  │  ┌────────────────────────┐  │   │     │   App.tsx        │ │  │
│  │  │   Serial Reader        │  │   │     │   AccessCard     │ │  │
│  │  │   (badge scan)         │  │   │     └──────────────────┘ │  │
│  │  └──────────┬─────────────┘  │   └───────────────────────────┘  │
│  │             │                │                                   │
│  │  ┌──────────▼─────────────┐  │                                   │
│  │  │   AccessService        │  │                                   │
│  │  │   checkAccess()        │  │                                   │
│  │  │   → createEvent()      │  │                                   │
│  │  │   → socket.send()      │  │                                   │
│  │  └────────────────────────┘  │                                   │
│  └──────────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Flux événement badge (temps réel)

```
Lecteur badge (série)
        │
        ▼
  SerialService
  (serial.service.ts)
        │  EventEmitter2 "serial"
        ▼
  AccessService.checkAccess()
  ├─ Vérifie permissions + horaires
  ├─ Crée Event en base (include: { user: true })
  └─ socket.send("event", JSON.stringify({
           ...event,          ← id, badge_id, status, createdAt
           user: { ... },     ← id, first_name, last_name, image
           eventType,         ← ACCESS_GRANTED | ACCESS_DENIED
           doorName,
           readerName
     }))
        │
        │  WebSocket  port 5000
        │  topic : "event"
        ▼
  socket.ts (renderer)
  socket.on("event", raw → parse JSON)
        │
        ▼
  App.tsx
  setActiveEvent(ev)  ──────────────────► AccessCard affiche 5 s
                                                │
                                     user.image présent ?
                                          │         │
                                         OUI        NON
                                          │         │
                                          ▼         ▼
                               GET /api/v2/     Initiales
                               users/:id/image  ou icône
                               port 80
```

---

### Flux configuration réseau

```
App.tsx (double-clic)
        │
        ▼
  [Modale mot de passe]
  vérifie ADMIN_PASSWORD
        │
        ▼
  NetworkConfigModal
  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │  Onglet Infos          Onglet WiFi     Onglet Eth   │
  │       │                     │               │       │
  │       ▼                     ▼               ▼       │
  │  window.api          window.api       window.api    │
  │  .getNetworkInfo()   .scanWifi()      .setEthernet()│
  │                      .connectWifi()                 │
  └─────────────────────────────────────────────────────┘
        │
        │  IPC (contextBridge)
        ▼
  Main Process (index.ts)
  apiGet() / apiPost()
        │
        │  HTTP  port 80
        ▼
  acl_controller REST API
  ┌────────────────────────────────────┐
  │  GET  /network/info                │
  │  GET  /network/scan                │
  │  POST /network/wifi                │
  │  POST /network/ethernet            │
  └────────────────────────────────────┘
        │
        ▼
  NetworkService (nmcli)
  └─ sudo nmcli device wifi connect ...
  └─ sudo nmcli con mod ...
  └─ sudo nmcli -t -f ... device wifi list
```

---

### Résumé des canaux de communication

| Canal | Protocole | Port | Direction | Données |
|-------|-----------|------|-----------|---------|
| Événements badge | WebSocket (Socket.IO) | 5000 | backend → desktop | AccessEvent JSON |
| Info réseau | HTTP GET | 80 | desktop → backend | NetworkInfo JSON |
| Scan WiFi | HTTP GET | 80 | desktop → backend | WifiNetwork[] |
| Connexion WiFi | HTTP POST | 80 | desktop → backend | SSID + password + mode |
| Config Ethernet | HTTP POST | 80 | desktop → backend | IP + masque + passerelle |
| Image profil | HTTP GET | 80 | desktop → backend | Fichier image (jpg/png) |

---

## Stack technologique

| Couche | Technologie |
|--------|------------|
| Framework desktop | Electron 31.x |
| Build | electron-vite 2.x + Vite 5.x |
| UI | React 18.x |
| Styles | Tailwind CSS 3.x |
| Temps réel | Socket.IO client 4.x |
| Icônes | lucide-react |
| Clavier tactile | react-simple-keyboard |
| Langage | TypeScript 5.x |
| Packaging | electron-builder 24.x |

---

## Structure des fichiers

```
ACL_VioWatch/
├── src/
│   ├── main/
│   │   └── index.ts               # Processus principal Electron
│   ├── preload/
│   │   ├── index.ts               # Bridge IPC → renderer
│   │   └── index.d.ts             # Types exposés à window.api
│   └── renderer/
│       ├── index.html             # Point d'entrée HTML (CSP)
│       └── src/
│           ├── main.tsx           # Montage React
│           ├── App.tsx            # Composant racine + logique socket
│           ├── socket.ts          # Configuration Socket.IO
│           ├── assets/
│           │   └── main.css       # Animations personnalisées (RFID pulse, glow)
│           ├── components/
│           │   ├── AccessCard.tsx       # Affichage événement badge
│           │   ├── IdleScreen.tsx       # Écran d'attente animé
│           │   ├── StatusBar.tsx        # Barre état connexion + horloge
│           │   ├── NetworkConfigModal.tsx  # Modale configuration réseau
│           │   ├── VirtualKeyboard.tsx  # Clavier AZERTY tactile
│           │   └── KbInput.tsx          # Champ lié au clavier virtuel
│           └── context/
│               └── KeyboardContext.tsx  # État global du clavier virtuel
├── resources/
│   └── icon.png
├── electron.vite.config.ts
├── electron-builder.yml
└── tailwind.config.js
```

---

## Processus principal — `src/main/index.ts`

### Fenêtre

```
Taille     : 600 × 1024 px (fixe, non redimensionnable)
Titre      : VioWatch
Preload    : src/preload/index.js (sandbox désactivé)
```

### Connexion backend

```typescript
const API_BASE = 'http://192.168.10.132:80/api/v2'
```

Deux helpers HTTP via `electron.net` (pas de `fetch` / `axios`) :

| Fonction | Rôle |
|----------|------|
| `apiGet(path)` | Requête GET → JSON |
| `apiPost(path, data)` | Requête POST JSON |

### Handlers IPC

| Canal IPC | Endpoint backend | Description |
|-----------|-----------------|-------------|
| `get-network-info` | `GET /network/info` | Hostname, IP, MAC, SSID, mode |
| `scan-wifi` | `GET /network/scan` | Liste `{ssid, signal, security}[]` |
| `connect-wifi` | `POST /network/wifi` | Connexion WiFi DHCP ou statique |
| `set-ethernet` | `POST /network/ethernet` | Config Ethernet DHCP ou statique |

**Format `connect-wifi` (DHCP) :**
```json
{ "dhcp": true, "ssid": "...", "password": "..." }
```

**Format `connect-wifi` (statique) :**
```json
{ "dhcp": false, "ssid": "...", "password": "...", "staticIp": "...", "mask": "24", "gw": "...", "dnsPrimaryWifi": "..." }
```

**Format `set-ethernet` (statique) :**
```json
{ "dhcp": false, "staticIpEthern": "...", "maskEthern": "24", "gwEthern": "...", "dnsPrimaryEthern": "..." }
```

---

## Preload — `src/preload/index.ts`

Expose `window.api` au renderer via `contextBridge` :

```typescript
window.api = {
  getNetworkInfo(): Promise<NetworkInfo>
  scanWifi():       Promise<{ success: boolean; networks: WifiNetwork[]; error?: string }>
  connectWifi(opts: WifiConnectOptions): Promise<{ success: boolean; error?: string }>
  setEthernet(opts: EthernetOptions):   Promise<{ success: boolean; error?: string }>
}
```

**Types clés :**

```typescript
interface NetworkInfo {
  hostname: string
  wifiIP: string; wifiMac: string; wifiInterface: string
  wifiSsid: string | null; wifiMode: string | null
  ethernetIP: string; ethernetMac: string; ethernetInterface: string
  ethernetMode: string | null
}

interface WifiNetwork { ssid: string; signal: number; security: string }
```

---

## Socket — `src/renderer/src/socket.ts`

```typescript
const SERVER_URL = 'http://192.168.10.132:5000'   // WebSocket backend
export const API_BASE = SERVER_URL.replace(':5000', ':80')  // REST API
```

**Configuration Socket.IO :**

| Paramètre | Valeur |
|-----------|--------|
| Transport | `websocket` uniquement (pas de polling) |
| Auto-reconnect | Activé, tentatives infinies |
| Délai reconnexion | 3 000 ms |

**Événements écoutés dans `App.tsx` :**

| Événement | Action |
|-----------|--------|
| `connect` | `setConnected(true)` |
| `disconnect(reason)` | `setConnected(false)` |
| `connect_error(err)` | Log erreur |
| `event(raw)` | Parse JSON → `setActiveEvent(ev)` → auto-reset après 5 s |

---

## Composant racine — `App.tsx`

### Constantes

```typescript
DISPLAY_DURATION       = 5 000 ms  // Durée affichage événement badge
SETTINGS_ICON_DURATION = 6 000 ms  // Durée visibilité icône paramètres
ADMIN_PASSWORD         = '2899100*-+'
SHOW_LOGS              = false      // Activer le panneau logs socket
```

### Flux principal

```
Socket "event" reçu
  → parseJSON(raw) → AccessEvent
  → setActiveEvent(ev)
  → AccessCard affiché 5 s
  → setActiveEvent(null) → IdleScreen
```

### Accès configuration réseau

```
Double-clic n'importe où
  → icône engrenage apparaît (6 s)
  → clic icône → modale mot de passe
  → vérification ADMIN_PASSWORD
  → NetworkConfigModal s'ouvre
```

---

## Composants

### `AccessCard.tsx`

Affiche un événement d'accès reçu par socket.

**Props :** `event: AccessEvent`

**Interface `AccessEvent` :**
```typescript
{
  userId?: string | null
  status?: boolean
  eventType?: 'ACCESS_GRANTED' | 'ACCESS_DENIED'
  doorName?: string | null
  readerName?: string | null
  createdAt?: string
  user?: { id?: string; first_name?: string; last_name?: string; image?: string | null }
}
```

**Logique statut :**
```typescript
const granted = event.status === true || event.eventType === 'ACCESS_GRANTED'
```

**Composant `Avatar` :**
- Si `user.image` + `user.id` → charge `GET /api/v2/users/{id}/image`
- Échec de chargement → affiche initiales (prénom[0] + nom[0])
- Pas d'image en base → icône `UserCheck` / `UserX`

**Couleurs :**
- Accordé : `emerald` (vert)
- Refusé : `rose` (rouge)

---

### `IdleScreen.tsx`

Écran d'attente affiché quand aucun événement actif.

- Message "APPROCHER VOTRE BADGE" avec points clignotants
- Animation cercles concentriques (`ping`)
- Icône carte RFID flottante avec halo coloré
- Palette : bleu nuit / cyan

---

### `StatusBar.tsx`

Barre fixe en bas de fenêtre. Mise à jour toutes les secondes.

| Élément | Description |
|---------|-------------|
| Indicateur connexion | Vert pulsé "CONNECTÉ" ou rouge "DÉCONNECTÉ" |
| Date | Format français long (ex : "lun. 13 avr. 2026") |
| Heure | HH:MM:SS, police monospace |

---

### `NetworkConfigModal.tsx`

Modale de configuration réseau accessible après authentification admin.

**3 onglets :**

#### Infos
- Charge `window.api.getNetworkInfo()` à l'ouverture
- Affiche : hostname, IP/MAC WiFi, IP/MAC Ethernet

#### WiFi
- **Auto-scan** au montage du composant
- Bouton "Scanner" pour relancer manuellement
- Liste des réseaux : SSID, signal (%), sécurité, badge "Connecté"
- SSID connecté pré-sélectionné au chargement
- Mode actuel affiché : 🟢 DHCP (auto) | 🟠 IP Statique
- Toggle DHCP / IP Statique
- Champs statiques : IP, masque CIDR, passerelle, DNS
- Bouton "Se connecter" → `window.api.connectWifi()`

#### Ethernet
- Charge interface + mode actuel depuis `getNetworkInfo()`
- Mode actuel affiché : 🟢 DHCP (auto) | 🟠 IP Statique
- Toggle DHCP / IP Statique
- Champs statiques si mode static
- Bouton "Appliquer" → `window.api.setEthernet()`

---

### `VirtualKeyboard.tsx`

Clavier AZERTY tactile (bibliothèque `react-simple-keyboard`).

**Layouts :**
- `default` — minuscules
- `shift` — majuscules
- `numbers` — chiffres et symboles

**Comportement :**
- S'ouvre en overlay via `KeyboardContext`
- Barre de prévisualisation (masquée si `type="password"`)
- Touche OK → ferme le clavier
- Clic extérieur → ferme le clavier
- Shift automatiquement relâché après saisie

---

### `KbInput.tsx`

Champ de saisie lié au clavier virtuel.

- Au focus → `KeyboardContext.open(value, onChange, type)`
- Affiche les caractères masqués (●) pour les mots de passe
- Curseur animé quand clavier ouvert

---

## Contexte clavier — `KeyboardContext.tsx`

État global du clavier virtuel, accessible via `useKeyboard()`.

```typescript
interface KbCtx {
  isOpen: boolean
  kbValue: string
  kbType: 'text' | 'password'
  open(value: string, onChange: (v: string) => void, type?: string): void
  close(): void
  handleChange(v: string): void
}
```

**Cycle de vie :**
```
KbInput.focus()
  → context.open(val, setter)
  → VirtualKeyboard s'affiche
  → chaque touche → handleChange() → setter()
  → OK → context.close()
```

---

## Content Security Policy — `index.html`

```
default-src  'self'
script-src   'self'
style-src    'self' 'unsafe-inline'
img-src      'self' data: http: https:    ← images profil backend
connect-src  'self' http: https: ws: wss: ← socket + API
```

---

## Build & packaging

**Scripts :**

| Commande | Action |
|----------|--------|
| `npm run dev` | Développement avec hot reload |
| `npm run build` | Compilation TypeScript + renderer |
| `npm run build:linux` | AppImage Linux |
| `npm run build:win` | Installeur NSIS Windows |
| `npm run typecheck` | Vérification types TS |

**electron-builder.yml :**
- `appId` : `com.electron.app`
- `productName` : `education_datashow`
- Linux : AppImage
- Windows : NSIS installer + portable

---

## Points de configuration

| Paramètre | Emplacement | Valeur actuelle |
|-----------|-------------|-----------------|
| IP backend | `src/main/index.ts` + `src/renderer/src/socket.ts` | `192.168.10.132` |
| Port WebSocket | `src/renderer/src/socket.ts` | `5000` |
| Port REST API | Dérivé du SERVER_URL (`:5000` → `:80`) | `80` |
| Mot de passe admin | `src/renderer/src/App.tsx` | `2899100*-+` |
| Durée affichage badge | `src/renderer/src/App.tsx` | `5 000 ms` |
| Taille fenêtre | `src/main/index.ts` | `600 × 1024 px` |
