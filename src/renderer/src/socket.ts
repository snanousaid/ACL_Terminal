import { io, Socket } from 'socket.io-client'

// Change this URL to match your acl_controller server
// const SERVER_URL = 'http://localhost:3000'
const SERVER_URL = 'http://192.168.11.103:3000'
const socket: Socket = io(SERVER_URL, {
  transports: ['websocket'],
  autoConnect: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
})

export default socket
