import React, { useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
} from '@mui/material'

const RoomParticipantsModal = ({ open, onClose, room, participants, currentUserName }) => {
  const { creator, members } = useMemo(() => {
    const creator = participants?.find((p) => p.role === 'creator') || null
    const members = (participants || []).filter((p) => p.role !== 'creator')
    return { creator, members }
  }, [participants])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <Typography variant="h6" fontWeight={600}>
          참가자 목록
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {room?.name}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            생성자
          </Typography>
          {creator ? (
            <List dense>
              <ListItem>
                <ListItemText
                  primary={
                    <Typography fontWeight={500}>
                      {creator.nickname}
                      {creator.nickname === currentUserName && ' (나)'}
                    </Typography>
                  }
                  secondary="방 생성자"
                />
              </ListItem>
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              생성자 정보가 없습니다.
            </Typography>
          )}
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            참여자
          </Typography>
          {members.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              아직 다른 참여자가 없습니다.
            </Typography>
          ) : (
            <List dense>
              {members.map((p) => (
                <ListItem key={p.id}>
                  <ListItemText
                    primary={
                      <Typography fontWeight={p.nickname === currentUserName ? 500 : 400}>
                        {p.nickname}
                        {p.nickname === currentUserName && ' (나)'}
                      </Typography>
                    }
                    secondary={p.role === 'member' ? '참여자' : p.role}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  )
}

export default RoomParticipantsModal
