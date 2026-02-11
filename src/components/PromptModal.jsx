import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
} from '@mui/material'
import QuestionMarkIcon from '@mui/icons-material/QuestionMark'

const PromptModal = ({ open, onClose, onConfirm, title, message, placeholder, defaultValue, errorCode }) => {
  const [value, setValue] = useState(defaultValue || '')

  React.useEffect(() => {
    if (open) {
      setValue(defaultValue || '')
    }
  }, [open, defaultValue])

  const handleConfirm = () => {
    onConfirm(value)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(16px)',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuestionMarkIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            {title || '입력'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {message}
        </Typography>
        {errorCode && (
          <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
            에러 코드: {errorCode}
            <br />
            관리자에게 문의해주세요.
          </Typography>
        )}
        <TextField
          autoFocus
          fullWidth
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="outlined"
        />
      </DialogContent>
      <DialogActions sx={{ gap: 1, px: 2, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ flex: 1 }}>
          취소
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="primary" sx={{ flex: 1 }} disabled={!value.trim()}>
          확인
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PromptModal
