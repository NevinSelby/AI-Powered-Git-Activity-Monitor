import { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'

function Toast({ incident, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for animation to complete
    }, 5000) // Show for 5 seconds

    return () => clearTimeout(timer)
  }, [onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  if (!incident) return null

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white dark:bg-dark-800 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              New Incident Detected
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {incident.eventType.replace('Event', '')} in {incident.repoName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {incident.timestampRelative}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toast 