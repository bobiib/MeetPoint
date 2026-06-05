export interface Availability {
  appointment_id: string
  user_id: string
  is_available: boolean
  created_at: string
  updated_at: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function fetchAvailability(userId: string): Promise<Availability[]> {
  const response = await fetch(
    `${apiBaseUrl}/availabilities?user_id=eq.${encodeURIComponent(userId)}`,
  )

  if (!response.ok) {
    throw new Error('Verfuegbarkeiten konnten nicht geladen werden.')
  }

  return response.json()
}

export async function setAvailability(
  appointmentId: string,
  userId: string,
  isAvailable: boolean,
): Promise<Availability> {
  const response = await fetch(`${apiBaseUrl}/availabilities?on_conflict=appointment_id,user_id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify({
      appointment_id: appointmentId,
      user_id: userId,
      is_available: isAvailable,
    }),
  })

  if (!response.ok) {
    throw new Error('Verfuegbarkeit konnte nicht gespeichert werden.')
  }

  const availabilities = (await response.json()) as Availability[]
  if (!availabilities[0]) {
    throw new Error('Verfuegbarkeit konnte nicht gespeichert werden.')
  }

  return availabilities[0]
}
