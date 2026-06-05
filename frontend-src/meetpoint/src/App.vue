<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { createUser } from './services/registrationApi'
import LoginForm from './components/LoginForm.vue'
import UserSession from './components/UserSession.vue'
import GroupManager from './components/GroupManager.vue'
import GroupMembersManager from './components/GroupMembersManager.vue'
import AppointmentProposalForm from './components/AppointmentProposalForm.vue'
import InterestManager from './components/InterestManager.vue'
import ActivityOverview from './components/ActivityOverview.vue'
import AppointmentList from './components/AppointmentList.vue'
import { loadSession, logoutUser, type LoggedInUser } from './services/authApi'
import type { Activity } from './services/activityApi'
import type { Group } from './services/groupApi'

const loggedInUser = ref<LoggedInUser | null>(loadSession())
const selectedGroup = ref<Group | null>(null)
const selectedActivity = ref<Activity | null>(null)
const appointmentRefreshKey = ref(0)
const authMode = ref<'login' | 'register'>('login')

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

const selectedActivityLabel = computed(() => selectedActivity.value?.title ?? 'Keine Aktivität ausgewählt')
const selectedGroupId = computed(() => selectedGroup.value?.id ?? '')
const selectedGroupLabel = computed(() => selectedGroup.value?.name ?? 'Keine Gruppe ausgewählt')

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

function handleLoginSuccess(user: LoggedInUser) {
  loggedInUser.value = user
  authMode.value = 'login'
}

function handleLogout() {
  logoutUser()
  loggedInUser.value = null
  selectedGroup.value = null
  selectedActivity.value = null
}

function handleGroupSelected(group: Group) {
  selectedGroup.value = group
  selectedActivity.value = null
}

function handleActivitySelected(activity: Activity) {
  selectedActivity.value = activity
}

function handleAppointmentCreated() {
  appointmentRefreshKey.value += 1
}

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
      authMode.value = 'login'
    }
  } catch {
    message.value =
      'Die API ist noch nicht erreichbar. Sobald das Backend läuft, kann das Konto gespeichert werden.'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <main v-if="!loggedInUser" class="auth-shell">
    <section class="auth-hero" aria-labelledby="page-title">
      <div class="hero-content">
        <p class="eyebrow">MeetPoint</p>
        <h1 id="page-title">Treffen planen, ohne Chat-Chaos.</h1>
        <p>
          Gruppen erstellen, Interessen sammeln, Aktivitäten auswählen und passende Termine
          gemeinsam abstimmen.
        </p>

        <dl class="hero-metrics">
          <div>
            <dt>Status</dt>
            <dd>Testbereit</dd>
          </div>
          <div>
            <dt>Backend</dt>
            <dd>PostgREST</dd>
          </div>
          <div>
            <dt>Daten</dt>
            <dd>PostgreSQL</dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="auth-panel" aria-label="Zugang">
      <div class="auth-card">
        <div class="segmented-control" role="tablist" aria-label="Zugang auswählen">
          <button
            type="button"
            :class="{ active: authMode === 'login' }"
            @click="authMode = 'login'"
          >
            Anmelden
          </button>
          <button
            type="button"
            :class="{ active: authMode === 'register' }"
            @click="authMode = 'register'"
          >
            Registrieren
          </button>
        </div>

        <LoginForm v-if="authMode === 'login'" @login-success="handleLoginSuccess" />

        <form v-else class="registration-form" novalidate @submit.prevent="submitRegistration">
          <div class="form-heading">
            <p>Neues Konto</p>
            <h2>Konto erstellen</h2>
          </div>

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
      </div>
    </section>
  </main>

  <main v-else class="dashboard-shell">
    <aside class="dashboard-sidebar">
      <div class="brand-block">
        <p class="eyebrow">MeetPoint</p>
        <h1>Planungszentrale</h1>
      </div>

      <UserSession :user="loggedInUser" @logout="handleLogout" />

      <div class="context-card">
        <p>Ablauf</p>
        <ol>
          <li :class="{ done: selectedGroupId }">Gruppe auswählen</li>
          <li :class="{ done: selectedActivity }">Aktivität auswählen</li>
          <li>Termin vorschlagen</li>
          <li>Verfügbarkeit eintragen</li>
        </ol>
      </div>

      <div class="context-card">
        <p>Aktuelle Auswahl</p>
        <dl>
          <div>
            <dt>Gruppe</dt>
            <dd>{{ selectedGroupLabel }}</dd>
          </div>
          <div>
            <dt>Aktivität</dt>
            <dd>{{ selectedActivityLabel }}</dd>
          </div>
        </dl>
      </div>
    </aside>

    <section class="dashboard-content" aria-label="MeetPoint Dashboard">
      <header class="dashboard-header">
        <div>
          <p class="eyebrow">Dashboard</p>
          <h2>Gruppen, Aktivitäten und Termine</h2>
        </div>
        <p>
          Wähle zuerst eine Gruppe, danach eine Aktivität. Dann kannst du Termine erstellen
          und Verfügbarkeiten setzen.
        </p>
      </header>

      <div class="dashboard-grid">
        <section class="dashboard-column">
          <GroupManager :user="loggedInUser" @group-selected="handleGroupSelected" />
          <GroupMembersManager v-if="selectedGroupId" :group-id="selectedGroupId" />
          <InterestManager v-if="selectedGroupId" :group-id="selectedGroupId" :user="loggedInUser" />
        </section>

        <section class="dashboard-column">
          <ActivityOverview
            v-if="selectedGroupId"
            :group-id="selectedGroupId"
            @activity-selected="handleActivitySelected"
          />
          <div v-else class="empty-dashboard-card">
            <h3>Keine Gruppe ausgewählt</h3>
            <p>Wähle eine Gruppe aus, damit Aktivitäten und Termine angezeigt werden.</p>
          </div>

          <AppointmentProposalForm
            :activity="selectedActivity"
            :user="loggedInUser"
            @appointment-created="handleAppointmentCreated"
          />
          <AppointmentList
            :key="`${selectedActivity?.id ?? 'none'}-${appointmentRefreshKey}`"
            :activity="selectedActivity"
            :user="loggedInUser"
          />
        </section>
      </div>
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
  color: #182230;
  background: #eef3f1;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

button,
input {
  font: inherit;
}

.auth-shell {
  display: grid;
  grid-template-columns: minmax(360px, 0.95fr) minmax(360px, 1fr);
  min-height: 100vh;
}

.auth-hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  padding: clamp(32px, 7vw, 96px);
  color: #ffffff;
  background:
    linear-gradient(rgba(8, 47, 73, 0.78), rgba(20, 83, 45, 0.72)),
    url('https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1800&q=80')
      center / cover;
}

