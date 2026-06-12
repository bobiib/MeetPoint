<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchAppointments, deleteAppointment, type Appointment } from '../services/appointmentApi'
import { fetchAvailabilitiesByAppointments, setAvailability, type Availability } from '../services/availabilityApi'
import { fetchAllUsers, type LoggedInUser } from '../services/authApi'
import type { Activity } from '../services/activityApi'
import type { Group } from '../services/groupApi'
import ConfirmModal from './ConfirmModal.vue'

const props = defineProps<{
  activity: Activity | null
  group: Group
  user: LoggedInUser
}>()

const appointments = ref<Appointment[]>([])
const availabilities = ref<Availability[]>([])
const allUsers = ref<LoggedInUser[]>([])
const isLoading = ref(false)
const isSaving = ref('')
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')
const appointmentToDelete = ref<string | null>(null)

const userMap = computed(() => {
  const map = new Map<string, LoggedInUser>()
  for (const u of allUsers.value) {
    map.set(u.id, u)
  }
  return map
})

// Calculate votes per appointment
const appointmentVotes = computed(() => {
  const map = new Map<string, { yes: string[], no: string[] }>()
  
  for (const appt of appointments.value) {
    map.set(appt.id, { yes: [], no: [] })
  }

  for (const avail of availabilities.value) {
    if (map.has(avail.appointment_id)) {
      const votes = map.get(avail.appointment_id)!
      const username = userMap.value.get(avail.user_id)?.username || 'Unbekannt'
      if (avail.is_available) {
        votes.yes.push(username)
      } else {
        votes.no.push(username)
      }
    }
  }
  return map
})

// Find the winner (most yes votes, tiebreaker: fewest no votes)
const winningAppointmentId = computed(() => {
  if (appointments.value.length === 0) return null
  
  let bestId: string | null = null
  let maxYes = -1
  let minNo = Infinity

  for (const [id, votes] of appointmentVotes.value.entries()) {
    if (votes.yes.length > 0) {
      if (votes.yes.length > maxYes) {
        maxYes = votes.yes.length
        minNo = votes.no.length
        bestId = id
      } else if (votes.yes.length === maxYes && votes.no.length < minNo) {
        minNo = votes.no.length
        bestId = id
      }
    }
  }
  return bestId
})

const myVotes = computed(() => {
  const map = new Map<string, boolean>()
  for (const avail of availabilities.value) {
    if (avail.user_id === props.user.id) {
      map.set(avail.appointment_id, avail.is_available)
    }
  }
  return map
})

