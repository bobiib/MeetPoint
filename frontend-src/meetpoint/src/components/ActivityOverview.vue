<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { fetchActivities, type Activity } from '../services/activityApi'

const props = defineProps<{
  groupId: string
}>()

const emit = defineEmits<{
  activitySelected: [activity: Activity]
}>()

const activities = ref<Activity[]>([])
const selectedActivityId = ref('')
const isLoading = ref(false)
const message = ref('')

async function loadActivities() {
  if (!props.groupId) {
    activities.value = []
    selectedActivityId.value = ''
    return
  }

  isLoading.value = true
  message.value = ''

  try {
    activities.value = await fetchActivities(props.groupId)
    const onlyActivity = activities.value[0]
    if (activities.value.length === 1 && onlyActivity) {
      selectActivity(onlyActivity)
    } else if (!activities.value.some((activity) => activity.id === selectedActivityId.value)) {
      selectedActivityId.value = ''
    }
  } catch {
    message.value = 'Aktivitaeten konnten nicht geladen werden.'
  } finally {
    isLoading.value = false
  }
}

function selectActivity(activity: Activity) {
  selectedActivityId.value = activity.id
  emit('activitySelected', activity)
}

watch(() => props.groupId, loadActivities)
onMounted(loadActivities)
</script>

<template>
  <section class="workspace-section" aria-labelledby="activities-title">
    <div class="section-heading">
      <p>Arbeitspaket 3.2</p>
      <h2 id="activities-title">Aktivitaetsvorschlaege anzeigen</h2>
    </div>

    <p v-if="message" class="form-message error" role="status">{{ message }}</p>

    <div class="activity-list">
      <p v-if="isLoading" class="empty-state">Aktivitaeten werden geladen...</p>
      <p v-else-if="activities.length === 0" class="empty-state">
        Noch keine Aktivitaetsvorschlaege vorhanden.
      </p>

      <article
        v-for="activity in activities"
        v-else
        :key="activity.id"
        class="activity-item"
        :class="{ selected: selectedActivityId === activity.id }"
      >
        <div>
          <strong>{{ activity.title }}</strong>
          <small>{{ activity.description || 'Keine Beschreibung' }}</small>
        </div>
        <button type="button" @click="selectActivity(activity)">Auswaehlen</button>
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
.section-heading h2,
.empty-state {
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

.activity-list {
  display: grid;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  padding: 14px;
  background: #ffffff;
}

.activity-item.selected {
  border-color: #0f766e;
  background: #f0fdfa;
}

.activity-item div {
  display: grid;
  gap: 4px;
}

.activity-item small,
.empty-state {
  color: #627d98;
  font-weight: 600;
}

button {
  min-height: 40px;
  border: 0;
  border-radius: 8px;
  padding: 9px 13px;
  color: #0f766e;
  background: #d9f5ee;
  font-weight: 800;
  cursor: pointer;
}

.form-message {
  margin: 0;
  border-radius: 8px;
  padding: 12px 14px;
  font-weight: 700;
}

.form-message.error {
  color: #7f1d1d;
  background: #fee2e2;
}
</style>
