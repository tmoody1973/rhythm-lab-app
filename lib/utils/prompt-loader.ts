import { promises as fs } from 'fs'
import path from 'path'

const PROMPTS_FILE_PATH = path.join(process.cwd(), 'data', 'custom-prompts.json')

// Load custom prompts from the admin-managed file
export async function loadCustomPrompts() {
  try {
    const data = await fs.readFile(PROMPTS_FILE_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading custom prompts:', error)
    throw new Error('Custom prompts file not found or corrupted')
  }
}