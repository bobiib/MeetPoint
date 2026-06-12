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
    <div class="auth-overlay"></div>
    <div class="auth-container">
      <section class="auth-hero" aria-labelledby="page-title">
        <div class="brand-logo">
          <div class="logo-circle"></div>
          <span>MeetPoint</span>
        </div>
        <h1 id="page-title">Treffen planen,<br>ohne Chat-Chaos.</h1>
        <p>Gruppen erstellen, Interessen sammeln, Aktivitäten auswählen und passende Termine gemeinsam abstimmen.</p>
      </section>

      <section class="auth-panel">
        <div class="auth-card">
          <div class="glass-tabs">
            <button
              type="button"
              :class="{ active: authMode === 'login' }"
              @click="authMode = 'login'"
            >
              Login
            </button>
            <button
              type="button"
              :class="{ active: authMode === 'register' }"
              @click="authMode = 'register'"
            >
              Registrieren
            </button>
          </div>

          <div class="auth-form-container">
            <LoginForm v-if="authMode === 'login'" @login-success="handleLoginSuccess" />

            <form v-else class="registration-form" novalidate @submit.prevent="submitRegistration">
              <h2>Konto erstellen</h2>
              <p class="subtitle">Werde Teil der MeetPoint Community.</p>

              <div class="input-group">
                <input
                  id="reg-username"
                  v-model="form.username"
                  autocomplete="username"
                  name="username"
                  type="text"
                  placeholder=" "
                  :aria-invalid="wasSubmitted && Boolean(validationErrors.username)"
                />
                <label for="reg-username">Benutzername</label>
                <span v-if="wasSubmitted && validationErrors.username" class="error-text">
                  {{ validationErrors.username }}
                </span>
              </div>

              <div class="input-group">
                <input
                  id="reg-email"
                  v-model="form.email"
                  autocomplete="email"
                  name="email"
                  type="email"
                  placeholder=" "
                  :aria-invalid="wasSubmitted && Boolean(validationErrors.email)"
                />
                <label for="reg-email">E-Mail-Adresse</label>
                <span v-if="wasSubmitted && validationErrors.email" class="error-text">
                  {{ validationErrors.email }}
                </span>
              </div>

              <div class="input-group">
                <input
                  id="reg-password"
                  v-model="form.password"
                  autocomplete="new-password"
                  name="password"
                  type="password"
                  placeholder=" "
                  :aria-invalid="wasSubmitted && Boolean(validationErrors.password)"
                />
                <label for="reg-password">Passwort</label>
                <span v-if="wasSubmitted && validationErrors.password" class="error-text">
                  {{ validationErrors.password }}
                </span>
              </div>

              <div class="input-group">
                <input
                  id="reg-password-confirm"
                  v-model="form.passwordConfirmation"
                  autocomplete="new-password"
                  name="passwordConfirmation"
                  type="password"
                  placeholder=" "
                  :aria-invalid="wasSubmitted && Boolean(validationErrors.passwordConfirmation)"
                />
                <label for="reg-password-confirm">Passwort bestätigen</label>
                <span v-if="wasSubmitted && validationErrors.passwordConfirmation" class="error-text">
                  {{ validationErrors.passwordConfirmation }}
                </span>
              </div>

              <button class="btn-primary" type="submit" :disabled="isSaving">
                {{ isSaving ? 'Wird gespeichert...' : 'Registrieren' }}
              </button>

              <p v-if="message" class="form-message" :class="messageType" role="status">
                {{ message }}
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  </main>

  <main v-else class="dashboard-shell">
    <aside class="dashboard-sidebar">
      <div class="brand-logo">
        <div class="logo-circle"></div>
        <span>MeetPoint</span>
      </div>

      <UserSession :user="loggedInUser" @logout="handleLogout" />

      <div class="nav-context">
        <h3>Planungs-Ablauf</h3>
        <ul class="step-list">
          <li :class="{ active: !selectedGroupId, completed: selectedGroupId }">
            <span class="step-icon">1</span> Gruppe wählen
          </li>
          <li :class="{ active: selectedGroupId && !selectedActivity, completed: selectedActivity }">
            <span class="step-icon">2</span> Aktivität wählen
          </li>
          <li :class="{ active: selectedGroupId && selectedActivity }">
            <span class="step-icon">3</span> Termin finden
          </li>
        </ul>
      </div>

      <div class="nav-context selection-card">
        <h3>Aktuelle Auswahl</h3>
        <div class="selection-item">
          <span>Gruppe</span>
          <strong>{{ selectedGroupLabel }}</strong>
        </div>
        <div class="selection-item">
          <span>Aktivität</span>
          <strong>{{ selectedActivityLabel }}</strong>
        </div>
      </div>
    </aside>

    <div class="dashboard-main">
      <header class="dashboard-header">
        <h1>Übersicht</h1>
        <p>Erstelle Gruppen, sammle Aktivitäten und plane gemeinsame Termine.</p>
      </header>

      <div class="dashboard-content">
        <!-- Spalte 1: Gruppen & Mitglieder -->
        <div class="content-col">
          <GroupManager :user="loggedInUser" @group-selected="handleGroupSelected" />
          <Transition name="fade-slide">
            <GroupMembersManager v-if="selectedGroupId" :group-id="selectedGroupId" />
          </Transition>
          <Transition name="fade-slide">
            <InterestManager v-if="selectedGroup" :group="selectedGroup" :user="loggedInUser" />
          </Transition>
        </div>

        <!-- Spalte 2: Aktivitäten & Termine -->
        <div class="content-col">
          <Transition name="fade-slide" mode="out-in">
            <ActivityOverview
              v-if="selectedGroup"
              :key="selectedGroup.id"
              :group="selectedGroup"
              :user="loggedInUser"
              @activity-selected="handleActivitySelected"
            />
            <div v-else class="glass-panel empty-state">
              <div class="icon-placeholder">🌍</div>
              <h3>Keine Gruppe ausgewählt</h3>
              <p>Bitte wähle links eine Gruppe aus oder erstelle eine neue, um Aktivitäten zu sehen.</p>
            </div>
          </Transition>

          <Transition name="fade-slide">
            <div v-if="selectedActivity && selectedGroup" class="appointment-section">
              <AppointmentProposalForm
                :activity="selectedActivity"
                :user="loggedInUser"
                @appointment-created="handleAppointmentCreated"
              />
              <AppointmentList
                :key="`${selectedActivity.id}-${appointmentRefreshKey}`"
                :activity="selectedActivity"
                :group="selectedGroup"
                :user="loggedInUser"
              />
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* --- GLOBALS (DARK THEME) --- */
:global(:root) {
  --bg-main: #0B1120;
  --bg-panel: rgba(30, 41, 59, 0.4);
  --bg-panel-solid: #1e293b;
  --bg-input: rgba(15, 23, 42, 0.6);
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --accent: #10b981;
  --accent-hover: #059669;
  --border: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(16, 185, 129, 0.5);
  --shadow-glow: 0 0 20px rgba(16, 185, 129, 0.15);
  --radius: 12px;
}

:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  background-color: var(--bg-main);
  background-image: 
    radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.1) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.1) 0px, transparent 50%);
  color: var(--text-main);
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

:global(h1), :global(h2), :global(h3), :global(h4) {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
}

/* --- COMMON COMPONENTS --- */
:global(.btn-primary) {
  width: 100%;
  padding: 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}
:global(.btn-primary:hover:not(:disabled)) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}
:global(.btn-primary:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

:global(.glass-panel) {
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
}

/* INPUT FLOATING LABELS */
:global(.input-group) {
  position: relative;
  margin-bottom: 20px;
}
:global(.input-group input), :global(.input-group textarea) {
  width: 100%;
  padding: 16px 16px 8px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-main);
  font-size: 1rem;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
}
:global(.input-group input:focus), :global(.input-group textarea:focus) {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--border-focus);
}
:global(.input-group input[aria-invalid="true"]), :global(.input-group textarea[aria-invalid="true"]) {
  border-color: #ef4444;
}
:global(.input-group label) {
  position: absolute;
  left: 16px;
  top: 14px;
  color: var(--text-muted);
  font-size: 1rem;
  pointer-events: none;
  transition: all 0.2s ease-out;
}
:global(.input-group input:focus ~ label),
:global(.input-group input:not(:placeholder-shown) ~ label),
:global(.input-group textarea:focus ~ label),
:global(.input-group textarea:not(:placeholder-shown) ~ label) {
  top: 4px;
  font-size: 0.75rem;
  color: var(--accent);
}
:global(.error-text) {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 4px;
  display: block;
}

