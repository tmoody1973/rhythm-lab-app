'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Save, RefreshCw, Eye, Edit, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PromptTemplate {
  system: string
  prompt: string
  notes: string
}

interface PromptTemplates {
  'artist-profile': PromptTemplate
  'deep-dive': PromptTemplate
  'blog-post': PromptTemplate
  'show-description': PromptTemplate
}

export default function PromptManagementPage() {
  const [templates, setTemplates] = useState<PromptTemplates | null>(null)
  const [editingTemplates, setEditingTemplates] = useState<PromptTemplates | null>(null)
  const [activeTab, setActiveTab] = useState<keyof PromptTemplates>('artist-profile')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Load current templates
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/prompts')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
        setEditingTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveTemplates = async () => {
    if (!editingTemplates) return

    setSaving(true)
    setSaveResult(null)

    try {
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: editingTemplates })
      })

      const result = await response.json()

      if (result.success) {
        setTemplates(editingTemplates)
        setIsEditing(false)
        setSaveResult({ success: true, message: 'Prompts saved successfully!' })
      } else {
        setSaveResult({ success: false, message: result.error || 'Failed to save prompts' })
      }
    } catch (error) {
      setSaveResult({ success: false, message: 'Failed to save prompts' })
    } finally {
      setSaving(false)
    }
  }

  const resetTemplates = () => {
    if (templates) {
      setEditingTemplates({ ...templates })
      setIsEditing(false)
      setSaveResult(null)
    }
  }

  const updateTemplate = (contentType: keyof PromptTemplates, field: keyof PromptTemplate, value: string) => {
    if (!editingTemplates) return

    setEditingTemplates(prev => ({
      ...prev!,
      [contentType]: {
        ...prev![contentType],
        [field]: value
      }
    }))
    setIsEditing(true)
  }

  const getContentTypeLabel = (type: keyof PromptTemplates) => {
    const labels = {
      'artist-profile': 'Artist Profiles',
      'deep-dive': 'Deep Dives',
      'blog-post': 'Blog Posts',
      'show-description': 'Show Descriptions'
    }
    return labels[type]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Management</h1>
          <p className="text-muted-foreground">
            Customize AI prompts for each content type. Changes are applied immediately to new content generation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isEditing && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
              <Edit className="w-3 h-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Note:</strong> These prompts are server-side only and not exposed to the public.
          Only admin users can view and edit them.
        </AlertDescription>
      </Alert>

      {saveResult && (
        <Alert className={saveResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
          <AlertDescription className={saveResult.success ? "text-green-800" : "text-red-800"}>
            {saveResult.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex space-x-4 mb-6">
        <Button
          onClick={saveTemplates}
          disabled={!isEditing || isSaving}
          className="flex-1"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>

        <Button
          onClick={resetTemplates}
          disabled={!isEditing}
          variant="outline"
        >
          Reset Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as keyof PromptTemplates)}>
        <TabsList className="grid w-full grid-cols-4">
          {Object.keys(editingTemplates || {}).map((type) => (
            <TabsTrigger key={type} value={type}>
              {getContentTypeLabel(type as keyof PromptTemplates)}
            </TabsTrigger>
          ))}
        </TabsList>

        {editingTemplates && Object.entries(editingTemplates).map(([type, template]) => (
          <TabsContent key={type} value={type} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  {getContentTypeLabel(type as keyof PromptTemplates)} Prompts
                </CardTitle>
                <CardDescription>
                  Configure the AI system prompt and user prompt template for {type.replace('-', ' ')} generation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor={`${type}-system`}>System Prompt</Label>
                  <p className="text-sm text-muted-foreground">
                    Defines the AI's role, expertise, and writing style for this content type.
                  </p>
                  <Textarea
                    id={`${type}-system`}
                    value={template.system}
                    onChange={(e) => updateTemplate(type as keyof PromptTemplates, 'system', e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${type}-prompt`}>User Prompt Template</Label>
                  <p className="text-sm text-muted-foreground">
                    Template for the user prompt. Uses variables: {type === 'show-description' ? 'topic (show title), additionalContext (tracklist)' : 'topic, additionalContext, targetLength'}.
                  </p>
                  <Textarea
                    id={`${type}-prompt`}
                    value={template.prompt}
                    onChange={(e) => updateTemplate(type as keyof PromptTemplates, 'prompt', e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${type}-notes`}>Usage Notes</Label>
                  <p className="text-sm text-muted-foreground">
                    Guidelines and tips for this content type (for reference only).
                  </p>
                  <Textarea
                    id={`${type}-notes`}
                    value={template.notes}
                    onChange={(e) => updateTemplate(type as keyof PromptTemplates, 'notes', e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}