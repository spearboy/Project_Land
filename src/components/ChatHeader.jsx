import React from 'react'
import { AppBar, Toolbar, Box, Typography, IconButton } from '@mui/material'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'

const ChatHeader = ({ name, micOn, onToggleMic, onLeave }) => {
  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(16px)',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(148,163,184,0.1)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 2 } }}>
        <Box>
          <Typography variant="h6" fontWeight={600} noWrap>
            공용 채팅방
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {name} 님
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color={micOn ? 'secondary' : 'default'}
            onClick={onToggleMic}
            sx={{
              backgroundColor: micOn ? 'rgba(236,72,153,0.2)' : 'transparent',
            }}
          >
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
          <IconButton
            color="inherit"
            onClick={onLeave}
            sx={{
              backgroundColor: 'rgba(148,163,184,0.1)',
            }}
          >
            <ExitToAppIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default ChatHeader

