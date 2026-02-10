import React from 'react'
import { Box, Paper, Typography, TextField, Button } from '@mui/material'

const EnterScreen = ({ name, onNameChange, onEnter, onKeyDown }) => {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          alignItems: 'center',
          textAlign: 'center',
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(15,23,42,0.9)',
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Project Land
        </Typography>
        <Typography variant="h6" fontWeight={600} color="primary.main" gutterBottom>
          Voice Chat
        </Typography>
        <Typography variant="body1" color="text.secondary">
          간단한 이름을 입력하고 방에 입장해서 텍스트와 음성으로 대화해보세요.
        </Typography>
        <TextField
          label="이름"
          variant="outlined"
          fullWidth
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '1rem',
            },
          }}
        />
        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={onEnter}
          disabled={!name.trim()}
          sx={{ mt: 1, py: 1.5 }}
        >
          입장하기
        </Button>
      </Paper>
    </Box>
  )
}

export default EnterScreen

