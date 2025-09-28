import { searchClient } from './client'
import type { SearchAnalytics, SearchAnalyticsEvent } from './types'

// Analytics client configuration
const ANALYTICS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!,
  appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  userToken: 'anonymous', // Should be replaced with actual user ID when available
  enablePartialResults: true,
  enableClickAnalytics: true
}

// Generate unique session ID
function generateSessionId(): string {
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('algolia-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('algolia-session-id', sessionId)
    }
    return sessionId
  }
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get user ID (replace with actual user management logic)
function getUserId(): string | undefined {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user-id') || undefined
  }
  return undefined
}

// Track search events
export async function trackSearchEvent(
  event: SearchAnalyticsEvent,
  data: Partial<SearchAnalytics>
): Promise<void> {
  try {
    const analyticsData: SearchAnalytics = {
      event,
      timestamp: new Date().toISOString(),
      session_id: generateSessionId(),
      user_id: getUserId(),
      ...data
    }

    // Store locally for later batch sending
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('algolia-analytics-queue') || '[]'
      const queue = JSON.parse(stored)
      queue.push(analyticsData)

      // Keep only last 100 events to prevent storage bloat
      if (queue.length > 100) {
        queue.splice(0, queue.length - 100)
      }

      localStorage.setItem('algolia-analytics-queue', JSON.stringify(queue))
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Search Analytics Event:', analyticsData)
    }

    // Send to analytics service (implement your preferred analytics service)
    await sendToAnalyticsService(analyticsData)
  } catch (error) {
    console.error('Error tracking search event:', error)
  }
}

// Send analytics data to your preferred service
async function sendToAnalyticsService(data: SearchAnalytics): Promise<void> {
  try {
    // Example: Send to your own analytics endpoint
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).catch(error => {
        console.error('Failed to send analytics:', error)
      })
    }

    // Example: Send to Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', data.event, {
        event_category: 'search',
        event_label: data.query,
        custom_parameter_1: data.result_count,
        custom_parameter_2: data.filters ? JSON.stringify(data.filters) : undefined
      })
    }
  } catch (error) {
    console.error('Error sending to analytics service:', error)
  }
}

// Batch send queued analytics
export async function flushAnalyticsQueue(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const stored = localStorage.getItem('algolia-analytics-queue')
    if (!stored) return

    const queue = JSON.parse(stored)
    if (queue.length === 0) return

    // Send batch to analytics service
    await fetch('/api/analytics/search/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events: queue })
    })

    // Clear queue after successful send
    localStorage.removeItem('algolia-analytics-queue')
  } catch (error) {
    console.error('Error flushing analytics queue:', error)
  }
}

// Search performance monitoring
export class SearchPerformanceMonitor {
  private startTime: number = 0
  private metrics: {
    queryTime: number
    resultCount: number
    query: string
    filters: any
  }[] = []

  startQuery(query: string, filters: any = {}) {
    this.startTime = performance.now()
    return {
      query,
      filters,
      startTime: this.startTime
    }
  }

  endQuery(resultCount: number, query: string, filters: any = {}) {
    const endTime = performance.now()
    const queryTime = endTime - this.startTime

    const metric = {
      queryTime,
      resultCount,
      query,
      filters
    }

    this.metrics.push(metric)

    // Keep only last 50 metrics
    if (this.metrics.length > 50) {
      this.metrics.shift()
    }

    // Track slow queries (>500ms)
    if (queryTime > 500) {
      trackSearchEvent('search', {
        query,
        filters,
        result_count: resultCount
      })
    }

    return metric
  }

  getAverageQueryTime(): number {
    if (this.metrics.length === 0) return 0
    const total = this.metrics.reduce((sum, metric) => sum + metric.queryTime, 0)
    return total / this.metrics.length
  }

  getMetrics() {
    return {
      averageQueryTime: this.getAverageQueryTime(),
      totalQueries: this.metrics.length,
      recentMetrics: this.metrics.slice(-10)
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new SearchPerformanceMonitor()

// Search insights tracking
export function trackSearchInsights(insights: any) {
  try {
    // Track with Algolia Insights API
    if (typeof window !== 'undefined' && (window as any).aa) {
      (window as any).aa('init', {
        appId: ANALYTICS_CONFIG.appId,
        apiKey: ANALYTICS_CONFIG.apiKey,
        userToken: ANALYTICS_CONFIG.userToken
      })

      ;(window as any).aa('sendEvents', [insights])
    }
  } catch (error) {
    console.error('Error tracking search insights:', error)
  }
}

// Click tracking for search results
export function trackResultClick(
  objectID: string,
  position: number,
  queryID: string,
  query: string
) {
  trackSearchEvent('click', {
    clicked_object_id: objectID,
    clicked_position: position,
    query
  })

  // Track with Algolia Insights
  trackSearchInsights({
    eventType: 'click',
    eventName: 'Result Clicked',
    index: 'rhythm_lab_songs', // or determine dynamically
    userToken: ANALYTICS_CONFIG.userToken,
    objectIDs: [objectID],
    positions: [position],
    queryID
  })
}

// View tracking for search results
export function trackResultView(
  objectIDs: string[],
  queryID: string,
  query: string
) {
  trackSearchEvent('view_more', {
    query,
    result_count: objectIDs.length
  })

  // Track with Algolia Insights
  trackSearchInsights({
    eventType: 'view',
    eventName: 'Results Viewed',
    index: 'rhythm_lab_songs', // or determine dynamically
    userToken: ANALYTICS_CONFIG.userToken,
    objectIDs,
    queryID
  })
}

// Filter tracking
export function trackFilterUsage(filterType: string, filterValue: string, query: string) {
  trackSearchEvent('filter', {
    query,
    filters: { [filterType]: [filterValue] }
  })
}

// Suggestion click tracking
export function trackSuggestionClick(suggestion: string, position: number) {
  trackSearchEvent('suggestion_click', {
    query: suggestion,
    clicked_position: position
  })
}

// Search session management
export class SearchSession {
  private sessionData: {
    startTime: number
    queries: string[]
    clicks: number
    filters: any[]
  }

  constructor() {
    this.sessionData = {
      startTime: Date.now(),
      queries: [],
      clicks: 0,
      filters: []
    }
  }

  addQuery(query: string) {
    this.sessionData.queries.push(query)
  }

  addClick() {
    this.sessionData.clicks++
  }

  addFilter(filter: any) {
    this.sessionData.filters.push(filter)
  }

  getSessionData() {
    return {
      ...this.sessionData,
      duration: Date.now() - this.sessionData.startTime,
      totalQueries: this.sessionData.queries.length,
      uniqueQueries: [...new Set(this.sessionData.queries)].length
    }
  }

  endSession() {
    const sessionData = this.getSessionData()

    // Track session end
    trackSearchEvent('search', {
      query: `Session completed: ${sessionData.totalQueries} queries`,
      result_count: sessionData.clicks
    })

    return sessionData
  }
}

// Auto-flush analytics on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushAnalyticsQueue()
  })

  // Also flush periodically
  setInterval(() => {
    flushAnalyticsQueue()
  }, 60000) // Every minute
}