import React from 'react';

/**
 * Utility function to safely extract text from Storyblok rich text or plain text
 * Handles objects with {type, content} structure that can't be rendered as React children
 */
export function extractTextFromRichText(obj: any): string {
  // If it's already a string, return it
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'boolean') return String(obj);

  // If it's null or undefined, return empty string
  if (!obj) return '';

  // Handle Storyblok rich text structure with type and content
  if (obj.type && obj.content) {
    // If content is an array, recursively extract text from each node
    if (Array.isArray(obj.content)) {
      return obj.content
        .map((node: any) => extractTextFromRichText(node))
        .filter(Boolean)
        .join(' ');
    }
    // If content is not an array, try to extract text from it
    return extractTextFromRichText(obj.content);
  }

  // Handle text nodes directly
  if (obj.text) return obj.text;

  // Handle objects with specific text properties
  if (obj.value) return String(obj.value);
  if (obj.name) return String(obj.name);

  // Handle objects with a content property (but no type)
  if (obj.content && typeof obj.content !== 'string') {
    return extractTextFromRichText(obj.content);
  }

  // For arrays, extract text from each element
  if (Array.isArray(obj)) {
    return obj.map(item => extractTextFromRichText(item)).filter(Boolean).join(' ');
  }

  // Last resort: try to convert to string
  // But avoid [object Object] by checking if it's a plain object
  if (typeof obj === 'object' && obj.constructor === Object) {
    // For plain objects without recognized structure, return empty string
    // to avoid [object Object] being rendered
    return '';
  }

  return String(obj);
}

/**
 * Safely render text that might be rich text or plain string
 * Returns a string suitable for rendering in React
 */
export function safeRenderText(content: any, fallback: string = ''): string {
  // Return primitives directly
  if (typeof content === 'string' || typeof content === 'number' || typeof content === 'boolean') {
    return String(content);
  }

  // Return fallback for null/undefined
  if (!content) {
    return fallback;
  }

  // Extract text from rich text objects
  const text = extractTextFromRichText(content);
  return text || fallback;
}

/**
 * Render rich text content — returns plain text extraction since Storyblok renderer is removed
 */
export function renderRichText(content: any): React.ReactNode {
  if (typeof content === 'string' || typeof content === 'number') return content
  if (!content) return null
  return extractTextFromRichText(content)
}