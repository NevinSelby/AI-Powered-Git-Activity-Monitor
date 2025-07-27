import { useState, useEffect, useRef } from 'react'
import { Moon, Sun, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import IncidentCard from './components/IncidentCard'
import ConnectionStatus from './components/ConnectionStatus'
import Toast from './components/Toast'

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [incidents, setIncidents] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connected')
  const [lastUpdate, setLastUpdate] = useState(null)
  const [toastIncident, setToastIncident] = useState(null)
  const incidentFeedRef = useRef(null)

  useEffect(() => {
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    // Load initial data
    fetchInitialData()
    
    // Connect to SSE stream
    const eventSource = new EventSource('/api/stream')
    
    eventSource.onopen = () => {
      console.log('✅ SSE connection opened, setting status to connected')
      setConnectionStatus('connected')
      // Set last update if not already set
      if (!lastUpdate) {
        setLastUpdate(new Date())
      }
    }
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'connected') {
          setConnectionStatus('connected')
        } else if (data.type === 'new_summary') {
          setConnectionStatus('connected') // Ensure status stays connected when receiving data
          setIncidents(prev => [data.data, ...prev].slice(0, 50))
          setLastUpdate(new Date())
          setToastIncident(data.data)
          showNewIncidentNotification(data.data)
          
          // Subtle auto-scroll to show new incident
          setTimeout(() => {
            if (incidentFeedRef.current) {
              incidentFeedRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              })
            }
          }, 500)
        } else if (data.type === 'ping') {
          setConnectionStatus('connected') // Keep connection alive on ping
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }
    
    eventSource.onerror = () => {
      setConnectionStatus('disconnected')
    }
    
    return () => {
      eventSource.close()
    }
  }, [])

  const fetchInitialData = async () => {
    try {
      const response = await fetch('/api/summary')
      if (response.ok) {
        const data = await response.json()
        setIncidents(data)
        // Set last update if we have data
        if (data.length > 0) {
          setLastUpdate(new Date())
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
    }
  }

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const showNewIncidentNotification = (incident) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Git Incident Detected', {
        body: `${incident.eventType} in ${incident.repoName}`,
        icon: '/favicon.ico'
      })
    }
  }

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-200`}>
      {/* Header */}
      <header className="bg-white dark:bg-dark-900 shadow-sm border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI-Powered Git Activity Monitor
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Real-time incident detection and AI summarization
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ConnectionStatus status={connectionStatus} lastUpdate={lastUpdate} />
              
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Incidents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{incidents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">System Status</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {connectionStatus === 'connected' ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Update</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Incident Feed */}
        <div className="space-y-6" ref={incidentFeedRef}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Live Incident Feed
          </h2>
          
          {incidents.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No incidents detected</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Monitoring GitHub for suspicious activity...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Toast Notifications */}
      {toastIncident && (
        <Toast 
          incident={toastIncident} 
          onClose={() => setToastIncident(null)} 
        />
      )}
    </div>
  )
}

export default App 