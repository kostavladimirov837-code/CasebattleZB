<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../api";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const caseData = ref(null);
const loadingCase = ref(true);
const spinning = ref(false);
const finished = ref(false);
const errorMessage = ref("");
const openResult = ref(null);
const decisionDone = ref(false);
const instantActionLoading = ref(false);
const decisionMessage = ref("");
const reelItems = ref([]);
const offset = ref(0);
const spinnerViewport = ref(null);
const ITEM_WIDTH = 164;
const ITEM_GAP = 12;

const canOpen = computed(() => !!caseData.value && !spinning.value);
const canDecide = computed(
  () => finished.value && openResult.value && !decisionDone.value && !instantActionLoading.value
);

function normalizeItem(item, idx) {
  return {
    id: `${item.name}-${idx}`,
    name: item.name,
    rarity: item.rarity,
    value: item.value
  };
}

async function loadCase() {
  loadingCase.value = true;
  errorMessage.value = "";
  try {
    const response = await api.get("/cases");
    const caseId = Number(route.params.id);
    const found = response.data.find((item) => item.id === caseId);
    if (!found) {
      errorMessage.value = "Кейс не найден";
      return;
    }
    caseData.value = found;
    reelItems.value = found.items.map((item, idx) => normalizeItem(item, idx));
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Не удалось загрузить кейс";
  } finally {
    loadingCase.value = false;
  }
}

function rarityClass(rarity) {
  const value = String(rarity || "").toLowerCase();
  if (value.includes("knife") || value.includes("gloves")) return "rare-knife";
  if (value.includes("covert")) return "rare-red";
  if (value.includes("classified")) return "rare-pink";
  if (value.includes("restricted")) return "rare-purple";
  if (value.includes("mil-spec")) return "rare-blue";
  return "rare-gray";
}

function buildSpinList(wonItem) {
  const source = caseData.value?.items || [];
  const spinList = [];
  for (let i = 0; i < 42; i += 1) {
    const rnd = source[Math.floor(Math.random() * source.length)];
    spinList.push(normalizeItem(rnd, i));
  }
  const targetIndex = 36;
  spinList[targetIndex] = normalizeItem(wonItem, targetIndex);
  return { spinList, targetIndex };
}

async function openCase() {
  if (!canOpen.value) return;
  spinning.value = true;
  finished.value = false;
  errorMessage.value = "";
  decisionMessage.value = "";
  decisionDone.value = false;
  openResult.value = null;
  offset.value = 0;

  try {
    const response = await api.post(`/cases/${caseData.value.id}/open`, { count: 1 });
    const wonItem = response.data.items[0];
    auth.user = response.data.user;
    openResult.value = response.data;

    const { spinList, targetIndex } = buildSpinList(wonItem);
    reelItems.value = spinList;

    requestAnimationFrame(() => {
      const viewportWidth = spinnerViewport.value?.clientWidth || 0;
      const itemPitch = ITEM_WIDTH + ITEM_GAP;
      const targetCenter = targetIndex * itemPitch + ITEM_WIDTH / 2;
      offset.value = viewportWidth / 2 - targetCenter;
    });

    setTimeout(() => {
      finished.value = true;
      spinning.value = false;
    }, 4200);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Ошибка открытия кейса";
    spinning.value = false;
  }
}

async function sellWonItem() {
  if (!canDecide.value) return;
  const inventoryItemId = Number(openResult.value?.inventoryItemId);
  if (!inventoryItemId) {
    errorMessage.value = "Не удалось продать предмет";
    return;
  }
  instantActionLoading.value = true;
  errorMessage.value = "";
  try {
    const response = await api.post(`/inventory/${inventoryItemId}/sell`);
    auth.user = response.data.user;
    decisionDone.value = true;
    decisionMessage.value = `Скин продан за ${response.data.sold.value} ₽`;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Ошибка продажи скина";
  } finally {
    instantActionLoading.value = false;
  }
}

function keepWonItem() {
  if (!canDecide.value) return;
  decisionDone.value = true;
  decisionMessage.value = "Скин оставлен в инвентаре";
}

onMounted(async () => {
  await loadCase();
});
</script>

<template>
  <section class="dashboard neo-page case-open-page">
    <div class="case-open-top">
      <button class="cb-btn cb-btn-ghost" @click="router.push('/cases')">Назад к кейсам</button>
    </div>

    <div v-if="loadingCase" class="neo-card panel">Загрузка кейса...</div>
    <div v-else-if="errorMessage && !caseData" class="neo-card panel error">{{ errorMessage }}</div>

    <template v-else>
      <div class="neo-card panel">
        <h2 class="neo-title">{{ caseData.name }}</h2>
        <p class="neo-muted">Цена открытия: {{ Number(caseData.price).toFixed(2) }} ₽</p>
      </div>

      <div class="case-spinner-wrap neo-card">
        <div class="case-pointer"></div>
        <div
          ref="spinnerViewport"
          class="case-spinner-viewport"
        >
          <div class="case-reel" :style="{ transform: `translateX(${offset}px)` }" :class="{ spinning }">
          <article
            v-for="item in reelItems"
            :key="item.id"
            class="reel-item"
            :class="rarityClass(item.rarity)"
          >
            <h4>{{ item.name }}</h4>
            <p>{{ item.value }} ₽</p>
            <span>{{ item.rarity }}</span>
          </article>
          </div>
        </div>
      </div>

      <div class="case-open-actions">
        <button class="cb-btn cb-btn-primary" :disabled="!canOpen" @click="openCase">
          {{ spinning ? "Открываем..." : "Открыть кейс" }}
        </button>
      </div>

      <div v-if="finished && openResult" class="result-card neo-card">
        <h3 class="neo-subtitle">Вы выбили</h3>
        <p>{{ openResult.items[0].name }} ({{ openResult.items[0].value }} ₽)</p>
        <p>Потрачено: {{ openResult.spent }} ₽</p>
        <p>Профит: {{ openResult.profit }} ₽</p>
        <div v-if="!decisionDone" class="case-decision">
          <p class="neo-muted">Что сделать со скином?</p>
          <div class="case-decision-actions">
            <button class="cb-btn cb-btn-primary" :disabled="!canDecide" @click="sellWonItem">
              {{ instantActionLoading ? "Продаем..." : "Продать сразу" }}
            </button>
            <button class="cb-btn cb-btn-ghost" :disabled="!canDecide" @click="keepWonItem">
              Оставить в инвентаре
            </button>
          </div>
        </div>
        <p v-else class="neo-success">{{ decisionMessage }}</p>
      </div>

      <p v-if="errorMessage && caseData" class="error">{{ errorMessage }}</p>
    </template>
  </section>
</template>
