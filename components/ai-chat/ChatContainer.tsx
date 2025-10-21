'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `# 🎵 Welcome to Music Discovery!

I'm your AI music guide for Rhythm Lab Radio. I combine our curated catalog with real-time web search to bring you the most up-to-date music recommendations.

I can help you:

- **Discover artists** by genre, mood, or style with rich visual cards
- **Explore similar artists** based on your favorites
- **Get latest updates** on tours, releases, and music news
- **Find the perfect soundtrack** for your current mood
- **Create listening guides** with essential tracks and albums

Try asking me things like:
- "Find me experimental jazz artists"
- "Show me chill electronic music for studying"
- "What's new from artists similar to Kamasi Washington?"
- "Discover ambient artists with recent releases"

What kind of music are you in the mood for today?`,
  timestamp: Date.now(),
}

const SUGGESTED_PROMPTS = [
  "Find me experimental jazz artists",
  "Show me chill electronic music",
  "Discover new ambient releases",
  "What's good for deep focus?",
]

export function ChatContainer() {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (userMessage: string) => {
    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      // Call the AI chat endpoint
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: userMessage },
          ],
          userId: user?.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // Handle JSON response (non-streaming)
      const data = await response.json()

      // Create assistant message with the response content
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content || '',
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      console.error('Chat error:', error)

      // Add error message
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or check that your API keys are configured correctly.',
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([WELCOME_MESSAGE])
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div>
          <h2 className="text-lg font-bold">Music Discovery AI</h2>
          <p className="text-sm text-muted-foreground">
            Powered by Thesys C1
          </p>
        </div>
        {messages.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
          >
            Clear Chat
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts (only show when chat is fresh) */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Try these:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading}
          placeholder="Ask me about music..."
        />
      </div>
    </div>
  )
}
