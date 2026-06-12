<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { createGroup, fetchGroups, updateGroup, deleteGroup, type Group } from '../services/groupApi'
import type { LoggedInUser } from '../services/authApi'
import ConfirmModal from './ConfirmModal.vue'

const props = defineProps<{
  user: LoggedInUser
}>()

const emit = defineEmits<{
  groupSelected: [group: Group]
}>()

const groups = ref<Group[]>([])
const selectedGroupId = ref('')
const editingGroupId = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')
const isCreating = ref(false)

const form = reactive({
  name: '',
  description: '',
})

async function loadGroups() {
  isLoading.value = true
  message.value = ''
  messageType.value = ''

  try {
    groups.value = await fetchGroups(props.user.id)
  } catch {
    message.value = 'Gruppen konnten nicht geladen werden.'
    messageType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.description = ''
  editingGroupId.value = ''
  isCreating.value = false
}

function editGroup(group: Group) {
  isCreating.value = true
  editingGroupId.value = group.id
  form.name = group.name
  form.description = group.description ?? ''
}

function selectGroup(group: Group) {
  selectedGroupId.value = group.id
  emit('groupSelected', group)
}

async function saveGroup() {
  message.value = ''
  messageType.value = ''

  if (!form.name.trim()) {
    message.value = 'Bitte gib einen Gruppennamen ein.'
    messageType.value = 'error'
    return
  }

  isSaving.value = true

  try {
    if (editingGroupId.value) {
      await updateGroup(editingGroupId.value, {
        name: form.name.trim(),
        description: form.description.trim(),
      })
      message.value = 'Gruppe wurde gespeichert.'
    } else {
      await createGroup({
        name: form.name.trim(),
        description: form.description.trim(),
        ownerId: props.user.id,
      })
      message.value = 'Gruppe wurde erstellt.'
    }

    messageType.value = 'success'
    resetForm()
    await loadGroups()
  } catch {
    message.value = 'Die Gruppe konnte nicht gespeichert werden.'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}

const groupToDelete = ref<string | null>(null)

async function handleDeleteGroup(groupId: string, event: Event) {
  event.stopPropagation()
  groupToDelete.value = groupId
}

async function confirmDeleteGroup() {
  if (!groupToDelete.value) return
  const groupId = groupToDelete.value
  groupToDelete.value = null
  
  message.value = ''
  messageType.value = ''
  try {
    await deleteGroup(groupId, props.user.id)
    message.value = 'Gruppe wurde gelöscht.'
    messageType.value = 'success'
    if (selectedGroupId.value === groupId) {
      selectedGroupId.value = ''
      emit('groupSelected', null as any)
    }
    await loadGroups()
  } catch (error: any) {
    message.value = error.message || 'Gruppe konnte nicht gelöscht werden.'
    messageType.value = 'error'
  }
}

onMounted(loadGroups)
</script>

<template>
  <section class="glass-panel" aria-labelledby="groups-title">
    <div class="panel-header">
      <h2 id="groups-title">Meine Gruppen</h2>
      <button v-if="!isCreating" class="btn-icon" @click="isCreating = true" title="Neue Gruppe">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Neu
      </button>
    </div>

    <Transition name="fade-slide">
      <form v-if="isCreating" class="creation-form" @submit.prevent="saveGroup">
        <div class="input-group">
          <input id="group-name" v-model="form.name" type="text" placeholder=" " />
          <label for="group-name">Gruppenname</label>
        </div>

        <div class="input-group">
          <textarea id="group-desc" v-model="form.description" rows="2" placeholder=" "></textarea>
          <label for="group-desc">Beschreibung</label>
        </div>

        <div class="actions">
          <button class="btn-primary" type="submit" :disabled="isSaving">
            {{ isSaving ? 'Speichern...' : editingGroupId ? 'Änderungen speichern' : 'Erstellen' }}
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

    <div class="item-list">
      <p v-if="isLoading" class="empty-state">Lade Gruppen...</p>
      <p v-else-if="groups.length === 0" class="empty-state">Noch keine Gruppen vorhanden.</p>

      <article
        v-for="group in groups"
        v-else
        :key="group.id"
        class="card-item"
        :class="{ selected: selectedGroupId === group.id }"
        @click="selectGroup(group)"
      >
        <div class="card-content">
          <div class="card-icon">👥</div>
          <div class="card-text">
            <strong>{{ group.name }}</strong>
            <small>{{ group.description || 'Keine Beschreibung' }}</small>
          </div>
        <div class="card-actions">
          <button class="btn-icon small" type="button" @click.stop="editGroup(group)" title="Bearbeiten">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button 
            v-if="props.user.id === group.owner_id"
            class="btn-icon small danger" 
            type="button" 
            @click.stop="handleDeleteGroup(group.id, $event)" 
            title="Löschen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </article>
    </div>

    <Transition name="fade-slide">
      <ConfirmModal
        v-if="groupToDelete"
        title="Gruppe löschen"
        message="Möchtest du diese Gruppe wirklich löschen? Alle Aktivitäten, Termine und Abstimmungen gehen unwiderruflich verloren!"
        confirm-text="Löschen"
        :danger="true"
        @confirm="confirmDeleteGroup"
        @cancel="groupToDelete = null"
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
.btn-icon.small {
  padding: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
}
.btn-icon.small:hover {
  color: var(--accent);
  background: rgba(16, 185, 129, 0.1);
}
.btn-icon.small.danger:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
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

.item-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.card-item:hover {
  background: rgba(30, 41, 59, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.card-item.selected {
  border-color: var(--accent);
  background: rgba(16, 185, 129, 0.05);
  box-shadow: var(--shadow-glow);
}
.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}
.card-icon {
  font-size: 1.5rem;
  background: rgba(0,0,0,0.2);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
.card-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-text strong {
  font-size: 1.1rem;
}
.card-text small {
  color: var(--text-muted);
}
.card-actions {
  display: flex;
  gap: 8px;
}
</style>
