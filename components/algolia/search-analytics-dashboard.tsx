"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search, TrendingUp, Clock, Users, Eye, MousePointer,
  BarChart3, PieChart, Activity, Filter, Calendar,
  Download, RefreshCw, AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { performanceMonitor } from '@/lib/algolia/analytics'

interface SearchAnalyticsDashboardProps {
  className?: string
}

export function SearchAnalyticsDashboard({ className }: SearchAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<SearchAnalyticsData>({
    overview: {
      totalSearches: 0,
      totalClicks: 0,
      averageProcessingTime: 0,
      uniqueUsers: 0,
      topQueries: [],
      noResultsQueries: [],
      clickThroughRate: 0
    },
    performance: {
      averageResponseTime: 0,
      slowQueries: [],
      peakUsageHours: [],
      systemHealth: 'good'
    },
    trends: {
      searchVolumeByHour: [],
      popularGenres: [],
      contentTypeDistribution: []
    }
  })

  const [dateRange, setDateRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(false)

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData()
  }, [dateRange])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Simulate loading analytics data
      // In real implementation, this would fetch from your analytics API
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockData: SearchAnalyticsData = {
        overview: {
          totalSearches: 12534,
          totalClicks: 8901,
          averageProcessingTime: 45,
          uniqueUsers: 2341,
          topQueries: [
            { query: 'deep house', count: 1234, ctr: 0.78 },
            { query: 'ambient music', count: 987, ctr: 0.65 },
            { query: 'jazz fusion', count: 765, ctr: 0.82 },
            { query: 'electronic', count: 654, ctr: 0.59 },
            { query: 'progressive house', count: 543, ctr: 0.73 }
          ],
          noResultsQueries: [
            'obscure underground techno',
            'vintage synthesizer tracks',
            'experimental noise',
            'unreleased bootlegs'
          ],
          clickThroughRate: 0.71
        },
        performance: {
          averageResponseTime: performanceMonitor.getAverageQueryTime(),
          slowQueries: [
            { query: 'complex search with many filters', time: 1200 },
            { query: 'deep house ambient jazz', time: 980 },
            { query: 'artist profile comprehensive', time: 750 }
          ],
          peakUsageHours: [
            { hour: 14, searches: 892 },
            { hour: 15, searches: 1034 },
            { hour: 16, searches: 876 }
          ],
          systemHealth: 'good'
        },
        trends: {
          searchVolumeByHour: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            searches: Math.floor(Math.random() * 1000) + 100
          })),
          popularGenres: [
            { genre: 'Deep House', count: 2341, percentage: 23.4 },
            { genre: 'Ambient', count: 1876, percentage: 18.7 },
            { genre: 'Techno', count: 1654, percentage: 16.5 },
            { genre: 'Jazz', count: 1234, percentage: 12.3 },
            { genre: 'Electronic', count: 987, percentage: 9.8 }
          ],
          contentTypeDistribution: [
            { type: 'Songs', count: 8901, percentage: 71.0 },
            { type: 'Artist Profiles', count: 1876, percentage: 15.0 },
            { type: 'Shows', count: 1234, percentage: 9.8 },
            { type: 'Blog Posts', count: 523, percentage: 4.2 }
          ]
        }
      }

      setAnalytics(mockData)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = () => {
    // Export analytics data as CSV
    const csvData = generateCSVReport(analytics)
    downloadCSV(csvData, `search-analytics-${dateRange}.csv`)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Search Analytics</h2>
          <p className="text-[#a1a1aa] mt-1">
            Monitor search performance and user behavior
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateRange(range)}
                className={cn(
                  "rounded-none first:rounded-l-lg last:rounded-r-lg",
                  dateRange === range ? "bg-[#b12e2e] text-white" : "text-[#a1a1aa] hover:text-white"
                )}
              >
                {range}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalyticsData}
            disabled={isLoading}
            className="border-[#2a2f3e] text-[#a1a1aa] hover:border-[#b12e2e] hover:text-[#b12e2e]"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            className="border-[#2a2f3e] text-[#a1a1aa] hover:border-[#b12e2e] hover:text-[#b12e2e]"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Searches"
          value={analytics.overview.totalSearches.toLocaleString()}
          icon={Search}
          trend={+12.5}
        />
        <MetricCard
          title="Click-Through Rate"
          value={`${(analytics.overview.clickThroughRate * 100).toFixed(1)}%`}
          icon={MousePointer}
          trend={+3.2}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${analytics.overview.averageProcessingTime}ms`}
          icon={Clock}
          trend={-8.1}
          trendPositive={false}
        />
        <MetricCard
          title="Unique Users"
          value={analytics.overview.uniqueUsers.toLocaleString()}
          icon={Users}
          trend={+18.7}
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="queries" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queries">Top Queries</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="queries" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Queries */}
            <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Search Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.overview.topQueries.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{item.query}</div>
                        <div className="text-sm text-[#a1a1aa]">
                          {item.count} searches • {(item.ctr * 100).toFixed(1)}% CTR
                        </div>
                      </div>
                      <Badge variant="outline" className="border-[#2a2f3e] text-[#a1a1aa]">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* No Results Queries */}
            <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  No Results Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.overview.noResultsQueries.map((query, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="text-[#a1a1aa] text-sm">{query}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-[#b12e2e] hover:text-white hover:bg-[#b12e2e]"
                      >
                        Investigate
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#a1a1aa]">System Health</span>
                    <Badge
                      className={cn(
                        analytics.performance.systemHealth === 'good'
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      )}
                    >
                      {analytics.performance.systemHealth}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#a1a1aa]">Avg Response Time</span>
                    <span className="text-white">{analytics.performance.averageResponseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#a1a1aa]">Peak Usage</span>
                    <span className="text-white">
                      {analytics.performance.peakUsageHours[0]?.hour}:00-{analytics.performance.peakUsageHours[0]?.hour + 1}:00
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slow Queries */}
            <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Slow Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.performance.slowQueries.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="text-white text-sm">{item.query}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-[#a1a1aa]">Response time</div>
                        <Badge variant="outline" className="border-yellow-500/20 text-yellow-400">
                          {item.time}ms
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Popular Genres */}
            <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Popular Genres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.trends.popularGenres.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">{item.genre}</span>
                        <span className="text-[#a1a1aa] text-xs">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-[#2a2f3e] rounded-full h-2">
                        <div
                          className="bg-[#b12e2e] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Type Distribution */}
            <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Content Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.trends.contentTypeDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="text-white text-sm">{item.type}</div>
                        <div className="text-xs text-[#a1a1aa]">{item.count.toLocaleString()} results</div>
                      </div>
                      <Badge variant="outline" className="border-[#2a2f3e] text-[#a1a1aa]">
                        {item.percentage}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Search Issues & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <SearchIssueItem
                  type="warning"
                  title="Low Click-Through Rate on Some Queries"
                  description="Several popular queries have CTR below 50%"
                  recommendation="Review search result relevance and consider adjusting ranking algorithms"
                />
                <SearchIssueItem
                  type="info"
                  title="High Volume of 'No Results' Queries"
                  description="4 queries returned no results in the past week"
                  recommendation="Consider expanding content coverage or improving synonym handling"
                />
                <SearchIssueItem
                  type="success"
                  title="Performance Optimization Opportunity"
                  description="Average response time could be improved"
                  recommendation="Consider implementing search result caching for popular queries"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Metric card component
function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendPositive = true
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  trend?: number
  trendPositive?: boolean
}) {
  return (
    <Card className="bg-[#0a0e1a] border-[#2a2f3e]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#a1a1aa] text-sm">{title}</p>
            <p className="text-white text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-[#b12e2e] to-[#8b5cf6] rounded-lg flex items-center justify-center">
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-3">
            <TrendingUp className={cn(
              "h-3 w-3",
              trendPositive ? "text-green-400" : "text-red-400"
            )} />
            <span className={cn(
              "text-xs",
              trendPositive ? "text-green-400" : "text-red-400"
            )}>
              {trendPositive ? '+' : ''}{trend.toFixed(1)}%
            </span>
            <span className="text-[#a1a1aa] text-xs">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Search issue item component
function SearchIssueItem({
  type,
  title,
  description,
  recommendation
}: {
  type: 'warning' | 'info' | 'success'
  title: string
  description: string
  recommendation: string
}) {
  const iconMap = {
    warning: AlertTriangle,
    info: Eye,
    success: TrendingUp
  }

  const colorMap = {
    warning: 'text-yellow-400',
    info: 'text-blue-400',
    success: 'text-green-400'
  }

  const Icon = iconMap[type]

  return (
    <div className="p-4 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg">
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5", colorMap[type])} />
        <div className="flex-1">
          <h4 className="text-white font-medium">{title}</h4>
          <p className="text-[#a1a1aa] text-sm mt-1">{description}</p>
          <p className="text-sm text-[#8b5cf6] mt-2">
            <strong>Recommendation:</strong> {recommendation}
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function generateCSVReport(analytics: SearchAnalyticsData): string {
  const headers = ['Metric', 'Value', 'Period']
  const rows = [
    ['Total Searches', analytics.overview.totalSearches.toString(), 'Current Period'],
    ['Click-Through Rate', `${(analytics.overview.clickThroughRate * 100).toFixed(1)}%`, 'Current Period'],
    ['Average Response Time', `${analytics.overview.averageProcessingTime}ms`, 'Current Period'],
    ['Unique Users', analytics.overview.uniqueUsers.toString(), 'Current Period']
  ]

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Type definitions
interface SearchAnalyticsData {
  overview: {
    totalSearches: number
    totalClicks: number
    averageProcessingTime: number
    uniqueUsers: number
    topQueries: Array<{
      query: string
      count: number
      ctr: number
    }>
    noResultsQueries: string[]
    clickThroughRate: number
  }
  performance: {
    averageResponseTime: number
    slowQueries: Array<{
      query: string
      time: number
    }>
    peakUsageHours: Array<{
      hour: number
      searches: number
    }>
    systemHealth: 'good' | 'warning' | 'critical'
  }
  trends: {
    searchVolumeByHour: Array<{
      hour: number
      searches: number
    }>
    popularGenres: Array<{
      genre: string
      count: number
      percentage: number
    }>
    contentTypeDistribution: Array<{
      type: string
      count: number
      percentage: number
    }>
  }
}