/* --- AUTH SHELL --- */
.auth-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.auth-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80') center/cover;
  opacity: 0.15;
  z-index: 0;
}
.auth-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  width: 100%;
  max-width: 1100px;
  padding: 40px;
  z-index: 1;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 2rem;
}
.logo-circle {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--accent), #3b82f6);
  border-radius: 50%;
  box-shadow: var(--shadow-glow);
}
.brand-logo span {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: -0.5px;
}

.auth-hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.auth-hero h1 {
  font-size: 4rem;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.auth-hero p {
  font-size: 1.2rem;
  color: var(--text-muted);
  max-width: 400px;
  line-height: 1.6;
}

.auth-panel {
  display: flex;
  justify-content: center;
  align-items: center;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.glass-tabs {
  display: flex;
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  padding: 6px;
  margin-bottom: 32px;
}
.glass-tabs button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px;
  color: var(--text-muted);
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.glass-tabs button.active {
  background: var(--bg-panel-solid);
  color: var(--text-main);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.auth-form-container h2 {
  font-size: 2rem;
  margin: 0 0 8px;
}
.subtitle {
  color: var(--text-muted);
  margin-bottom: 24px;
}
.form-message {
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  font-weight: 500;
  text-align: center;
}
.form-message.error { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
.form-message.success { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); }

/* --- DASHBOARD SHELL --- */
.dashboard-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.dashboard-sidebar {
  width: 300px;
  background: rgba(15, 23, 42, 0.8);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
  overflow-y: auto;
}

.nav-context {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}
.nav-context h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin: 0 0 16px;
}

.step-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.step-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s;
}
.step-icon {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--bg-input);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem;
}
.step-list li.active {
  color: var(--text-main);
}
.step-list li.active .step-icon {
  background: var(--accent);
  color: #fff;
  box-shadow: var(--shadow-glow);
}
.step-list li.completed {
  color: var(--accent);
}
.step-list li.completed .step-icon {
  background: rgba(16, 185, 129, 0.2);
  color: var(--accent);
}

.selection-item {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
}
.selection-item span {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.selection-item strong {
  color: var(--text-main);
  font-size: 1rem;
}

.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 40px;
}

.dashboard-header {
  margin-bottom: 40px;
}
.dashboard-header h1 {
  font-size: 2.5rem;
  margin: 0 0 8px;
}
.dashboard-header p {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin: 0;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
}

.content-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(15px) scale(0.98);
}

.empty-state {
  text-align: center;
  padding: 40px 24px !important;
}
.icon-placeholder {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}
.empty-state h3 {
  margin: 0 0 8px;
}
.empty-state p {
  color: var(--text-muted);
  margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .auth-container {
    grid-template-columns: 1fr;
    padding: 20px;
  }
  .auth-hero {
    text-align: center;
    align-items: center;
  }
  .dashboard-shell {
    flex-direction: column;
  }
  .dashboard-sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
</style>
