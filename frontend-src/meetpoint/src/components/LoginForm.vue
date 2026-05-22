<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { loginUser, saveSession, type LoggedInUser } from '../services/authApi'

const emit = defineEmits<{
  loginSuccess: [user: LoggedInUser]
}>()

const form = reactive({
  email: '',
  password: '',
})

const wasSubmitted = ref(false)
const isLoggingIn = ref(false)
const errorMessage = ref('')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validationErrors = computed(() => {
  const errors: Partial<Record<keyof typeof form, string>> = {}

  if (!form.email.trim()) {
    errors.email = 'E-Mail-Adresse ist erforderlich.'
  } else if (!emailPattern.test(form.email)) {
    errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein.'
  }

  if (!form.password) {
    errors.password = 'Passwort ist erforderlich.'
  }

  return errors
})

const canSubmit = computed(() => Object.keys(validationErrors.value).length === 0 && !isLoggingIn.value)

async function submitLogin() {
  wasSubmitted.value = true
  errorMessage.value = ''

  if (!canSubmit.value) {
    errorMessage.value = 'Bitte korrigiere die markierten Felder.'
    return
  }

  isLoggingIn.value = true

  try {
    const user = await loginUser({
      email: form.email.trim(),
      password: form.password,
    })

    saveSession(user)
    emit('loginSuccess', user)

    form.email = ''
    form.password = ''
    wasSubmitted.value = false
  } catch {
    errorMessage.value = 'Login fehlgeschlagen. Bitte prüfe E-Mail und Passwort.'
  } finally {
    isLoggingIn.value = false
  }
}
</script>

<template>
  <section class="login-panel" aria-labelledby="login-title">
    <h2 id="login-title">Anmelden</h2>

    <form class="login-form" novalidate @submit.prevent="submitLogin">
      <label>
        E-Mail-Adresse
        <input
          v-model="form.email"
          autocomplete="email"
          name="login-email"
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
          autocomplete="current-password"
          name="login-password"
          type="password"
          :aria-invalid="wasSubmitted && Boolean(validationErrors.password)"
        />
        <span v-if="wasSubmitted && validationErrors.password" class="error-text">
          {{ validationErrors.password }}
        </span>
      </label>

      <button type="submit" :disabled="isLoggingIn">
        {{ isLoggingIn ? 'Wird angemeldet...' : 'Anmelden' }}
      </button>

      <p v-if="errorMessage" class="form-message error" role="status">
        {{ errorMessage }}
      </p>
    </form>
  </section>
</template>

<style scoped>
.login-panel {
  margin-top: 36px;
}

.login-form {
  display: grid;
  gap: 18px;
  width: min(100%, 520px);
}

h2 {
  margin: 0 0 24px;
  color: #102a43;
  font-size: clamp(1.6rem, 3vw, 2.3rem);
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

.form-message.error {
  color: #7f1d1d;
  background: #fee2e2;
}
</style>
