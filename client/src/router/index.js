import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import AuthView from "../views/AuthView.vue";
import CasesView from "../views/CasesView.vue";
import ProfileView from "../views/ProfileView.vue";
import SellView from "../views/SellView.vue";
import UpgradeView from "../views/UpgradeView.vue";
import ContestsView from "../views/ContestsView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/auth", name: "auth", component: AuthView },
    { path: "/", redirect: "/cases" },
    { path: "/cases", name: "cases", component: CasesView },
    { path: "/profile", name: "profile", component: ProfileView },
    { path: "/sell", name: "sell", component: SellView },
    { path: "/upgrade", name: "upgrade", component: UpgradeView },
    { path: "/contests", name: "contests", component: ContestsView }
  ]
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (auth.token && !auth.user) {
    try {
      await auth.loadProfile();
    } catch (error) {
      auth.logout();
    }
  }

  if (to.path !== "/auth" && !auth.token) {
    return "/auth";
  }

  if (to.path === "/auth" && auth.token) {
    return "/";
  }

  return true;
});

export default router;
