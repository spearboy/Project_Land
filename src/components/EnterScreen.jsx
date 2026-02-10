import React, { useState } from 'react'
import { Box, Paper, Typography, TextField, Button, Link } from '@mui/material'
import { supabase } from '../lib/supabase'

const passwordIsValid = (password) => {
  if (password.length < 8) return false
  // 특수문자 1개 이상 포함
  return /[!@#$%^&*(),.?":{}|<>_\-\\[\];'`~+/=]/.test(password)
}

const EnterScreen = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validateLogin = () => {
    const newErrors = {}
    if (!userId.trim()) newErrors.userId = '아이디를 입력해주세요.'
    if (!password.trim()) newErrors.password = '비밀번호를 입력해주세요.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateSignup = () => {
    const newErrors = {}
    if (!userId.trim()) newErrors.userId = '아이디를 입력해주세요.'
    if (!passwordIsValid(password)) {
      newErrors.password = '비밀번호는 8자리 이상이며 특수문자를 1개 이상 포함해야 합니다.'
    }
    if (!nickname.trim()) newErrors.nickname = '닉네임을 입력해주세요.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validateLogin()) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId.trim())
        .eq('password', password)
        .single()

      if (error || !data) {
        setErrors({
          password: '아이디 또는 비밀번호가 올바르지 않습니다.',
        })
        return
      }

      onAuthSuccess({
        id: data.id,
        userId: data.user_id,
        nickname: data.nickname,
      })
    } catch (err) {
      console.error('로그인 오류:', err)
      alert('로그인에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!validateSignup()) return
    setLoading(true)

    try {
      // 아이디 중복 체크
      const { data: existingUserId } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', userId.trim())
        .single()

      if (existingUserId) {
        setErrors((prev) => ({
          ...prev,
          userId: '이미 사용 중인 아이디입니다.',
        }))
        setLoading(false)
        return
      }

      // 닉네임 중복 체크
      const { data: existingNickname } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname.trim())
        .single()

      if (existingNickname) {
        setErrors((prev) => ({
          ...prev,
          nickname: '이미 사용 중인 닉네임입니다.',
        }))
        setLoading(false)
        return
      }

      // 중복이 없으면 회원가입 진행
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
        console.error('유저 저장 오류:', error)
        alert('회원 정보 저장에 실패했습니다. 다시 시도해주세요.')
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

  const handleSubmit = () => {
    if (mode === 'login') {
      handleLogin()
    } else {
      handleSignup()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const resetForm = () => {
    setUserId('')
    setPassword('')
    setNickname('')
    setErrors({})
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    resetForm()
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
          {mode === 'login'
            ? '아이디와 비밀번호로 로그인하세요.'
            : '회원가입 정보를 입력하세요.'}
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
          helperText={
            errors.password ||
            (mode === 'signup' ? '8자리 이상, 특수문자 1개 이상 포함' : '')
          }
        />
        {mode === 'signup' && (
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
        )}

        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ mt: 1, py: 1.5 }}
        >
          {loading
            ? mode === 'login'
              ? '로그인 중...'
              : '가입 중...'
            : mode === 'login'
            ? '로그인'
            : '회원가입'}
        </Button>

        <Box sx={{ mt: 1 }}>
          {mode === 'login' ? (
            <Typography variant="body2" color="text.secondary">
              계정이 없으신가요?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => switchMode('signup')}
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                회원가입
              </Link>
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              이미 계정이 있으신가요?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => switchMode('login')}
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                로그인
              </Link>
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default EnterScreen

