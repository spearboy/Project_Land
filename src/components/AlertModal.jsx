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
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

const AlertModal = ({ open, onClose, title, message, errorCode }) => {
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
          <ErrorOutlineIcon color="error" />
          <Typography variant="h6" fontWeight={600}>
            {title || '알림'}
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
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary" fullWidth>
          확인
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AlertModal
