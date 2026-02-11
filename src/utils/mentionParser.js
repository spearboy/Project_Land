export const parseMentions = (text) => {
  const mentionRegex = /@(\S+)/g
  const mentions = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }

  return [...new Set(mentions)]
}

export const formatMessageWithMentions = (text, participants) => {
  if (!text) return [{ type: 'text', content: '' }]
  
  const lines = text.split('\n')
  const allParts = []
  
  lines.forEach((line, lineIndex) => {
    const mentionRegex = /@(\S+)/g
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
    const parts = []
    let lastIndex = 0
    
    const matches = []
    let match
    
    while ((match = mentionRegex.exec(line)) !== null) {
      matches.push({
        type: 'mention',
        index: match.index,
        length: match[0].length,
        content: match[0],
        nickname: match[1],
      })
    }
    
    urlRegex.lastIndex = 0
    while ((match = urlRegex.exec(line)) !== null) {
      matches.push({
        type: 'link',
        index: match.index,
        length: match[0].length,
        content: match[0],
        url: match[0].startsWith('www.') ? 'https://' + match[0] : match[0],
      })
    }
    
    matches.sort((a, b) => a.index - b.index)
    
    const filteredMatches = []
    let currentEnd = 0
    matches.forEach((m) => {
      if (m.index >= currentEnd) {
        filteredMatches.push(m)
        currentEnd = m.index + m.length
      }
    })
    
    filteredMatches.forEach((m) => {
      if (m.index > lastIndex) {
        parts.push({
          type: 'text',
          content: line.substring(lastIndex, m.index),
        })
      }
      
      if (m.type === 'mention') {
        const isParticipant = participants.some((p) => p.nickname === m.nickname)
        parts.push({
          type: 'mention',
          content: m.content,
          nickname: m.nickname,
          isValid: isParticipant,
        })
      } else if (m.type === 'link') {
        parts.push({
          type: 'link',
          content: m.content,
          url: m.url,
        })
      }
      
      lastIndex = m.index + m.length
    })
    
    if (lastIndex < line.length) {
      parts.push({
        type: 'text',
        content: line.substring(lastIndex),
      })
    }
    
    if (parts.length === 0) {
      parts.push({
        type: 'text',
        content: line,
      })
    }
    
    allParts.push(...parts)
    
    if (lineIndex < lines.length - 1) {
      allParts.push({
        type: 'linebreak',
        content: '\n',
      })
    }
  })
  
  return allParts.length > 0 ? allParts : [{ type: 'text', content: text }]
}
