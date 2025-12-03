

import { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, Container, Grid, Paper, Stack, Typography, useTheme, Avatar } from '@mui/material'
import AppHeader from '@components/AppHeader'
import ErrorAlert from '@components/ErrorAlert'
import { SettlementsApi, UsersApi } from '@api/index'
import type { WeeklySettlementResponse, UserResponse } from '@api/types'
import { useNavigate, useParams } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

export default function WeeklySettlementsPage() {
  const { groupId, week, year } = useParams()
  const gid = Number(groupId)
  const w = Number(week)
  const y = Number(year)
  const nav = useNavigate()
  const theme = useTheme()

  const [data, setData] = useState<WeeklySettlementResponse | null>(null)
  const [users, setUsers] = useState<UserResponse[]>([])
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    SettlementsApi.balancesByWeek(gid, w, y).then(setData).catch(setError)
    UsersApi.list().then(setUsers).catch(setError)
  }, [gid, w, y])

  const getUserName = (id: number) => users.find(u => u.id === id)?.name || `User ${id}`

  return (
    <>
      <AppHeader />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <ErrorAlert error={error} />
        <Button startIcon={<ArrowBackIcon />} onClick={() => nav(-1)} sx={{ mb: 2 }}>Back</Button>

        <Typography variant="h4" fontWeight="bold" gutterBottom>Weekly Settlements</Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Week {w} / {y}
        </Typography>

        {/* Who Owes Whom */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Who Owes Whom (This Week)</Typography>
        <Stack spacing={2}>
          {(!data?.pairwiseBalances || data.pairwiseBalances.length === 0) && (
            <Typography color="text.secondary">No debts found for this week.</Typography>
          )}
          {data?.pairwiseBalances.map((pb, idx) => (
            <Card key={idx} variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography fontWeight="bold">{pb.user1}</Typography>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Typography variant="caption" color="text.secondary">owes</Typography>
                    <ArrowForwardIcon color="action" fontSize="small" />
                  </Box>
                  <Typography fontWeight="bold">{pb.user2}</Typography>
                </Box>
                <Typography variant="h6" color="error.main">
                  ₹{Number(pb.amount).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* My Status */}
        {data && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>My Status</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="error.main" gutterBottom>To Pay</Typography>
                  {data.toPay.length === 0 ? <Typography variant="body2" color="text.secondary">Nothing to pay</Typography> : (
                    <Stack spacing={1}>
                      {data.toPay.map((tp, i) => (
                        <Box key={i} display="flex" justifyContent="space-between">
                          <Typography>{tp.toUser}</Typography>
                          <Typography fontWeight="bold">₹{tp.amount}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>To Receive</Typography>
                  {data.toReceive.length === 0 ? <Typography variant="body2" color="text.secondary">Nothing to receive</Typography> : (
                    <Stack spacing={1}>
                      {data.toReceive.map((tr, i) => (
                        <Box key={i} display="flex" justifyContent="space-between">
                          <Typography>{tr.fromUser}</Typography>
                          <Typography fontWeight="bold">₹{tr.amount}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
    </>
  )
}