function formatAppointment(startsAt: string) {
  return new Intl.DateTimeFormat('de-CH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(startsAt))
}

async function loadAppointmentsAndVotes() {
  if (!props.activity) {
    appointments.value = []
    availabilities.value = []
    return
  }

  isLoading.value = true
  message.value = ''
  messageType.value = ''

  try {
    if (allUsers.value.length === 0) {
      allUsers.value = await fetchAllUsers()
    }

    appointments.value = await fetchAppointments(props.activity.id)
    if (appointments.value.length > 0) {
      const appointmentIds = appointments.value.map(a => a.id)
      availabilities.value = await fetchAvailabilitiesByAppointments(appointmentIds)
    } else {
      availabilities.value = []
    }
  } catch {
    message.value = 'Termine konnten nicht vollständig geladen werden.'
    messageType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

async function saveAvailability(appointmentId: string, isAvailable: boolean) {
  isSaving.value = appointmentId
  message.value = ''
  messageType.value = ''

  try {
    const saved = await setAvailability(appointmentId, props.user.id, isAvailable)
    availabilities.value = [
      ...availabilities.value.filter((item) => !(item.appointment_id === appointmentId && item.user_id === props.user.id)),
      saved,
    ]
  } catch {
    message.value = 'Verfügbarkeit konnte nicht gespeichert werden.'
    messageType.value = 'error'
  } finally {
    isSaving.value = ''
  }
}

async function handleDeleteAppointment(appointmentId: string, event: Event) {
  event.stopPropagation()
  appointmentToDelete.value = appointmentId
}

async function confirmDeleteAppointment() {
  if (!appointmentToDelete.value) return
  const appointmentId = appointmentToDelete.value
  appointmentToDelete.value = null
  
  message.value = ''
  messageType.value = ''
  try {
    await deleteAppointment(appointmentId, props.user.id)
    message.value = 'Termin wurde gelöscht.'
    messageType.value = 'success'
    await loadAppointmentsAndVotes()
  } catch (error: any) {
    message.value = error.message || 'Termin konnte nicht gelöscht werden.'
    messageType.value = 'error'
  }
}

watch(() => props.activity?.id, loadAppointmentsAndVotes)
onMounted(loadAppointmentsAndVotes)
</script>

<template>
  <section class="glass-panel" aria-labelledby="appointments-title">
    <div class="panel-header">
      <h2 id="appointments-title">Terminabstimmung</h2>
      <div class="icon-header">📅</div>
    </div>

    <p v-if="!activity" class="empty-state">Wähle zuerst eine Aktivität aus.</p>

    <template v-else>
      <p v-if="message" class="form-message" :class="messageType" role="status">
        {{ message }}
      </p>

      <div class="appointment-list">
        <p v-if="isLoading" class="empty-state">Termine werden geladen...</p>
        <p v-else-if="appointments.length === 0" class="empty-state">
          Noch keine Termine für diese Aktivität vorhanden.
        </p>

        <article
          v-for="appointment in appointments"
          v-else
          :key="appointment.id"
          class="appointment-card"
          :class="{ 'winner-card': appointment.id === winningAppointmentId }"
        >
          <div v-if="appointment.id === winningAppointmentId" class="winner-badge">
            🏆 Bester Termin
          </div>

          <div class="appointment-info">
            <div class="date-badge">
              <strong>{{ new Date(appointment.starts_at).getDate() }}</strong>
              <span>{{ new Date(appointment.starts_at).toLocaleString('de-CH', { month: 'short' }) }}</span>
            </div>
            
            <div class="appointment-details">
              <strong>{{ formatAppointment(appointment.starts_at) }}</strong>
              <small>{{ appointment.description || 'Keine Beschreibung' }}</small>
              
              <div class="votes-overview">
                <div v-if="appointmentVotes.get(appointment.id)?.yes.length" class="vote-group yes-group">
                  <span class="vote-icon">👍</span>
                  <span class="voter-names">{{ appointmentVotes.get(appointment.id)?.yes.join(', ') }}</span>
                </div>
                <div v-if="appointmentVotes.get(appointment.id)?.no.length" class="vote-group no-group">
                  <span class="vote-icon">👎</span>
                  <span class="voter-names">{{ appointmentVotes.get(appointment.id)?.no.join(', ') }}</span>
                </div>
                <div v-if="!appointmentVotes.get(appointment.id)?.yes.length && !appointmentVotes.get(appointment.id)?.no.length" class="no-votes">
                  Noch keine Abstimmungen
                </div>
              </div>
            </div>
          </div>

          <div class="vote-actions">
            <button
              class="vote-btn yes"
              :class="{ active: myVotes.get(appointment.id) === true }"
              :disabled="isSaving === appointment.id"
              @click="saveAvailability(appointment.id, true)"
              title="Ich kann"
            >
              👍
            </button>
            <button
              class="vote-btn no"
              :class="{ active: myVotes.get(appointment.id) === false }"
              :disabled="isSaving === appointment.id"
              @click="saveAvailability(appointment.id, false)"
              title="Ich kann nicht"
            >
              👎
            </button>
            <button
              v-if="props.user.id === appointment.created_by || props.user.id === props.group.owner_id"
              class="btn-icon small danger delete-btn"
              type="button"
              @click="handleDeleteAppointment(appointment.id, $event)"
              title="Termin löschen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </article>
      </div>
    </template>

    <Transition name="fade-slide">
      <ConfirmModal
        v-if="appointmentToDelete"
        title="Termin löschen"
        message="Möchtest du diesen Terminvorschlag wirklich löschen? Dies kann nicht rückgängig gemacht werden."
        confirm-text="Löschen"
        :danger="true"
        @confirm="confirmDeleteAppointment"
        @cancel="appointmentToDelete = null"
      />
    </Transition>
  </section>
</template>

<style scoped>
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.panel-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-main);
}
.icon-header {
  font-size: 1.8rem;
  opacity: 0.8;
}

.btn-icon.small {
  padding: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 8px;
}
.btn-icon.small:hover {
  color: var(--accent);
  background: rgba(16, 185, 129, 0.1);
}
.btn-icon.small.danger:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
.delete-btn {
  margin-left: 8px;
  align-self: center;
}

.appointment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.appointment-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.2s;
  overflow: hidden;
}
.appointment-card:hover {
  background: rgba(30, 41, 59, 0.8);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.winner-card {
  border-color: var(--accent);
  background: rgba(16, 185, 129, 0.1);
  box-shadow: var(--shadow-glow);
}
.winner-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--accent);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 4px 12px;
  border-bottom-left-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.appointment-info {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.15);
  color: var(--accent);
  border-radius: 12px;
  min-width: 56px;
  height: 56px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.date-badge strong {
  font-size: 1.3rem;
  line-height: 1;
}
.date-badge span {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
}

.appointment-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.appointment-details strong {
  font-size: 1.1rem;
}
.appointment-details small {
  color: var(--text-muted);
}

.votes-overview {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.vote-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-main);
  background: rgba(0,0,0,0.2);
  padding: 4px 8px;
  border-radius: 8px;
  width: fit-content;
}
.yes-group {
  border-left: 3px solid var(--accent);
}
.no-group {
  border-left: 3px solid #ef4444;
}
.vote-icon {
  font-size: 0.9rem;
}
.voter-names {
  opacity: 0.9;
}
.no-votes {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 4px;
}

.vote-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.vote-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.vote-btn:hover:not(:disabled) {
  transform: scale(1.1);
}
.vote-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

.vote-btn.yes.active {
  background: rgba(16, 185, 129, 0.2);
  border-color: var(--accent);
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
}
.vote-btn.no.active {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
}

@media (max-width: 620px) {
  .appointment-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .winner-badge {
    position: relative;
    border-radius: 8px;
    display: inline-block;
    margin-bottom: 8px;
  }
  .vote-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
