"use client";

import React from 'react';
import { processShortcodes } from '@/lib/shortcodes';

// Component to render rich text content from Storyblok
export function RichTextRenderer({ content }: { content: any }) {
  // If content is a string, render it directly
  if (typeof content === 'string') {
    return <div className="prose max-w-none">{content}</div>;
  }

  // If content is an object with type and content properties but content is a string,
  // it's likely a malformed object that shouldn't be rendered directly
  if (content && typeof content === 'object' && content.type && typeof content.content === 'string') {
    console.warn('RichTextRenderer received malformed content object:', content);
    return <div className="prose max-w-none">{String(content.content)}</div>;
  }

  // Check if content has the expected structure for rich text
  if (!content || !content.content || !Array.isArray(content.content)) {
    return null;
  }

  const renderNode = (node: any, index: number): React.ReactNode => {
    if (!node) return null;

    switch (node.type) {
      case 'paragraph':
        // Check if this paragraph contains shortcodes
        const paragraphText = node.content?.map((child: any) => child.text || '').join('');
        const hasShortcodes = /\[youtube=([^\]]+)\]/.test(paragraphText);

        if (hasShortcodes) {
          // Process the entire paragraph content as shortcodes
          const processedContent = processShortcodes(paragraphText);
          return <div key={`paragraph-shortcode-${index}`}>{processedContent}</div>;
        }

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
        };

        return (
          <HeadingTag key={index} className={headingClasses[level] || 'text-lg font-semibold mb-2 text-gray-900'}>
            {node.content?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
          </HeadingTag>
        );

      case 'text':
        // Note: Shortcode processing is handled at the paragraph level
        // This text processing is for individual text nodes within paragraphs
        // that don't contain shortcodes

        // Regular text processing
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
        if (node.content && Array.isArray(node.content)) {
          return (
            <React.Fragment key={index}>
              {node.content.map((child: any, childIndex: number) => renderNode(child, childIndex))}
            </React.Fragment>
          );
        }
        // If node is an object with type and content but we don't recognize the type,
        // try to render it as text if it has a text property, otherwise return null
        if (node.text) {
          return <span key={index}>{node.text}</span>;
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