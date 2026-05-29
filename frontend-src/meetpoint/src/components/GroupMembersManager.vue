<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import {
  addGroupMember,
  fetchGroupMembers,
  findUserByEmail,
  removeGroupMember,
  type GroupMember,
} from '../services/memberApi'

const props = defineProps<{
  groupId: string
}>()

const members = ref<GroupMember[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')

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
    message.value = 'Mitglied wurde hinzugefuegt.'
    messageType.value = 'success'
    await loadMembers()
  } catch {
    message.value = 'Mitglied konnte nicht hinzugefuegt werden.'
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
  <section class="members-section" aria-labelledby="members-title">
    <div class="section-heading">
      <p>Arbeitspaket 2.2</p>
      <h2 id="members-title">Mitglieder verwalten</h2>
    </div>

    <form class="member-form" @submit.prevent="addMember">
      <label>
        E-Mail-Adresse des Mitglieds
        <input v-model="form.email" name="member-email" type="email" />
      </label>

      <button type="submit" :disabled="isSaving">
        {{ isSaving ? 'Wird hinzugefuegt...' : 'Mitglied hinzufuegen' }}
      </button>
    </form>

    <p v-if="message" class="form-message" :class="messageType" role="status">
      {{ message }}
    </p>

    <div class="member-list">
      <p v-if="isLoading" class="empty-state">Mitglieder werden geladen...</p>
      <p v-else-if="members.length === 0" class="empty-state">Noch keine Mitglieder vorhanden.</p>

      <article v-for="member in members" v-else :key="member.user_id" class="member-item">
        <div>
          <strong>{{ member.user_id }}</strong>
          <small>Rolle: {{ member.role }}</small>
        </div>

        <button type="button" @click="removeMember(member.user_id)">Entfernen</button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.members-section {
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

.member-form {
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

.member-item button {
  background: #b42318;
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

.member-list {
  display: grid;
  gap: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  padding: 14px;
  background: #ffffff;
}

.member-item div {
  display: grid;
  gap: 4px;
}

.member-item small {
  color: #627d98;
  font-weight: 600;
}
</style>
