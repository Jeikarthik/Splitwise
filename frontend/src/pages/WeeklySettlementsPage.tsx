import { Box, Button, Container, Typography } from '@mui/material'
import AppHeader from '@components/AppHeader'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

export default function WeeklySettlementsPage() {
  const nav = useNavigate()
  return (
    <>
      <AppHeader />
      <Container sx={{ mt: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => nav(-1)} sx={{ mb: 2 }}>Back</Button>
        <Typography variant="h4">Weekly Settlements</Typography>
        <Typography color="text.secondary">Not implemented yet.</Typography>
      </Container>
    </>
  )
}
