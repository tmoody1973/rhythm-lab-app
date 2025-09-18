import { createClient } from '@/lib/supabase/server'

export const TEMP_UPLOADS_BUCKET = 'temp-uploads'

/**
 * Upload file to temporary storage bucket
 * Returns storage path for later retrieval
 */
export async function uploadToTempStorage(
  file: File | Buffer,
  filename: string,
  userId: string,
  contentType: string
): Promise<{ path: string; url: string }> {
  const supabase = await createClient()

  // Create unique filename with user ID prefix
  const timestamp = Date.now()
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${userId}/${timestamp}_${cleanFilename}`

  const { data, error } = await supabase.storage
    .from(TEMP_UPLOADS_BUCKET)
    .upload(storagePath, file, {
      contentType,
      duplex: 'half' // Required for Node.js environments
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw new Error(`Failed to upload to storage: ${error.message}`)
  }

  // Get public URL for the uploaded file
  const { data: urlData } = supabase.storage
    .from(TEMP_UPLOADS_BUCKET)
    .getPublicUrl(storagePath)

  return {
    path: storagePath,
    url: urlData.publicUrl
  }
}

/**
 * Download file from temporary storage
 */
export async function downloadFromTempStorage(path: string): Promise<Buffer> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(TEMP_UPLOADS_BUCKET)
    .download(path)

  if (error) {
    console.error('Storage download error:', error)
    throw new Error(`Failed to download from storage: ${error.message}`)
  }

  return Buffer.from(await data.arrayBuffer())
}

/**
 * Delete file from temporary storage
 */
export async function deleteFromTempStorage(path: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.storage
      .from(TEMP_UPLOADS_BUCKET)
      .remove([path])

    if (error) {
      console.error('Storage delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Storage delete error:', error)
    return false
  }
}

/**
 * Clean up expired temporary files
 * Should be called periodically (e.g., via cron job)
 */
export async function cleanupExpiredFiles(maxAgeHours = 168): Promise<number> { // Default 7 days
  try {
    const supabase = await createClient()

    // List all files in the bucket
    const { data, error } = await supabase.storage
      .from(TEMP_UPLOADS_BUCKET)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (error) {
      console.error('Failed to list files for cleanup:', error)
      return 0
    }

    const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000))
    const filesToDelete: string[] = []

    for (const file of data) {
      if (file.created_at && new Date(file.created_at) < cutoffTime) {
        filesToDelete.push(file.name)
      }
    }

    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from(TEMP_UPLOADS_BUCKET)
        .remove(filesToDelete)

      if (deleteError) {
        console.error('Failed to delete expired files:', deleteError)
        return 0
      }

      console.log(`Cleaned up ${filesToDelete.length} expired files`)
    }

    return filesToDelete.length
  } catch (error) {
    console.error('Cleanup error:', error)
    return 0
  }
}

/**
 * Get file info from temporary storage
 */
export async function getTempFileInfo(path: string) {
  const supabase = await createClient()

  // Extract folder and filename from path
  const pathParts = path.split('/')
  const folder = pathParts.slice(0, -1).join('/')
  const filename = pathParts[pathParts.length - 1]

  const { data, error } = await supabase.storage
    .from(TEMP_UPLOADS_BUCKET)
    .list(folder, {
      search: filename
    })

  if (error || !data || data.length === 0) {
    return null
  }

  return data[0]
}

/**
 * Check if temporary storage bucket exists and create if needed
 * This should be run during application setup
 */
export async function ensureTempStorageBucket(): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('Failed to list buckets:', listError)
      return false
    }

    const bucketExists = buckets.some(bucket => bucket.name === TEMP_UPLOADS_BUCKET)

    if (!bucketExists) {
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(TEMP_UPLOADS_BUCKET, {
        public: false, // Private bucket for security
        allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
        fileSizeLimit: 500 * 1024 * 1024 // 500MB limit
      })

      if (createError) {
        console.error('Failed to create temp uploads bucket:', createError)
        return false
      }

      console.log('Created temp uploads bucket successfully')
    }

    return true
  } catch (error) {
    console.error('Error ensuring temp storage bucket:', error)
    return false
  }
}

/**
 * Client-side utility to get upload URL for direct uploads
 */
export function getClientUploadConfig() {
  return {
    bucketName: TEMP_UPLOADS_BUCKET,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
    allowedExtensions: ['.mp3', '.wav']
  }
}