import { promises as fs } from 'fs'
import path from 'path'

export interface ContentHistoryEntry {
  id: string
  title: string
  contentType: 'artist-profile' | 'deep-dive' | 'blog-post' | 'show-description'
  status: 'published' | 'draft' | 'error'
  createdAt: string
  storyblokId?: string
  storyblokUrl?: string
  liveUrl?: string
  errorMessage?: string
  metadata: {
    generatedBy: string
    wordCount?: number
    hasDiscography?: boolean
    discographyCount?: number
    hasImages?: boolean
  }
}

const HISTORY_FILE_PATH = path.join(process.cwd(), 'data', 'content-history.json')

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Load content history from file
export async function loadContentHistory(): Promise<ContentHistoryEntry[]> {
  try {
    await ensureDataDirectory()
    const data = await fs.readFile(HISTORY_FILE_PATH, 'utf-8')
    const history = JSON.parse(data)

    // Sort by creation date (newest first)
    return history.sort((a: ContentHistoryEntry, b: ContentHistoryEntry) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch {
    // Return empty array if file doesn't exist
    return []
  }
}

// Save content history to file
async function saveContentHistory(history: ContentHistoryEntry[]): Promise<void> {
  await ensureDataDirectory()
  await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(history, null, 2))
}

// Add new content entry to history
export async function addContentHistoryEntry(entry: Omit<ContentHistoryEntry, 'id' | 'createdAt'>): Promise<ContentHistoryEntry> {
  const history = await loadContentHistory()

  const newEntry: ContentHistoryEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString()
  }

  history.unshift(newEntry) // Add to beginning (newest first)

  // Keep only last 100 entries to prevent file from growing too large
  if (history.length > 100) {
    history.splice(100)
  }

  await saveContentHistory(history)
  return newEntry
}

// Update existing content entry (e.g., when published to Storyblok)
export async function updateContentHistoryEntry(
  id: string,
  updates: Partial<ContentHistoryEntry>
): Promise<ContentHistoryEntry | null> {
  const history = await loadContentHistory()
  const entryIndex = history.findIndex(entry => entry.id === id)

  if (entryIndex === -1) {
    return null
  }

  history[entryIndex] = { ...history[entryIndex], ...updates }
  await saveContentHistory(history)

  return history[entryIndex]
}

// Get content history with pagination
export async function getContentHistory(
  page: number = 1,
  limit: number = 20,
  contentType?: string
): Promise<{
  entries: ContentHistoryEntry[]
  total: number
  page: number
  totalPages: number
}> {
  let history = await loadContentHistory()

  // Filter by content type if specified
  if (contentType && contentType !== 'all') {
    history = history.filter(entry => entry.contentType === contentType)
  }

  const total = history.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit

  const entries = history.slice(startIndex, endIndex)

  return {
    entries,
    total,
    page,
    totalPages
  }
}

// Generate unique ID for content entries
function generateId(): string {
  return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get summary statistics
export async function getContentHistoryStats(): Promise<{
  totalContent: number
  publishedContent: number
  draftContent: number
  errorContent: number
  contentByType: Record<string, number>
  recentActivity: ContentHistoryEntry[]
}> {
  const history = await loadContentHistory()

  const stats = {
    totalContent: history.length,
    publishedContent: history.filter(e => e.status === 'published').length,
    draftContent: history.filter(e => e.status === 'draft').length,
    errorContent: history.filter(e => e.status === 'error').length,
    contentByType: {} as Record<string, number>,
    recentActivity: history.slice(0, 5) // Last 5 entries
  }

  // Count by content type
  history.forEach(entry => {
    stats.contentByType[entry.contentType] = (stats.contentByType[entry.contentType] || 0) + 1
  })

  return stats
}