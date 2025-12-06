import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import LandingView from "../views/index.vue";
import chatView from "../views/chatView.vue";
import officeWeb from "../views/officeWeb.vue";
import SearchView from "../views/SearchView.vue";
import SearchHub from "../components/SearchHub.vue";
import vedioPhoto from "../views/vedioPhoto.vue";
import Map3DView from "../views/Map3DView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "index",
    component: LandingView,
  },
  {
    path: "/chat",
    name: "chat",
    component: chatView,
  },
  {
    path: "/office",
    name: "office",
    component: officeWeb,
  },
  {
    path: "/search",
    name: "search",
    component: SearchView,
  },
  {
    path: "/searchhub",
    name: "searchhub",
    component: SearchHub,
  },
  {
    path: "/vedioPhoto",
    name: "vedioPhoto",
    component: vedioPhoto,
  },
  {
    path: "/map3d",
    name: "map3d",
    component: Map3DView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || "/"),
  routes,
});

export default router;
