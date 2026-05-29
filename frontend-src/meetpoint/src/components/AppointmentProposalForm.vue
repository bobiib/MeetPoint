<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createAppointment } from '../services/appointmentApi'
import type { LoggedInUser } from '../services/authApi'

const props = defineProps<{
  user: LoggedInUser
}>()

const form = reactive({
  activityId: '',
  date: '',
  time: '',
  description: '',
})

const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')

function resetForm() {
  form.activityId = ''
  form.date = ''
  form.time = ''
  form.description = ''
}

async function submitAppointment() {
  message.value = ''
  messageType.value = ''

  if (!form.activityId.trim() || !form.date || !form.time) {
    message.value = 'Bitte gib Aktivitaet, Datum und Zeit ein.'
    messageType.value = 'error'
    return
  }

  isSaving.value = true

  try {
    await createAppointment({
      activityId: form.activityId.trim(),
      startsAt: new Date(`${form.date}T${form.time}`).toISOString(),
      description: form.description.trim(),
      createdBy: props.user.id,
    })

    message.value = 'Terminvorschlag wurde erstellt.'
    messageType.value = 'success'
    resetForm()
  } catch {
    message.value = 'Terminvorschlag konnte nicht gespeichert werden.'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section class="workspace-section" aria-labelledby="appointment-title">
    <div class="section-heading">
      <p>Arbeitspaket 4.1</p>
      <h2 id="appointment-title">Terminvorschlag erstellen</h2>
    </div>

    <form class="appointment-form" @submit.prevent="submitAppointment">
      <label>
        Aktivitaets-ID
        <input v-model="form.activityId" name="activity-id" type="text" />
      </label>

      <div class="date-grid">
        <label>
          Datum
          <input v-model="form.date" name="appointment-date" type="date" />
        </label>

        <label>
          Zeit
          <input v-model="form.time" name="appointment-time" type="time" />
        </label>
      </div>

      <label>
        Beschreibung
        <textarea v-model="form.description" name="appointment-description" rows="3"></textarea>
      </label>

      <button type="submit" :disabled="isSaving">
        {{ isSaving ? 'Wird gespeichert...' : 'Terminvorschlag speichern' }}
      </button>

      <p v-if="message" class="form-message" :class="messageType" role="status">
        {{ message }}
      </p>
    </form>
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
.section-heading h2 {
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

.appointment-form {
  display: grid;
  gap: 14px;
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

label {
  display: grid;
  gap: 8px;
  color: #263f53;
  font-size: 0.95rem;
  font-weight: 750;
}

input,
textarea {
  width: 100%;
  border: 1px solid #bcccdc;
  border-radius: 8px;
  padding: 11px 13px;
  color: #102a43;
  background: #ffffff;
  font: inherit;
}

input {
  min-height: 46px;
}

textarea {
  resize: vertical;
}

button {
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  padding: 10px 14px;
  color: #ffffff;
  background: #0f766e;
  font-weight: 800;
  cursor: pointer;
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

@media (max-width: 560px) {
  .date-grid {
    grid-template-columns: 1fr;
  }
}
</style>
