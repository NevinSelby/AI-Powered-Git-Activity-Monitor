import { Wifi, WifiOff, Clock } from 'lucide-react'

function ConnectionStatus({ status, lastUpdate }) {
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : isConnecting ? (
          <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isConnected ? 'Live' : isConnecting ? 'Connecting...' : 'Offline'}
        </span>
        {isConnected && <div className="pulse-dot" />}
      </div>
      
      {lastUpdate && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          <span>{lastUpdate.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  )
}

export default ConnectionStatus 