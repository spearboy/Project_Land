import React, { useState, useCallback } from 'react'
import { Box, Paper, Typography, TextField, Button, Link } from '@mui/material'
import { supabase } from '../lib/supabase'
import { ERROR_CODES, getErrorMessage } from '../constants/errorCodes'
import AlertModal from './AlertModal'

const passwordIsValid = (password) => {
  if (password.length < 8) return false
  return /[!@#$%^&*(),.?":{}|<>_\-\\[\];'`~+/=]/.test(password)
}

const hashPassword = async (password) => {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const encoder = new TextEncoder()
  const data = encoder.encode(password + saltHex)

  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return `${saltHex}:${hashHex}`
}

const verifyPassword = async (password, passwordHash) => {
  const [saltHex, storedHash] = passwordHash.split(':')
  if (!saltHex || !storedHash) return false

  const encoder = new TextEncoder()
  const data = encoder.encode(password + saltHex)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return hashHex === storedHash
}

const EnterScreen = ({ onAuthSuccess, showAlert }) => {
  const [mode, setMode] = useState('login')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '', errorCode: null })

  const openAlert = useCallback((title, message, errorCode = null) => {
    setAlertModal({ open: true, title, message, errorCode })
  }, [])

  const closeAlert = useCallback(() => {
    setAlertModal({ open: false, title: '', message: '', errorCode: null })
  }, [])

  const validateLogin = useCallback(() => {
    const newErrors = {}
    if (!userId.trim()) newErrors.userId = '아이디를 입력해주세요.'
    if (!password.trim()) newErrors.password = '비밀번호를 입력해주세요.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [userId, password])

  const validateSignup = useCallback(() => {
    const newErrors = {}
    if (!userId.trim()) newErrors.userId = '아이디를 입력해주세요.'
    if (!passwordIsValid(password)) {
      newErrors.password = '비밀번호는 8자리 이상이며 특수문자를 1개 이상 포함해야 합니다.'
    }
    if (!nickname.trim()) newErrors.nickname = '닉네임을 입력해주세요.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [userId, password, nickname])

  const handleLogin = useCallback(async () => {
    if (!validateLogin()) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId.trim())
        .single()

      if (error || !data) {
        setErrors({
          password: '아이디 또는 비밀번호가 올바르지 않습니다.',
        })
        setLoading(false)
        return
      }

      const isValid = await verifyPassword(password, data.password_hash)
      if (!isValid) {
        setErrors({
          password: '아이디 또는 비밀번호가 올바르지 않습니다.',
        })
        setLoading(false)
        return
      }

      onAuthSuccess({
        id: data.id,
        userId: data.user_id,
        nickname: data.nickname,
        isAdmin: Boolean(data.is_admin),
      })
    } catch (err) {
      console.error('로그인 오류:', err)
      openAlert('로그인 실패', getErrorMessage(ERROR_CODES.AUTH_LOGIN_FAILED), ERROR_CODES.AUTH_LOGIN_FAILED)
    } finally {
      setLoading(false)
    }
  }, [userId, password, validateLogin, onAuthSuccess, openAlert])

  const handleSignup = useCallback(async () => {
    if (!validateSignup()) return
    setLoading(true)

    try {
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

      const passwordHash = await hashPassword(password)

      const { data, error } = await supabase
        .from('users')
        .insert({
          user_id: userId.trim(),
          password_hash: passwordHash,
          nickname: nickname.trim(),
          is_admin: false,
        })
        .select()
        .single()

      if (error) {
        console.error('유저 저장 오류:', error)
        openAlert('회원가입 실패', getErrorMessage(ERROR_CODES.AUTH_SIGNUP_FAILED), ERROR_CODES.AUTH_SIGNUP_FAILED)
        setLoading(false)
        return
      }

      if (data) {
        onAuthSuccess({
          id: data.id,
          userId: data.user_id,
          nickname: data.nickname,
          isAdmin: Boolean(data.is_admin),
        })
      }
    } finally {
      setLoading(false)
    }
  }, [userId, password, nickname, validateSignup, onAuthSuccess, openAlert])

  const handleForgotPassword = useCallback(async () => {
    const newErrors = {}
    if (!userId.trim()) newErrors.userId = '아이디를 입력해주세요.'
    if (!nickname.trim()) newErrors.nickname = '닉네임을 입력해주세요.'
    if (!passwordIsValid(newPassword)) {
      newErrors.newPassword = '비밀번호는 8자리 이상이며 특수문자를 1개 이상 포함해야 합니다.'
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)

    try {
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId.trim())
        .eq('nickname', nickname.trim())
        .single()

      if (findError || !user) {
        setErrors({
          nickname: '아이디와 닉네임이 일치하지 않습니다.',
        })
        setLoading(false)
        return
      }

      const passwordHash = await hashPassword(newPassword)

      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', user.id)

      if (updateError) {
        console.error('비밀번호 변경 오류:', updateError)
        openAlert('비밀번호 변경 실패', getErrorMessage(ERROR_CODES.AUTH_PASSWORD_RESET_FAILED), ERROR_CODES.AUTH_PASSWORD_RESET_FAILED)
        setLoading(false)
        return
      }

      openAlert('비밀번호 변경 완료', '비밀번호가 성공적으로 변경되었습니다. 로그인해주세요.')
      switchMode('login')
    } catch (err) {
      console.error('비밀번호 찾기 오류:', err)
      openAlert('비밀번호 찾기 실패', getErrorMessage(ERROR_CODES.AUTH_PASSWORD_RESET_FAILED), ERROR_CODES.AUTH_PASSWORD_RESET_FAILED)
    } finally {
      setLoading(false)
    }
  }, [userId, nickname, newPassword, openAlert])

  const handleSubmit = useCallback(() => {
    if (mode === 'login') {
      handleLogin()
    } else if (mode === 'signup') {
      handleSignup()
    } else if (mode === 'forgot') {
      handleForgotPassword()
    }
  }, [mode, handleLogin, handleSignup, handleForgotPassword])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const resetForm = useCallback(() => {
    setUserId('')
    setPassword('')
    setNickname('')
    setNewPassword('')
    setErrors({})
  }, [])

  const switchMode = useCallback((newMode) => {
    setMode(newMode)
    resetForm()
  }, [resetForm])

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
              : mode === 'signup'
              ? '회원가입 정보를 입력하세요.'
              : '아이디와 닉네임을 입력하고 새 비밀번호를 설정하세요.'}
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
          {mode !== 'forgot' && (
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
          )}
          {(mode === 'signup' || mode === 'forgot') && (
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
          {mode === 'forgot' && (
            <TextField
              label="새 비밀번호"
              type="password"
              variant="outlined"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1rem',
                },
              }}
              error={Boolean(errors.newPassword)}
              helperText={errors.newPassword || '8자리 이상, 특수문자 1개 이상 포함'}
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
                : mode === 'signup'
                ? '가입 중...'
                : '변경 중...'
              : mode === 'login'
              ? '로그인'
              : mode === 'signup'
              ? '회원가입'
              : '비밀번호 변경'}
          </Button>

          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {mode === 'login' ? (
              <>
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
                <Typography variant="body2" color="text.secondary">
                  비밀번호를 잊으셨나요?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => switchMode('forgot')}
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    비밀번호 찾기
                  </Link>
                </Typography>
              </>
            ) : mode === 'signup' ? (
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
            ) : (
              <Typography variant="body2" color="text.secondary">
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
                  로그인으로 돌아가기
                </Link>
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </>
  )
}

export default EnterScreen
