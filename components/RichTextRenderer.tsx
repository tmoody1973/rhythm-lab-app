"use client";

import React from 'react';
import { processShortcodes } from '@/lib/shortcodes';

// Component to render rich text content from Storyblok
export function RichTextRenderer({ content }: { content: any }) {
  if (!content || !content.content) {
    return null;
  }

  const renderNode = (node: any, index: number): React.ReactNode => {
    if (!node) return null;

    switch (node.type) {
      case 'paragraph':
        // Check if this paragraph contains only a shortcode
        const paragraphText = node.content?.map((child: any) => child.text || '').join('');
        const isOnlyShortcode = /^\[youtube=([^\]]+)\]$/.test(paragraphText?.trim() || '');

        if (isOnlyShortcode) {
          // Render shortcode without paragraph wrapper
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
        // Check if text contains shortcodes
        const hasShortcodes = /\[youtube=([^\]]+)\]/.test(node.text);

        if (hasShortcodes) {
          // Process shortcodes and return the processed content
          const processedContent = processShortcodes(node.text);
          return <div key={`shortcode-${index}`}>{processedContent}</div>;
        }

        // Regular text processing (no shortcodes)
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