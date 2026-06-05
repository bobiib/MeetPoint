export interface Interest {
  id: string
  group_id: string
  name: string
  created_by: string | null
  created_at: string
}

export interface InterestInput {
  groupId: string
  name: string
  createdBy: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function fetchInterests(groupId: string): Promise<Interest[]> {
  const response = await fetch(
    `${apiBaseUrl}/interests?group_id=eq.${encodeURIComponent(groupId)}&order=created_at.desc`,
  )

  if (!response.ok) {
    throw new Error('Interessen konnten nicht geladen werden.')
  }

  return response.json()
}

export async function createInterest(input: InterestInput): Promise<Interest> {
  const response = await fetch(`${apiBaseUrl}/interests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      group_id: input.groupId,
      name: input.name,
      created_by: input.createdBy,
    }),
  })

  if (!response.ok) {
    throw new Error('Interesse konnte nicht gespeichert werden.')
  }

  const interests = (await response.json()) as Interest[]
  if (!interests[0]) {
    throw new Error('Interesse konnte nicht gespeichert werden.')
  }

  return interests[0]
}
