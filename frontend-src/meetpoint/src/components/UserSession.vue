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
  <section class="user-profile" aria-label="Benutzersitzung">
    <div class="avatar">
      {{ user.username.charAt(0).toUpperCase() }}
    </div>
    <div class="user-info">
      <p class="username">{{ user.username }}</p>
      <p class="email">{{ user.email }}</p>
    </div>
    <button type="button" class="btn-logout" @click="emit('logout')" title="Abmelden">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
    </button>
  </section>
</template>

<style scoped>
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--accent), #3b82f6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.2rem;
  color: #fff;
  box-shadow: var(--shadow-glow);
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.username {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-logout:hover {
  background: #ef4444;
  color: #fff;
  transform: translateX(2px);
}
</style>
