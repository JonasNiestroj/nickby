import { createSSRApp } from 'vue';
import App from './App.vue';
import { createRouter } from './router.js';

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export function createApp(init) {
  const app = createSSRApp(App);

  if (init) {
    init(app);
  }

  const router = createRouter();
  app.use(router);
  return { app, router };
}
