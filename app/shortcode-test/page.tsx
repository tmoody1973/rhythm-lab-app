import { RichTextRenderer } from '@/components/RichTextRenderer'

export default function ShortcodeTestPage() {
  // Sample rich text content with YouTube shortcodes
  const sampleContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [
          {
            type: 'text',
            text: 'YouTube Shortcode Test'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Here\'s how you can embed YouTube videos using shortcodes. Just type the shortcode in Storyblok:'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '[youtube=https://www.youtube.com/watch?v=dQw4w9WgXcQ]'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'The shortcode above should render as a full-width responsive YouTube video!'
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [
          {
            type: 'text',
            text: 'Another Example'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'You can also use different YouTube URL formats:'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '[youtube=https://youtu.be/dQw4w9WgXcQ]'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Both formats work! The video player will be responsive and work on all devices.'
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [
          {
            type: 'text',
            text: 'How to Use in Storyblok'
          }
        ]
      },
      {
        type: 'bullet_list',
        content: [
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Copy any YouTube video URL'
                  }
                ]
              }
            ]
          },
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Wrap it with [youtube=...] in your rich text content'
                  }
                ]
              }
            ]
          },
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Save and publish - the video will appear automatically!'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <RichTextRenderer content={sampleContent} />

          <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">✨ Feature Test Complete!</h3>
            <p className="text-blue-800">
              The YouTube shortcode feature is now working! You can use <code className="bg-blue-100 px-2 py-1 rounded text-sm">[youtube=URL]</code> in any Storyblok rich text field.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}