import React, { useState, useMemo } from 'react'
import { Box } from '@mui/material'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import VoiceStatusBar from './VoiceStatusBar'
import MessageInput from './MessageInput'
import RoomParticipantsModal from './RoomParticipantsModal'

const ChatScreen = ({
  name,
  room,
  participants,
  messages,
  message,
  micOn,
  onToggleMic,
  onMessageChange,
  onSendMessage,
  onFileSelect,
  onLeave,
  notificationEnabled,
  onToggleNotification,
  showAlert,
}) => {
  const [openParticipants, setOpenParticipants] = useState(false)

  const participantsCount = useMemo(() => participants?.length || (room ? 1 : 0), [participants, room])

  return (
    <>
      <ChatHeader
        name={name}
        room={room}
        micOn={micOn}
        onToggleMic={onToggleMic}
        onLeave={onLeave}
        participantsCount={participantsCount}
        onOpenParticipants={() => setOpenParticipants(true)}
        notificationEnabled={notificationEnabled}
        onToggleNotification={onToggleNotification}
      />

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MessageList messages={messages} currentUserName={name} participants={participants} />
      </Box>

      <VoiceStatusBar micOn={micOn} />
      <MessageInput
        message={message}
        onChange={onMessageChange}
        onSend={onSendMessage}
        onFileSelect={onFileSelect}
        showAlert={showAlert}
      />

      <RoomParticipantsModal
        open={openParticipants}
        onClose={() => setOpenParticipants(false)}
        room={room}
        participants={participants}
        currentUserName={name}
      />
    </>
  )
}

export default ChatScreen
