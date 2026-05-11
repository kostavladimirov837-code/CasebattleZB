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
  { to: "/contracts", label: "Контракты" },
  { to: "/contests", label: "Конкурсы" }
];

function logout() {
  auth.logout();
  router.push("/auth");
}
</script>

<template>
  <div class="app-layout" :class="{ 'app-layout--auth': isAuthPage }">
    <header class="topbar" v-if="!isAuthPage">
      <div class="brand-wrap">
        <RouterLink to="/cases" class="brand-link">
          <strong class="brand-logo">CASEBATTLE</strong>
        </RouterLink>
      </div>
      <nav class="main-nav" aria-label="Основное меню">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</RouterLink>
      </nav>
      <div class="user-info">
        <span class="user-chip user-chip--accent">{{ auth.user?.username }}</span>
        <span class="user-chip">Баланс: {{ Number(auth.user?.balance ?? 0).toFixed(2) }} ₽</span>
        <button type="button" class="cb-btn cb-btn-primary cb-btn--compact" @click="logout">Выйти</button>
      </div>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
    <footer v-if="!isAuthPage" class="app-footer">
      <span class="app-footer__credit">
        Разработка:
        <a href="https://github.com/Jwiqen" target="_blank" rel="noopener noreferrer">Jwiqen</a>
      </span>
    </footer>
  </div>
</template>
