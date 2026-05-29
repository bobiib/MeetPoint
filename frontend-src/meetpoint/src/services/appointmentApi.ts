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
