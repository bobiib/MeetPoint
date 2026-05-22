<script setup lang="ts">
import type { LoggedInUser } from '../services/authApi'

defineProps<{
  user: LoggedInUser
}>()

const emit = defineEmits<{
  logout: []
}>()
</script>

<template>
  <section class="session-panel" aria-label="Benutzersitzung">
    <div>
      <p class="label">Angemeldet als</p>
      <p class="username">{{ user.username }}</p>
      <p class="email">{{ user.email }}</p>
    </div>

    <button type="button" @click="emit('logout')">Abmelden</button>
  </section>
</template>

<style scoped>
.session-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: min(100%, 520px);
  margin-top: 28px;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  padding: 16px;
  background: #f8fafc;
}

.label,
.username,
.email {
  margin: 0;
}

.label {
  color: #627d98;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}

.username {
  color: #102a43;
  font-size: 1.1rem;
  font-weight: 800;
}

.email {
  color: #486581;
}

button {
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  padding: 10px 14px;
  color: #ffffff;
  background: #b42318;
  font-weight: 800;
  cursor: pointer;
}
</style>
