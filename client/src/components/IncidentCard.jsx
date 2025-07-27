import { useState } from 'react'
import { ChevronDown, ChevronUp, GitBranch, AlertTriangle, Clock, User, ExternalLink } from 'lucide-react'

function IncidentCard({ incident }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getEventBadgeStyle = (eventType) => {
    const styles = {
      'WorkflowRunEvent': 'badge-critical',
      'PushEvent': 'badge-warning',
      'IssuesEvent': 'badge-info',
      'RepositoryEvent': 'badge-critical',
      'DeleteEvent': 'badge-warning',
      'SecurityAdvisoryEvent': 'badge-critical',
      'ReleaseEvent': 'badge-info'
    }
    return styles[eventType] || 'badge-info'
  }

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'WorkflowRunEvent':
        return <AlertTriangle className="h-4 w-4" />
      case 'PushEvent':
        return <GitBranch className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatBulletPoints = (text) => {
    if (!text) return []
    return text.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[•\-]\s*/, '').trim())
      .filter(line => line.length > 0)
  }

  return (
    <div className="incident-card animate-fade-in">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getEventIcon(incident.eventType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {incident.repoName}
                </h3>
                <span className={`badge ${getEventBadgeStyle(incident.eventType)}`}>
                  {incident.eventType.replace('Event', '')}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {incident.summary.overall}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{incident.timestampRelative}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>Event ID: {incident.eventId.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-dark-700 pt-4 space-y-4">
            {/* Root Cause */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                Root Cause
              </h4>
              <ul className="space-y-1">
                {formatBulletPoints(incident.summary.rootCause).map((point, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                    <span className="text-red-500 mr-2 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Impact */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                Impact
              </h4>
              <ul className="space-y-1">
                {formatBulletPoints(incident.summary.impact).map((point, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                    <span className="text-yellow-500 mr-2 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                <ExternalLink className="h-4 w-4 text-blue-500 mr-2" />
                Next Steps
              </h4>
              <ul className="space-y-1">
                {formatBulletPoints(incident.summary.nextSteps).map((point, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                    <span className="text-blue-500 mr-2 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Raw JSON Data */}
            <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 mt-4">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Raw Event Data
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <span className="font-medium">Event ID:</span>
                  <span className="ml-1 font-mono">{incident.eventId}</span>
                </div>
                <div>
                  <span className="font-medium">Timestamp:</span>
                  <span className="ml-1">{new Date(incident.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-gray-900 dark:bg-black rounded p-3 overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify({
                    id: incident.eventId,
                    type: incident.eventType,
                    repo: incident.repoName,
                    timestamp: incident.timestamp,
                    summary: incident.summary
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IncidentCard 