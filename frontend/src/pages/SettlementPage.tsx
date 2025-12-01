import { useEffect, useState } from 'react'
import { Box, Card, CardContent, Container, Grid, Typography } from '@mui/material'
import AppHeader from '@components/AppHeader'
import ErrorAlert from '@components/ErrorAlert'
import { SettlementsApi, UsersApi } from '@api/index'
import type { GroupSettlementSummary, ShareResponse, UserOutstandingDebts, UserResponse } from '@api/types'
import { useAuth } from '@context/AuthContext'
import { useParams } from 'react-router-dom'
import { formatMoney } from '@utils/format'

export default function SettlementPage() {
  const { user } = useAuth()
  const { groupId } = useParams()
  const gid = Number(groupId)
  const [summary, setSummary] = useState<GroupSettlementSummary | null>(null)
  const [debts, setDebts] = useState<UserOutstandingDebts | null>(null)
  const [users, setUsers] = useState<UserResponse[]>([])
  const [pairwise, setPairwise] = useState<{ fromUserId: number; toUserId: number; amount: string }[]>([])
  const [mySpend, setMySpend] = useState<string>('0')
  const [error, setError] = useState<any>(null)

  const refresh = async () => {
    setSummary(await SettlementsApi.group(gid))
    if (user) setDebts(await SettlementsApi.user(user.id))
    setUsers(await UsersApi.list())
    const pw = await SettlementsApi.pairwise(gid)
    setPairwise(pw.owes)
    try {
      const sp = await SettlementsApi.mySpendGroup(gid)
      setMySpend(String(sp.amount ?? '0'))
    } catch {}
  }

  useEffect(() => { refresh().catch(setError) }, [gid, user?.id])

  const nameOf = (uid: number) => users.find(u => u.id === uid)?.name || String(uid)

  // Removed group-wide Total Receivable/Payable to reduce confusion

  return (
    <>
      <AppHeader />
      <Container sx={{ mt: 3 }}>
        <ErrorAlert error={error} />
        <Typography variant="h5" gutterBottom>Group Settlement</Typography>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>You spent in this group: {formatMoney(mySpend)}</Typography>
        {summary && (
          <Box>
            <Typography variant="subtitle1">Outstanding confirmations: {summary.outstandingConfirmations}</Typography>

            <Typography variant="h6" sx={{ mt: 3 }}>Balances</Typography>
            {(() => {
              const send = summary.balances
                .filter(b => Number(b.netBalance) < 0)
                .map(b => ({ userId: b.userId, amount: Math.abs(Number(b.netBalance)) }))
              const receive = summary.balances
                .filter(b => Number(b.netBalance) > 0)
                .map(b => ({ userId: b.userId, amount: Number(b.netBalance) }))
              return (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>To send</Typography>
                    <Grid container spacing={2}>
                      {send.map(item => (
                        <Grid item xs={12} key={`send-${item.userId}`}>
                          <Card>
                            <CardContent>
                              <Typography variant="subtitle1">{nameOf(item.userId)}</Typography>
                              <Typography variant="body2">Amount: {formatMoney(item.amount)}</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                      {send.length === 0 && <Typography variant="body2">Nothing to send.</Typography>}
                    </Grid>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>To receive</Typography>
                    <Grid container spacing={2}>
                      {receive.map(item => (
                        <Grid item xs={12} key={`recv-${item.userId}`}>
                          <Card>
                            <CardContent>
                              <Typography variant="subtitle1">{nameOf(item.userId)}</Typography>
                              <Typography variant="body2">Amount: {formatMoney(item.amount)}</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                      {receive.length === 0 && <Typography variant="body2">Nothing to receive.</Typography>}
                    </Grid>
                  </Grid>
                </Grid>
              )
            })()}
          </Box>
        )}

        {debts && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>My Debts</Typography>
            <Grid container spacing={2}>
              {debts.debts.map(d => (
                <Grid item xs={12} md={6} lg={4} key={d.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1">Owe: {formatMoney(d.amount)}</Typography>
                      <Typography variant="body2">To: {nameOf(d.payerId)}</Typography>
                      <Typography variant="body2">Status: {d.status}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {pairwise.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>Pairwise Payables</Typography>
            <Grid container spacing={2}>
              {pairwise.map(p => (
                <Grid item xs={12} md={6} lg={4} key={`${p.fromUserId}->${p.toUserId}`}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1">{nameOf(p.fromUserId)} ➜ {nameOf(p.toUserId)}</Typography>
                      <Typography variant="body2">Amount: {formatMoney(p.amount)}</Typography>
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
