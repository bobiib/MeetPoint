<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { createGroup, fetchGroups, updateGroup, type Group } from '../services/groupApi'
import type { LoggedInUser } from '../services/authApi'

const props = defineProps<{
  user: LoggedInUser
}>()

const groups = ref<Group[]>([])
const selectedGroupId = ref('')
const editingGroupId = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')

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
}

function editGroup(group: Group) {
  editingGroupId.value = group.id
  form.name = group.name
  form.description = group.description ?? ''
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

onMounted(loadGroups)
</script>

<template>
  <section class="workspace-section" aria-labelledby="groups-title">
    <div class="section-heading">
      <p>Arbeitspaket 2.1</p>
      <h2 id="groups-title">Gruppen verwalten</h2>
    </div>

    <form class="group-form" @submit.prevent="saveGroup">
      <label>
        Gruppenname
        <input v-model="form.name" name="group-name" type="text" />
      </label>

      <label>
        Beschreibung
        <textarea v-model="form.description" name="group-description" rows="3"></textarea>
      </label>

      <div class="actions">
        <button type="submit" :disabled="isSaving">
          {{ isSaving ? 'Wird gespeichert...' : editingGroupId ? 'Gruppe speichern' : 'Gruppe erstellen' }}
        </button>
        <button v-if="editingGroupId" class="secondary" type="button" @click="resetForm">
          Abbrechen
        </button>
      </div>
    </form>

    <p v-if="message" class="form-message" :class="messageType" role="status">
      {{ message }}
    </p>

    <div class="group-list" aria-live="polite">
      <p v-if="isLoading" class="empty-state">Gruppen werden geladen...</p>
      <p v-else-if="groups.length === 0" class="empty-state">Noch keine Gruppen vorhanden.</p>

      <article
        v-for="group in groups"
        v-else
        :key="group.id"
        class="group-item"
        :class="{ selected: selectedGroupId === group.id }"
      >
        <label class="select-row">
          <input v-model="selectedGroupId" name="selected-group" type="radio" :value="group.id" />
          <span>
            <strong>{{ group.name }}</strong>
            <small>{{ group.description || 'Keine Beschreibung' }}</small>
          </span>
        </label>
        <button class="secondary" type="button" @click="editGroup(group)">Bearbeiten</button>
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

.group-form {
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

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

button.secondary {
  color: #0f766e;
  background: #d9f5ee;
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

.group-list {
  display: grid;
  gap: 12px;
}

.group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  padding: 14px;
  background: #ffffff;
}

.group-item.selected {
  border-color: #0f766e;
  background: #f0fdfa;
}

.select-row {
  display: flex;
  grid-template-columns: none;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.select-row input {
  width: auto;
  min-height: auto;
}

.select-row span {
  display: grid;
  gap: 4px;
}

.select-row small {
  color: #627d98;
  font-weight: 600;
}
</style>
