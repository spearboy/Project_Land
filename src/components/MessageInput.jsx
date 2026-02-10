import React from 'react'
import { Box, TextField, Fab } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

const MessageInput = ({ message, onChange, onSend }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <Box
      sx={{
        p: 2,
        pt: 1.5,
        backgroundColor: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(148,163,184,0.1)',
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-end',
      }}
    >
      <TextField
        placeholder="메시지를 입력하세요"
        variant="outlined"
        fullWidth
        multiline
        maxRows={4}
        value={message}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '1rem',
            backgroundColor: 'rgba(31,41,55,0.5)',
          },
        }}
      />
      <Fab
        color="primary"
        onClick={onSend}
        disabled={!message.trim()}
        sx={{
          minWidth: 48,
          minHeight: 48,
          flexShrink: 0,
        }}
      >
        <SendIcon />
      </Fab>
    </Box>
  )
}

export default MessageInput

