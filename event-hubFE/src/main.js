import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

import App from './App.vue';
import { router } from './router/index.js';
import { setUnauthorizedHandler } from './api/client.js';
import { useAuthStore } from './stores/auth.store.js';

import 'primeicons/primeicons.css';
import './styles/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.app-dark',
      cssLayer: { name: 'primevue', order: 'theme, base, primevue' },
    },
  },
});
app.use(router);

const auth = useAuthStore();
setUnauthorizedHandler(() => {
  auth.clear();
  const current = router.currentRoute.value;
  if (current.name === 'login') return;
  router.push({ name: 'login', query: { redirect: current.fullPath } });
});

app.mount('#app');
