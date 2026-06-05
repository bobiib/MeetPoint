<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchAppointments, type Appointment } from '../services/appointmentApi'
import { fetchAvailability, setAvailability, type Availability } from '../services/availabilityApi'
import type { Activity } from '../services/activityApi'
import type { LoggedInUser } from '../services/authApi'

const props = defineProps<{
  activity: Activity | null
  user: LoggedInUser
}>()

const appointments = ref<Appointment[]>([])
const availabilities = ref<Availability[]>([])
const isLoading = ref(false)
const isSaving = ref('')
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')

const availabilityByAppointment = computed(() => {
  return new Map(availabilities.value.map((item) => [item.appointment_id, item.is_available]))
})

function formatAppointment(startsAt: string) {
  return new Intl.DateTimeFormat('de-CH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(startsAt))
}

async function loadAppointments() {
  if (!props.activity) {
    appointments.value = []
    return
  }

  isLoading.value = true
  message.value = ''
  messageType.value = ''

  try {
    const [nextAppointments, nextAvailabilities] = await Promise.all([
      fetchAppointments(props.activity.id),
      fetchAvailability(props.user.id),
    ])
    appointments.value = nextAppointments
    availabilities.value = nextAvailabilities
  } catch {
    message.value = 'Termine konnten nicht geladen werden.'
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
      ...availabilities.value.filter((item) => item.appointment_id !== appointmentId),
      saved,
    ]
    message.value = 'Verfügbarkeit wurde gespeichert.'
    messageType.value = 'success'
  } catch {
    message.value = 'Verfügbarkeit konnte nicht gespeichert werden.'
    messageType.value = 'error'
  } finally {
    isSaving.value = ''
  }
}

watch(() => props.activity?.id, loadAppointments)
onMounted(loadAppointments)
</script>

<template>
  <section class="workspace-section" aria-labelledby="appointments-title">
    <div class="section-heading">
      <p>Arbeitspakete 4.2 und 4.3</p>
      <h2 id="appointments-title">Termine und Verfügbarkeit</h2>
    </div>

    <p v-if="!activity" class="empty-state">Wähle zuerst eine Aktivität aus.</p>

    <template v-else>
      <p class="activity-context">Aktivität: {{ activity.title }}</p>

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
          class="appointment-item"
        >
          <div>
            <strong>{{ formatAppointment(appointment.starts_at) }}</strong>
            <small>{{ appointment.description || 'Keine Beschreibung' }}</small>
            <small>
              Deine Antwort:
              {{
                availabilityByAppointment.get(appointment.id) === true
                  ? 'verfügbar'
                  : availabilityByAppointment.get(appointment.id) === false
                    ? 'nicht verfügbar'
                    : 'noch offen'
              }}
            </small>
          </div>

          <div class="actions">
            <button
              type="button"
              :disabled="isSaving === appointment.id"
              @click="saveAvailability(appointment.id, true)"
            >
              Kann
            </button>
            <button
              class="danger"
              type="button"
              :disabled="isSaving === appointment.id"
              @click="saveAvailability(appointment.id, false)"
            >
              Kann nicht
            </button>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
.workspace-section {
  display: grid;
  gap: 18px;
  width: min(100%, 680px);
  margin-top: 36px;
  border-top: 1px solid #d9e2ec;
  padding-top: 30px;
}

.section-heading p,
.section-heading h2,
.empty-state,
.activity-context {
  margin: 0;
}

.section-heading p {
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}

.section-heading h2 {
  color: #102a43;
  font-size: clamp(1.5rem, 3vw, 2.1rem);
}

.activity-context,
.empty-state {
  color: #627d98;
  font-weight: 700;
}

.appointment-list {
  display: grid;
  gap: 12px;
}

.appointment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  padding: 14px;
  background: #ffffff;
}

.appointment-item div {
  display: grid;
  gap: 4px;
}

.appointment-item small {
  color: #627d98;
  font-weight: 600;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

button {
  min-height: 40px;
  border: 0;
  border-radius: 8px;
  padding: 9px 13px;
  color: #ffffff;
  background: #0f766e;
  font-weight: 800;
  cursor: pointer;
}

button.danger {
  background: #b42318;
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

@media (max-width: 620px) {
  .appointment-item {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
