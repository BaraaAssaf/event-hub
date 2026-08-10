<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import SelectButton from 'primevue/selectbutton';
import ErrorBanner from '@/components/common/ErrorBanner.vue';
import { useAuthStore } from '@/stores/auth.store.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const roles = [
  { label: 'Attend events', value: 'attendee' },
  { label: 'Organize events', value: 'organizer' },
];

const form = reactive({ name: '', email: '', password: '', role: 'attendee' });
const errors = reactive({ name: '', email: '', password: '' });
const failure = ref(null);
const submitting = ref(false);

function validate() {
  errors.name = form.name.trim().length >= 2 ? '' : 'Name must be at least 2 characters';
  errors.email = /^\S+@\S+\.\S+$/.test(form.email.trim()) ? '' : 'Enter a valid email address';
  errors.password =
    form.password.length >= 6 ? '' : 'Password must be at least 6 characters';
  return !errors.name && !errors.email && !errors.password;
}

async function submit() {
  failure.value = null;
  if (!validate()) return;

  submitting.value = true;
  try {
    const user = await auth.register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    });
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
    <h1>Create an account</h1>
    <p class="muted" style="margin-top: 0">Attend events, or run your own.</p>

    <ErrorBanner :error="failure" style="margin-bottom: 1rem" />

    <form class="stack" novalidate @submit.prevent="submit">
      <div class="field">
        <label for="name">Name</label>
        <InputText
          id="name"
          v-model="form.name"
          autocomplete="name"
          :invalid="Boolean(errors.name)"
        />
        <small v-if="errors.name" class="field__error">{{ errors.name }}</small>
      </div>

      <div class="field">
        <label for="email">Email</label>
        <InputText
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          :invalid="Boolean(errors.email)"
        />
        <small v-if="errors.email" class="field__error">{{ errors.email }}</small>
      </div>

      <div class="field">
        <label for="password">Password</label>
        <Password
          id="password"
          v-model="form.password"
          toggleMask
          fluid
          inputId="password"
          autocomplete="new-password"
          :invalid="Boolean(errors.password)"
        />
        <small v-if="errors.password" class="field__error">{{ errors.password }}</small>
      </div>

      <div class="field">
        <label>I want to</label>
        <SelectButton v-model="form.role" :options="roles" optionLabel="label" optionValue="value" />
      </div>

      <Button type="submit" label="Create account" :loading="submitting" />
    </form>

    <p class="muted" style="margin-bottom: 0">
      Already registered?
      <RouterLink :to="{ name: 'login', query: route.query }">Sign in</RouterLink>
    </p>
  </section>
</template>
