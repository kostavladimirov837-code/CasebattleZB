<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../api";
import { useAuthStore } from "../stores/auth";
import { FUSE_ALL_CONTRACT, FUSE_RESULT_MIN_RATIO, FUSE_RESULT_MAX_RATIO } from "../contracts";

const auth = useAuthStore();
const inventory = ref([]);
const history = ref([]);
const loading = ref(false);
const result = ref(null);
const errorMessage = ref("");

const totalInventoryValue = computed(() =>
  inventory.value.reduce((sum, item) => sum + Number(item.value || 0), 0)
);
const boundsLabel = computed(
  () =>
    `${Math.round(FUSE_RESULT_MIN_RATIO * 100)}% — ${Math.round(FUSE_RESULT_MAX_RATIO * 100)}% суммы всех скинов`
);

async function loadData() {
  const [inventoryRes, historyRes] = await Promise.all([
    api.get("/inventory"),
    api.get("/contracts/history")
  ]);
  inventory.value = inventoryRes.data;
  history.value = historyRes.data;
}

async function fuseAll() {
  errorMessage.value = "";
  result.value = null;
  loading.value = true;
  try {
    const response = await api.post("/contracts/fuse-all");
    result.value = response.data;
    auth.user = response.data.user;
    await loadData();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Не удалось выполнить контракт";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadData();
});
</script>

<template>
  <section class="dashboard neo-page">
    <h2 class="neo-title">Контракты</h2>

    <div class="panel neo-card">
      <h3 class="neo-subtitle">{{ FUSE_ALL_CONTRACT.title }}</h3>
      <p class="neo-muted">{{ FUSE_ALL_CONTRACT.description }}</p>
      <p class="neo-muted">
        Диапазон итога: от <strong>{{ boundsLabel }}</strong> (сумма всех ваших скинов сейчас:
        {{ totalInventoryValue }} ₽).
      </p>

      <p>
        В инвентаре: {{ inventory.length }} шт.,
        сумма {{ totalInventoryValue }} ₽
      </p>

      <button
        class="cb-btn cb-btn-primary"
        type="button"
        :disabled="loading || inventory.length === 0"
        @click="fuseAll"
      >
        {{ loading ? "Объединение…" : "Слить все скины в один" }}
      </button>
    </div>

    <div class="result-card neo-card" v-if="result">
      <p>
        Списано скинов: {{ result.consumed.length }}, их сумма до контракта:
        {{ result.totalInput }} ₽
      </p>
      <p>
        Получено: {{ result.merged.item_name }} — стоимость
        {{ result.resultValue }} ₽
      </p>
      <p v-if="result.totalInput > 0" class="neo-muted">
        Это около {{ ((result.resultValue / result.totalInput) * 100).toFixed(1) }}% от суммы входа (цель случайная в
        заданном диапазоне).
      </p>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="panel neo-card">
      <h3 class="neo-subtitle">История контрактов</h3>
      <ul class="contracts-history-list">
        <li v-for="row in history" :key="row.id">
          Слияние {{ row.consumedCount }} шт.: вход {{ row.totalInput }} ₽ → результат
          {{ row.resultValue }} ₽
          <template v-if="row.ratioApprox != null">
            (×{{ Number(row.ratioApprox).toFixed(2) }})
          </template>
        </li>
      </ul>
      <p v-if="!history.length" class="neo-muted">Пока пусто</p>
    </div>
  </section>
</template>

<style scoped>
.contracts-history-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.contracts-history-list li + li {
  margin-top: 0.35rem;
}
</style>
