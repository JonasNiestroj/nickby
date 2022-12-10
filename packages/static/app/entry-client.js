import { createApp } from './main';
import init from '@nickby/init';

const { app, router } = createApp(init);

// wait until router is ready before mounting to ensure hydration match
router.isReady().then(() => {
  app.mount('#app');
});
