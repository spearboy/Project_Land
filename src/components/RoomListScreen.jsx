import React, { useEffect, useState, useCallback } from 'react'
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
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'
import { Switch, FormControlLabel } from '@mui/material'
import { supabase } from '../lib/supabase'
import { ERROR_CODES, getErrorMessage } from '../constants/errorCodes'
import AlertModal from './AlertModal'
import ConfirmModal from './ConfirmModal'
import PromptModal from './PromptModal'

const RoomListScreen = ({ user, onSelectRoom, onLogout, notificationSettings, onToggleNotification, showAlert }) => {
  const [rooms, setRooms] = useState([])
  const [newRoomName, setNewRoomName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '', errorCode: null })
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, errorCode: null })
  const [promptModal, setPromptModal] = useState({ open: false, title: '', message: '', onConfirm: null, errorCode: null })

  const openAlert = useCallback((title, message, errorCode = null) => {
    setAlertModal({ open: true, title, message, errorCode })
  }, [])

  const closeAlert = useCallback(() => {
    setAlertModal({ open: false, title: '', message: '', errorCode: null })
  }, [])

  const openConfirm = useCallback((title, message, onConfirm, errorCode = null) => {
    setConfirmModal({ open: true, title, message, onConfirm, errorCode })
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmModal({ open: false, title: '', message: '', onConfirm: null, errorCode: null })
  }, [])

  const openPrompt = useCallback((title, message, onConfirm, errorCode = null) => {
    setPromptModal({ open: true, title, message, onConfirm, errorCode })
  }, [])

  const closePrompt = useCallback(() => {
    setPromptModal({ open: false, title: '', message: '', onConfirm: null, errorCode: null })
  }, [])

  const loadRooms = useCallback(async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('채팅방 로드 오류:', error)
      return
    }

    setRooms(data || [])
  }, [])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  useEffect(() => {
    if (isPrivate && !inviteCode) {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase()
      setInviteCode(code)
    }
    if (!isPrivate) {
      setInviteCode('')
    }
  }, [isPrivate])

  const handleCreateRoom = useCallback(async () => {
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
        openAlert('채팅방 생성 실패', getErrorMessage(ERROR_CODES.ROOM_CREATE_FAILED), ERROR_CODES.ROOM_CREATE_FAILED)
        setLoading(false)
        return
      }

      setRooms((prev) => [...prev, data])
      setNewRoomName('')
      setIsPrivate(false)
    } finally {
      setLoading(false)
    }
  }, [newRoomName, user, isPrivate, inviteCode, openAlert])

  const handleDeleteRoom = useCallback(async (roomId, creatorId) => {
    if (!user.isAdmin && creatorId !== user.id) {
      openAlert('삭제 권한 없음', '본인이 생성한 방만 삭제할 수 있습니다. (관리자는 모든 방 삭제 가능)')
      return
    }
    
    openConfirm(
      '채팅방 삭제',
      '정말 이 채팅방을 삭제하시겠습니까?',
      async () => {
        const { error } = await supabase.from('rooms').delete().eq('id', roomId)

        if (error) {
          console.error('채팅방 삭제 오류:', error)
          openAlert('채팅방 삭제 실패', getErrorMessage(ERROR_CODES.ROOM_DELETE_FAILED), ERROR_CODES.ROOM_DELETE_FAILED)
          return
        }

        setRooms((prev) => prev.filter((room) => room.id !== roomId))
      }
    )
  }, [user, openAlert, openConfirm])

  const handleRoomClick = useCallback(async (room) => {
    if (room.is_private && !user.isAdmin) {
      if (room.creator_id !== user.id) {
        const { data: existing, error } = await supabase
          .from('room_participants')
          .select('id')
          .eq('room_id', room.id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          console.error('참가자 확인 오류:', error)
          openAlert('채팅방 입장 실패', getErrorMessage(ERROR_CODES.ROOM_JOIN_FAILED), ERROR_CODES.ROOM_JOIN_FAILED)
          return
        }

        if (!existing) {
          openPrompt(
            '초대코드 입력',
            '이 비밀방의 초대코드를 입력하세요.',
            (code) => {
              if (!code) return
              if (
                code.trim().toUpperCase() !==
                (room.invite_code || '').toUpperCase()
              ) {
                openAlert('초대코드 오류', '초대코드가 올바르지 않습니다.', ERROR_CODES.ROOM_INVALID_INVITE_CODE)
                return
              }
              onSelectRoom(room)
            }
          )
          return
        }
      }
    }

    onSelectRoom(room)
  }, [user, onSelectRoom, openAlert, openPrompt])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateRoom()
    }
  }, [handleCreateRoom])

  return (
    <>
      <AlertModal
        open={alertModal.open}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        errorCode={alertModal.errorCode}
      />
      <ConfirmModal
        open={confirmModal.open}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm || (() => {})}
        title={confirmModal.title}
        message={confirmModal.message}
        errorCode={confirmModal.errorCode}
      />
      <PromptModal
        open={promptModal.open}
        onClose={closePrompt}
        onConfirm={promptModal.onConfirm || (() => {})}
        title={promptModal.title}
        message={promptModal.message}
        errorCode={promptModal.errorCode}
      />
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
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                채팅방 선택
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.nickname} 님, 참여할 채팅방을 선택하거나 새로 만들어보세요.
              </Typography>
            </Box>
            <IconButton
              color="inherit"
              onClick={onLogout}
              sx={{
                backgroundColor: 'rgba(148,163,184,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(148,163,184,0.2)',
                },
              }}
              title="로그아웃"
            >
              <LogoutIcon />
            </IconButton>
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
              onKeyDown={handleKeyDown}
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
                    onClick={() => handleRoomClick(room)}
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
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            const currentSetting = notificationSettings[room.id] !== false
                            onToggleNotification(room.id, !currentSetting)
                          }}
                          title={
                            notificationSettings[room.id] === false
                              ? '알림 켜기'
                              : '알림 끄기'
                          }
                        >
                          {notificationSettings[room.id] === false ? (
                            <NotificationsOffIcon fontSize="small" />
                          ) : (
                            <NotificationsIcon fontSize="small" />
                          )}
                        </IconButton>
                        {(room.creator_id === user.id || user.isAdmin) && (
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
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      </Box>
    </>
  )
}

export default RoomListScreen
