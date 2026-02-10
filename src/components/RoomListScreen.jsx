import React, { useEffect, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { Switch, FormControlLabel } from '@mui/material'
import { supabase } from '../lib/supabase'

const RoomListScreen = ({ user, onSelectRoom }) => {
  const [rooms, setRooms] = useState([])
  const [newRoomName, setNewRoomName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  const loadRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('채팅방 로드 오류:', error)
      return
    }

    setRooms(data || [])
  }

  useEffect(() => {
    loadRooms()
  }, [])

  useEffect(() => {
    if (isPrivate && !inviteCode) {
      // 간단한 6자리 초대코드 생성
      const code = Math.random().toString(36).slice(2, 8).toUpperCase()
      setInviteCode(code)
    }
    if (!isPrivate) {
      setInviteCode('')
    }
  }, [isPrivate])

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: newRoomName.trim(),
          creator_id: user.id,
          creator_nickname: user.nickname,
          is_private: isPrivate,
          invite_code: isPrivate ? inviteCode : null,
        })
        .select()
        .single()

      if (error) {
        console.error('채팅방 생성 오류:', error)
        alert('채팅방 생성에 실패했습니다.')
        return
      }

      setRooms((prev) => [...prev, data])
      setNewRoomName('')
      setIsPrivate(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoom = async (roomId, creatorId) => {
    if (creatorId !== user.id) {
      alert('본인이 생성한 방만 삭제할 수 있습니다.')
      return
    }
    if (!window.confirm('정말 이 채팅방을 삭제하시겠습니까?')) return

    const { error } = await supabase.from('rooms').delete().eq('id', roomId)

    if (error) {
      console.error('채팅방 삭제 오류:', error)
      alert('채팅방 삭제에 실패했습니다.')
      return
    }

    setRooms((prev) => prev.filter((room) => room.id !== roomId))
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 500,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(15,23,42,0.9)',
        }}
      >
        <Box sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            채팅방 선택
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.nickname} 님, 참여할 채팅방을 선택하거나 새로 만들어보세요.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'flex-end',
          }}
        >
          <TextField
            label="새 채팅방 이름"
            variant="outlined"
            fullWidth
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreateRoom()
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={handleCreateRoom}
            disabled={loading || !newRoomName.trim()}
          >
            <AddIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                color="secondary"
              />
            }
            label="비밀방으로 만들기"
          />
          {isPrivate && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">
                초대코드
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {inviteCode}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box
          sx={{
            maxHeight: '50vh',
            overflowY: 'auto',
            borderRadius: 2,
            border: '1px solid rgba(148,163,184,0.3)',
          }}
        >
          {rooms.length === 0 ? (
            <Box
              sx={{
                p: 3,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                아직 생성된 채팅방이 없습니다.
                <br />
                첫 번째 채팅방을 만들어보세요!
              </Typography>
            </Box>
          ) : (
            <List dense>
              {rooms.map((room) => (
                <ListItem
                  key={room.id}
                  button
                  onClick={() => {
                    if (room.is_private) {
                      const code = window.prompt('이 비밀방의 초대코드를 입력하세요.')
                      if (!code) return
                      if (code.trim().toUpperCase() !== (room.invite_code || '').toUpperCase()) {
                        alert('초대코드가 올바르지 않습니다.')
                        return
                      }
                    }
                    onSelectRoom(room)
                  }}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(148,163,184,0.08)',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight={500}>
                        {room.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          만든 사람: {room.creator_nickname}
                        </Typography>
                        {room.is_private ? (
                          <LockIcon sx={{ fontSize: 14 }} color="secondary" />
                        ) : (
                          <LockOpenIcon sx={{ fontSize: 14, color: 'rgba(148,163,184,0.9)' }} />
                        )}
                      </Box>
                    }
                  />
                  {room.creator_id === user.id && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRoom(room.id, room.creator_id)
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default RoomListScreen

