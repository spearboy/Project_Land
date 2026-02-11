import React from 'react'
import { AppBar, Toolbar, Box, Typography, IconButton, Chip, Button } from '@mui/material'
import MicOffIcon from '@mui/icons-material/MicOff'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import NotificationsIcon from '@mui/icons-material/Notifications'
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'

const ChatHeader = ({
  name,
  room,
  micOn,
  onToggleMic,
  onLeave,
  participantsCount,
  onOpenParticipants,
  notificationEnabled,
  onToggleNotification,
}) => {
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
            {room?.name || '채팅방'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {name} 님
          </Typography>
          {typeof participantsCount === 'number' && participantsCount > 0 && (
            <Button
              variant="text"
              size="small"
              onClick={onOpenParticipants}
              sx={{
                ml: 3,
                p: 0,
                minWidth: 'auto',
                fontSize: '0.75rem',
                textTransform: 'none',
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: 'primary.main',
                },
              }}
            >
              참가자 {participantsCount}명
            </Button>
          )}
        </Box>
        {room?.is_private && room?.invite_code && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 1 }}>
            <Chip
              label="비밀방"
              size="small"
              color="secondary"
              sx={{ mb: 0.5, fontSize: '0.7rem' }}
            />
            <Typography variant="caption" color="text.secondary" noWrap>
              초대코드: <strong>{room.invite_code}</strong>
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color={notificationEnabled ? 'primary' : 'default'}
            onClick={onToggleNotification}
            title={notificationEnabled ? '알림 끄기' : '알림 켜기'}
            sx={{
              backgroundColor: notificationEnabled ? 'rgba(99,102,241,0.2)' : 'transparent',
            }}
          >
            {notificationEnabled ? <NotificationsIcon /> : <NotificationsOffIcon />}
          </IconButton>
          <IconButton
            color="default"
            disabled
            sx={{
              backgroundColor: 'transparent',
              opacity: 0.4,
              cursor: 'not-allowed',
            }}
            title="음성 채팅은 아직 준비 중입니다"
          >
            <MicOffIcon />
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
