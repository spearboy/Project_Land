import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, CircularProgress, Typography } from '@mui/material'

const SummaryModal = ({ open, onClose, summary, loading, error }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(148,163,184,0.1)',
        },
      }}
    >
      <DialogTitle sx={{ color: 'text.primary', fontWeight: 600 }}>채팅방 요약</DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
              요약 중...
            </Typography>
          </Box>
        )}
        {error && (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}
        {summary && !loading && (
          <Box sx={{ py: 1 }}>
            <Typography
              variant="body1"
              sx={{
                color: 'text.primary',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
              }}
            >
              {summary}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SummaryModal
