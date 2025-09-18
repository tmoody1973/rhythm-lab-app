import { sb } from '@/src/lib/storyblok';

// Component to render rich text content
function RichTextRenderer({ content }: { content: any }) {
  if (!content || !content.content) {
    return null;
  }

  const renderNode = (node: any, index: number): React.ReactNode => {
    if (!node) return null;

    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
            {node.content?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
          </p>
        );

      case 'heading':
        const level = node.attrs?.level || 2;
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
        const headingClasses: Record<number, string> = {
          1: 'text-3xl font-bold mb-6 text-gray-900',
          2: 'text-2xl font-semibold mb-4 text-gray-900',
          3: 'text-xl font-semibold mb-3 text-gray-900',
          4: 'text-lg font-semibold mb-2 text-gray-900',
          5: 'text-base font-semibold mb-2 text-gray-900',
          6: 'text-sm font-semibold mb-2 text-gray-900'
        }[level] || 'text-lg font-semibold mb-2 text-gray-900';

        return (
          <HeadingTag key={index} className={headingClasses}>
            {node.content?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
          </HeadingTag>
        );

      case 'text':
        let textElement: React.ReactNode = node.text;

        if (node.marks) {
          node.marks.forEach((mark: any, markIndex: number) => {
            switch (mark.type) {
              case 'bold':
                textElement = <strong key={`bold-${index}-${markIndex}`} className="font-semibold">{textElement}</strong>;
                break;
              case 'italic':
                textElement = <em key={`italic-${index}-${markIndex}`} className="italic">{textElement}</em>;
                break;
              case 'link':
                textElement = (
                  <a
                    key={`link-${index}-${markIndex}`}
                    href={mark.attrs?.href || '#'}
                    className="text-blue-600 hover:text-blue-800 underline"
                    target={mark.attrs?.target || '_self'}
                  >
                    {textElement}
                  </a>
                );
                break;
            }
          });
        }

        return <span key={`text-${index}`}>{textElement}</span>;

      case 'bullet_list':
        return (
          <ul key={index} className="mb-4 ml-6 list-disc space-y-1">
            {node.content?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
          </ul>
        );

      case 'ordered_list':
        return (
          <ol key={index} className="mb-4 ml-6 list-decimal space-y-1">
            {node.content?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
          </ol>
        );

      case 'list_item':
        return (
          <li key={index} className="text-gray-700">
            {node.content?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
          </li>
        );

      case 'blockquote':
        return (
          <blockquote key={index} className="mb-4 pl-4 border-l-4 border-gray-300 italic text-gray-600">
            {node.content?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
          </blockquote>
        );

      case 'code_block':
        return (
          <pre key={index} className="mb-4 p-4 bg-gray-100 rounded-lg overflow-x-auto">
            <code className="text-sm">
              {node.content?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
            </code>
          </pre>
        );

      default:
        // Fallback for unknown node types
        if (node.content) {
          return node.content.map((child: any, childIndex: number) => renderNode(child, childIndex));
        }
        return null;
    }
  };

  return (
    <div className="prose max-w-none">
      {content.content.map((node: any, index: number) => renderNode(node, index))}
    </div>
  );
}

// Component to render a single blog post
function BlogPost({ story }: { story: any }) {
  const content = story.content;

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Featured Image */}
      {content?.featured_image?.filename && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={content.featured_image.filename}
            alt={content.featured_image.alt || story.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{story.name}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>Published {new Date(story.published_at || story.created_at).toLocaleDateString()}</span>
          {story.content?.category && (
            <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">
              {story.content.category}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {content?.intro && (
          <div className="text-lg text-gray-600 mb-6 font-medium">
            {content.intro}
          </div>
        )}

        {content?.content && (
          <RichTextRenderer content={content.content} />
        )}

        {content?.body && (
          <RichTextRenderer content={content.body} />
        )}

        {/* Fallback for simple text content */}
        {content && !content.content && !content.body && (
          <div className="text-gray-700">
            {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
          </div>
        )}
      </div>

      {/* Tags */}
      {content?.tags && content.tags.length > 0 && (
        <div className="px-8 py-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {content.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default async function StoryblokTestPage() {
  try {
    // Fetch stories from Storyblok
    const storyblokApi = sb();
    const response = await storyblokApi.get('cdn/stories', {
      version: 'published',
      per_page: 10
    });

    const stories = response.data.stories;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog</h1>
            <p className="text-lg text-gray-600">Stories from Storyblok</p>
          </div>

          {stories.length > 0 ? (
            <div className="space-y-8">
              {stories.map((story: any) => (
                <BlogPost key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No stories found.</p>
              <p className="text-gray-400 text-sm mt-2">Create some content in your Storyblok space to see it here.</p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching stories:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog</h1>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading stories</h3>
                <p className="text-sm text-red-700 mt-1">
                  Unable to fetch content from Storyblok. Please check your connection and try again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}