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
  <form class="login-form" novalidate @submit.prevent="submitLogin">
    <h2>Willkommen zurück</h2>
    <p class="subtitle">Melde dich an, um weiterzuplanen.</p>

    <div class="input-group">
      <input
        id="login-email"
        v-model="form.email"
        autocomplete="email"
        name="login-email"
        type="email"
        placeholder=" "
        :aria-invalid="wasSubmitted && Boolean(validationErrors.email)"
      />
      <label for="login-email">E-Mail-Adresse</label>
      <span v-if="wasSubmitted && validationErrors.email" class="error-text">
        {{ validationErrors.email }}
      </span>
    </div>

    <div class="input-group">
      <input
        id="login-password"
        v-model="form.password"
        autocomplete="current-password"
        name="login-password"
        type="password"
        placeholder=" "
        :aria-invalid="wasSubmitted && Boolean(validationErrors.password)"
      />
      <label for="login-password">Passwort</label>
      <span v-if="wasSubmitted && validationErrors.password" class="error-text">
        {{ validationErrors.password }}
      </span>
    </div>

    <button class="btn-primary" type="submit" :disabled="isLoggingIn">
      {{ isLoggingIn ? 'Wird angemeldet...' : 'Anmelden' }}
    </button>

    <p v-if="errorMessage" class="form-message error" role="status">
      {{ errorMessage }}
    </p>
  </form>
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
}
h2 {
  font-size: 2rem;
  margin: 0 0 8px;
}
.subtitle {
  color: var(--text-muted);
  margin-bottom: 24px;
}
</style>
