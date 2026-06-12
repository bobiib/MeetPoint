<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import {
  addGroupMember,
  fetchGroupMembers,
  findUserByEmail,
  removeGroupMember,
  type GroupMember,
} from '../services/memberApi'
import { fetchAllUsers, type LoggedInUser } from '../services/authApi'
import { computed } from 'vue'

const props = defineProps<{
  groupId: string
}>()

const allUsers = ref<LoggedInUser[]>([])

const userMap = computed(() => {
  const map = new Map<string, LoggedInUser>()
  for (const u of allUsers.value) {
    map.set(u.id, u)
  }
  return map
})

const members = ref<GroupMember[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')
const isAdding = ref(false)

const form = reactive({
  email: '',
})

async function loadMembers() {
  if (!props.groupId) {
    members.value = []
    return
  }

  isLoading.value = true
  message.value = ''
  messageType.value = ''

  try {
    if (allUsers.value.length === 0) {
      allUsers.value = await fetchAllUsers()
    }
    members.value = await fetchGroupMembers(props.groupId)
  } catch {
    message.value = 'Mitglieder konnten nicht geladen werden.'
    messageType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

async function addMember() {
  message.value = ''
  messageType.value = ''

  if (!form.email.trim()) {
    message.value = 'Bitte gib eine E-Mail-Adresse ein.'
    messageType.value = 'error'
    return
  }

  isSaving.value = true

  try {
    const user = await findUserByEmail(form.email)

    if (!user) {
      message.value = 'Kein Benutzer mit dieser E-Mail-Adresse gefunden.'
      messageType.value = 'error'
      return
    }

    await addGroupMember(props.groupId, user.id)
    form.email = ''
    message.value = 'Mitglied wurde hinzugefügt.'
    messageType.value = 'success'
    isAdding.value = false
    await loadMembers()
  } catch {
    message.value = 'Mitglied konnte nicht hinzugefügt werden.'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}

async function removeMember(userId: string) {
  message.value = ''
  messageType.value = ''

  try {
    await removeGroupMember(props.groupId, userId)
    message.value = 'Mitglied wurde entfernt.'
    messageType.value = 'success'
    await loadMembers()
  } catch {
    message.value = 'Mitglied konnte nicht entfernt werden.'
    messageType.value = 'error'
  }
}

watch(() => props.groupId, loadMembers)
onMounted(loadMembers)
</script>

<template>
  <section class="glass-panel" aria-labelledby="members-title" style="margin-top: 24px;">
    <div class="panel-header">
      <h2 id="members-title">Mitglieder</h2>
      <button v-if="!isAdding" class="btn-icon" @click="isAdding = true" title="Mitglied hinzufügen">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
      </button>
    </div>

    <Transition name="fade-slide">
      <form v-if="isAdding" class="creation-form" @submit.prevent="addMember">
        <div class="input-group">
          <input id="member-email" v-model="form.email" type="email" placeholder=" " />
          <label for="member-email">E-Mail-Adresse des Mitglieds</label>
        </div>

        <div class="actions">
          <button class="btn-primary" type="submit" :disabled="isSaving">
            {{ isSaving ? 'Wird hinzugefügt...' : 'Hinzufügen' }}
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

    <div class="item-list">
      <p v-if="isLoading" class="empty-state">Mitglieder werden geladen...</p>
      <p v-else-if="members.length === 0" class="empty-state">Noch keine Mitglieder vorhanden.</p>

      <article v-for="member in members" v-else :key="member.user_id" class="card-item">
        <div class="card-content">
          <div class="card-icon" style="font-size: 1rem; width: 36px; height: 36px;">👤</div>
          <div class="card-text">
            <strong>{{ userMap.get(member.user_id)?.username || member.user_id.substring(0, 8) + '...' }}</strong>
            <small>Rolle: {{ member.role }}</small>
          </div>
        </div>
        <button class="btn-icon small danger" type="button" @click="removeMember(member.user_id)" title="Entfernen">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </article>
    </div>
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
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}
.card-icon {
  background: rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
.card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.card-text strong {
  font-size: 1rem;
}
.card-text small {
  color: var(--text-muted);
}
</style>
