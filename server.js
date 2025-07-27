import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync, readdirSync } from 'fs';

// Load environment variables from .secrets file (only in development)
if (process.env.NODE_ENV !== 'production') {
  try {
    const secrets = readFileSync('.secrets', 'utf8');
    secrets.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to load .secrets file:', error.message);
  }
}

// Import modules after environment variables are loaded
import database from './database.js';
import githubPoller from './github-poller.js';
import aiSummarizer from './ai-summarizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Store SSE clients
const sseClients = new Set();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ai-powered-git-activity-monitor.onrender.com', 'https://your-app-name.onrender.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Serve static frontend files with cache busting
const staticPath = path.join(__dirname, 'client/dist');
console.log('🔍 Checking for static files at:', staticPath);
console.log('🔍 Current directory:', __dirname);
console.log('🔍 Directory contents:', readdirSync(__dirname));

// Check if client directory exists
const clientPath = path.join(__dirname, 'client');
if (existsSync(clientPath)) {
  console.log('✅ Client directory exists');
  console.log('🔍 Client directory contents:', readdirSync(clientPath));
} else {
  console.log('❌ Client directory not found');
}

if (existsSync(staticPath)) {
  app.use(express.static(staticPath, {
    etag: false,
    lastModified: false,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
  console.log('✅ Static files served from:', staticPath);
} else {
  console.error('❌ Static files not found at:', staticPath);
  
  // Try to serve the client directory directly as fallback
  if (existsSync(clientPath)) {
    app.use('/client', express.static(clientPath));
    console.log('✅ Serving client directory as fallback');
  }
  
  // Create a simple fallback response
  app.get('*', (req, res) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI-Powered Git Activity Monitor</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h1>AI-Powered Git Activity Monitor</h1>
          <p>Backend is running successfully!</p>
          <p>API Health: <a href="/api/health">/api/health</a></p>
          <p>API Summary: <a href="/api/summary">/api/summary</a></p>
          <p>Test Page: <a href="/client/test.html">/client/test.html</a></p>
          <p>Frontend build files are missing. Check the deployment logs.</p>
        </body>
      </html>
    `);
  });
}

// API Routes
app.get('/api/summary', async (req, res) => {
  try {
    const since = req.query.since;
    const summaries = await database.getSummaries(since);
    
    const formattedSummaries = summaries.map(summary => ({
      id: summary.id,
      eventId: summary.event_id,
      repoName: summary.repo_name,
      eventType: summary.event_type,
      summary: {
        overall: summary.summary_text,
        rootCause: summary.root_cause,
        impact: summary.impact,
        nextSteps: summary.next_steps
      },
      timestamp: summary.created_at,
      timestampRelative: getRelativeTime(summary.created_at)
    }));

    res.json(formattedSummaries);
  } catch (error) {
    console.error('❌ Error fetching summaries:', error);
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

// SSE endpoint for real-time updates
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const clientId = Date.now() + Math.random();
  
  const client = {
    id: clientId,
    response: res,
    lastPing: Date.now()
  };
  
  sseClients.add(client);
  console.log(`📡 SSE client connected (${sseClients.size} total)`);

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'AI-Powered Git Activity Monitor connected' })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    sseClients.delete(client);
    console.log(`📡 SSE client disconnected (${sseClients.size} total)`);
  });

  // Keep connection alive
  const pingInterval = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(pingInterval);
      return;
    }
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);

  req.on('close', () => clearInterval(pingInterval));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    clients: sseClients.size,
    github: githubPoller.isPolling,
    ai: aiSummarizer.isProcessing
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Broadcast new summary to all SSE clients
export function broadcastSummary(summary) {
  const formattedSummary = {
    id: summary.id,
    eventId: summary.event_id,
    repoName: summary.repo_name,
    eventType: summary.event_type,
    summary: {
      overall: summary.summary_text,
      rootCause: summary.root_cause,
      impact: summary.impact,
      nextSteps: summary.next_steps
    },
    timestamp: summary.created_at,
    timestampRelative: getRelativeTime(summary.created_at)
  };

  const message = JSON.stringify({
    type: 'new_summary',
    data: formattedSummary
  });

  sseClients.forEach(client => {
    try {
      if (!client.response.writableEnded) {
        client.response.write(`data: ${message}\n\n`);
      }
    } catch (error) {
      console.error('❌ Error broadcasting to client:', error);
      sseClients.delete(client);
    }
  });

  console.log(`📡 Broadcasted summary to ${sseClients.size} clients`);
}

function getRelativeTime(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return 'just now';
}

// Enhanced database methods to trigger broadcasts
const originalSaveSummary = database.saveSummary.bind(database);
database.saveSummary = async function(summary) {
  const result = await originalSaveSummary(summary);
  
  // Get the full summary with ID for broadcasting
  const summaries = await this.getSummaries();
  const latestSummary = summaries[0];
  
  if (latestSummary) {
    broadcastSummary(latestSummary);
  }
  
  return result;
};

// Start services
async function startServer() {
  try {
    // Initialize database first
    await database.init();
    console.log('✅ Database initialized');

    // Validate environment variables
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is REQUIRED for AI summarization!');
      console.log('📝 Get your free key at: https://makersuite.google.com/app/apikey');
    }
    
    if (!process.env.GITHUB_TOKEN) {
      console.error('❌ GITHUB_TOKEN is REQUIRED for proper rate limits!');
      console.log('📝 Get your token at: https://github.com/settings/tokens');
      console.log('⚠️ Without token: 60 requests/hour | With token: 5,000 requests/hour');
    }

    // Initialize AI summarizer after environment is loaded
    if (!aiSummarizer.initialize()) {
      console.error('❌ AI summarizer initialization failed');
    }

    // Start background services
    await githubPoller.start();
    await aiSummarizer.start();

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 AI-Powered Git Activity Monitor running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  githubPoller.stop();
  aiSummarizer.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  githubPoller.stop();
  aiSummarizer.stop();
  process.exit(0);
});

startServer(); 