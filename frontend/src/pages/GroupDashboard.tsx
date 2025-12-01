import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Card, CardActions, CardContent, Chip, Container, Grid, Stack, TextField, Typography } from '@mui/material'
import AppHeader from '@components/AppHeader'
import ErrorAlert from '@components/ErrorAlert'
import { GroupsApi, UsersApi } from '@api/index'
import type { GroupResponse, UserResponse, InvitationResponse } from '@api/types'
import { useAuth } from '@context/AuthContext'
import { Link as RouterLink } from 'react-router-dom'

export default function GroupDashboard() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [error, setError] = useState<any>(null)
  const [name, setName] = useState('')
  // Members are no longer added at creation; invites will be sent by user ID after creation
  const [joinCode, setJoinCode] = useState('')
  const [myJoinRequests, setMyJoinRequests] = useState<{ id: number; groupCode: string; status: string }[]>([])
  const [myInvitations, setMyInvitations] = useState<InvitationResponse[]>([])

  const refresh = () => {
    if (!user) return
    GroupsApi.listForUser(user.id).then(setGroups).catch(setError)
    UsersApi.list().then(setUsers).catch(setError)
    UsersApi.list().then(setUsers).catch(setError)
    if (user) {
      UsersApi.joinRequests(user.id).then(setMyJoinRequests).catch(() => { })
      GroupsApi.listMyInvitations().then(setMyInvitations).catch(() => { })
    }
  }

  const onJoin = async () => {
    if (!user || !joinCode) return
    setError(null)
    try {
      await GroupsApi.submitJoinRequest({ groupCode: joinCode.trim().toUpperCase(), userId: user.id })
      setJoinCode('')
      refresh()
    } catch (e) { setError(e) }
  }

  useEffect(() => { refresh() }, [user?.id])

  const onCreate = async () => {
    if (!user) return
    setError(null)
    try {
      const payload = { name, creatorId: user.id, memberIds: [] as number[] }
      await GroupsApi.create(payload)
      setName('')
      refresh()
    } catch (e) { setError(e) }
  }
  const onRespondInvitation = async (invitationId: number, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await GroupsApi.respondToInvitation(invitationId, status)
      refresh()
    } catch (e) { setError(e) }
  }

  return (
    <>
      <AppHeader />
      <Container sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>My Groups</Typography>
        <Typography variant="h5" gutterBottom>My Groups</Typography>
        <ErrorAlert error={error} />
        {myInvitations.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" color="primary">You have been invited to join these groups:</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {myInvitations.map(i => (
                <Grid item xs={12} md={6} lg={4} key={i.id}>
                  <Card sx={{ border: '1px solid #1976d2' }}>
                    <CardContent>
                      <Typography variant="h6">{i.groupName}</Typography>
                      <Typography variant="body2">Invited by: {i.invitedByName}</Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" variant="contained" onClick={() => onRespondInvitation(i.id, 'ACCEPTED')}>Accept</Button>
                      <Button size="small" color="error" onClick={() => onRespondInvitation(i.id, 'REJECTED')}>Reject</Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        <Grid container spacing={2}>
          {groups.map(g => (
            <Grid item xs={12} md={6} lg={4} key={g.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                    <Typography variant="h6">{g.name}</Typography>
                    {g.groupCode && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={`Code: ${g.groupCode}`} size="small" />
                        <Button size="small" onClick={async () => { try { await navigator.clipboard.writeText(g.groupCode!) } catch {} }}>Copy</Button>
                      </Stack>
                    )}
                  </Box>
                  <Typography variant="body2">Members: {g.memberIds.length}</Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" component={RouterLink} to={`/groups/${g.id}`}>Open</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Create Group</Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Group Name" value={name} onChange={e => setName(e.target.value)} />
            <Typography variant="body2" color="text.secondary">
              After creating, invite members by their User ID from the group page.
            </Typography>
            <Button variant="contained" onClick={onCreate} disabled={!name}>Create</Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Join Group</Typography>
          <Stack spacing={2} sx={{ mt: 1 }} direction={{ xs: 'column', sm: 'row' }}>
            <TextField label="Group Code" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
            <Button variant="outlined" onClick={onJoin} disabled={!joinCode}>Submit Request</Button>
          </Stack>
          {myJoinRequests?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">My Pending Join Requests</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {myJoinRequests.map(r => (
                  <Grid item xs={12} md={6} lg={4} key={r.id}>
                    <Card>
                      <CardContent>
                        <Typography>Code: {r.groupCode}</Typography>
                        <Typography>Status: {r.status}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </Container>
    </>
  )
}
