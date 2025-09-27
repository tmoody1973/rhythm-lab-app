import { promises as fs } from 'fs'
import path from 'path'

export interface PodcastHistoryEntry {
  id: string
  title: string
  sourceType: 'deep-dive' | 'manual' // Source of the podcast
  sourceId?: string // ID of the source content (e.g., Storyblok story ID)
  status: 'completed' | 'processing' | 'error'
  createdAt: string
  updatedAt: string
  script: Array<{ speaker: 'Samara' | 'Carl', text: string }> | null
  audio: {
    audioUrl?: string // Storyblok asset URL
    storyblokAssetId?: string
    duration?: number
    fileSize?: number
    mimeType?: string
  } | null
  storyblok: {
    assetId?: string
    storyId?: string // Deep-dive story that was updated with podcast
    assetUrl?: string
  } | null
  podbean: {
    episodeId?: string
    episodeUrl?: string
    publishStatus?: 'draft' | 'published'
  } | null
  errorMessage?: string
  metadata: {
    scriptGeneratedAt?: string
    audioGeneratedAt?: string
    uploadedToStoryblokAt?: string
    publishedToPodbeantAt?: string
    scriptLineCount?: number
    estimatedDuration?: number
    generatedBy: string
  }
}

const PODCAST_HISTORY_FILE_PATH = path.join(process.cwd(), 'data', 'podcast-history.json')

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Load podcast history from file
export async function loadPodcastHistory(): Promise<PodcastHistoryEntry[]> {
  try {
    await ensureDataDirectory()
    const data = await fs.readFile(PODCAST_HISTORY_FILE_PATH, 'utf-8')
    const history = JSON.parse(data)

    // Sort by creation date (newest first)
    return history.sort((a: PodcastHistoryEntry, b: PodcastHistoryEntry) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch {
    // Return empty array if file doesn't exist
    return []
  }
}

// Save podcast history to file
async function savePodcastHistory(history: PodcastHistoryEntry[]): Promise<void> {
  await ensureDataDirectory()
  await fs.writeFile(PODCAST_HISTORY_FILE_PATH, JSON.stringify(history, null, 2))
}

// Add new podcast entry to history
export async function addPodcastHistoryEntry(entry: Omit<PodcastHistoryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PodcastHistoryEntry> {
  const history = await loadPodcastHistory()

  const newEntry: PodcastHistoryEntry = {
    ...entry,
    id: generatePodcastId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  history.unshift(newEntry) // Add to beginning (newest first)

  // Keep only last 50 podcast entries to prevent file from growing too large
  if (history.length > 50) {
    history.splice(50)
  }

  await savePodcastHistory(history)
  return newEntry
}

// Update existing podcast entry (e.g., when audio is generated or uploaded)
export async function updatePodcastHistoryEntry(
  id: string,
  updates: Partial<PodcastHistoryEntry>
): Promise<PodcastHistoryEntry | null> {
  const history = await loadPodcastHistory()
  const entryIndex = history.findIndex(entry => entry.id === id)

  if (entryIndex === -1) {
    return null
  }

  history[entryIndex] = {
    ...history[entryIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }

  await savePodcastHistory(history)
  return history[entryIndex]
}

// Get podcast history with pagination
export async function getPodcastHistory(
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<{
  entries: PodcastHistoryEntry[]
  total: number
  page: number
  totalPages: number
}> {
  let history = await loadPodcastHistory()

  // Filter by status if specified
  if (status && status !== 'all') {
    history = history.filter(entry => entry.status === status)
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

// Generate unique ID for podcast entries
function generatePodcastId(): string {
  return `podcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get podcast summary statistics
export async function getPodcastHistoryStats(): Promise<{
  totalPodcasts: number
  completedPodcasts: number
  processingPodcasts: number
  errorPodcasts: number
  totalAudioDuration: number
  podcastsBySource: Record<string, number>
  recentActivity: PodcastHistoryEntry[]
  storyblokUploads: number
  podbeanPublished: number
}> {
  const history = await loadPodcastHistory()

  const stats = {
    totalPodcasts: history.length,
    completedPodcasts: history.filter(e => e.status === 'completed').length,
    processingPodcasts: history.filter(e => e.status === 'processing').length,
    errorPodcasts: history.filter(e => e.status === 'error').length,
    totalAudioDuration: 0,
    podcastsBySource: {} as Record<string, number>,
    recentActivity: history.slice(0, 5), // Last 5 entries
    storyblokUploads: history.filter(e => e.storyblok?.assetId).length,
    podbeanPublished: history.filter(e => e.podbean?.publishStatus === 'published').length
  }

  // Calculate total duration and count by source type
  history.forEach(entry => {
    if (entry.audio?.duration) {
      stats.totalAudioDuration += entry.audio.duration
    }

    stats.podcastsBySource[entry.sourceType] = (stats.podcastsBySource[entry.sourceType] || 0) + 1
  })

  return stats
}

// Get podcast by ID
export async function getPodcastById(id: string): Promise<PodcastHistoryEntry | null> {
  const history = await loadPodcastHistory()
  return history.find(entry => entry.id === id) || null
}

// Search podcasts by title
export async function searchPodcasts(query: string): Promise<PodcastHistoryEntry[]> {
  const history = await loadPodcastHistory()
  const searchTerm = query.toLowerCase()

  return history.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm)
  )
}