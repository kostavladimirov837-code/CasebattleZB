<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const mode = ref("login");
const loading = ref(false);
const errorMessage = ref("");

const form = reactive({
  username: "",
  password: ""
});

async function submit() {
  loading.value = true;
  errorMessage.value = "";
  try {
    if (mode.value === "register") {
      await auth.register(form);
    } else {
      await auth.login(form);
    }
    router.push("/");
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Ошибка запроса";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="auth-container">
    <div class="auth-card">
      <h1>CaseBattle</h1>
      <p>Вход и регистрация через внутреннюю базу данных</p>

      <div class="tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Вход</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">Регистрация</button>
      </div>

      <form @submit.prevent="submit" class="auth-form">
        <input v-model.trim="form.username" type="text" placeholder="Логин" required />
        <input v-model="form.password" type="password" placeholder="Пароль (минимум 6 символов)" required />
        <button type="submit" :disabled="loading">
          {{ loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт" }}
        </button>
      </form>

      <p class="error" v-if="errorMessage">{{ errorMessage }}</p>
    </div>
  </section>
</template>
