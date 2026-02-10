import React from 'react'
import { Box } from '@mui/material'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import VoiceStatusBar from './VoiceStatusBar'
import MessageInput from './MessageInput'

const ChatScreen = ({
  name,
  messages,
  message,
  micOn,
  onToggleMic,
  onMessageChange,
  onSendMessage,
  onLeave,
}) => {
  return (
    <>
      <ChatHeader name={name} micOn={micOn} onToggleMic={onToggleMic} onLeave={onLeave} />

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MessageList messages={messages} currentUserName={name} />
      </Box>

      <VoiceStatusBar micOn={micOn} />
      <MessageInput message={message} onChange={onMessageChange} onSend={onSendMessage} />
    </>
  )
}

export default ChatScreen

