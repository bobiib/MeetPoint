export interface ActivityInterest {
  activity_id: string
  interest_id: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function fetchActivityInterests(activityId: string): Promise<ActivityInterest[]> {
  const response = await fetch(
    `${apiBaseUrl}/activity_interests?activity_id=eq.${encodeURIComponent(activityId)}`,
  )

  if (!response.ok) {
    throw new Error('Interessen der Aktivitaet konnten nicht geladen werden.')
  }

  return response.json()
}

export async function fetchActivityInterestsForActivities(activityIds: string[]): Promise<ActivityInterest[]> {
  if (activityIds.length === 0) return []
  const ids = activityIds.map((id) => encodeURIComponent(id)).join(',')
  const response = await fetch(`${apiBaseUrl}/activity_interests?activity_id=in.(${ids})`)

  if (!response.ok) {
    throw new Error('Interessen der Aktivitaeten konnten nicht geladen werden.')
  }

  return response.json()
}

export async function linkInterestsToActivity(activityId: string, interestIds: string[]) {
  // First delete existing links
  await fetch(`${apiBaseUrl}/activity_interests?activity_id=eq.${encodeURIComponent(activityId)}`, {
    method: 'DELETE',
  })

  // Then insert new ones
  if (interestIds.length > 0) {
    const response = await fetch(`${apiBaseUrl}/activity_interests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(
        interestIds.map((id) => ({
          activity_id: activityId,
          interest_id: id,
        }))
      ),
    })

    if (!response.ok) {
      throw new Error('Interessen konnten nicht verknuepft werden.')
    }
  }
}
