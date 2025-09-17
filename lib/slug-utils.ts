// Utility functions for creating URL-friendly slugs

export function createSlug(text: string): string {
  return text
    .toLowerCase()                    // Convert to lowercase
    .trim()                          // Remove leading/trailing spaces
    .replace(/[^\w\s-]/g, '')        // Remove special characters except hyphens
    .replace(/[\s_-]+/g, '-')        // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '');        // Remove leading/trailing hyphens
}

// Examples:
// createSlug("My Amazing Blog Post!") → "my-amazing-blog-post"
// createSlug("Jazz & Soul Music Review") → "jazz-soul-music-review"
// createSlug("  Deep House Explorations  ") → "deep-house-explorations"

export function createUniqueSlug(title: string, existingSlugs: string[] = []): string {
  let baseSlug = createSlug(title);
  let slug = baseSlug;
  let counter = 1;

  // If slug already exists, add a number
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// Example:
// createUniqueSlug("My Post", ["my-post"]) → "my-post-1"
// createUniqueSlug("My Post", ["my-post", "my-post-1"]) → "my-post-2"