import { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material'
import AppHeader from '@components/AppHeader'
import ErrorAlert from '@components/ErrorAlert'
import StatusChip from '@components/StatusChip'
import { PaymentsApi, SharesApi, SubEventsApi, UsersApi } from '@api/index'
import type { ShareResponse, SubEventResponse, UserResponse } from '@api/types'
import { useAuth } from '@context/AuthContext'
import { useParams } from 'react-router-dom'

export default function SubEventDetailsPage() {
  const { user } = useAuth()
  const { subEventId } = useParams()
  const sid = Number(subEventId)
  const [sub, setSub] = useState<SubEventResponse | null>(null)
  const [shares, setShares] = useState<ShareResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [error, setError] = useState<any>(null)

  const refresh = async () => {
    const se = await SubEventsApi.get(sid)
    setSub(se)
    const sh = await SharesApi.listBySubEvent(sid)
    setShares(sh)
    const us = await UsersApi.list()
    setUsers(us)
  }

  useEffect(() => { refresh().catch(setError) }, [sid])

  const nameOf = (uid: number) => users.find(u => u.id === uid)?.name || String(uid)

  const onMark = async (share: ShareResponse) => {
    if (!user) return
    await PaymentsApi.markPaid(share.id)
    refresh()
  }

  const onConfirm = async (share: ShareResponse) => {
    if (!user) return
    await PaymentsApi.confirm(share.id)
    refresh()
  }

  return (
    <>
      <AppHeader />
      <Container sx={{ mt: 3 }}>
        <ErrorAlert error={error} />
        {sub && (
          <Box>
            <Typography variant="h5" gutterBottom>{sub.description}</Typography>
            <Typography variant="body1">Total: {sub.totalAmount}</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>Payer: {nameOf(sub.payerId)}</Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Shares</Typography>
            <Grid container spacing={2}>
              {shares.map(sh => (
                <Grid item xs={12} md={6} lg={4} key={sh.id}>
                  <Card>
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="subtitle1">{nameOf(sh.userId)}</Typography>
                        <Typography variant="body2">Amount: {sh.amount}</Typography>
                        <StatusChip state={sh.status} />
                        {sub && sh.userId === sub.payerId && sh.status === 'CONFIRMED' && (
                          <Typography variant="caption" color="success.main">Auto-Confirmed (payer)</Typography>
                        )}
                        {sh.markedAt && <Typography variant="caption">Marked: {new Date(sh.markedAt).toLocaleString()}</Typography>}
                        {sh.confirmedAt && <Typography variant="caption">Confirmed: {new Date(sh.confirmedAt).toLocaleString()}</Typography>}
                        <Stack direction="row" spacing={1}>
                          {user && sh.userId === user.id && sh.status === 'UNPAID' && (
                            <Button size="small" variant="outlined" onClick={() => onMark(sh)}>Mark as Paid</Button>
                          )}
                          {user && sub && sub.payerId === user.id && sh.status === 'MARKED_AS_PAID' && (
                            <Button size="small" variant="contained" onClick={() => onConfirm(sh)}>Confirm</Button>
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </>
  )
}
