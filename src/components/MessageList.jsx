import React, { useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import MicIcon from '@mui/icons-material/Mic'
import { formatMessageWithMentions } from '../utils/mentionParser'

// 시간 포맷팅 함수 (오후 11:11 형식)
const formatTime = (dateString) => {
  const date = new Date(dateString)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? '오후' : '오전'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`
}

// 같은 시간대인지 확인 (시:분 단위로 비교)
const isSameTime = (dateString1, dateString2) => {
  if (!dateString1 || !dateString2) return false
  const date1 = new Date(dateString1)
  const date2 = new Date(dateString2)
  return (
    date1.getHours() === date2.getHours() && date1.getMinutes() === date2.getMinutes()
  )
}

const MessageList = ({ messages, currentUserName, participants = [] }) => {
  const containerRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !bottomRef.current) return

    // 새 메시지가 들어올 때마다 아래로 스크롤
    bottomRef.current.scrollIntoView({ block: 'end' })
  }, [messages])

  if (!messages.length) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(99,102,241,0.2)',
            border: '2px solid rgba(99,102,241,0.3)',
          }}
        >
          <MicIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        </Box>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          아직 메시지가 없습니다.
          <br />
          첫 메시지를 보내보세요!
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        pb: 1,
      }}
    >
      {messages.map((m, index) => {
        const isMe = m.user === currentUserName
        const prevMessage = index > 0 ? messages[index - 1] : null
        const nextMessage = index < messages.length - 1 ? messages[index + 1] : null
        
        // 같은 시간대인지 확인
        const showTime = !nextMessage || !isSameTime(m.created_at, nextMessage.created_at)

        return (
          <Box
            key={m.id}
            sx={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              maxWidth: '50%',
              minWidth: 'fit-content',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 0.5,
                mb: 0.5,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: '0.7rem',
                }}
              >
                {isMe ? '나' : m.user}
              </Typography>
              {showTime && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.65rem',
                    opacity: 0.7,
                  }}
                >
                  {formatTime(m.created_at)}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 1,
                backgroundColor: isMe ? 'primary.main' : 'rgba(31,41,55,0.9)',
                wordBreak: 'break-word',
              }}
            >
              <Typography variant="body1" sx={{ fontSize: '0.95rem' }}>
                {formatMessageWithMentions(m.text, participants).map((part, idx) => {
                  if (part.type === 'mention') {
                    return (
                      <Box
                        key={idx}
                        component="span"
                        sx={{
                          backgroundColor: part.isValid
                            ? 'rgba(236,72,153,0.3)'
                            : 'rgba(148,163,184,0.2)',
                          color: part.isValid ? 'secondary.main' : 'text.secondary',
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 0.5,
                          fontWeight: part.isValid ? 600 : 400,
                        }}
                      >
                        {part.content}
                      </Box>
                    )
                  }
                  return <span key={idx}>{part.content}</span>
                })}
              </Typography>
            </Box>
          </Box>
        )
      })}
      <Box ref={bottomRef} sx={{ height: 1 }} />
    </Box>
  )
}

export default MessageList

