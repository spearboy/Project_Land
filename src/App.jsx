import React, { useState, useEffect, useRef } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material'
import { SnackbarProvider, useSnackbar } from 'notistack'
import EnterScreen from './components/EnterScreen'
import ChatScreen from './components/ChatScreen'
import RoomListScreen from './components/RoomListScreen'
import { supabase } from './lib/supabase'
import { parseMentions } from './utils/mentionParser'

const APP_VERSION = 'v0.0.5'

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
          minHeight: 48, // 터치 친화적 버튼 크기
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
  const [user, setUser] = useState(null) // { id, userId, nickname, isAdmin }
  const [entered, setEntered] = useState(false)
  const [currentRoom, setCurrentRoom] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [micOn, setMicOn] = useState(false)
  const [participants, setParticipants] = useState([])
  const [notificationSettings, setNotificationSettings] = useState({}) // { roomId: boolean }
  const channelRef = useRef(null)
  const allRoomsChannelRef = useRef(null) // 모든 방의 메시지를 구독

  // 앱 시작 시 로컬 스토리지에서 로그인 정보 & 버전 확인
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('chatUser')
      const savedVersion = localStorage.getItem('appVersion')

      // 저장된 유저가 없으면 버전 정보도 정리
      if (!savedUser) {
        if (savedVersion && savedVersion !== APP_VERSION) {
          localStorage.removeItem('appVersion')
        }
        return
      }

      // 버전이 없거나 현재 버전과 다르면 강제 로그아웃 처리
      if (!savedVersion || savedVersion !== APP_VERSION) {
        try {
          // 채널 구독 해제 시도
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
          // 문제가 있어도 로컬 스토리지 강제 삭제 후 로그인 화면으로
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
        }
        return
      }

      // 버전이 일치하면 로그인 복원
      const userData = JSON.parse(savedUser)
      setUser(userData)
      setEntered(true)
    } catch (err) {
      console.error('저장된 로그인 정보/버전 로드 오류:', err)
      localStorage.removeItem('chatUser')
      localStorage.removeItem('appVersion')
    }
  }, [])

  // 로그인 후 모든 방의 알림 설정 로드
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

  // 모든 방의 메시지를 구독하여 알림 표시 (현재 방이 아닌 다른 방의 메시지)
  useEffect(() => {
    if (!entered || !user) return

    // 참가 중인 모든 방 조회
    const setupAllRoomsSubscription = async () => {
      const { data: participantRooms, error } = await supabase
        .from('room_participants')
        .select('room_id')
        .eq('user_id', user.id)

      if (error || !participantRooms) return

      const roomIds = participantRooms.map((p) => p.room_id)

      // 모든 방의 메시지 구독
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

            // 현재 방의 메시지는 제외 (이미 화면에 표시됨)
            if (currentRoom && roomId === currentRoom.id) return

            // 방 정보 조회
            const { data: roomData } = await supabase
              .from('rooms')
              .select('name')
              .eq('id', roomId)
              .single()

            if (!roomData) return

            // 맨션 확인
            const mentions = message.mentions || []
            const isMentioned = mentions.includes(user.nickname)

            // 알림 설정 확인
            const notificationsEnabled = notificationSettings[roomId] !== false // 기본값은 true

            // 맨션되었거나 알림이 켜져있으면 토스트 표시
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

  // 방 입장 시 기존 메시지 & 참가자 로드 및 실시간 구독 설정
  useEffect(() => {
    if (!entered || !currentRoom) return

    const loadRoomData = async () => {
      // 기존 메시지 로드
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

    // 실시간 구독 설정 (현재 방만)
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
            created_at: payload.new.created_at,
          }
          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    channelRef.current = channel

    // 정리 함수
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [entered, currentRoom])

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    setEntered(true)
    // 로컬 스토리지에 로그인 정보 저장
    localStorage.setItem('chatUser', JSON.stringify(userData))
    localStorage.setItem('appVersion', APP_VERSION)
  }

  const handleSelectRoom = async (room) => {
    if (!user) return

    // 참가자 정보 upsert (이미 참가 중이면 유지)
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
      alert('채팅방에 입장할 수 없습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setCurrentRoom(room)
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    if (!user) return
    if (!currentRoom) return

    // 방이 아직 존재하는지 확인
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', currentRoom.id)
      .maybeSingle()

    if (roomError || !roomData) {
      alert('이미 삭제된 방입니다. 리스트로 이동합니다.')
      handleLeaveRoom()
      return
    }

    // 맨션 추출
    const mentions = parseMentions(message.trim())
    // 참가자 목록에서 실제 존재하는 닉네임만 필터링
    const validMentions = mentions.filter((nickname) =>
      participants.some((p) => p.nickname === nickname)
    )

    // Supabase에 메시지 저장
    const { error } = await supabase.from('messages').insert({
      room_id: currentRoom.id,
      user_name: user.nickname,
      text: message.trim(),
      mentions: validMentions.length > 0 ? validMentions : null,
    })

    if (error) {
      console.error('메시지 전송 오류:', error)
      // FK 제약 등으로 방이 이미 삭제된 경우를 대비
      alert('이미 삭제된 방입니다. 리스트로 이동합니다.')
      handleLeaveRoom()
      return
    }

    // 로컬 상태는 Realtime 구독으로 자동 업데이트됨
    setMessage('')
  }

  // 알림 설정 토글
  const handleToggleNotification = async (roomId, enabled) => {
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
  }

  // 채팅방 나가기 (리스트로 돌아가기)
  const handleLeaveRoom = () => {
    // 구독 해제
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    setCurrentRoom(null)
    setMessages([])
    setMessage('')
    setMicOn(false)
    setParticipants([])
  }

  // 로그아웃
  const handleLogout = () => {
    // 구독 해제
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
    // 로컬 스토리지에서 로그인 정보 및 버전 정보 삭제
    localStorage.removeItem('chatUser')
    localStorage.removeItem('appVersion')
  }

  return (
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
        <EnterScreen onAuthSuccess={handleAuthSuccess} />
      ) : !currentRoom ? (
        <RoomListScreen
          user={user}
          onSelectRoom={handleSelectRoom}
          onLogout={handleLogout}
          notificationSettings={notificationSettings}
          onToggleNotification={handleToggleNotification}
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
          onLeave={handleLeaveRoom}
          notificationEnabled={notificationSettings[currentRoom.id] !== false}
          onToggleNotification={() =>
            handleToggleNotification(currentRoom.id, notificationSettings[currentRoom.id] === false)
          }
        />
      )}
    </Box>
  )
}

const App = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={3000}
      >
        <AppContent />
      </SnackbarProvider>
    </ThemeProvider>
  )
}

export default App