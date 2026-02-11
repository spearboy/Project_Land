import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'

const ConfirmModal = ({ open, onClose, onConfirm, title, message, confirmText, cancelText, errorCode }) => {
  const handleConfirm = () => {
    onConfirm()
    onClose()
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
          <HelpOutlineIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            {title || '확인'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: errorCode ? 1 : 0 }}>
          {message}
        </Typography>
        {errorCode && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            에러 코드: {errorCode}
            <br />
            관리자에게 문의해주세요.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ gap: 1, px: 2, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ flex: 1 }}>
          {cancelText || '취소'}
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="primary" sx={{ flex: 1 }}>
          {confirmText || '확인'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmModal
