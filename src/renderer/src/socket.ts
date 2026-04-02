import { io, Socket } from 'socket.io-client'

// const SERVER_URL = 'http://192.168.10.132:5000'
const SERVER_URL = 'http://localhost:5000'
const socket: Socket = io(SERVER_URL, {
  transports: ['websocket'],   // skip XHR polling — backend is standalone WS server
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 3000,
})

export { SERVER_URL }
export default socket
