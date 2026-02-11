import React, { useRef, useCallback, useMemo, useState } from 'react'
import { Box, TextField, Fab, IconButton, Tooltip } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import { ERROR_CODES } from '../constants/errorCodes'
import AlertModal from './AlertModal'

const isMobile = () => {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    (typeof window !== 'undefined' && window.innerWidth <= 768) ||
    'ontouchstart' in window
  )
}

const MessageInput = ({ message, onChange, onSend, onFileSelect, showAlert }) => {
  const fileInputRef = useRef(null)
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '', errorCode: null })

  const openAlert = useCallback((title, message, errorCode = null) => {
    setAlertModal({ open: true, title, message, errorCode })
  }, [])

  const closeAlert = useCallback(() => {
    setAlertModal({ open: false, title: '', message: '', errorCode: null })
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (isMobile()) {
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }, [onSend])

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      if (showAlert) {
        showAlert('파일 형식 오류', '이미지 또는 영상 파일만 업로드할 수 있습니다.', ERROR_CODES.FILE_INVALID_TYPE)
      } else {
        openAlert('파일 형식 오류', '이미지 또는 영상 파일만 업로드할 수 있습니다.', ERROR_CODES.FILE_INVALID_TYPE)
      }
      return
    }

    if (onFileSelect) {
      onFileSelect(file)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onFileSelect, showAlert, openAlert])

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const isSendDisabled = useMemo(() => !message.trim(), [message])

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
          p: 2,
          pt: 1.5,
          backgroundColor: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(148,163,184,0.1)',
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-end',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <Tooltip title="이미지 또는 영상 첨부">
          <IconButton
            onClick={handleAttachClick}
            sx={{
              minWidth: 48,
              minHeight: 48,
              flexShrink: 0,
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            <AttachFileIcon />
          </IconButton>
        </Tooltip>
        <TextField
          placeholder="메시지를 입력하세요"
          variant="outlined"
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '1rem',
              backgroundColor: 'rgba(31,41,55,0.5)',
            },
          }}
        />
        <Fab
          color="primary"
          onClick={onSend}
          disabled={isSendDisabled}
          sx={{
            minWidth: 48,
            minHeight: 48,
            flexShrink: 0,
          }}
        >
          <SendIcon />
        </Fab>
      </Box>
    </>
  )
}

export default MessageInput
