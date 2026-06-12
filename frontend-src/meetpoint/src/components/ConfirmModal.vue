<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('cancel')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal-card" role="dialog" aria-modal="true" :aria-labelledby="title">
      <h3 class="modal-title">{{ title }}</h3>
      <p class="modal-message">{{ message }}</p>
      <div class="modal-actions">
        <button class="btn-secondary" @click="emit('cancel')">
          {{ cancelText || 'Abbrechen' }}
        </button>
        <button 
          class="btn-primary" 
          :class="{ 'btn-danger': danger }"
          @click="emit('confirm')"
        >
          {{ confirmText || 'Bestätigen' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  background: var(--bg-panel-solid);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  animation: modal-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes modal-pop {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-title {
  margin: 0 0 12px;
  font-size: 1.25rem;
  color: var(--text-main);
}

.modal-message {
  color: var(--text-muted);
  margin: 0 0 24px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-secondary {
  padding: 10px 16px;
  background: transparent;
  color: var(--text-main);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
}

.btn-primary {
  padding: 10px 16px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-danger {
  background: #ef4444;
}

.btn-danger:hover {
  background: #dc2626;
}
</style>
