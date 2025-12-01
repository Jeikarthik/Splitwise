import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'

export default function AppHeader() {
  const { user, setUser } = useAuth()
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>SmartSplit</Typography>
        {user ? (
          <Box display="flex" gap={2} alignItems="center">
            <Typography variant="body2">{user.name}</Typography>
            <Button color="inherit" component={RouterLink} to="/groups">Groups</Button>
            <Button color="inherit" onClick={() => { localStorage.removeItem('auth_token'); setUser(null) }}>Logout</Button>
          </Box>
        ) : (
          <Button color="inherit" component={RouterLink} to="/">Login</Button>
        )}
      </Toolbar>
    </AppBar>
  )
}
