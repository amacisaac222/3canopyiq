#!/usr/bin/env node

/**
 * Claude Code Deep Context Hooks
 * Captures ALL Claude Code tool usage for rich context tracking
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const API_URL = process.env.CANOPYIQ_API_URL || 'http://localhost:3000/api/claude';
const SESSION_ID = `claude-context-${Date.now()}`;

class ClaudeCodeContextTracker {
  constructor() {
    this.explorationPath = [];
    this.searchHistory = [];
    this.errorLog = [];
    this.decisionPoints = [];
    this.fileReadCount = new Map();
    this.timeSpentInFile = new Map();
    this.lastFileAccess = null;
    this.sessionStartTime = Date.now();
  }

  // Track Read tool usage - captures exploration
  async trackRead(filePath, options = {}) {
    const timestamp = Date.now();

    // Track time spent in previous file
    if (this.lastFileAccess) {
      const timeSpent = timestamp - this.lastFileAccess.timestamp;
      const prevFile = this.lastFileAccess.file;
      this.timeSpentInFile.set(prevFile, (this.timeSpentInFile.get(prevFile) || 0) + timeSpent);
    }

    // Track exploration path
    this.explorationPath.push({
      file: filePath,
      timestamp,
      action: 'read',
      lineRange: options.lineRange
    });

    // Track read frequency
    this.fileReadCount.set(filePath, (this.fileReadCount.get(filePath) || 0) + 1);

    this.lastFileAccess = { file: filePath, timestamp };

    await this.sendEvent({
      type: 'exploration',
      subtype: 'file_read',
      description: `Explored: ${path.basename(filePath)}`,
      filePath,
      readCount: this.fileReadCount.get(filePath),
      metadata: {
        lineRange: options.lineRange,
        isRevisit: this.fileReadCount.get(filePath) > 1,
        explorationDepth: this.explorationPath.length
      }
    });

    return { tracked: true, readCount: this.fileReadCount.get(filePath) };
  }

  // Track Search/Grep usage - captures investigation patterns
  async trackSearch(pattern, options = {}) {
    const timestamp = Date.now();

    this.searchHistory.push({
      pattern,
      timestamp,
      scope: options.scope || 'workspace',
      resultCount: options.resultCount || 0
    });

    await this.sendEvent({
      type: 'search',
      subtype: options.tool || 'grep',
      description: `Searched for: "${pattern}"`,
      pattern,
      metadata: {
        scope: options.scope,
        fileTypes: options.fileTypes,
        resultCount: options.resultCount,
        includePattern: options.includePattern,
        excludePattern: options.excludePattern,
        searchNumber: this.searchHistory.length,
        // Track if this search led to a file edit
        ledToEdit: false // Will be updated later if edit follows
      }
    });

    // Analyze search intent
    const intent = this.analyzeSearchIntent(pattern);
    if (intent) {
      await this.trackDecision(`Search intent: ${intent}`, { pattern });
    }

    return { tracked: true, searchNumber: this.searchHistory.length };
  }

  // Track Edit/Write operations with context
  async trackEdit(filePath, changes, options = {}) {
    const timestamp = Date.now();

    // Find related searches (searches that happened in last 2 minutes)
    const recentSearches = this.searchHistory.filter(
      s => timestamp - s.timestamp < 120000
    );

    // Find exploration context (files read before this edit)
    const explorationContext = this.explorationPath
      .filter(e => timestamp - e.timestamp < 300000)
      .map(e => e.file);

    await this.sendEvent({
      type: 'file_edit',
      subtype: options.operation || 'modify',
      description: `Modified: ${path.basename(filePath)}`,
      filePath,
      metadata: {
        linesAdded: changes.linesAdded || 0,
        linesRemoved: changes.linesRemoved || 0,
        changeType: changes.type,
        // Rich context
        triggeredBySearches: recentSearches.map(s => s.pattern),
        explorationContext: [...new Set(explorationContext)],
        timeFromLastRead: this.lastFileAccess ?
          timestamp - this.lastFileAccess.timestamp : null,
        editNumber: options.editNumber || 1,
        isRefactoring: this.detectRefactoring(changes)
      }
    });

    // Mark recent searches as "led to edit"
    if (recentSearches.length > 0) {
      await this.sendEvent({
        type: 'insight',
        description: `Search "${recentSearches[0].pattern}" led to edit in ${path.basename(filePath)}`
      });
    }

    return { tracked: true, context: { searches: recentSearches.length, explorations: explorationContext.length } };
  }

  // Track Bash commands with full context
  async trackCommand(command, output, options = {}) {
    const timestamp = Date.now();

    // Detect command type
    const commandType = this.detectCommandType(command);

    // Check for errors
    const hasError = this.detectError(output);
    if (hasError) {
      this.errorLog.push({
        command,
        error: hasError,
        timestamp
      });
    }

    await this.sendEvent({
      type: 'command',
      subtype: commandType,
      description: `Executed: ${command}`,
      command,
      metadata: {
        exitCode: options.exitCode,
        duration: options.duration,
        hasError,
        errorMessage: hasError,
        commandType,
        isTest: commandType === 'test',
        isBuild: commandType === 'build',
        isDiagnostic: commandType === 'diagnostic',
        // Track command patterns
        isRetry: this.isRetryCommand(command),
        attempNumber: options.attemptNumber || 1,
        output: output ? output.substring(0, 1000) : null
      }
    });

    // Track error recovery pattern
    if (hasError && this.errorLog.length > 1) {
      const prevError = this.errorLog[this.errorLog.length - 2];
      if (timestamp - prevError.timestamp < 60000) {
        await this.trackDecision('Error recovery attempt', {
          fromError: prevError.error,
          command
        });
      }
    }

    return { tracked: true, hasError, commandType };
  }

  // Track decision points and alternatives
  async trackDecision(description, metadata = {}) {
    const timestamp = Date.now();

    this.decisionPoints.push({
      description,
      metadata,
      timestamp,
      contextFiles: this.explorationPath.slice(-5).map(e => e.file)
    });

    await this.sendEvent({
      type: 'decision',
      description,
      metadata: {
        ...metadata,
        decisionNumber: this.decisionPoints.length,
        timeInSession: timestamp - this.sessionStartTime,
        afterErrorCount: this.errorLog.length
      }
    });

    return { tracked: true };
  }

  // Track failed attempts and iterations
  async trackFailedAttempt(description, reason, metadata = {}) {
    await this.sendEvent({
      type: 'failed_attempt',
      description,
      metadata: {
        reason,
        ...metadata,
        attemptNumber: metadata.attemptNumber || 1,
        willRetry: metadata.willRetry || false
      }
    });

    return { tracked: true };
  }

  // Generate session insights
  async generateInsights() {
    const insights = {
      explorationDepth: this.explorationPath.length,
      uniqueFilesExplored: new Set(this.explorationPath.map(e => e.file)).size,
      searchPatterns: this.searchHistory.length,
      decisionsnade: this.decisionPoints.length,
      errorsEncountered: this.errorLog.length,
      mostExploredFiles: this.getTopExploredFiles(),
      timeDistribution: this.getTimeDistribution(),
      searchToEditRatio: this.searchHistory.length / Math.max(1,
        this.explorationPath.filter(e => e.action === 'edit').length),
      sessionDuration: Date.now() - this.sessionStartTime
    };

    await this.sendEvent({
      type: 'session_insights',
      description: 'Session analysis complete',
      metadata: insights
    });

    return insights;
  }

  // Helper: Analyze search intent
  analyzeSearchIntent(pattern) {
    if (/error|exception|failed/i.test(pattern)) return 'debugging';
    if (/TODO|FIXME|HACK/i.test(pattern)) return 'finding_tech_debt';
    if (/function|class|def|interface/i.test(pattern)) return 'finding_definition';
    if (/import|require|from/i.test(pattern)) return 'tracing_dependencies';
    if (/test|spec|describe|it\(/i.test(pattern)) return 'finding_tests';
    return null;
  }

  // Helper: Detect command type
  detectCommandType(command) {
    if (/^(npm|yarn|pnpm) (test|run test)/i.test(command)) return 'test';
    if (/^(npm|yarn|pnpm) (build|run build)/i.test(command)) return 'build';
    if (/^git (status|diff|log|show)/i.test(command)) return 'vcs_check';
    if (/^git (add|commit|push|pull)/i.test(command)) return 'vcs_action';
    if (/^(ls|cat|grep|find|which)/i.test(command)) return 'diagnostic';
    if (/^(npm|yarn|pnpm) install/i.test(command)) return 'dependency';
    return 'other';
  }

  // Helper: Detect errors in output
  detectError(output) {
    if (!output) return null;
    const errorPatterns = [
      /error:/i,
      /failed/i,
      /exception/i,
      /cannot find/i,
      /not found/i,
      /undefined|null reference/i,
      /syntax error/i,
      /type error/i
    ];

    for (const pattern of errorPatterns) {
      const match = output.match(pattern);
      if (match) {
        // Extract error context
        const lines = output.split('\n');
        const errorLineIndex = lines.findIndex(l => pattern.test(l));
        if (errorLineIndex !== -1) {
          return lines.slice(
            Math.max(0, errorLineIndex - 1),
            Math.min(lines.length, errorLineIndex + 3)
          ).join('\n');
        }
        return match[0];
      }
    }
    return null;
  }

  // Helper: Detect refactoring
  detectRefactoring(changes) {
    if (!changes.description) return false;
    const refactoringPatterns = [
      /refactor/i,
      /rename/i,
      /extract/i,
      /move/i,
      /restructure/i,
      /reorganize/i
    ];
    return refactoringPatterns.some(p => p.test(changes.description));
  }

  // Helper: Check if command is a retry
  isRetryCommand(command) {
    // Check if we've seen similar command recently
    // This would need command history tracking
    return false; // Simplified for now
  }

  // Helper: Get top explored files
  getTopExploredFiles() {
    return Array.from(this.fileReadCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([file, count]) => ({
        file: path.basename(file),
        count,
        timeSpent: this.timeSpentInFile.get(file) || 0
      }));
  }

  // Helper: Get time distribution
  getTimeDistribution() {
    const total = Array.from(this.timeSpentInFile.values())
      .reduce((sum, time) => sum + time, 0);

    return Array.from(this.timeSpentInFile.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([file, time]) => ({
        file: path.basename(file),
        timeSpent: time,
        percentage: ((time / total) * 100).toFixed(1)
      }));
  }

  // Send event to API
  async sendEvent(event) {
    try {
      await axios.post(`${API_URL}/sessions`, {
        action: 'addContextualEvent',
        sessionId: SESSION_ID,
        data: {
          ...event,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to send event:', error.message);
    }
  }
}

// Export for use by Claude Code integration
module.exports = ClaudeCodeContextTracker;

// If run directly, demonstrate capabilities
if (require.main === module) {
  const tracker = new ClaudeCodeContextTracker();

  console.log('🚀 Claude Code Context Tracker Active');
  console.log('This enhanced tracker captures:');
  console.log('  📖 File exploration patterns');
  console.log('  🔍 Search queries and results');
  console.log('  ✏️ Edit context and triggers');
  console.log('  💻 Command execution with error detection');
  console.log('  🎯 Decision points and alternatives');
  console.log('  ❌ Failed attempts and recovery');
  console.log('  📊 Session insights and patterns');
  console.log('\nSession ID:', SESSION_ID);

  // Demo the capabilities
  setTimeout(async () => {
    await tracker.trackRead('/src/app.js');
    await tracker.trackSearch('authentication error');
    await tracker.trackCommand('npm test', 'Error: Test failed');
    await tracker.trackEdit('/src/auth.js', { linesAdded: 10, linesRemoved: 5 });
    await tracker.generateInsights();
  }, 1000);
}