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
  const [user, setUser] = useState(null) // { id, userId, nickname }
  const [entered, setEntered] = useState(false)
  const [currentRoom, setCurrentRoom] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [micOn, setMicOn] = useState(false)
  const channelRef = useRef(null)

  // 방 입장 시 기존 메시지 로드 및 실시간 구독 설정
  useEffect(() => {
    if (!entered || !currentRoom) return

    // 기존 메시지 로드
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', currentRoom.id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        console.error('메시지 로드 오류:', error)
        return
      }

      if (data) {
        setMessages(
          data.map((msg) => ({
            id: msg.id,
            user: msg.user_name,
            text: msg.text,
            created_at: msg.created_at,
          }))
        )
      }
    }

    loadMessages()

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
  }

  const handleSelectRoom = (room) => {
    setCurrentRoom(room)
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    if (!user) return

    // Supabase에 메시지 저장
    const { error } = await supabase.from('messages').insert({
      room_id: currentRoom.id,
      user_name: user.nickname,
      text: message.trim(),
    })

    if (error) {
      console.error('메시지 전송 오류:', error)
      alert('메시지 전송에 실패했습니다.')
      return
    }

    // 로컬 상태는 Realtime 구독으로 자동 업데이트됨
    setMessage('')
  }

  const handleLeave = () => {
    // 구독 해제
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    setEntered(false)
    setUser(null)
    setCurrentRoom(null)
    setMessages([])
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
          <RoomListScreen user={user} onSelectRoom={handleSelectRoom} />
        ) : (
          <ChatScreen
            name={user.nickname}
            room={currentRoom}
            messages={messages}
            message={message}
            micOn={micOn}
            onToggleMic={() => setMicOn((prev) => !prev)}
            onMessageChange={setMessage}
            onSendMessage={handleSendMessage}
            onLeave={handleLeave}
          />
        )}
      </Box>
    </ThemeProvider>
  )
}

export default App