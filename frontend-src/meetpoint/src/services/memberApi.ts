export interface GroupMember {
  group_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

export interface UserSearchResult {
  id: string
  username: string
  email: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  const response = await fetch(
    `${apiBaseUrl}/group_members?group_id=eq.${encodeURIComponent(groupId)}`,
  )

  if (!response.ok) {
    throw new Error('Mitglieder konnten nicht geladen werden.')
  }

  return response.json()
}

export async function findUserByEmail(email: string): Promise<UserSearchResult | null> {
  const response = await fetch(
    `${apiBaseUrl}/users?email=eq.${encodeURIComponent(email.trim().toLowerCase())}`,
  )

  if (!response.ok) {
    throw new Error('Benutzer konnte nicht gesucht werden.')
  }

  const users = (await response.json()) as UserSearchResult[]
  return users[0] ?? null
}

export async function addGroupMember(groupId: string, userId: string): Promise<GroupMember> {
  const response = await fetch(`${apiBaseUrl}/group_members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    }),
  })

  if (!response.ok) {
    throw new Error('Mitglied konnte nicht hinzugefuegt werden.')
  }

  const members = (await response.json()) as GroupMember[]

  if (!members[0]) {
    throw new Error('Mitglied konnte nicht hinzugefuegt werden.')
  }

  return members[0]
}

export async function removeGroupMember(groupId: string, userId: string) {
  const response = await fetch(
    `${apiBaseUrl}/group_members?group_id=eq.${encodeURIComponent(groupId)}&user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    throw new Error('Mitglied konnte nicht entfernt werden.')
  }
}
