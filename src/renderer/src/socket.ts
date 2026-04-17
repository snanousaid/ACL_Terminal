import { io, Socket } from 'socket.io-client'

/* ============================================================
   SOCKET BADGE — ACL_Controller (NestJS, réseau local)
   ============================================================ */
const SERVER_URL = 'http://192.168.10.132:5000'
// const SERVER_URL = 'http://localhost:5000'

/** Base URL for the REST API (port 80) */
export const API_BASE = SERVER_URL.replace(':5000', ':80')

const socket: Socket = io(SERVER_URL, {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 3000,
})

/* ============================================================
   SOCKET FACE ID — FACE_detection (Python, localhost)
   ============================================================ */
export const FACE_SERVER_URL = 'http://localhost:5001'

/** URL du stream MJPEG (HTTP, port 5000 local) */
export const FACE_STREAM_URL = 'http://localhost:5000/video_feed'

/** Base API Face ID (enrôlement, liste users, etc.) */
export const FACE_API_BASE = 'http://localhost:5000'

export const faceSocket: Socket = io(FACE_SERVER_URL, {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 3000,
})

export { SERVER_URL }
export default socket
