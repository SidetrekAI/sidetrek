import { useContext } from 'react'
import { SocketContext } from './SocketProvider'

export const useSocket = () => {
  const socket = useContext(SocketContext)

  return socket
}
