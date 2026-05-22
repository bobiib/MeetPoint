export interface RegistrationData {
  username: string
  email: string
  password: string
}

export interface RegistrationResponse {
  success: boolean
  message: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'
const registrationEndpoint = import.meta.env.VITE_REGISTRATION_ENDPOINT ?? '/users'

export async function createUser(data: RegistrationData): Promise<RegistrationResponse> {
  const response = await fetch(`${apiBaseUrl}${registrationEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      username: data.username,
      email: data.email,
      password: data.password,
    }),
  })

  if (!response.ok) {
    return {
      success: false,
      message: 'Die Registrierung konnte nicht gespeichert werden.',
    }
  }

  return {
    success: true,
    message: 'Das Benutzerkonto wurde erstellt.',
  }
}
