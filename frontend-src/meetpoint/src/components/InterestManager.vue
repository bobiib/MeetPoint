<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { createInterest, fetchInterests, type Interest } from '../services/interestApi'
import type { LoggedInUser } from '../services/authApi'

const props = defineProps<{
  groupId: string
  user: LoggedInUser
}>()

const interests = ref<Interest[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')

const form = reactive({
  name: '',
})

async function loadInterests() {
  if (!props.groupId) {
    interests.value = []
    return
  }

  isLoading.value = true
  message.value = ''
  messageType.value = ''

  try {
    interests.value = await fetchInterests(props.groupId)
  } catch {
    message.value = 'Interessen konnten nicht geladen werden.'
    messageType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

async function saveInterest() {
  message.value = ''
  messageType.value = ''

  if (!form.name.trim()) {
    message.value = 'Bitte gib ein Interesse ein.'
    messageType.value = 'error'
    return
  }

  isSaving.value = true

  try {
    await createInterest({
      groupId: props.groupId,
      name: form.name.trim(),
      createdBy: props.user.id,
    })

    form.name = ''
    message.value = 'Interesse wurde gespeichert.'
    messageType.value = 'success'
    await loadInterests()
  } catch {
    message.value = 'Interesse konnte nicht gespeichert werden.'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}

watch(() => props.groupId, loadInterests)
onMounted(loadInterests)
</script>

<template>
  <section class="workspace-section" aria-labelledby="interest-title">
    <div class="section-heading">
      <p>Arbeitspaket 3.1</p>
      <h2 id="interest-title">Interessen erfassen</h2>
    </div>

    <form class="interest-form" @submit.prevent="saveInterest">
      <label>
        Interesse
        <input v-model="form.name" name="interest-name" placeholder="z. B. Kino, Sport, Essen" type="text" />
      </label>

      <button type="submit" :disabled="isSaving">
        {{ isSaving ? 'Wird gespeichert...' : 'Interesse speichern' }}
      </button>
    </form>

    <p v-if="message" class="form-message" :class="messageType" role="status">
      {{ message }}
    </p>

    <div class="interest-list">
      <p v-if="isLoading" class="empty-state">Interessen werden geladen...</p>
      <p v-else-if="interests.length === 0" class="empty-state">Noch keine Interessen vorhanden.</p>
      <article v-for="interest in interests" v-else :key="interest.id" class="interest-item">
        <strong>{{ interest.name }}</strong>
      </article>
    </div>
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

.interest-form {
  display: grid;
  gap: 14px;
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
  min-height: 46px;
  border: 1px solid #bcccdc;
  border-radius: 8px;
  padding: 11px 13px;
  color: #102a43;
  background: #ffffff;
  font: inherit;
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

.form-message,
.empty-state {
  margin: 0;
}

.form-message {
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

.empty-state {
  color: #627d98;
}

.interest-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.interest-item {
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  padding: 10px 12px;
  color: #102a43;
  background: #f8fafc;
}
</style>
