import React, { useState } from 'react'
import { Box, Paper, Typography, TextField, Button } from '@mui/material'
import { supabase } from '../lib/supabase'

const passwordIsValid = (password) => {
  if (password.length < 8) return false
  // 특수문자 1개 이상 포함
  return /[!@#$%^&*(),.?":{}|<>_\-\\[\];'`~+/=]/.test(password)
}

const EnterScreen = ({ onAuthSuccess }) => {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!userId.trim()) newErrors.userId = '아이디를 입력해주세요.'
    if (!passwordIsValid(password)) {
      newErrors.password = '비밀번호는 8자리 이상이며 특수문자를 1개 이상 포함해야 합니다.'
    }
    if (!nickname.trim()) newErrors.nickname = '닉네임을 입력해주세요.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          user_id: userId.trim(),
          password, // 데모용: 실제 서비스에서는 반드시 해시해야 합니다.
          nickname: nickname.trim(),
        })
        .select()
        .single()

      if (error) {
        // 유니크 제약 조건 에러 등 처리
        if (error.code === '23505') {
          setErrors((prev) => ({
            ...prev,
            userId: '이미 사용 중인 아이디입니다.',
          }))
        } else {
          console.error('유저 저장 오류:', error)
          alert('회원 정보 저장에 실패했습니다. 다시 시도해주세요.')
        }
        return
      }

      if (data) {
        onAuthSuccess({
          id: data.id,
          userId: data.user_id,
          nickname: data.nickname,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

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
          아이디, 비밀번호, 닉네임을 입력하고 방에 입장하세요.
        </Typography>
        <TextField
          label="아이디"
          variant="outlined"
          fullWidth
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '1rem',
            },
          }}
          error={Boolean(errors.userId)}
          helperText={errors.userId}
        />
        <TextField
          label="비밀번호"
          type="password"
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '1rem',
            },
          }}
          error={Boolean(errors.password)}
          helperText={errors.password || '8자리 이상, 특수문자 1개 이상 포함'}
        />
        <TextField
          label="닉네임"
          variant="outlined"
          fullWidth
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '1rem',
            },
          }}
          error={Boolean(errors.nickname)}
          helperText={errors.nickname}
        />
        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ mt: 1, py: 1.5 }}
        >
          {loading ? '입장 중...' : '입장하기'}
        </Button>
      </Paper>
    </Box>
  )
}

export default EnterScreen

