<script setup lang="ts">
import { onMounted, reactive, ref, watch, computed } from 'vue'
import { fetchActivities, createActivity, deleteActivity, type Activity } from '../services/activityApi'
import { fetchInterests, type Interest } from '../services/interestApi'
import { fetchActivityInterestsForActivities, linkInterestsToActivity, type ActivityInterest } from '../services/activityInterestApi'
import type { LoggedInUser } from '../services/authApi'
import type { Group } from '../services/groupApi'
import ConfirmModal from './ConfirmModal.vue'

const props = defineProps<{
  group: Group
  user: LoggedInUser
}>()

const emit = defineEmits<{
  activitySelected: [activity: Activity]
}>()

const activities = ref<Activity[]>([])
const interests = ref<Interest[]>([])
const activityInterests = ref<ActivityInterest[]>([])
const selectedActivityId = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')
const isCreating = ref(false)

const activityToDelete = ref<string | null>(null)

const form = reactive({
  title: '',
  description: '',
  selectedInterests: [] as string[]
})

const interestsByActivity = computed(() => {
  const map = new Map<string, Interest[]>()
  for (const link of activityInterests.value) {
    const interest = interests.value.find(i => i.id === link.interest_id)
    if (interest) {
      if (!map.has(link.activity_id)) {
        map.set(link.activity_id, [])
      }
      map.get(link.activity_id)!.push(interest)
    }
  }
  return map
})

