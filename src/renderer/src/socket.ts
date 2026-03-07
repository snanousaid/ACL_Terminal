import { io, Socket } from 'socket.io-client'

// Same config as ACL_133_FRONT — socket server runs on port 5000
const SERVER_URL = 'http://192.168.11.103:5000'

const socket: Socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 3000,
})

export default socket
