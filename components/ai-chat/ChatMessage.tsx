'use client'

import { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { C1Component } from '@thesysai/genui-sdk'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 max-w-[80%] shadow-sm">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    )
  }

  // Check if content contains C1 component markup
  const hasC1Content = content.includes('<content>') && content.includes('</content>')

  // If it's a C1 component response, use the C1Component renderer
  if (hasC1Content) {
    return (
      <div className="flex justify-start mb-4 w-full">
        <div className="w-full max-w-[90%]">
          <C1Component c1Response={content} isStreaming={false} />
        </div>
      </div>
    )
  }

  // Regular markdown message for non-C1 responses
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-card border border-border rounded-2xl px-4 py-3 max-w-[85%] shadow-sm">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              // Customize markdown rendering
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
              p: ({ node, ...props }) => (
                <p {...props} className="mb-2 last:mb-0" />
              ),
              ul: ({ node, ...props }) => (
                <ul {...props} className="list-disc pl-4 mb-2" />
              ),
              ol: ({ node, ...props }) => (
                <ol {...props} className="list-decimal pl-4 mb-2" />
              ),
              code: ({ node, inline, ...props }: any) =>
                inline ? (
                  <code {...props} className="bg-muted px-1 py-0.5 rounded text-xs" />
                ) : (
                  <code {...props} className="block bg-muted p-2 rounded my-2 text-xs" />
                ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}