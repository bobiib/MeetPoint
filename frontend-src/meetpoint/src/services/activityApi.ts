export interface Activity {
  id: string
  group_id: string
  title: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function fetchActivities(groupId: string): Promise<Activity[]> {
  const response = await fetch(
    `${apiBaseUrl}/activities?group_id=eq.${encodeURIComponent(groupId)}&order=created_at.desc`,
  )

  if (!response.ok) {
    throw new Error('Aktivitaeten konnten nicht geladen werden.')
  }

  return response.json()
}
