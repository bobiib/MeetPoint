export interface Group {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface GroupInput {
  name: string
  description: string
  ownerId: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function fetchGroups(ownerId: string): Promise<Group[]> {
  const response = await fetch(
    `${apiBaseUrl}/groups?owner_id=eq.${encodeURIComponent(ownerId)}&order=created_at.desc`,
  )

  if (!response.ok) {
    throw new Error('Gruppen konnten nicht geladen werden.')
  }

  return response.json()
}

export async function createGroup(input: GroupInput): Promise<Group> {
  const response = await fetch(`${apiBaseUrl}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description || null,
      owner_id: input.ownerId,
    }),
  })

  if (!response.ok) {
    throw new Error('Gruppe konnte nicht erstellt werden.')
  }

  const groups = (await response.json()) as Group[]
  if (!groups[0]) {
    throw new Error('Gruppe konnte nicht erstellt werden.')
  }

  return groups[0]
}

export async function updateGroup(groupId: string, input: Pick<GroupInput, 'name' | 'description'>) {
  const response = await fetch(`${apiBaseUrl}/groups?id=eq.${encodeURIComponent(groupId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description || null,
    }),
  })

  if (!response.ok) {
    throw new Error('Gruppe konnte nicht gespeichert werden.')
  }

  const groups = (await response.json()) as Group[]
  if (!groups[0]) {
    throw new Error('Gruppe konnte nicht gespeichert werden.')
  }

  return groups[0]
}

export async function deleteGroup(groupId: string, userId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/rpc/delete_group`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_group_id: groupId,
      p_user_id: userId,
    }),
  })

  if (!response.ok) {
    throw new Error('Gruppe konnte nicht gelöscht werden. Möglicherweise fehlen dir die Rechte.')
  }
}
