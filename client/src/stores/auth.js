import { defineStore } from "pinia";
import api from "../api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("casebattle_token") || "",
    user: null
  }),
  getters: {
    isAuthorized: (state) => Boolean(state.token && state.user)
  },
  actions: {
    async register(payload) {
      const response = await api.post("/auth/register", payload);
      this.setSession(response.data.token, response.data.user);
    },
    async login(payload) {
      const response = await api.post("/auth/login", payload);
      this.setSession(response.data.token, response.data.user);
    },
    async loadProfile() {
      if (!this.token) {
        return;
      }
      const response = await api.get("/me");
      this.user = response.data;
    },
    setSession(token, user) {
      this.token = token;
      this.user = user;
      localStorage.setItem("casebattle_token", token);
    },
    logout() {
      this.token = "";
      this.user = null;
      localStorage.removeItem("casebattle_token");
    }
  }
});
