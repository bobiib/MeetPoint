<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createAppointment } from '../services/appointmentApi'
import type { LoggedInUser } from '../services/authApi'
import type { Activity } from '../services/activityApi'

const props = defineProps<{
  user: LoggedInUser
  activity: Activity | null
}>()

const emit = defineEmits<{
  appointmentCreated: []
}>()

const form = reactive({
  date: '',
  time: '',
  description: '',
})

const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')
const isCreating = ref(false)

function resetForm() {
  form.date = ''
  form.time = ''
  form.description = ''
  isCreating.value = false
}

async function submitAppointment() {
  message.value = ''
  messageType.value = ''

  if (!props.activity) {
    message.value = 'Bitte wähle zuerst eine Aktivität aus.'
    messageType.value = 'error'
    return
  }

  if (!form.date || !form.time) {
    message.value = 'Bitte gib Datum und Zeit ein.'
    messageType.value = 'error'
    return
  }

  isSaving.value = true

  try {
    await createAppointment({
      activityId: props.activity.id,
      startsAt: new Date(`${form.date}T${form.time}`).toISOString(),
      description: form.description.trim(),
      createdBy: props.user.id,
    })

    message.value = 'Terminvorschlag wurde erstellt.'
    messageType.value = 'success'
    resetForm()
    emit('appointmentCreated')
  } catch {
    message.value = 'Terminvorschlag konnte nicht gespeichert werden.'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section class="glass-panel" aria-labelledby="appointment-title" style="margin-bottom: 24px;">
    <div class="panel-header">
      <h2 id="appointment-title">Neuer Termin</h2>
      <button v-if="!isCreating" class="btn-icon" @click="isCreating = true" title="Termin vorschlagen">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>

    <Transition name="fade-slide">
      <form v-if="isCreating" class="creation-form" @submit.prevent="submitAppointment">
        <div class="date-grid">
          <div class="input-group">
            <input id="appt-date" v-model="form.date" type="date" placeholder=" " />
            <label for="appt-date">Datum</label>
          </div>

          <div class="input-group">
            <input id="appt-time" v-model="form.time" type="time" placeholder=" " />
            <label for="appt-time">Zeit</label>
          </div>
        </div>

        <div class="input-group">
          <textarea id="appt-desc" v-model="form.description" rows="2" placeholder=" "></textarea>
          <label for="appt-desc">Beschreibung (optional)</label>
        </div>

        <div class="actions">
          <button class="btn-primary" type="submit" :disabled="isSaving">
            {{ isSaving ? 'Wird gespeichert...' : 'Vorschlagen' }}
          </button>
          <button class="btn-secondary" type="button" @click="resetForm">
            Abbrechen
          </button>
        </div>
      </form>
    </Transition>

    <p v-if="message" class="form-message" :class="messageType" role="status">
      {{ message }}
    </p>
  </section>
</template>

<style scoped>
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.panel-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-main);
}

.btn-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.05);
  color: var(--text-main);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-icon:hover {
  background: var(--bg-panel-solid);
  border-color: var(--border-focus);
}

.creation-form {
  background: rgba(0,0,0,0.2);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid var(--border);
}

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.actions {
  display: flex;
  gap: 12px;
}
.btn-secondary {
  padding: 14px;
  background: transparent;
  color: var(--text-main);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover {
  background: rgba(255,255,255,0.05);
}

@media (max-width: 560px) {
  .date-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
