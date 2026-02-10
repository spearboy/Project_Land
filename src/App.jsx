import React, { useState } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material'
import EnterScreen from './components/EnterScreen'
import ChatScreen from './components/ChatScreen'

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
  const [name, setName] = useState('')
  const [entered, setEntered] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [micOn, setMicOn] = useState(false)

  const handleEnter = () => {
    if (!name.trim()) return
    setEntered(true)
  }

  const handleEnterKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnter()
    }
  }

  const handleSendMessage = () => {
    if (!message.trim()) return
    setMessages((prev) => [...prev, { id: Date.now(), user: name, text: message }])
    setMessage('')
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
        {!entered ? (
          <EnterScreen
            name={name}
            onNameChange={setName}
            onEnter={handleEnter}
            onKeyDown={handleEnterKey}
          />
        ) : (
          <ChatScreen
            name={name}
            messages={messages}
            message={message}
            micOn={micOn}
            onToggleMic={() => setMicOn((prev) => !prev)}
            onMessageChange={setMessage}
            onSendMessage={handleSendMessage}
            onLeave={() => setEntered(false)}
          />
        )}
      </Box>
    </ThemeProvider>
  )
}

export default App