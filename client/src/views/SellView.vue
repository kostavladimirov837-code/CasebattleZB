<script setup>
import { onMounted, ref } from "vue";
import api from "../api";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const inventory = ref([]);
const message = ref("");
const errorMessage = ref("");
const sellingId = ref(null);

async function loadInventory() {
  const response = await api.get("/inventory");
  inventory.value = response.data;
}

async function sellItem(id) {
  if (sellingId.value !== null) {
    return;
  }
  message.value = "";
  errorMessage.value = "";
  sellingId.value = id;
  try {
    const response = await api.post(`/inventory/${id}/sell`);
    auth.user = response.data.user;
    message.value = `Продано: ${response.data.sold.item_name} за ${response.data.sold.value} ₽`;
    await loadInventory();
  } catch (error) {
    const serverMessage = error.response?.data?.message;
    errorMessage.value = serverMessage || "Ошибка продажи, попробуйте еще раз";
  } finally {
    sellingId.value = null;
  }
}

onMounted(async () => {
  await loadInventory();
});
</script>

<template>
  <section class="dashboard neo-page">
    <h2 class="neo-title">Продажа скинов</h2>
    <p class="neo-muted">Продавайте скины из инвентаря и пополняйте баланс.</p>
    <p v-if="message" class="neo-success">{{ message }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="panel neo-card">
      <ul>
        <li v-for="item in inventory" :key="item.id" class="inventory-row">
          <span>{{ item.item_name }} ({{ item.value }} ₽)</span>
          <button class="cb-btn cb-btn-primary" :disabled="sellingId === item.id || sellingId !== null" @click="sellItem(item.id)">
            {{ sellingId === item.id ? "Продаем..." : "Продать" }}
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>
