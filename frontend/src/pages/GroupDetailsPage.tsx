import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Card, CardContent, Chip, Container, Grid, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import AppHeader from '@components/AppHeader'
import ErrorAlert from '@components/ErrorAlert'
import { EventsApi, GroupsApi, UsersApi } from '@api/index'
import type { EventResponse, GroupResponse, UserResponse, WeekSummary } from '@api/types'
import { useAuth } from '@context/AuthContext'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import DeleteIcon from '@mui/icons-material/Delete'

export default function GroupDetailsPage() {
  const { user } = useAuth()
  const { groupId } = useParams()
  const gid = Number(groupId)
  const [group, setGroup] = useState<GroupResponse | null>(null)
  const [events, setEvents] = useState<EventResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [error, setError] = useState<any>(null)
  const [newEventName, setNewEventName] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newMemberId, setNewMemberId] = useState<number | ''>('')
  const [groupCode, setGroupCode] = useState<string>('')
  const [joinRequests, setJoinRequests] = useState<{ id: number; requesterId: number; status: string }[]>([])
  const [weeks, setWeeks] = useState<WeekSummary[]>([])
  const [selectedWeek, setSelectedWeek] = useState<number | ''>('')
  const [selectedYear, setSelectedYear] = useState<number | ''>('')
  const [eventsByWeek, setEventsByWeek] = useState<EventResponse[]>([])
  const nav = useNavigate()

  const refresh = () => {
    GroupsApi.get(gid).then(g => {
      setGroup(g)
      if (user && user.id === g.creatorId) {
        GroupsApi.listJoinRequests(gid).then(setJoinRequests).catch(() => { })
      }
    }).catch(setError)
    EventsApi.listByGroup(gid).then(setEvents).catch(setError)
    UsersApi.list().then(setUsers).catch(setError)
    GroupsApi.getCode(gid).then((r: any) => setGroupCode(r.groupCode)).catch(() => setGroupCode(''))
    EventsApi.listWeeks(gid).then((ws: WeekSummary[]) => {
      setWeeks(ws)
      if (ws.length > 0) {
        const w0 = ws[0]
        setSelectedWeek(w0.weekNumber)
        setSelectedYear(w0.year)
        EventsApi.listByWeek(gid, w0.weekNumber, w0.year).then(setEventsByWeek).catch(() => setEventsByWeek([]))
      } else {
        setSelectedWeek('')
        setSelectedYear('')
        setEventsByWeek([])
      }
    }).catch(() => setWeeks([]))
  }

  useEffect(() => { refresh() }, [gid])

  const addMember = async () => {
    if (!newMemberId) return
    try {
      await GroupsApi.invite(gid, newMemberId as number)
      setNewMemberId('')
      // Optional: show success message
    } catch (e) { setError(e) }
  }

  const removeMember = async (uid: number) => {
    await GroupsApi.removeMember(gid, uid)
    refresh()
  }

  const createEvent = async () => {
    if (!user) return
    const dateStr = newEventDate || new Date().toISOString().slice(0, 10)
    try {
      const warn: any = await GroupsApi.newEventWarning(gid, dateStr)
      if (warn?.warn && warn.pendingPayments > 0) {
        const proceed = window.confirm(warn.message || 'Creating this event will hide the oldest page which has pending payments. Proceed?')
        if (!proceed) return
      }
    } catch {}
    await EventsApi.create({ groupId: gid, name: newEventName, creatorId: user.id, eventDate: dateStr })
    setNewEventName('')
    setNewEventDate('')
    refresh()
  }

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(groupCode) } catch { }
  }

  // Regenerate removed: group code is immutable

  const approveJoin = async (requestId: number) => {
    try { await GroupsApi.approveJoin(gid, requestId); refresh() } catch { }
  }

  const rejectJoin = async (requestId: number) => {
    try { await GroupsApi.rejectJoin(gid, requestId); refresh() } catch { }
  }

  const onChangeWeek = async (weekNumber: number, year: number) => {
    if (!weekNumber || !year) return
    setSelectedWeek(weekNumber)
    setSelectedYear(year)
    try {
      const list = await EventsApi.listByWeek(gid, weekNumber, year)
      setEventsByWeek(list)
    } catch { setEventsByWeek([]) }
  }

  const members = useMemo(() => users.filter(u => (group?.memberIds || []).includes(u.id || -1)), [users, group?.memberIds])

  return (
    <>
      <AppHeader />
      <Container sx={{ mt: 3 }}>
        <ErrorAlert error={error} />
        {group && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>{group.name}</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {groupCode && <Chip label={`Code: ${groupCode}`} />}
                {groupCode && <Button size="small" onClick={copyCode}>Copy</Button>}
              </Stack>
            </Box>
            {user && user.id === group.creatorId && joinRequests.length > 0 && (
              <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip color="warning" label={`Pending Join Requests: ${joinRequests.length}`} />
              </Stack>
            )}
            <Typography variant="subtitle1">Members</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              {members.map(m => (
                <Chip key={m.id} label={m.name} onDelete={() => removeMember(m.id)} />
              ))}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
              <TextField label="Add by User ID" value={newMemberId} onChange={e => setNewMemberId(e.target.value ? Number(e.target.value) : '')} sx={{ minWidth: 220 }} />
              {typeof newMemberId === 'number' && !!newMemberId && (
                <Chip color="info" label={`User: ${users.find(u => u.id === newMemberId)?.name || 'Unknown'}`} />
              )}
              <Button variant="outlined" onClick={addMember} disabled={!newMemberId}>Invite</Button>
              <Button variant="contained" component={RouterLink} to={`/settlements/${group.id}`}>View Settlements</Button>
            </Stack>

            <Typography variant="h6">Events</Typography>
            <Grid container spacing={2}>
              {events.map(e => (
                <Grid item xs={12} md={6} lg={4} key={e.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1">{e.name}</Typography>
                    </CardContent>
                    <Button component={RouterLink} to={`/events/${e.id}`}>Open</Button>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6">Pages</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1, alignItems: 'center' }}>
                <TextField select label="Select Page" value={weeks.findIndex(w => w.weekNumber === selectedWeek && w.year === selectedYear)} onChange={e => {
                  const idx = Number(e.target.value)
                  const w = weeks[idx]
                  if (w) onChangeWeek(w.weekNumber, w.year)
                }} sx={{ minWidth: 200 }}>
                  {weeks.map((w, idx) => (
                    <MenuItem key={`${w.weekNumber}-${w.year}`} value={idx}>Page {idx + 1} ({w.eventCount})</MenuItem>
                  ))}
                </TextField>
                {selectedWeek && selectedYear && (
                  <Button variant="contained" component={RouterLink} to={`/settlements/${group.id}/weekly/${selectedWeek}/${selectedYear}`}>View Settlements</Button>
                )}
              </Stack>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {eventsByWeek.map(e => (
                  <Grid item xs={12} md={6} lg={4} key={`w-${e.id}`}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1">{e.name}</Typography>
                        {e.eventDate && <Typography variant="body2">Date: {new Date(e.eventDate).toLocaleDateString()}</Typography>}
                      </CardContent>
                      <Button component={RouterLink} to={`/events/${e.id}`}>Open</Button>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {user && user.id === group.creatorId && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6">Join Requests</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {joinRequests.map(j => (
                    <Grid item xs={12} md={6} lg={4} key={j.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle1">Requester: {users.find(u => u.id === j.requesterId)?.name || j.requesterId}</Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Button size="small" variant="contained" onClick={() => approveJoin(j.id)}>Approve</Button>
                            <Button size="small" variant="outlined" color="error" onClick={() => rejectJoin(j.id)}>Reject</Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  {joinRequests.length === 0 && <Typography variant="body2">No pending requests.</Typography>}
                </Grid>
              </Box>
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <TextField label="New event name" value={newEventName} onChange={e => setNewEventName(e.target.value)} />
              <Button variant="contained" onClick={createEvent} disabled={!newEventName}>Create</Button>
            </Stack>
          </Box>
        )}
      </Container>
    </>
  )
}
