<script setup>
import { onMounted, ref } from "vue";
import api from "../api";
import { useAuthStore } from "../stores/auth";
import CaseCard from "../components/CaseCard.vue";

const auth = useAuthStore();
const cases = ref([]);
const opening = ref(false);
const result = ref(null);
const errorMessage = ref("");

async function loadCases() {
  const response = await api.get("/cases");
  cases.value = response.data;
}

async function openCase(caseId) {
  opening.value = true;
  errorMessage.value = "";
  try {
    const response = await api.post(`/cases/${caseId}/open`, { count: 1 });
    result.value = response.data;
    auth.user = response.data.user;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Ошибка открытия кейса";
  } finally {
    opening.value = false;
  }
}

onMounted(async () => {
  await loadCases();
});
</script>

<template>
  <section class="dashboard">
    <h2>Открытие кейсов</h2>
    <div class="cases-grid">
      <CaseCard
        v-for="caseItem in cases"
        :key="caseItem.id"
        :case-item="caseItem"
        :loading="opening"
        @open="openCase"
      />
    </div>

    <div v-if="result" class="result-card">
      <h3>Результат открытия</h3>
      <p>Кейс: {{ result.case }}</p>
      <p>Выпало: {{ result.items[0].name }} ({{ result.items[0].value }} ₽)</p>
      <p>Профит: {{ result.profit }} ₽</p>
    </div>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </section>
</template>
