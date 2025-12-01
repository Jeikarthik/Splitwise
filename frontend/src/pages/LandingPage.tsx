import { Box, Button, Card, CardContent, CircularProgress, Container, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { AuthApi, UsersApi } from '@api/index'
import type { AuthResponse, UserResponse } from '@api/types'
import { useAuth } from '@context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ErrorAlert from '@components/ErrorAlert'

export default function LandingPage() {
  const { user, setUser } = useAuth()
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => { setLoading(false) }, [])

  useEffect(() => { if (user) nav('/groups', { replace: true }) }, [user])

  const validEmail = useMemo(() => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(loginEmail), [loginEmail])
  const canLogin = useMemo(() => validEmail && !!loginPassword, [validEmail, loginPassword])
  const onLogin = async () => {
    setError(null)
    try {
      const res: AuthResponse = await AuthApi.login({ email: loginEmail, password: loginPassword })
      localStorage.setItem('auth_token', res.token)
      setUser(res.user)
    } catch (e) { setError(e) }
  }
  const onCreate = async () => {
    setError(null)
    try {
      const u = await UsersApi.create({ name, email, password })
      // after signup, log in the user
      const res: AuthResponse = await AuthApi.login({ email, password })
      localStorage.setItem('auth_token', res.token)
      setUser(u)
    } catch (e) { setError(e) }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Group Finance Tracker</Typography>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Login</Typography>
            <ErrorAlert error={error} />
            <TextField label="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} error={!!loginEmail && !validEmail} helperText={!!loginEmail && !validEmail ? 'Invalid email' : ' '} fullWidth />
            <TextField label="Password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} fullWidth />
            <Button variant="contained" disabled={!canLogin} onClick={onLogin}>Login</Button>
            <Box>
              <Typography variant="h6" sx={{ mt: 2 }}>Or Create New</Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <TextField label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth />
                <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} fullWidth />
              </Stack>
              <TextField sx={{ mt: 1 }} label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth />
              <Button sx={{ mt: 1 }} variant="outlined" onClick={onCreate} disabled={!name || !email || !password}>Create</Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}
