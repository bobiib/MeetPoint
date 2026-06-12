<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { createInterest, fetchInterests, deleteInterest, type Interest } from '../services/interestApi'
import type { LoggedInUser } from '../services/authApi'
import type { Group } from '../services/groupApi'
import ConfirmModal from './ConfirmModal.vue'

const props = defineProps<{
  group: Group
  user: LoggedInUser
}>()

const interests = ref<Interest[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')
const isAdding = ref(false)

const form = reactive({
  name: '',
})

async function loadInterests() {
  if (!props.group) {
    interests.value = []
    return
  }

  isLoading.value = true
  message.value = ''
  messageType.value = ''

  try {
    interests.value = await fetchInterests(props.group.id)
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
      groupId: props.group.id,
      name: form.name.trim(),
      createdBy: props.user.id,
    })

    form.name = ''
    message.value = 'Interesse wurde gespeichert.'
    messageType.value = 'success'
    isAdding.value = false
    await loadInterests()
  } catch {
    message.value = 'Interesse konnte nicht gespeichert werden.'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}

const interestToDelete = ref<string | null>(null)

async function handleDeleteInterest(interestId: string, event: Event) {
  event.stopPropagation()
  interestToDelete.value = interestId
}

async function confirmDeleteInterest() {
  if (!interestToDelete.value) return
  const interestId = interestToDelete.value
  interestToDelete.value = null
  
  message.value = ''
  messageType.value = ''
  try {
    await deleteInterest(interestId, props.user.id)
    message.value = 'Interesse wurde gelöscht.'
    messageType.value = 'success'
    await loadInterests()
  } catch (error: any) {
    message.value = error.message || 'Interesse konnte nicht gelöscht werden.'
    messageType.value = 'error'
  }
}

watch(() => props.group?.id, loadInterests)
onMounted(loadInterests)
</script>

<template>
  <section class="glass-panel" aria-labelledby="interest-title" style="margin-top: 24px;">
    <div class="panel-header">
      <h2 id="interest-title">Interessen</h2>
      <button v-if="!isAdding" class="btn-icon" @click="isAdding = true" title="Interesse hinzufügen">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>

    <Transition name="fade-slide">
      <form v-if="isAdding" class="creation-form" @submit.prevent="saveInterest">
        <div class="input-group">
          <input id="interest-name" v-model="form.name" type="text" placeholder=" " />
          <label for="interest-name">Neues Interesse (z. B. Kino, Sport)</label>
        </div>

        <div class="actions">
          <button class="btn-primary" type="submit" :disabled="isSaving">
            {{ isSaving ? 'Wird gespeichert...' : 'Hinzufügen' }}
          </button>
          <button class="btn-secondary" type="button" @click="isAdding = false">
            Abbrechen
          </button>
        </div>
      </form>
    </Transition>

    <p v-if="message" class="form-message" :class="messageType" role="status">
      {{ message }}
    </p>

    <div class="interest-list">
      <p v-if="isLoading" class="empty-state">Lade Interessen...</p>
      <p v-else-if="interests.length === 0" class="empty-state">Noch keine Interessen vorhanden.</p>
      <div v-for="interest in interests" v-else :key="interest.id" class="chip">
        <span>{{ interest.name }}</span>
        <button 
          v-if="props.user.id === interest.created_by || props.user.id === props.group.owner_id"
          class="delete-chip-btn"
          @click="handleDeleteInterest(interest.id, $event)"
          title="Löschen"
        >
          &times;
        </button>
      </div>
    </div>

    <Transition name="fade-slide">
      <ConfirmModal
        v-if="interestToDelete"
        title="Interesse löschen"
        message="Möchtest du dieses Interesse wirklich löschen?"
        confirm-text="Löschen"
        :danger="true"
        @confirm="confirmDeleteInterest"
        @cancel="interestToDelete = null"
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

.interest-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.chip {
  padding: 8px 16px;
  background: rgba(16, 185, 129, 0.1);
  color: var(--accent);
  border: 1px solid var(--border-focus);
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-chip-btn {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  margin-left: 4px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.delete-chip-btn:hover {
  opacity: 1;
  color: #ef4444;
}
</style>