.hero-content {
  max-width: 700px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #0f766e;
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
  font-size: clamp(3rem, 7vw, 5.8rem);
  line-height: 0.96;
}

.auth-hero .eyebrow {
  color: #c7f9e5;
}

.auth-hero p:not(.eyebrow) {
  max-width: 520px;
  margin-bottom: 0;
  color: #e3f8ef;
  font-size: 1.1rem;
  line-height: 1.7;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  max-width: 560px;
  margin: 42px 0 0;
}

.hero-metrics div {
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
}

.hero-metrics dt {
  color: #bbf7d0;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
}

.hero-metrics dd {
  margin: 4px 0 0;
  color: #ffffff;
  font-weight: 800;
}

.auth-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(28px, 5vw, 72px);
}

.auth-card {
  width: min(100%, 560px);
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  padding: 22px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.13);
}

.segmented-control {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 26px;
  border-radius: 8px;
  padding: 6px;
  background: #eef3f1;
}

.segmented-control button {
  min-height: 42px;
  color: #486581;
  background: transparent;
}

.segmented-control button.active {
  color: #ffffff;
  background: #0f766e;
}

.form-heading p,
.form-heading h2 {
  margin: 0;
}

.form-heading p {
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

h2 {
  margin-bottom: 28px;
  color: #102a43;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
}

.registration-form {
  display: grid;
  gap: 18px;
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

.dashboard-shell {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  min-height: 100vh;
}

.dashboard-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: 100vh;
  padding: 28px;
  overflow-y: auto;
  color: #ffffff;
  background: #0b3b3a;
}

.brand-block h1 {
  margin: 0;
  color: #ffffff;
  font-size: 2.1rem;
  line-height: 1.05;
}

.brand-block .eyebrow {
  color: #a7f3d0;
}

.context-card {
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.08);
}

.context-card p {
  margin: 0 0 12px;
  color: #a7f3d0;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.context-card ol {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 20px;
}

.context-card li {
  color: #d1fae5;
}

.context-card li.done {
  color: #ffffff;
  font-weight: 800;
}

.context-card dl {
  display: grid;
  gap: 12px;
  margin: 0;
}

.context-card div {
  display: grid;
  gap: 4px;
}

.context-card dt {
  color: #a7f3d0;
  font-size: 0.78rem;
  font-weight: 800;
}

.context-card dd {
  margin: 0;
  color: #ffffff;
  font-weight: 800;
}

.dashboard-content {
  padding: clamp(24px, 4vw, 48px);
}

.dashboard-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.dashboard-header h2 {
  margin: 0;
  color: #102a43;
}

.dashboard-header p:last-child {
  max-width: 520px;
  margin: 0;
  color: #486581;
  line-height: 1.6;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(360px, 1.1fr);
  gap: 22px;
  align-items: start;
}

.dashboard-column {
  display: grid;
  gap: 18px;
}

.empty-dashboard-card {
  border: 1px dashed #bcccdc;
  border-radius: 8px;
  padding: 22px;
  background: #ffffff;
}

.empty-dashboard-card h3,
.empty-dashboard-card p {
  margin: 0;
}

.empty-dashboard-card h3 {
  margin-bottom: 8px;
  color: #102a43;
}

.empty-dashboard-card p {
  color: #627d98;
  line-height: 1.6;
}

:deep(.login-panel) {
  margin-top: 0;
}

:deep(.login-form) {
  width: 100%;
}

:deep(.session-panel) {
  width: 100%;
  margin-top: 0;
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
}

:deep(.session-panel .label),
:deep(.session-panel .email) {
  color: #bbf7d0;
}

:deep(.session-panel .username) {
  color: #ffffff;
}

:deep(.workspace-section),
:deep(.members-section) {
  width: 100%;
  margin-top: 0;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  padding: 20px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.07);
}

:deep(.section-heading) {
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 12px;
}

@media (max-width: 1100px) {
  .dashboard-shell,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-sidebar {
    position: static;
    height: auto;
  }
}

@media (max-width: 820px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .auth-hero {
    min-height: 42vh;
  }

  .hero-metrics {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
