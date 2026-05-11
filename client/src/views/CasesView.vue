<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../api";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const cases = ref([]);
const errorMessage = ref("");
const battles = ref([
  {
    player1: "ShadowX",
    player2: "ToxicAim",
    caseName: "Elite Battle",
    prize: "183 ₽"
  },
  {
    player1: "Flexer",
    player2: "NightWolf",
    caseName: "Legend Battle",
    prize: "420 ₽"
  },
  {
    player1: "Cyber",
    player2: "Ghosty",
    caseName: "Quick Clash",
    prize: "96 ₽"
  }
]);

function caseGlow(caseItem, index) {
  const level = String(caseItem.rarity || caseItem.name || "").toLowerCase();
  if (level.includes("legend")) return "legend";
  if (level.includes("elite") || level.includes("epic")) return "elite";
  if (index % 3 === 0) return "starter";
  if (index % 3 === 1) return "elite";
  return "legend";
}

async function loadCases() {
  const response = await api.get("/cases");
  cases.value = response.data;
}

function openCase(caseId) {
  router.push(`/cases/${caseId}/open`);
}

onMounted(async () => {
  await loadCases();
});
</script>

<template>
  <section class="cb-landing">
    <div class="cb-bg"></div>

    <div class="cb-hero">
      <div>
        <div class="cb-badge">Real-time Case Battles</div>
        <h2 class="cb-title">
          Open Cases.
          <br />
          <span>Win Big.</span>
        </h2>
        <p class="cb-subtitle">
          Платформа кейс-баттлов с живыми открытиями, апгрейдами и прозрачной механикой выпадений.
        </p>
        <div class="cb-actions">
          <button class="cb-btn cb-btn-primary" @click="$router.push('/contests')">Start Battle</button>
          <button class="cb-btn cb-btn-ghost" @click="$router.push('/upgrade')">Watch Live</button>
        </div>
        <div class="cb-stats">
          <div class="cb-stat">
            <h3>24K+</h3>
            <p>Active Players</p>
          </div>
          <div class="cb-stat">
            <h3>1.2M</h3>
            <p>Cases Opened</p>
          </div>
          <div class="cb-stat">
            <h3>{{ Number(auth.user?.balance ?? 0).toFixed(2) }} ₽</h3>
            <p>Your Balance</p>
          </div>
        </div>
      </div>
      <div class="cb-live-card">
        <h3>Live Feed</h3>
        <p>Последние баттлы и открытия обновляются в реальном времени.</p>
      </div>
    </div>

    <div class="cb-section-title" id="cases">Cases</div>
    <div class="cb-case-grid">
      <article
        v-for="(caseItem, index) in cases"
        :key="caseItem.id"
        class="cb-case-card"
        :class="'cb-glow-' + caseGlow(caseItem, index)"
      >
        <h4>{{ caseItem.name }}</h4>
        <p class="cb-case-price">{{ Number(caseItem.price).toFixed(2) }} ₽</p>
        <p class="cb-case-meta">Drop rate: {{ caseItem.dropRate ?? "N/A" }}</p>
        <button class="cb-btn cb-btn-primary" @click="openCase(caseItem.id)">
          Открыть кейс
        </button>
      </article>
    </div>

    <div class="cb-section-title" id="battles">Battles</div>
    <div class="cb-battle-grid">
      <article v-for="battle in battles" :key="battle.player1 + battle.player2" class="cb-battle-card">
        <h4>{{ battle.caseName }}</h4>
        <p>{{ battle.player1 }} vs {{ battle.player2 }}</p>
        <strong>{{ battle.prize }}</strong>
      </article>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </section>
</template>
