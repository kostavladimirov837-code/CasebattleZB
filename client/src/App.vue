<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
const router = useRouter();
const isAuthPage = computed(() => router.currentRoute.value.path === "/auth");
const links = [
  { to: "/cases", label: "Кейсы" },
  { to: "/profile", label: "Личный кабинет" },
  { to: "/sell", label: "Продажа скинов" },
  { to: "/upgrade", label: "Апгрейды" },
  { to: "/contests", label: "Конкурсы" }
];

function logout() {
  auth.logout();
  router.push("/auth");
}
</script>

<template>
  <div class="app-layout">
    <header class="topbar" v-if="!isAuthPage">
      <div>
        <strong>CaseBattle</strong>
      </div>
      <nav class="main-nav">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</RouterLink>
      </nav>
      <div class="user-info">
        <span>{{ auth.user?.username }}</span>
        <span>Баланс: {{ auth.user?.balance ?? 0 }} ₽</span>
        <button @click="logout">Выйти</button>
      </div>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>
