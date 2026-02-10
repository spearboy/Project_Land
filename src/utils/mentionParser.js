// 맨션 파싱 유틸리티
// @닉네임 형식의 맨션을 추출

export const parseMentions = (text) => {
  // @닉네임 패턴 매칭 (띄어쓰기 전까지)
  const mentionRegex = /@(\S+)/g
  const mentions = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]) // 닉네임만 추출
  }

  return [...new Set(mentions)] // 중복 제거
}

export const formatMessageWithMentions = (text, participants) => {
  // 맨션된 닉네임을 찾아서 하이라이트
  const mentionRegex = /@(\S+)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    // 맨션 전 텍스트
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      })
    }

    // 맨션된 닉네임이 참가자 목록에 있는지 확인
    const mentionedNickname = match[1]
    const isParticipant = participants.some((p) => p.nickname === mentionedNickname)

    parts.push({
      type: 'mention',
      content: `@${mentionedNickname}`,
      nickname: mentionedNickname,
      isValid: isParticipant,
    })

    lastIndex = match.index + match[0].length
  }

  // 마지막 텍스트
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    })
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}
