import React, { useState, useEffect, useRef } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material'
import EnterScreen from './components/EnterScreen'
import ChatScreen from './components/ChatScreen'
import RoomListScreen from './components/RoomListScreen'
import { supabase } from './lib/supabase'

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

const App = () => {
  const [user, setUser] = useState(null) // { id, userId, nickname, isAdmin }
  const [entered, setEntered] = useState(false)
  const [currentRoom, setCurrentRoom] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [micOn, setMicOn] = useState(false)
  const [participants, setParticipants] = useState([])
  const channelRef = useRef(null)

  // 앱 시작 시 로컬 스토리지에서 로그인 정보 로드
  useEffect(() => {
    const savedUser = localStorage.getItem('chatUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setEntered(true)
      } catch (err) {
        console.error('저장된 로그인 정보 로드 오류:', err)
        localStorage.removeItem('chatUser')
      }
    }
  }, [])

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

    // 실시간 구독 설정
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

    // Supabase에 메시지 저장
    const { error } = await supabase.from('messages').insert({
      room_id: currentRoom.id,
      user_name: user.nickname,
      text: message.trim(),
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
    setEntered(false)
    setUser(null)
    setCurrentRoom(null)
    setMessages([])
    setMessage('')
    setMicOn(false)
    // 로컬 스토리지에서 로그인 정보 삭제
    localStorage.removeItem('chatUser')
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
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
          <RoomListScreen user={user} onSelectRoom={handleSelectRoom} onLogout={handleLogout} />
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
          />
        )}
      </Box>
    </ThemeProvider>
  )
}

export default App