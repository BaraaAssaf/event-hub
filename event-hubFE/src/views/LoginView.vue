<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import ErrorBanner from '@/components/common/ErrorBanner.vue';
import { useAuthStore } from '@/stores/auth.store.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({ email: '', password: '' });
const errors = reactive({ email: '', password: '' });
const failure = ref(null);
const submitting = ref(false);

function validate() {
  errors.email = /^\S+@\S+\.\S+$/.test(form.email.trim()) ? '' : 'Enter a valid email address';
  errors.password = form.password ? '' : 'Password is required';
  return !errors.email && !errors.password;
}

async function submit() {
  failure.value = null;
  if (!validate()) return;

  submitting.value = true;
  try {
    const user = await auth.login({ email: form.email.trim(), password: form.password });
    const fallback = user.role === 'organizer' ? { name: 'organizer' } : { name: 'events' };
    await router.replace(route.query.redirect || fallback);
  } catch (err) {
    failure.value = err;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="card auth-card">
    <h1>Sign in</h1>
    <p class="muted" style="margin-top: 0">Welcome back to EventHub.</p>

    <ErrorBanner :error="failure" style="margin-bottom: 1rem" />

    <form class="stack" novalidate @submit.prevent="submit">
      <div class="field">
        <label for="email">Email</label>
        <InputText
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          :invalid="Boolean(errors.email)"
          placeholder="you@example.com"
        />
        <small v-if="errors.email" class="field__error">{{ errors.email }}</small>
      </div>

      <div class="field">
        <label for="password">Password</label>
        <Password
          id="password"
          v-model="form.password"
          :feedback="false"
          toggleMask
          fluid
          inputId="password"
          autocomplete="current-password"
          :invalid="Boolean(errors.password)"
        />
        <small v-if="errors.password" class="field__error">{{ errors.password }}</small>
      </div>

      <Button type="submit" label="Sign in" :loading="submitting" />
    </form>

    <p class="muted" style="margin-bottom: 0">
      No account yet?
      <RouterLink :to="{ name: 'register', query: route.query }">Create one</RouterLink>
    </p>
  </section>
</template>
