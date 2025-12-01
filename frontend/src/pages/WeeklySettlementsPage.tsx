import { useEffect, useState } from 'react'
import { Box, Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material'
import AppHeader from '@components/AppHeader'
import ErrorAlert from '@components/ErrorAlert'
import { SettlementsApi } from '@api/index'
import type { WeeklySettlementResponse } from '@api/types'
import { useParams } from 'react-router-dom'
import { formatMoney } from '@utils/format'

export default function WeeklySettlementsPage() {
  const { groupId, week, year } = useParams()
  const gid = Number(groupId)
  const weekNum = Number(week)
  const yr = Number(year)
  const [data, setData] = useState<WeeklySettlementResponse | null>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    SettlementsApi.balancesByWeek(gid, weekNum, yr).then(setData).catch(setError)
  }, [gid, weekNum, yr])

  return (
    <>
      <AppHeader />
      <Container sx={{ mt: 3 }}>
        <ErrorAlert error={error} />
        <Typography variant="h5" gutterBottom>
          Settlements for Week {weekNum}, {yr}
        </Typography>

        {data && (
          <Box>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>You pay</Typography>
                <Stack spacing={1}>
                  {data.toPay.map((p, idx) => (
                    <Card key={`pay-${idx}`}>
                      <CardContent>
                        <Typography>Pay {formatMoney(p.amount)} to {p.toUser}</Typography>
                      </CardContent>
                    </Card>
                  ))}
                  {data.toPay.length === 0 && <Typography variant="body2">Nothing to pay.</Typography>}
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>You receive</Typography>
                <Stack spacing={1}>
                  {data.toReceive.map((r, idx) => (
                    <Card key={`recv-${idx}`}>
                      <CardContent>
                        <Typography>Receive {formatMoney(r.amount)} from {r.fromUser}</Typography>
                      </CardContent>
                    </Card>
                  ))}
                  {data.toReceive.length === 0 && <Typography variant="body2">Nothing to receive.</Typography>}
                </Stack>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Pairwise Payables</Typography>
              <Grid container spacing={2}>
                {data.pairwiseBalances.map((p, idx) => (
                  <Grid item xs={12} md={6} lg={4} key={`pw-${idx}`}>
                    <Card>
                      <CardContent>
                        <Typography>{p.user1} owes {p.user2}: {formatMoney(p.amount)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                {data.pairwiseBalances.length === 0 && <Typography variant="body2">All settled for this week.</Typography>}
              </Grid>
            </Box>
          </Box>
        )}
      </Container>
    </>
  )
}
