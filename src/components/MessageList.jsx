import React, { useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import MicIcon from '@mui/icons-material/Mic'

const MessageList = ({ messages, currentUserName }) => {
  const containerRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !bottomRef.current) return

    // 새 메시지가 들어올 때마다 아래로 스크롤
    bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
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
      {messages.map((m) => {
        const isMe = m.user === currentUserName
        return (
          <Box
            key={m.id}
            sx={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              maxWidth: '50%',
              minWidth: 'fit-content',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                ml: isMe ? 0 : 1.5,
                mr: isMe ? 1.5 : 0,
                display: 'block',
                mb: 0.5,
                textAlign: isMe ? 'right' : 'left',
              }}
            >
              {isMe ? '나' : m.user}
            </Typography>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 3,
                backgroundColor: isMe ? 'primary.main' : 'rgba(31,41,55,0.9)',
                wordBreak: 'break-word',
              }}
            >
              <Typography variant="body1" sx={{ fontSize: '0.95rem' }}>
                {m.text}
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

