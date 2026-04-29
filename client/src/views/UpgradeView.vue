<script setup>
import { onMounted, ref } from "vue";
import api from "../api";

const inventory = ref([]);
const history = ref([]);
const selectedItemId = ref(null);
const multiplier = ref(2);
const result = ref(null);
const errorMessage = ref("");

async function loadData() {
  const [inventoryRes, historyRes] = await Promise.all([
    api.get("/inventory"),
    api.get("/upgrades/history")
  ]);
  inventory.value = inventoryRes.data;
  history.value = historyRes.data;
}

async function upgrade() {
  errorMessage.value = "";
  result.value = null;
  try {
    const response = await api.post("/upgrade", {
      itemId: Number(selectedItemId.value),
      multiplier: Number(multiplier.value)
    });
    result.value = response.data;
    await loadData();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Ошибка апгрейда";
  }
}

onMounted(async () => {
  await loadData();
});
</script>

<template>
  <section class="dashboard">
    <h2>Апгрейды</h2>
    <div class="panel">
      <label>Скин для апгрейда:</label>
      <select v-model="selectedItemId">
        <option :value="null" disabled>Выберите предмет</option>
        <option v-for="item in inventory" :key="item.id" :value="item.id">
          {{ item.item_name }} ({{ item.value }} ₽)
        </option>
      </select>

      <label>Множитель:</label>
      <select v-model="multiplier">
        <option :value="1.5">x1.5</option>
        <option :value="2">x2</option>
        <option :value="3">x3</option>
        <option :value="5">x5</option>
      </select>

      <button @click="upgrade">Запустить апгрейд</button>
    </div>

    <div class="result-card" v-if="result">
      <p>Шанс: {{ Math.round(result.chance * 100) }}%</p>
      <p v-if="result.success">Успех! Новый скин: {{ result.reward.item_name }} ({{ result.reward.value }} ₽)</p>
      <p v-else class="error">Неудача: скин сгорел</p>
    </div>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="panel">
      <h3>История апгрейдов</h3>
      <ul>
        <li v-for="item in history" :key="item.id">
          {{ item.source_item_name }} x{{ item.multiplier }} ->
          {{ item.success ? item.new_item_name : "Неудача" }}
        </li>
      </ul>
    </div>
  </section>
</template>
