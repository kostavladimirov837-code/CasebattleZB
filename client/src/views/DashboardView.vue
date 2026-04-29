<script setup>
import { onMounted, ref } from "vue";
import api from "../api";
import { useAuthStore } from "../stores/auth";
import CaseCard from "../components/CaseCard.vue";

const auth = useAuthStore();
const cases = ref([]);
const inventory = ref([]);
const history = ref([]);
const opening = ref(false);
const topupAmount = ref(500);
const result = ref(null);
const errorMessage = ref("");

async function loadAll() {
  const [casesRes, inventoryRes, historyRes] = await Promise.all([
    api.get("/cases"),
    api.get("/inventory"),
    api.get("/history")
  ]);
  cases.value = casesRes.data;
  inventory.value = inventoryRes.data;
  history.value = historyRes.data;
}

async function openCase(caseId) {
  opening.value = true;
  errorMessage.value = "";
  try {
    const response = await api.post(`/cases/${caseId}/open`, { count: 1 });
    result.value = response.data;
    auth.user = response.data.user;
    await loadAll();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Ошибка открытия кейса";
  } finally {
    opening.value = false;
  }
}

async function topup() {
  errorMessage.value = "";
  try {
    const response = await api.post("/balance/topup", { amount: Number(topupAmount.value) });
    auth.user = response.data;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Ошибка пополнения";
  }
}

onMounted(async () => {
  try {
    if (!auth.user) {
      await auth.loadProfile();
    }
    await loadAll();
  } catch (error) {
    errorMessage.value = "Не удалось загрузить данные";
  }
});
</script>

<template>
  <section class="dashboard">
    <h2>Кейсы</h2>
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

    <div class="topup">
      <h3>Пополнение баланса</h3>
      <input v-model.number="topupAmount" type="number" min="1" />
      <button @click="topup">Пополнить</button>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="panels">
      <div class="panel">
        <h3>Инвентарь</h3>
        <ul>
          <li v-for="item in inventory.slice(0, 15)" :key="item.id">
            {{ item.item_name }} - {{ item.value }} ₽ ({{ item.rarity }})
          </li>
        </ul>
      </div>
      <div class="panel">
        <h3>История открытий</h3>
        <ul>
          <li v-for="item in history.slice(0, 15)" :key="item.id">
            {{ item.case_name }} -> {{ item.item_name }} ({{ item.item_value }} ₽)
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
