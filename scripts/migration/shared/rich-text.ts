type StoryblokNode = {
  type: string
  content?: StoryblokNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
  attrs?: Record<string, unknown>
}

export function storyblokRichtextToPortableText(
  sbContent: { content?: StoryblokNode[] } | null | undefined
): unknown[] {
  if (!sbContent?.content) return []
  return sbContent.content.flatMap(nodeToPortableText)
}

function randomKey(): string {
  return Math.random().toString(36).slice(2, 10)
}

function nodeToPortableText(node: StoryblokNode): unknown[] {
  if (node.type === 'paragraph') {
    const children = (node.content ?? []).map(spanToChild)
    if (children.length === 0) return []
    return [
      {
        _type: 'block',
        _key: randomKey(),
        style: 'normal',
        children,
        markDefs: [],
      },
    ]
  }

  if (node.type === 'heading') {
    const levelMap: Record<number, string> = {
      1: 'h1',
      2: 'h2',
      3: 'h3',
      4: 'h4',
      5: 'h5',
      6: 'h6',
    }
    const style = levelMap[(node.attrs?.level as number) ?? 2] ?? 'h2'
    return [
      {
        _type: 'block',
        _key: randomKey(),
        style,
        children: (node.content ?? []).map(spanToChild),
        markDefs: [],
      },
    ]
  }

  if (node.type === 'bullet_list') {
    return (node.content ?? []).flatMap((li) =>
      (li.content ?? [])
        .flatMap((child) => nodeToPortableText(child))
        .map((block: unknown) => ({
          ...(block as Record<string, unknown>),
          listItem: 'bullet',
          level: 1,
        }))
    )
  }

  if (node.type === 'ordered_list') {
    return (node.content ?? []).flatMap((li) =>
      (li.content ?? [])
        .flatMap((child) => nodeToPortableText(child))
        .map((block: unknown) => ({
          ...(block as Record<string, unknown>),
          listItem: 'number',
          level: 1,
        }))
    )
  }

  if (node.type === 'blockquote') {
    return [
      {
        _type: 'block',
        _key: randomKey(),
        style: 'blockquote',
        children: (node.content ?? []).flatMap((child) =>
          (child.content ?? []).map(spanToChild)
        ),
        markDefs: [],
      },
    ]
  }

  if (node.type === 'hard_break') {
    return [
      {
        _type: 'block',
        _key: randomKey(),
        style: 'normal',
        children: [{ _type: 'span', _key: randomKey(), text: '\n', marks: [] }],
        markDefs: [],
      },
    ]
  }

  // Skip unknown node types silently
  return []
}

function spanToChild(node: StoryblokNode): {
  _type: string
  _key: string
  text: string
  marks: string[]
} {
  const marks: string[] = (node.marks ?? []).flatMap((m) => {
    if (m.type === 'bold') return ['strong']
    if (m.type === 'italic') return ['em']
    if (m.type === 'code') return ['code']
    if (m.type === 'underline') return ['underline']
    if (m.type === 'strike') return ['strike-through']
    return []
  })
  return {
    _type: 'span',
    _key: randomKey(),
    text: node.text ?? '',
    marks,
  }
}
