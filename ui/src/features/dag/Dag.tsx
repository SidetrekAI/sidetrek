import { useCallback, useEffect, useState } from 'react'
import ReactFlow, { Node, Edge } from 'reactflow'
import { useSocket } from '@/features/ws/hooks'

export default function Dag() {
  const socket = useSocket()

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  const onMessage = useCallback((message: any) => {
    if (message?.topic !== 'dag' || !message?.data) return

    const data = JSON.parse(message.data)
    console.log('data', data)

    setNodes(data?.nodes)
    setEdges(data?.edges)
  }, [])

  useEffect(() => {
    socket.addEventListener('message', onMessage)

    return () => {
      socket.removeEventListener('message', onMessage)
    }
  }, [socket, onMessage])

  return (
    <div className="w-full h-full">
      <ReactFlow nodes={nodes} edges={edges} />
    </div>
  )
}
