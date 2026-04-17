# ACL Terminal

Borne d'accès multi-dispositifs (Electron + React + TypeScript).

Agrège en temps réel les événements d'accès provenant de plusieurs sources :
- **Badge** — via `ACL_Controller` (NestJS, socket.io:5000)
- **Face ID** — via `FACE_detection` (Python Flask + socket.io:5001, stream MJPEG local)
- **Fingerprint** *(futur)*

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  ACL_Terminal (Electron)                                   │
│  ├─ Dashboard : stream vidéo + bandeau accès unifié        │
│  └─ Admin (mot de passe) : Réseau | Face ID | ...          │
└──────┬──────────────────────────────────┬──────────────────┘
       │ WS :5000                         │ WS :5001 + HTTP :5000
┌──────▼──────────────┐            ┌──────▼──────────────────┐
│ ACL_Controller      │            │ FACE_detection (local)  │
│ (badges)            │            │ (face + stream MJPEG)   │
└─────────────────────┘            └─────────────────────────┘
```

## Scripts

```bash
npm install
npm run dev          # Développement
npm run build        # Build générique
npm run build:win    # Build Windows
npm run build:linux  # Build Linux (cible A733)
```
