import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Box, GlobalStyles } from '@mui/material'
import { SnackbarProvider, useSnackbar } from 'notistack'
import EnterScreen from './components/EnterScreen'
import ChatScreen from './components/ChatScreen'
import RoomListScreen from './components/RoomListScreen'
import AlertModal from './components/AlertModal'
import { supabase } from './lib/supabase'
import { parseMentions } from './utils/mentionParser'
import { ERROR_CODES, getErrorMessage } from './constants/errorCodes'

const APP_VERSION = 'v1.0.0'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#050816',
      paper: '#111827',
    },
    primary: {
      main: '#6366F1',
    },
    secondary: {
      main: '#EC4899',
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 48,
          minHeight: 48,
        },
      },
    },
  },
})

const AppContent = () => {
  const { enqueueSnackbar } = useSnackbar()
  const [user, setUser] = useState(null)
  const [entered, setEntered] = useState(false)
  const [currentRoom, setCurrentRoom] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [micOn, setMicOn] = useState(false)
  const [participants, setParticipants] = useState([])
  const [notificationSettings, setNotificationSettings] = useState({})
  const channelRef = useRef(null)
  const allRoomsChannelRef = useRef(null)
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '', errorCode: null })

  const showAlert = useCallback((title, message, errorCode = null) => {
    setAlertModal({ open: true, title, message, errorCode })
  }, [])

  const closeAlert = useCallback(() => {
    setAlertModal({ open: false, title: '', message: '', errorCode: null })
  }, [])

  const checkVersionAndLogout = useCallback(() => {
    try {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (allRoomsChannelRef.current) {
        supabase.removeChannel(allRoomsChannelRef.current)
        allRoomsChannelRef.current = null
      }
    } catch (logoutError) {
      console.error('버전 변경으로 인한 로그아웃 처리 중 오류:', logoutError)
    } finally {
      localStorage.removeItem('chatUser')
      localStorage.removeItem('appVersion')
      setEntered(false)
      setUser(null)
      setCurrentRoom(null)
      setMessages([])
      setMessage('')
      setMicOn(false)
      setNotificationSettings({})
      setParticipants([])
      setTimeout(() => {
        try {
          enqueueSnackbar('앱 버전이 업데이트되어 다시 로그인해야 합니다.', { variant: 'info' })
        } catch (e) {
          console.log('알림 표시 실패:', e)
        }
      }, 100)
    }
  }, [enqueueSnackbar])

  const checkVersion = useCallback(() => {
    const savedVersion = localStorage.getItem('appVersion')
    if (!savedVersion || savedVersion !== APP_VERSION) {
      checkVersionAndLogout()
      return false
    }
    return true
  }, [checkVersionAndLogout])

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('chatUser')
      const savedVersion = localStorage.getItem('appVersion')

      if (!savedUser) {
        if (savedVersion && savedVersion !== APP_VERSION) {
          localStorage.removeItem('appVersion')
        }
        return
      }

      if (!savedVersion || savedVersion !== APP_VERSION) {
        checkVersionAndLogout()
        return
      }

      const userData = JSON.parse(savedUser)
      setUser(userData)
      setEntered(true)
    } catch (err) {
      console.error('저장된 로그인 정보/버전 로드 오류:', err)
      localStorage.removeItem('chatUser')
      localStorage.removeItem('appVersion')
    }
  }, [checkVersionAndLogout])

  useEffect(() => {
    if (!entered || !user) return

    const loadNotificationSettings = async () => {
      const { data, error } = await supabase
        .from('room_notification_settings')
        .select('room_id, notifications_enabled')
        .eq('user_id', user.id)

      if (error) {
        console.error('알림 설정 로드 오류:', error)
        return
      }

      const settings = {}
      data?.forEach((setting) => {
        settings[setting.room_id] = setting.notifications_enabled
      })
      setNotificationSettings(settings)
    }

    loadNotificationSettings()
  }, [entered, user])

  useEffect(() => {
    if (!entered || !user) return

    const setupAllRoomsSubscription = async () => {
      const { data: participantRooms, error } = await supabase
        .from('room_participants')
        .select('room_id')
        .eq('user_id', user.id)

      if (error || !participantRooms) return

      const channel = supabase
        .channel('all-rooms-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          async (payload) => {
            const message = payload.new
            const roomId = message.room_id

            if (currentRoom && roomId === currentRoom.id) return

            const { data: roomData } = await supabase
              .from('rooms')
              .select('name')
              .eq('id', roomId)
              .single()

            if (!roomData) return

            const mentions = message.mentions || []
            const isMentioned = mentions.includes(user.nickname)
            const notificationsEnabled = notificationSettings[roomId] !== false

            if (isMentioned || notificationsEnabled) {
              const messageText = isMentioned
                ? `@${user.nickname} ${roomData.name}: ${message.user_name} - ${message.text}`
                : `${roomData.name}: ${message.user_name} - ${message.text}`

              enqueueSnackbar(messageText, {
                variant: isMentioned ? 'warning' : 'info',
                anchorOrigin: { vertical: 'top', horizontal: 'center' },
                autoHideDuration: isMentioned ? 5000 : 3000,
              })
            }
          }
        )
        .subscribe()

      allRoomsChannelRef.current = channel
    }

    setupAllRoomsSubscription()

    return () => {
      if (allRoomsChannelRef.current) {
        supabase.removeChannel(allRoomsChannelRef.current)
        allRoomsChannelRef.current = null
      }
    }
  }, [entered, user, currentRoom, notificationSettings, enqueueSnackbar])

  useEffect(() => {
    if (!entered || !currentRoom) return

    const loadRoomData = async () => {
      const [{ data: msgData, error: msgError }, { data: participantData, error: participantError }] =
        await Promise.all([
          supabase
            .from('messages')
            .select('*')
            .eq('room_id', currentRoom.id)
            .order('created_at', { ascending: true })
            .limit(100),
          supabase
            .from('room_participants')
            .select('*')
            .eq('room_id', currentRoom.id)
            .order('joined_at', { ascending: true }),
        ])

      if (msgError) {
        console.error('메시지 로드 오류:', msgError)
      } else if (msgData) {
        setMessages(
          msgData.map((msg) => ({
            id: msg.id,
            user: msg.user_name,
            text: msg.text,
            mentions: msg.mentions || [],
            file_url: msg.file_url || null,
            file_type: msg.file_type || null,
            created_at: msg.created_at,
          }))
        )
      }

      if (participantError) {
        console.error('참가자 로드 오류:', participantError)
      } else if (participantData) {
        setParticipants(participantData)
      }
    }

    loadRoomData()

    const channel = supabase
      .channel(`messages-room-${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${currentRoom.id}`,
        },
        (payload) => {
          const newMessage = {
            id: payload.new.id,
            user: payload.new.user_name,
            text: payload.new.text,
            mentions: payload.new.mentions || [],
            file_url: payload.new.file_url || null,
            file_type: payload.new.file_type || null,
            created_at: payload.new.created_at,
          }
          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [entered, currentRoom])

  const handleAuthSuccess = useCallback((userData) => {
    setUser(userData)
    setEntered(true)
    localStorage.setItem('chatUser', JSON.stringify(userData))
    localStorage.setItem('appVersion', APP_VERSION)
  }, [])

  const handleSelectRoom = useCallback(async (room) => {
    if (!user) return

    if (!checkVersion()) {
      return
    }

    const role = room.creator_id === user.id ? 'creator' : 'member'

    const { error } = await supabase.from('room_participants').upsert(
      {
        room_id: room.id,
        user_id: user.id,
        nickname: user.nickname,
        role,
      },
      {
        onConflict: 'room_id,user_id',
      }
    )

    if (error) {
      console.error('방 참가 오류:', error)
      showAlert('채팅방 입장 실패', getErrorMessage(ERROR_CODES.ROOM_JOIN_FAILED), ERROR_CODES.ROOM_JOIN_FAILED)
      return
    }

    setCurrentRoom(room)
  }, [user, checkVersion, showAlert])

  const handleLeaveRoom = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    setCurrentRoom(null)
    setMessages([])
    setMessage('')
    setMicOn(false)
    setParticipants([])
  }, [])

  const handleSendMessage = useCallback(async (fileUrl = null, fileType = null) => {
    if (!message.trim() && !fileUrl) {
      console.log('메시지 전송 실패: 메시지와 파일이 모두 비어있음')
      return
    }
    if (!user || !currentRoom) {
      console.log('메시지 전송 실패: 사용자 정보 또는 방 정보 없음')
      return
    }

    if (!checkVersion()) {
      console.log('메시지 전송 실패: 버전 체크 실패')
      return
    }

    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', currentRoom.id)
      .maybeSingle()

    if (roomError || !roomData) {
      showAlert('채팅방 오류', '이미 삭제된 방입니다. 리스트로 이동합니다.', ERROR_CODES.ROOM_ALREADY_DELETED)
      handleLeaveRoom()
      return
    }

    const mentions = parseMentions(message.trim())
    const validMentions = mentions.filter((nickname) =>
      participants.some((p) => p.nickname === nickname)
    )

    const messageData = {
      room_id: Number(currentRoom.id),
      user_name: String(user.nickname),
      text: String(message.trim() || ''),
      mentions: validMentions.length > 0 ? validMentions : null,
    }

    if (fileUrl) {
      messageData.file_url = String(fileUrl)
      messageData.file_type = String(fileType)
    }

    try {
      const { error } = await supabase.from('messages').insert(messageData)

      if (error) {
        console.error('메시지 전송 오류:', error)
        
        if (error.code === '23503' || error.message?.includes('foreign key')) {
          showAlert('채팅방 오류', '이미 삭제된 방입니다. 리스트로 이동합니다.', ERROR_CODES.MESSAGE_FOREIGN_KEY_ERROR)
          handleLeaveRoom()
        } else {
          showAlert('메시지 전송 실패', getErrorMessage(ERROR_CODES.MESSAGE_SEND_FAILED), ERROR_CODES.MESSAGE_SEND_FAILED)
        }
        return
      }
    } catch (err) {
      console.error('메시지 전송 중 예외 발생:', err)
      showAlert('메시지 전송 실패', getErrorMessage(ERROR_CODES.MESSAGE_SEND_FAILED), ERROR_CODES.MESSAGE_SEND_FAILED)
      return
    }

    setMessage('')
    console.log('메시지 전송 성공')
  }, [message, user, currentRoom, participants, checkVersion, showAlert, handleLeaveRoom])

  const handleFileSelect = useCallback(async (file) => {
    if (!user || !currentRoom) return

    if (!checkVersion()) {
      return
    }

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      showAlert('파일 형식 오류', '이미지 또는 영상 파일만 업로드할 수 있습니다.', ERROR_CODES.FILE_INVALID_TYPE)
      return
    }

    try {
      const bucketName = 'chat-files'
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const filePath = `${currentRoom.id}/${fileName}`

      console.log('파일 업로드 시도:', { bucketName, filePath, fileName })

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('파일 업로드 오류:', uploadError)
        
        if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === '404') {
          showAlert('파일 저장소 오류', getErrorMessage(ERROR_CODES.FILE_BUCKET_NOT_FOUND), ERROR_CODES.FILE_BUCKET_NOT_FOUND)
        } else if (uploadError.statusCode === '403' || uploadError.message?.includes('permission')) {
          showAlert('파일 업로드 권한 오류', getErrorMessage(ERROR_CODES.FILE_UPLOAD_PERMISSION_DENIED), ERROR_CODES.FILE_UPLOAD_PERMISSION_DENIED)
        } else {
          showAlert('파일 업로드 실패', getErrorMessage(ERROR_CODES.FILE_UPLOAD_FAILED), ERROR_CODES.FILE_UPLOAD_FAILED)
        }
        return
      }
      
      console.log('파일 업로드 성공:', uploadData)

      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        showAlert('파일 URL 오류', getErrorMessage(ERROR_CODES.FILE_URL_FETCH_FAILED), ERROR_CODES.FILE_URL_FETCH_FAILED)
        return
      }

      const fileType = isImage ? 'image' : 'video'
      await handleSendMessage(urlData.publicUrl, fileType)
    } catch (error) {
      console.error('파일 처리 오류:', error)
      showAlert('파일 업로드 실패', getErrorMessage(ERROR_CODES.FILE_UPLOAD_FAILED), ERROR_CODES.FILE_UPLOAD_FAILED)
    }
  }, [user, currentRoom, checkVersion, handleSendMessage, showAlert])

  const handleToggleNotification = useCallback(async (roomId, enabled) => {
    if (!user) return

    const { error } = await supabase.from('room_notification_settings').upsert(
      {
        room_id: roomId,
        user_id: user.id,
        notifications_enabled: enabled,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'room_id,user_id',
      }
    )

    if (error) {
      console.error('알림 설정 업데이트 오류:', error)
      return
    }

    setNotificationSettings((prev) => ({
      ...prev,
      [roomId]: enabled,
    }))
  }, [user])

  const handleLogout = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    if (allRoomsChannelRef.current) {
      supabase.removeChannel(allRoomsChannelRef.current)
      allRoomsChannelRef.current = null
    }
    setEntered(false)
    setUser(null)
    setCurrentRoom(null)
    setMessages([])
    setMessage('')
    setMicOn(false)
    setNotificationSettings({})
    localStorage.removeItem('chatUser')
    localStorage.removeItem('appVersion')
  }, [])

  const notificationToggleHandler = useMemo(() => {
    if (!currentRoom) return () => {}
    return () => handleToggleNotification(currentRoom.id, notificationSettings[currentRoom.id] === false)
  }, [currentRoom, notificationSettings, handleToggleNotification])

  return (
    <>
      <AlertModal
        open={alertModal.open}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        errorCode={alertModal.errorCode}
      />
      <Box
        sx={{
          minHeight: '100vh',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'radial-gradient(circle at top, #1f2937 0, #020617 55%, #000 100%)',
          overflow: 'hidden',
        }}
      >
        {!entered || !user ? (
          <EnterScreen onAuthSuccess={handleAuthSuccess} showAlert={showAlert} />
        ) : !currentRoom ? (
          <RoomListScreen
            user={user}
            onSelectRoom={handleSelectRoom}
            onLogout={handleLogout}
            notificationSettings={notificationSettings}
            onToggleNotification={handleToggleNotification}
            showAlert={showAlert}
          />
        ) : (
          <ChatScreen
            name={user.nickname}
            room={currentRoom}
            participants={participants}
            messages={messages}
            message={message}
            micOn={micOn}
            onToggleMic={() => setMicOn((prev) => !prev)}
            onMessageChange={setMessage}
            onSendMessage={handleSendMessage}
            onFileSelect={handleFileSelect}
            onLeave={handleLeaveRoom}
            notificationEnabled={notificationSettings[currentRoom.id] !== false}
            onToggleNotification={notificationToggleHandler}
            showAlert={showAlert}
          />
        )}
      </Box>
    </>
  )
}

const App = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          '.SnackbarContainer-root': {
            zIndex: '9999 !important',
          },
          '.SnackbarContent-root': {
            zIndex: '9999 !important',
          },
          '[class*="SnackbarContainer"]': {
            zIndex: '9999 !important',
          },
          '[class*="SnackbarContent"]': {
            zIndex: '9999 !important',
          },
        }}
      />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={3000}
        dense={false}
        preventDuplicate={true}
      >
        <AppContent />
      </SnackbarProvider>
    </ThemeProvider>
  )
}

export default App
