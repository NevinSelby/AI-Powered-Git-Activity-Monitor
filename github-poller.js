import database from './database.js';

class GitHubPoller {
  constructor() {
    this.baseUrl = 'https://api.github.com/events';
    this.token = process.env.GITHUB_TOKEN;
    this.isPolling = false;
    this.backoffMs = 1000;
    this.maxBackoffMs = 60000;
    this.lastEventId = null;
  }

  async start() {
    if (this.isPolling) return;
    this.isPolling = true;
    console.log('🚀 Starting GitHub events polling...');
    this.poll();
  }

  stop() {
    this.isPolling = false;
    console.log('⏹️ Stopping GitHub events polling...');
  }

  async poll() {
    while (this.isPolling) {
      try {
        await this.fetchEvents();
        this.backoffMs = 1000; // Reset backoff on success
        await this.sleep(10000); // Poll every 10 seconds when successful
      } catch (error) {
        console.error('❌ Polling error:', error.message);
        await this.handleError(error);
      }
    }
  }

  async fetchEvents() {
    const headers = {
      'User-Agent': 'AI-Powered-Git-Activity-Monitor/1.0',
      'Accept': 'application/vnd.github.v3+json'
    };

    if (this.token) {
      headers.Authorization = `token ${this.token}`;
    }

    const response = await fetch(this.baseUrl, { headers });

    if (response.status === 403 || response.status === 429) {
      const resetTime = response.headers.get('x-ratelimit-reset');
      const waitTime = resetTime ? (resetTime * 1000 - Date.now()) : this.backoffMs;
      throw new Error(`Rate limited. Reset in ${Math.ceil(waitTime / 1000)}s`);
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const events = await response.json();
    await this.processEvents(events);
  }

  async processEvents(events) {
    let newEvents = 0;
    
    for (const event of events) {
      if (this.lastEventId && event.id === this.lastEventId) break;
      
      const isSuspicious = this.isSuspiciousEvent(event);
      event.isSuspicious = isSuspicious;
      
      await database.saveEvent(event);
      
      if (isSuspicious) {
        newEvents++;
        console.log(`🚨 Suspicious event detected: ${event.type} in ${event.repo?.name}`);
      }
    }

    if (events.length > 0) {
      this.lastEventId = events[0].id;
    }

    if (newEvents > 0) {
      console.log(`📊 Processed ${events.length} events, ${newEvents} suspicious`);
    }
  }

  isSuspiciousEvent(event) {
    const suspiciousPatterns = [
      // Failed workflow runs
      () => event.type === 'WorkflowRunEvent' && 
            event.payload?.workflow_run?.conclusion === 'failure',
      
      // Force pushes to main/master branches
      () => event.type === 'PushEvent' && 
            event.payload?.forced && 
            ['main', 'master'].includes(event.payload?.ref?.replace('refs/heads/', '')),
      
      // Bursty issue creation (multiple issues from same user in short time)
      () => event.type === 'IssuesEvent' && 
            event.payload?.action === 'opened',
      
      // Repository deletions
      () => event.type === 'RepositoryEvent' && 
            event.payload?.action === 'deleted',
      
      // High-risk push events (large commits, many files)
      () => event.type === 'PushEvent' && 
            event.payload?.commits && 
            event.payload.commits.length > 10,
      
      // Branch deletions
      () => event.type === 'DeleteEvent' && 
            event.payload?.ref_type === 'branch',
      
      // Public repository made private
      () => event.type === 'RepositoryEvent' && 
            event.payload?.action === 'privatized',
      
      // Security alerts
      () => event.type === 'SecurityAdvisoryEvent',
      
      // Release events for high-profile repos
      () => event.type === 'ReleaseEvent' && 
            event.payload?.action === 'published'
    ];

    return suspiciousPatterns.some(pattern => {
      try {
        return pattern();
      } catch {
        return false;
      }
    });
  }

  async handleError(error) {
    // Add jitter to prevent thundering herd (±25% randomness)
    const jitter = this.backoffMs * 0.25 * (Math.random() - 0.5);
    const jitteredBackoff = Math.max(100, this.backoffMs + jitter);
    
    console.error(`⏳ Backing off for ${Math.round(jitteredBackoff)}ms due to:`, error.message);
    await this.sleep(jitteredBackoff);
    this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new GitHubPoller(); 