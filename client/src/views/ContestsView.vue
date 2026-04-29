<script setup>
import { onMounted, ref } from "vue";
import api from "../api";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const contests = ref([]);
const message = ref("");
const errorMessage = ref("");

async function loadContests() {
  const response = await api.get("/contests");
  contests.value = response.data;
}

async function joinContest(id) {
  message.value = "";
  errorMessage.value = "";
  try {
    const response = await api.post(`/contests/${id}/join`);
    auth.user = response.data.user;
    message.value = response.data.message;
    await loadContests();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Ошибка участия";
  }
}

async function drawContest(id) {
  message.value = "";
  errorMessage.value = "";
  try {
    const response = await api.post(`/contests/${id}/draw`);
    auth.user = response.data.user;
    message.value = `Победитель: ${response.data.winner.username}, приз ${response.data.prize} ₽`;
    await loadContests();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Ошибка розыгрыша";
  }
}

onMounted(async () => {
  await loadContests();
});
</script>

<template>
  <section class="dashboard">
    <h2>Конкурсы</h2>
    <p v-if="message">{{ message }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="cases-grid">
      <div v-for="contest in contests" :key="contest.id" class="panel">
        <h3>{{ contest.title }}</h3>
        <p>Билет: {{ contest.ticketPrice }} ₽</p>
        <p>Приз: {{ contest.prize }} ₽</p>
        <p>Участников: {{ contest.participants }}</p>
        <button :disabled="contest.joined" @click="joinContest(contest.id)">
          {{ contest.joined ? "Вы участвуете" : "Участвовать" }}
        </button>
        <button @click="drawContest(contest.id)">Разыграть</button>
      </div>
    </div>
  </section>
</template>
