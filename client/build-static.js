import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('🔨 Creating static build...');

// Create dist directory
const distDir = join(process.cwd(), 'dist');
try {
  mkdirSync(distDir, { recursive: true });
  console.log('✅ Created dist directory');
} catch (error) {
  console.log('📁 Dist directory already exists');
}

// Create static HTML with embedded React
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-Powered Git Activity Monitor</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .toast { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { transform: translateY(-100%); } to { transform: translateY(0); } }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <div id="root"></div>
    
    <script type="text/babel">
        const { useState, useEffect, useRef } = React;
        
        function App() {
            const [darkMode, setDarkMode] = useState(false);
            const [incidents, setIncidents] = useState([]);
            const [connectionStatus, setConnectionStatus] = useState('connected');
            const [lastUpdate, setLastUpdate] = useState(null);
            const [toastIncident, setToastIncident] = useState(null);
            const incidentFeedRef = useRef(null);

            useEffect(() => {
                const savedDarkMode = localStorage.getItem('darkMode') === 'true';
                setDarkMode(savedDarkMode);
                if (savedDarkMode) {
                    document.documentElement.classList.add('dark');
                }
            }, []);

            useEffect(() => {
                fetchInitialData();
                const eventSource = new EventSource('/api/stream');

                eventSource.onopen = () => {
                    setConnectionStatus('connected');
                    if (!lastUpdate) {
                        setLastUpdate(new Date());
                    }
                };

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'new_summary') {
                            setConnectionStatus('connected');
                            setIncidents(prev => [data.data, ...prev].slice(0, 50));
                            setLastUpdate(new Date());
                            setToastIncident(data.data);
                            setTimeout(() => {
                                if (incidentFeedRef.current) {
                                    incidentFeedRef.current.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start'
                                    });
                                }
                            }, 500);
                        } else if (data.type === 'ping') {
                            setConnectionStatus('connected');
                        }
                    } catch (error) {
                        console.error('Error parsing SSE data:', error);
                    }
                };

                eventSource.onerror = () => {
                    setConnectionStatus('disconnected');
                };

                return () => eventSource.close();
            }, []);

            const fetchInitialData = async () => {
                try {
                    const response = await fetch('/api/summary');
                    if (response.ok) {
                        const data = await response.json();
                        setIncidents(data);
                        if (data.length > 0) {
                            setLastUpdate(new Date());
                        }
                    }
                } catch (error) {
                    console.error('Error fetching initial data:', error);
                }
            };

            const toggleDarkMode = () => {
                const newDarkMode = !darkMode;
                setDarkMode(newDarkMode);
                localStorage.setItem('darkMode', newDarkMode);
                document.documentElement.classList.toggle('dark');
            };

            const getRelativeTime = (timestamp) => {
                const now = new Date();
                const time = new Date(timestamp);
                const diffInSeconds = Math.floor((now - time) / 1000);
                
                if (diffInSeconds < 60) return 'Just now';
                if (diffInSeconds < 3600) return \`\${Math.floor(diffInSeconds / 60)}m ago\`;
                if (diffInSeconds < 86400) return \`\${Math.floor(diffInSeconds / 3600)}h ago\`;
                return \`\${Math.floor(diffInSeconds / 86400)}d ago\`;
            };

            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    🔍 AI-Powered Git Activity Monitor
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">
                                    Real-time GitHub incident detection and AI-powered summarization
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <ConnectionStatus status={connectionStatus} lastUpdate={lastUpdate} />
                                <button
                                    onClick={toggleDarkMode}
                                    className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {darkMode ? '☀️' : '🌙'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                        Recent Incidents
                                    </h2>
                                    <div className="space-y-4" ref={incidentFeedRef}>
                                        {incidents.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="text-gray-400 dark:text-gray-500 mb-4">
                                                    📊
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    No incidents detected yet. Monitoring GitHub activity...
                                                </p>
                                            </div>
                                        ) : (
                                            incidents.map((incident, index) => (
                                                <IncidentCard key={index} incident={incident} getRelativeTime={getRelativeTime} />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        System Status
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">GitHub Polling</span>
                                            <span className="text-green-600 dark:text-green-400">✅ Active</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">AI Processing</span>
                                            <span className="text-green-600 dark:text-green-400">✅ Active</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Database</span>
                                            <span className="text-green-600 dark:text-green-400">✅ Connected</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        API Endpoints
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <a href="/api/health" className="block text-blue-600 dark:text-blue-400 hover:underline">
                                            /api/health
                                        </a>
                                        <a href="/api/summary" className="block text-blue-600 dark:text-blue-400 hover:underline">
                                            /api/summary
                                        </a>
                                        <a href="/api/stream" className="block text-blue-600 dark:text-blue-400 hover:underline">
                                            /api/stream
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {toastIncident && (
                        <Toast incident={toastIncident} onClose={() => setToastIncident(null)} />
                    )}
                </div>
            );
        }

        function ConnectionStatus({ status, lastUpdate }) {
            const isConnected = status === 'connected';
            const isConnecting = status === 'connecting';

            return (
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                        {isConnected ? (
                            <span className="text-green-500">●</span>
                        ) : isConnecting ? (
                            <span className="text-yellow-500 animate-pulse">●</span>
                        ) : (
                            <span className="text-red-500">●</span>
                        )}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {isConnected ? 'Live' : isConnecting ? 'Connecting...' : 'Offline'}
                        </span>
                        {isConnected && <div className="pulse-dot" />}
                    </div>

                    {lastUpdate && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>🕐</span>
                            <span>{lastUpdate.toLocaleTimeString()}</span>
                        </div>
                    )}
                </div>
            );
        }

        function IncidentCard({ incident, getRelativeTime }) {
            const [isExpanded, setIsExpanded] = useState(false);

            return (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-red-500">⚠️</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {incident.eventType}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {getRelativeTime(incident.timestamp)}
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {incident.summary?.overall || incident.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                                {incident.summary?.overall || incident.summary}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span>👤 {incident.actor || 'Unknown'}</span>
                                <span>🏢 {incident.repoName || incident.repo}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    </div>
                    
                    {isExpanded && (
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
                            <pre>{JSON.stringify(incident, null, 2)}</pre>
                        </div>
                    )}
                </div>
            );
        }

        function Toast({ incident, onClose }) {
            useEffect(() => {
                const timer = setTimeout(onClose, 5000);
                return () => clearTimeout(timer);
            }, [onClose]);

            return (
                <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm toast">
                    <div className="flex items-start space-x-3">
                        <span className="text-red-500">⚠️</span>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                New Incident Detected
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {incident.summary?.overall || incident.title}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>
                </div>
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>`;

// Write the HTML file
const indexPath = join(distDir, 'index.html');
writeFileSync(indexPath, htmlContent);
console.log('✅ Created index.html');

console.log('🎉 Static build complete!');
console.log('📁 Files created:');
console.log('  - dist/index.html'); 