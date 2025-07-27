import database from './database.js';

class AISummarizer {
  constructor() {
    this.apiKey = null;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
    this.isProcessing = false;
  }

  initialize() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return false;
    } else {
      console.log('✅ GEMINI_API_KEY loaded successfully');
      return true;
    }
  }

  async start() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    console.log('🧠 Starting AI summarization processor...');
    this.processQueue();
  }

  stop() {
    this.isProcessing = false;
    console.log('⏹️ Stopping AI summarization processor...');
  }

  async processQueue() {
    while (this.isProcessing) {
      try {
        const events = await database.getUnprocessedEvents();
        
        for (const event of events) {
          await this.processEvent(event);
          await this.sleep(2000); // Rate limiting - 2 seconds between requests
        }

        await this.sleep(15000); // Check for new events every 15 seconds
      } catch (error) {
        console.error('❌ AI processing error:', error.message);
        await this.sleep(30000); // Longer wait on error
      }
    }
  }

  async processEvent(event) {
    try {
      console.log(`🧠 Processing ${event.type} for ${event.repo_name}...`);
      
      const rawPayload = JSON.parse(event.raw_payload);
      const summary = await this.generateSummary(rawPayload);
      
      await database.saveSummary({
        eventId: event.id,
        repoName: event.repo_name,
        eventType: event.type,
        summaryText: summary.overall,
        rootCause: summary.rootCause,
        impact: summary.impact,
        nextSteps: summary.nextSteps
      });

      await database.markEventProcessed(event.id);
      console.log(`✅ Summarized ${event.type} for ${event.repo_name}`);
      
    } catch (error) {
      console.error(`❌ Failed to process event ${event.id}:`, error.message);
    }
  }

  async generateSummary(event) {
    const prompt = this.buildPrompt(event);
    
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const generatedText = result.candidates[0].content.parts[0].text;
      return this.parseResponse(generatedText);
    } catch (error) {
      console.error('❌ Gemini API error:', error.message);
      return this.getFallbackSummary(event);
    }
  }

  buildPrompt(event) {
    return `You are a cybersecurity analyst reviewing GitHub activity. Analyze this suspicious event and provide a structured incident summary.

EVENT DATA:
Type: ${event.type}
Repository: ${event.repo?.name || 'Unknown'}
Actor: ${event.actor?.login || 'Unknown'}
Created: ${event.created_at}
Payload: ${JSON.stringify(event.payload || {}, null, 2)}

Provide EXACTLY this format:

ROOT_CAUSE:
• [bullet point 1]
• [bullet point 2]
• [bullet point 3]

IMPACT:
• [bullet point 1]
• [bullet point 2]
• [bullet point 3]

NEXT_STEPS:
• [bullet point 1]
• [bullet point 2]
• [bullet point 3]

OVERALL_SUMMARY:
[2-3 sentence overview]

Keep each section to exactly 3 bullet points. Be specific about technical details, potential risks, and actionable recommendations.`;
  }

  parseResponse(response) {
    const sections = {
      rootCause: this.extractSection(response, 'ROOT_CAUSE'),
      impact: this.extractSection(response, 'IMPACT'),
      nextSteps: this.extractSection(response, 'NEXT_STEPS'),
      overall: this.extractSection(response, 'OVERALL_SUMMARY')
    };

    // Fallback if parsing fails
    if (!sections.rootCause || !sections.impact || !sections.nextSteps) {
      return this.parseResponseFallback(response);
    }

    return sections;
  }

  extractSection(text, sectionName) {
    const regex = new RegExp(`${sectionName}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  parseResponseFallback(response) {
    const lines = response.split('\n').filter(line => line.trim());
    const bullets = lines.filter(line => line.startsWith('•') || line.startsWith('-'));
    
    const chunkSize = Math.ceil(bullets.length / 3);
    return {
      rootCause: bullets.slice(0, chunkSize).join('\n'),
      impact: bullets.slice(chunkSize, chunkSize * 2).join('\n'),
      nextSteps: bullets.slice(chunkSize * 2).join('\n'),
      overall: lines.find(line => !line.startsWith('•') && !line.startsWith('-') && line.length > 20) || 'Suspicious activity detected requiring investigation.'
    };
  }

  getFallbackSummary(event) {
    const eventType = event.type;
    const repoName = event.repo?.name || 'unknown repository';
    
    const fallbacks = {
      'WorkflowRunEvent': {
        rootCause: '• CI/CD pipeline failure in automated workflow\n• Potential code quality or test failures\n• Build environment or dependency issues',
        impact: '• Development workflow disruption\n• Potential deployment delays\n• Code quality concerns',
        nextSteps: '• Review workflow logs for error details\n• Check recent commits for breaking changes\n• Verify build environment configuration'
      },
      'PushEvent': {
        rootCause: '• Force push detected to protected branch\n• Potential history rewriting or unauthorized changes\n• Git workflow violation',
        impact: '• Code history integrity compromised\n• Potential data loss or security issues\n• Team collaboration disruption',
        nextSteps: '• Review pushed changes immediately\n• Verify author authorization\n• Implement branch protection rules'
      },
      'IssuesEvent': {
        rootCause: '• High volume of issue creation detected\n• Potential spam or coordinated reporting\n• System or process-related problems',
        impact: '• Project management workflow disruption\n• Increased maintenance overhead\n• Community trust concerns',
        nextSteps: '• Review issue content for legitimacy\n• Check for spam patterns\n• Implement issue templates if needed'
      }
    };

    const fallback = fallbacks[eventType] || {
      rootCause: '• Suspicious activity pattern detected\n• Requires manual investigation\n• Potential security or operational concern',
      impact: '• Repository security or stability risk\n• Development workflow disruption\n• Requires immediate attention',
      nextSteps: '• Investigate event details manually\n• Review recent repository activity\n• Contact repository maintainers if needed'
    };

    return {
      ...fallback,
      overall: `Suspicious ${eventType} activity detected in ${repoName} requiring investigation.`
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new AISummarizer(); 