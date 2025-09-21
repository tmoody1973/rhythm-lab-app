interface Citation {
  number: number
  title: string
  url: string
}

export function formatContentWithCitations(content: string): string {
  const { mainContent, citations } = extractCitationsFromText(content)

  if (citations.length === 0) {
    return content
  }

  let formattedContent = mainContent + '\n\n---\n\n## 📚 Sources & References\n\n'

  citations.forEach((citation) => {
    formattedContent += `**[${citation.number}]** [${citation.title} →](${citation.url})\n\n`
  })

  formattedContent += '\n*These sources were automatically gathered during content generation.*'

  return formattedContent
}

function extractCitationsFromText(text: string): { mainContent: string; citations: Citation[] } {
  const citations: Citation[] = []
  let mainContent = text

  const sourcesMatch = text.match(/##\s*Sources?\s*\n([\s\S]*?)($|\n##)/i)

  if (sourcesMatch) {
    mainContent = text.substring(0, text.indexOf(sourcesMatch[0]))
    const citationText = sourcesMatch[1]

    const citationRegex = /\[(\d+)\]\s*\[([^\]]+)\]\(([^)]+)\)/g
    let match

    while ((match = citationRegex.exec(citationText)) !== null) {
      citations.push({
        number: parseInt(match[1]),
        title: match[2],
        url: match[3]
      })
    }

    // Also try to parse plain text format with URLs
    if (citations.length === 0) {
      const plainRegex = /\[(\d+)\]\s*([^-\n]+)\s*-?\s*(https?:\/\/[^\s\n]+)/g
      while ((match = plainRegex.exec(citationText)) !== null) {
        citations.push({
          number: parseInt(match[1]),
          title: match[2].trim().replace(/[-–]$/, '').trim(),
          url: match[3]
        })
      }
    }
  }

  return { mainContent, citations }
}