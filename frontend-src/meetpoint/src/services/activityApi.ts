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

export async function createActivity(activity: {
  groupId: string
  title: string
  description?: string
  createdBy: string
}): Promise<Activity> {
  const response = await fetch(`${apiBaseUrl}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      group_id: activity.groupId,
      title: activity.title,
      description: activity.description || null,
      created_by: activity.createdBy,
    }),
  })

  if (!response.ok) {
    throw new Error('Aktivitaet konnte nicht gespeichert werden.')
  }

  const data = await response.json()
  return data[0] || data
}

export async function deleteActivity(activityId: string, userId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/rpc/delete_activity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_activity_id: activityId,
      p_user_id: userId,
    }),
  })

  if (!response.ok) {
    throw new Error('Aktivität konnte nicht gelöscht werden. Möglicherweise fehlen dir die Rechte.')
  }
}
