<script setup>
import { onMounted, ref } from "vue";
import api from "../api";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const history = ref([]);
const inventoryCount = ref(0);
const topupAmount = ref(500);
const message = ref("");
const errorMessage = ref("");

async function loadData() {
  const [historyRes, inventoryRes] = await Promise.all([
    api.get("/history"),
    api.get("/inventory")
  ]);
  history.value = historyRes.data;
  inventoryCount.value = inventoryRes.data.length;
}

async function topup() {
  message.value = "";
  errorMessage.value = "";
  try {
    const response = await api.post("/balance/topup", { amount: Number(topupAmount.value) });
    auth.user = response.data;
    message.value = "Баланс успешно пополнен";
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Ошибка пополнения";
  }
}

onMounted(async () => {
  await loadData();
});
</script>

<template>
  <section class="dashboard neo-page">
    <h2 class="neo-title">Личный кабинет</h2>
    <div class="panel neo-card">
      <p><strong>Пользователь:</strong> {{ auth.user?.username }}</p>
      <p><strong>Баланс:</strong> {{ Number(auth.user?.balance ?? 0).toFixed(2) }} ₽</p>
      <p><strong>Скинов в инвентаре:</strong> {{ inventoryCount }}</p>
    </div>

    <div class="topup neo-card">
      <h3 class="neo-subtitle">Пополнить баланс</h3>
      <input v-model.number="topupAmount" type="number" min="1" />
      <button class="cb-btn cb-btn-primary" @click="topup">Пополнить</button>
      <p v-if="message" class="neo-success">{{ message }}</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>

    <div class="panel neo-card">
      <h3 class="neo-subtitle">История открытий</h3>
      <ul>
        <li v-for="item in history" :key="item.id">
          {{ item.case_name }} -> {{ item.item_name }} ({{ item.item_value }} ₽)
        </li>
      </ul>
    </div>
  </section>
</template>
