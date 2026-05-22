export interface LoginData {
  email: string
  password: string
}

export interface LoggedInUser {
  id: string
  username: string
  email: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function loginUser(data: LoginData): Promise<LoggedInUser> {
  const response = await fetch(`${apiBaseUrl}/rpc/login_user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_email: data.email,
      user_password: data.password,
    }),
  })

  if (!response.ok) {
    throw new Error('E-Mail-Adresse oder Passwort ist falsch.')
  }

  return response.json()
}

export function saveSession(user: LoggedInUser) {
  localStorage.setItem('meetpoint_user', JSON.stringify(user))
}

export function loadSession(): LoggedInUser | null {
  const savedUser = localStorage.getItem('meetpoint_user')

  if (!savedUser) {
    return null
  }

  return JSON.parse(savedUser) as LoggedInUser
}

export function logoutUser() {
  localStorage.removeItem('meetpoint_user')
}
