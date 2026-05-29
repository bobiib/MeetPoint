<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { createUser } from './services/registrationApi'
import LoginForm from './components/LoginForm.vue'
import UserSession from './components/UserSession.vue'
import GroupManager from './components/GroupManager.vue'
import AppointmentProposalForm from './components/AppointmentProposalForm.vue'
import { loadSession, logoutUser, type LoggedInUser } from './services/authApi'

const loggedInUser = ref<LoggedInUser | null>(loadSession())

function handleLoginSuccess(user: LoggedInUser) {
  loggedInUser.value = user
}

function handleLogout() {
  logoutUser()
  loggedInUser.value = null
}

const form = reactive({
  username: '',
  email: '',
  password: '',
  passwordConfirmation: '',
})

const wasSubmitted = ref(false)
const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validationErrors = computed(() => {
  const errors: Partial<Record<keyof typeof form, string>> = {}

  if (!form.username.trim()) {
    errors.username = 'Benutzername ist erforderlich.'
  }

  if (!form.email.trim()) {
    errors.email = 'E-Mail-Adresse ist erforderlich.'
  } else if (!emailPattern.test(form.email)) {
    errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein.'
  }

  if (!form.password) {
    errors.password = 'Passwort ist erforderlich.'
  } else if (form.password.length < 8) {
    errors.password = 'Das Passwort muss mindestens 8 Zeichen lang sein.'
  }

  if (!form.passwordConfirmation) {
    errors.passwordConfirmation = 'Bitte bestätige dein Passwort.'
  } else if (form.password !== form.passwordConfirmation) {
    errors.passwordConfirmation = 'Die Passwörter stimmen nicht überein.'
  }

  return errors
})

const canSubmit = computed(() => Object.keys(validationErrors.value).length === 0 && !isSaving.value)

function resetForm() {
  form.username = ''
  form.email = ''
  form.password = ''
  form.passwordConfirmation = ''
  wasSubmitted.value = false
}

async function submitRegistration() {
  wasSubmitted.value = true
  message.value = ''
  messageType.value = ''

  if (!canSubmit.value) {
    message.value = 'Bitte korrigiere die markierten Felder.'
    messageType.value = 'error'
    return
  }

  isSaving.value = true

  try {
    const result = await createUser({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    })

    message.value = result.message
    messageType.value = result.success ? 'success' : 'error'

    if (result.success) {
      resetForm()
    }
  } catch {
    message.value =
      'Die API ist noch nicht erreichbar. Das Formular ist vorbereitet und kann mit der Benutzer-Tabelle verbunden werden.'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <main class="page-shell">
    <section class="intro-panel" aria-labelledby="page-title">
      <p class="eyebrow">MeetPoint · Arbeitspaket 1.1</p>
      <h1 id="page-title">Registrierung</h1>
      <p>
        Neue Benutzer können ein Konto mit Benutzername, E-Mail-Adresse und Passwort erstellen.
      </p>
    </section>

    <section class="registration-panel" aria-labelledby="registration-title">
      <h2 id="registration-title">Konto erstellen</h2>

      <form class="registration-form" novalidate @submit.prevent="submitRegistration">
        <label>
          Benutzername
          <input
            v-model="form.username"
            autocomplete="username"
            name="username"
            type="text"
            :aria-invalid="wasSubmitted && Boolean(validationErrors.username)"
          />
          <span v-if="wasSubmitted && validationErrors.username" class="error-text">
            {{ validationErrors.username }}
          </span>
        </label>

        <label>
          E-Mail-Adresse
          <input
            v-model="form.email"
            autocomplete="email"
            name="email"
            type="email"
            :aria-invalid="wasSubmitted && Boolean(validationErrors.email)"
          />
          <span v-if="wasSubmitted && validationErrors.email" class="error-text">
            {{ validationErrors.email }}
          </span>
        </label>

        <label>
          Passwort
          <input
            v-model="form.password"
            autocomplete="new-password"
            name="password"
            type="password"
            :aria-invalid="wasSubmitted && Boolean(validationErrors.password)"
          />
          <span v-if="wasSubmitted && validationErrors.password" class="error-text">
            {{ validationErrors.password }}
          </span>
        </label>

        <label>
          Passwort bestätigen
          <input
            v-model="form.passwordConfirmation"
            autocomplete="new-password"
            name="passwordConfirmation"
            type="password"
            :aria-invalid="wasSubmitted && Boolean(validationErrors.passwordConfirmation)"
          />
          <span v-if="wasSubmitted && validationErrors.passwordConfirmation" class="error-text">
            {{ validationErrors.passwordConfirmation }}
          </span>
        </label>

        <button type="submit" :disabled="isSaving">
          {{ isSaving ? 'Wird gespeichert...' : 'Registrieren' }}
        </button>

        <p v-if="message" class="form-message" :class="messageType" role="status">
          {{ message }}
        </p>
      </form>

      <UserSession v-if="loggedInUser" :user="loggedInUser" @logout="handleLogout" />
      <LoginForm v-else @login-success="handleLoginSuccess" />

      <template v-if="loggedInUser">
        <GroupManager :user="loggedInUser" />
        <AppointmentProposalForm :user="loggedInUser" />
      </template>
    </section>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  color: #172033;
  background: #f3f7f4;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

button,
input {
  font: inherit;
}

.page-shell {
  display: grid;
  grid-template-columns: minmax(280px, 0.8fr) minmax(320px, 1fr);
  min-height: 100vh;
}

.intro-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(32px, 7vw, 88px);
  color: #ffffff;
  background:
    linear-gradient(135deg, rgba(10, 75, 92, 0.95), rgba(23, 120, 94, 0.92)),
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.28), transparent 28%);
}

.eyebrow {
  margin: 0 0 12px;
  color: #c7f9e5;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 18px;
  font-size: clamp(3rem, 8vw, 5.8rem);
  line-height: 0.96;
}

.intro-panel p:not(.eyebrow) {
  max-width: 520px;
  margin-bottom: 0;
  color: #e3f8ef;
  font-size: 1.1rem;
  line-height: 1.7;
}

.registration-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(28px, 5vw, 72px);
  background: #ffffff;
}

h2 {
  margin-bottom: 28px;
  color: #102a43;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
}

.registration-form {
  display: grid;
  gap: 18px;
  width: min(100%, 520px);
}

label {
  display: grid;
  gap: 8px;
  color: #263f53;
  font-size: 0.95rem;
  font-weight: 750;
}

input {
  width: 100%;
  min-height: 48px;
  border: 1px solid #bcccdc;
  border-radius: 8px;
  padding: 11px 13px;
  color: #102a43;
  background: #ffffff;
}

input:focus {
  border-color: #0f766e;
  outline: 3px solid rgba(15, 118, 110, 0.16);
}

input[aria-invalid='true'] {
  border-color: #b42318;
}

.error-text {
  color: #b42318;
  font-size: 0.84rem;
  font-weight: 700;
}

button {
  min-height: 50px;
  border: 0;
  border-radius: 8px;
  padding: 12px 18px;
  color: #ffffff;
  background: #0f766e;
  font-weight: 800;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: #115e59;
}

button:disabled {
  cursor: wait;
  opacity: 0.68;
}

.form-message {
  margin: 0;
  border-radius: 8px;
  padding: 12px 14px;
  font-weight: 700;
}

.form-message.success {
  color: #14532d;
  background: #dcfce7;
}

.form-message.error {
  color: #7f1d1d;
  background: #fee2e2;
}

@media (max-width: 820px) {
  .page-shell {
    grid-template-columns: 1fr;
  }

  .intro-panel {
    min-height: 38vh;
  }
}
</style>
