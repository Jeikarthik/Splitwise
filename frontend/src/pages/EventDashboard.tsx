import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardActions, CardContent, Container, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import AppHeader from '@components/AppHeader'
import ErrorAlert from '@components/ErrorAlert'
import { EventsApi, GroupsApi, SubEventsApi, UsersApi, SettlementsApi } from '@api/index'
import type { EventResponse, GroupResponse, SubEventResponse, UserResponse, PairwiseBalance } from '@api/types'
import { useAuth } from '@context/AuthContext'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { formatMoney } from '@utils/format'

export default function EventDashboard() {
  const { user } = useAuth()
  const { eventId } = useParams()
  const eid = Number(eventId)
  const [event, setEvent] = useState<EventResponse | null>(null)
  const [group, setGroup] = useState<GroupResponse | null>(null)
  const [users, setUsers] = useState<UserResponse[]>([])
  const [subs, setSubs] = useState<SubEventResponse[]>([])
  const [pairwise, setPairwise] = useState<PairwiseBalance[]>([])
  const [mySpend, setMySpend] = useState<string>('0')
  const [error, setError] = useState<any>(null)

  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [subEventDate, setSubEventDate] = useState('')
  const payerId = user?.id
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [equalSplit, setEqualSplit] = useState(false)
  const [customShares, setCustomShares] = useState<Record<number, string>>({})

  const refresh = async () => {
    const e = await EventsApi.get(eid)
    setEvent(e)
    setSubs(await SubEventsApi.listByEvent(eid))
    const g = await GroupsApi.get(e.groupId)
    setGroup(g)
    const us = await UsersApi.list()
    setUsers(us)
    try {
      const ev = await SettlementsApi.eventPairwise(eid)
      setPairwise(ev.pairwiseBalances || [])
    } catch {}
    try {
      const sp = await SettlementsApi.mySpendEvent(eid)
      setMySpend(String(sp.amount ?? '0'))
    } catch {}
  }

  useEffect(() => { refresh().catch(setError) }, [eid])

  useEffect(() => {
    const tid = setInterval(async () => {
      try {
        const ev = await SettlementsApi.eventPairwise(eid)
        setPairwise(ev.pairwiseBalances || [])
      } catch {}
    }, 10000)
    return () => clearInterval(tid)
  }, [eid])

  const members = useMemo(() => users.filter(u => (group?.memberIds || []).includes(u.id || -1)), [users, group?.memberIds])

  const customSum = useMemo(() => {
    if (equalSplit) return 0
    return (selectedMembers || []).reduce((acc, uid) => acc + Number(customShares[uid] || 0), 0)
  }, [equalSplit, selectedMembers, customShares])

  const totalNum = useMemo(() => Number(totalAmount || 0), [totalAmount])
  const splitMismatch = useMemo(() => {
    if (equalSplit) return false
    if (!totalAmount) return false
    if ((selectedMembers || []).length === 0) return false
    return Math.abs(customSum - totalNum) > 0.01
  }, [equalSplit, totalAmount, selectedMembers, customSum, totalNum])

  const createSubevent = async () => {
    setError(null)
    const shares = (equalSplit ? selectedMembers : Object.keys(customShares).map(Number))
      .map(uid => ({ userId: uid, amount: String(equalSplit ? Number(totalAmount || 0) / (selectedMembers.length || 1) : Number(customShares[uid] || 0)) }))
    // Client-side validation for custom split sum
    if (!equalSplit) {
      const total = Number(totalAmount || 0)
      const sum = shares.reduce((acc, s) => acc + Number(s.amount || 0), 0)
      if (Math.abs(sum - total) > 0.01) {
        setError({ message: 'Share splits must sum to total amount' })
        return
      }
    }
    await SubEventsApi.create({ eventId: eid, description, totalAmount, payerId: payerId as number, subEventDate, shares })
    setDescription('')
    setTotalAmount('')
    setSubEventDate('')
    setSelectedMembers([])
    setCustomShares({})
    setEqualSplit(false)
    refresh()
  }

  return (
    <>
      <AppHeader />
      <Container sx={{ mt: 3 }}>
        <ErrorAlert error={error} />
        {event && (
          <Box>
            <Typography variant="h5" gutterBottom>{event.name}</Typography>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>You spent in this event: {formatMoney(mySpend)}</Typography>
            <Typography variant="subtitle1">Subevents</Typography>
            <Grid container spacing={2}>
              {subs.map(s => (
                <Grid item xs={12} md={6} lg={4} key={s.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1">{s.description}</Typography>
                      <Typography variant="body2">Total: {s.totalAmount}</Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" component={RouterLink} to={`/subevents/${s.id}`}>View Shares</Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Settlements (Remaining)</Typography>
                {event?.weekNumber && event?.year && (
                  <Button size="small" variant="outlined" component={RouterLink} to={`/settlements/${event.groupId}/weekly/${event.weekNumber}/${event.year}`}>
                    View Weekly Settlements
                  </Button>
                )}
              </Stack>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {pairwise.map((p, idx) => (
                  <Grid item xs={12} md={6} lg={4} key={`evpw-${idx}`}>
                    <Card>
                      <CardContent>
                        <Typography>{p.user1} owes {p.user2}: {formatMoney(p.amount)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                {pairwise.length === 0 && (
                  <Typography variant="body2" sx={{ ml: 1 }}>All settled for this event.</Typography>
                )}
              </Grid>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6">Add expense</Typography>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <TextField label="Total Amount" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
                <TextField label="Date" type="date" InputLabelProps={{ shrink: true }} value={subEventDate} onChange={e => setSubEventDate(e.target.value)} />
                <TextField select label="Participants" SelectProps={{ multiple: true, value: selectedMembers, onChange: e => {
                  const v = e.target.value
                  setSelectedMembers(typeof v === 'string' ? v.split(',').map(Number) : v as number[])
                }}}>
                  {members.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </TextField>
                <TextField select label="Split Type" value={equalSplit ? 'equal' : 'custom'} onChange={e => setEqualSplit(e.target.value === 'equal')}>
                  <MenuItem value="equal">Split equally</MenuItem>
                  <MenuItem value="custom">Custom amounts</MenuItem>
                </TextField>
                {!equalSplit && (
                  <Stack spacing={1}>
                    {selectedMembers.map(uid => (
                      <TextField key={uid} label={`Amount for ${users.find(u => u.id === uid)?.name || uid}`} value={customShares[uid] || ''} onChange={e => setCustomShares(prev => ({ ...prev, [uid]: e.target.value }))} />
                    ))}
                  </Stack>
                )}
                {splitMismatch && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    Total amount ({formatMoney(totalNum)}) does not match sum of split amounts ({formatMoney(customSum)}). Please adjust the splits before creating the event.
                  </Alert>
                )}
                <Button variant="contained" onClick={createSubevent} disabled={!description || !totalAmount || !subEventDate || !payerId || selectedMembers.length === 0 || (!equalSplit && splitMismatch)}>Create</Button>
              </Stack>
            </Box>
          </Box>
        )}
      </Container>
    </>
  )
}