async function loadActivitiesAndInterests() {
  if (!props.group) {
    activities.value = []
    interests.value = []
    activityInterests.value = []
    selectedActivityId.value = ''
    return
  }

  isLoading.value = true
  message.value = ''
  messageType.value = ''

  try {
    const [fetchedActivities, fetchedInterests] = await Promise.all([
      fetchActivities(props.group.id),
      fetchInterests(props.group.id)
    ])
    activities.value = fetchedActivities
    interests.value = fetchedInterests

    if (activities.value.length > 0) {
      activityInterests.value = await fetchActivityInterestsForActivities(
        activities.value.map(a => a.id)
      )
    } else {
      activityInterests.value = []
    }

    const onlyActivity = activities.value[0]
    if (activities.value.length === 1 && onlyActivity) {
      selectActivity(onlyActivity)
    } else if (!activities.value.some((activity) => activity.id === selectedActivityId.value)) {
      selectedActivityId.value = ''
    }
  } catch {
    message.value = 'Aktivitäten konnten nicht vollständig geladen werden.'
    messageType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

function selectActivity(activity: Activity) {
  selectedActivityId.value = activity.id
  emit('activitySelected', activity)
}

function resetForm() {
  form.title = ''
  form.description = ''
  form.selectedInterests = []
  isCreating.value = false
}

function toggleInterestSelection(interestId: string) {
  const index = form.selectedInterests.indexOf(interestId)
  if (index === -1) {
    form.selectedInterests.push(interestId)
  } else {
    form.selectedInterests.splice(index, 1)
  }
}

async function saveActivity() {
  message.value = ''
  messageType.value = ''

  if (!form.title.trim()) {
    message.value = 'Bitte gib einen Titel ein.'
    messageType.value = 'error'
    return
  }

  isSaving.value = true

  try {
    const activity = await createActivity({
      groupId: props.group.id,
      title: form.title.trim(),
      description: form.description.trim(),
      createdBy: props.user.id,
    })

    if (form.selectedInterests.length > 0) {
      await linkInterestsToActivity(activity.id, form.selectedInterests)
    }

    message.value = 'Aktivität wurde erstellt.'
    messageType.value = 'success'
    resetForm()
    await loadActivitiesAndInterests()
    
    // Automatically select the newly created activity
    const newActivity = activities.value.find(a => a.id === activity.id)
    if (newActivity) selectActivity(newActivity)
  } catch {
    message.value = 'Die Aktivität konnte nicht gespeichert werden.'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}

async function handleDeleteActivity(activityId: string, event: Event) {
  event.stopPropagation()
  activityToDelete.value = activityId
}

async function confirmDeleteActivity() {
  if (!activityToDelete.value) return
  const activityId = activityToDelete.value
  activityToDelete.value = null
  
  message.value = ''
  messageType.value = ''
  try {
    await deleteActivity(activityId, props.user.id)
    message.value = 'Aktivität wurde gelöscht.'
    messageType.value = 'success'
    if (selectedActivityId.value === activityId) {
      selectedActivityId.value = ''
      emit('activitySelected', null as any)
    }
    await loadActivitiesAndInterests()
  } catch (error: any) {
    message.value = error.message || 'Aktivität konnte nicht gelöscht werden.'
    messageType.value = 'error'
  }
}

watch(() => props.group?.id, loadActivitiesAndInterests)
onMounted(loadActivitiesAndInterests)
</script>

<template>
  <section class="glass-panel" aria-labelledby="activities-title">
    <div class="panel-header">
      <h2 id="activities-title">Aktivitäten</h2>
      <button v-if="!isCreating" class="btn-icon" @click="isCreating = true" title="Neue Aktivität">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Neu
      </button>
    </div>

    <Transition name="fade-slide">
      <form v-if="isCreating" class="creation-form" @submit.prevent="saveActivity">
        <div class="input-group">
          <input id="activity-title" v-model="form.title" type="text" placeholder=" " />
          <label for="activity-title">Aktivität (z.B. Bowling)</label>
        </div>

        <div class="input-group">
          <textarea id="activity-desc" v-model="form.description" rows="2" placeholder=" "></textarea>
          <label for="activity-desc">Beschreibung (optional)</label>
        </div>

        <div v-if="interests.length > 0" class="interest-selection">
          <p class="interest-label">Welche Interessen werden abgedeckt?</p>
          <div class="interest-chips">
            <button
              v-for="interest in interests"
              :key="interest.id"
              type="button"
              class="interest-chip"
              :class="{ active: form.selectedInterests.includes(interest.id) }"
              @click="toggleInterestSelection(interest.id)"
            >
              {{ interest.name }}
            </button>
          </div>
        </div>

        <div class="actions">
          <button class="btn-primary" type="submit" :disabled="isSaving">
            {{ isSaving ? 'Speichern...' : 'Erstellen' }}
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
      <p v-if="isLoading" class="empty-state">Aktivitäten werden geladen...</p>
      <p v-else-if="activities.length === 0" class="empty-state">
        Noch keine Aktivitätsvorschläge für diese Gruppe. Klicke auf "Neu", um eine zu erstellen!
      </p>

      <article
        v-for="activity in activities"
        v-else
        :key="activity.id"
        class="card-item"
        :class="{ selected: selectedActivityId === activity.id }"
        @click="selectActivity(activity)"
      >
        <div class="card-content">
          <div class="card-icon">⚡</div>
          <div class="card-text">
            <strong>{{ activity.title }}</strong>
            <small>{{ activity.description || 'Keine Beschreibung' }}</small>
            
            <div v-if="interestsByActivity.get(activity.id)?.length" class="card-interests">
              <span v-for="i in interestsByActivity.get(activity.id)" :key="i.id" class="mini-chip">
                {{ i.name }}
              </span>
            </div>
          </div>
        </div>
        <button
          v-if="props.user.id === activity.created_by || props.user.id === props.group.owner_id"
          class="btn-icon small danger delete-btn"
          type="button"
          @click="handleDeleteActivity(activity.id, $event)"
          title="Aktivität löschen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </article>
    </div>

    <Transition name="fade-slide">
      <ConfirmModal
        v-if="activityToDelete"
        title="Aktivität löschen"
        message="Möchtest du diese Aktivität und alle dazugehörigen Termine wirklich löschen? Dies kann nicht rückgängig gemacht werden."
        confirm-text="Löschen"
        :danger="true"
        @confirm="confirmDeleteActivity"
        @cancel="activityToDelete = null"
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
.delete-btn {
  margin-left: 8px;
}

.creation-form {
  background: rgba(0,0,0,0.2);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid var(--border);
}

.interest-selection {
  margin-bottom: 20px;
}
.interest-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.interest-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.interest-chip {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 6px 14px;
  color: var(--text-main);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.interest-chip:hover {
  background: rgba(255,255,255,0.1);
}
.interest-chip.active {
  background: rgba(16, 185, 129, 0.2);
  border-color: var(--accent);
  color: #fff;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
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
.card-interests {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.mini-chip {
  font-size: 0.7rem;
  background: rgba(16, 185, 129, 0.15);
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
</style>
