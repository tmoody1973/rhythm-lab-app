"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Assistant Producer
        </h1>
        <p className="text-gray-600">
          Welcome to the AI Assistant Producer!
          Manage your Rhythm Lab content and imports from here.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <Link href="/admin/mixcloud">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Mixcloud Import</CardTitle>
              <CardDescription>
                Import shows from Mixcloud API into Storyblok
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">In Development</Badge>
                <Button variant="ghost" size="sm">
                  Go to Import →
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <Link href="/admin/content">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Content Management</CardTitle>
              <CardDescription>
                Manage blog posts, profiles, and deep dives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="outline">Coming Soon</Badge>
                <Button variant="ghost" size="sm" disabled>
                  Go to Content →
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <Link href="/admin/algolia-sync">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Algolia Search Sync</CardTitle>
              <CardDescription>
                Manually sync archive tracks and live songs to search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                <Button variant="ghost" size="sm">
                  Go to Sync →
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <Link href="/admin/youtube-cache">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">YouTube Video Cache</CardTitle>
              <CardDescription>
                Cache YouTube videos to avoid API rate limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Active</Badge>
                <Button variant="ghost" size="sm">
                  Go to Cache →
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database</span>
              <Badge variant="default" className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storyblok API</span>
              <Badge variant="default" className="bg-green-500">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mixcloud API</span>
              <Badge variant="outline">Not Tested</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest admin actions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 text-center py-8">
              No recent activity to display
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Frequently accessed external resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" asChild>
              <a href="https://app.storyblok.com" target="_blank" rel="noopener noreferrer">
                Storyblok CMS
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                Supabase Dashboard
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://mixcloud.com" target="_blank" rel="noopener noreferrer">
                Mixcloud
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                View Live Site
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
