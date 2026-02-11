import React from 'react'
import { Box, Typography } from '@mui/material'

const VoiceStatusBar = ({ micOn }) => {
  if (!micOn) return null

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        backgroundColor: 'rgba(236,72,153,0.15)',
        borderTop: '1px solid rgba(236,72,153,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'secondary.main',
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%, 100%': {
              opacity: 1,
            },
            '50%': {
              opacity: 0.5,
            },
          },
        }}
      />
      <Typography variant="body2" color="secondary.main">
        음성 채팅 활성화 중
      </Typography>
    </Box>
  )
}

export default VoiceStatusBar
