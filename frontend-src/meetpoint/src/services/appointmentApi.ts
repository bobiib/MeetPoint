export interface AppointmentInput {
  activityId: string
  startsAt: string
  description: string
  createdBy: string
}

export interface Appointment {
  id: string
  activity_id: string
  starts_at: string
  description: string | null
  created_by: string | null
  created_at: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function fetchAppointments(activityId: string): Promise<Appointment[]> {
  const response = await fetch(
    `${apiBaseUrl}/appointments?activity_id=eq.${encodeURIComponent(activityId)}&order=starts_at.asc`,
  )

  if (!response.ok) {
    throw new Error('Termine konnten nicht geladen werden.')
  }

  return response.json()
}

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  const response = await fetch(`${apiBaseUrl}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      activity_id: input.activityId,
      starts_at: input.startsAt,
      description: input.description || null,
      created_by: input.createdBy,
    }),
  })

  if (!response.ok) {
    throw new Error('Terminvorschlag konnte nicht erstellt werden.')
  }

  const appointments = (await response.json()) as Appointment[]
  if (!appointments[0]) {
    throw new Error('Terminvorschlag konnte nicht erstellt werden.')
  }

  return appointments[0]
}

export async function deleteAppointment(appointmentId: string, userId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/rpc/delete_appointment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_appointment_id: appointmentId,
      p_user_id: userId,
    }),
  })

  if (!response.ok) {
    throw new Error('Terminvorschlag konnte nicht gelöscht werden. Möglicherweise fehlen dir die Rechte.')
  }
}
