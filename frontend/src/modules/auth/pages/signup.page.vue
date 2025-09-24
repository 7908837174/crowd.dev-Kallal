<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <router-link
            to="/auth/signin"
            class="font-medium text-brand-500 hover:text-brand-400"
          >
            sign in to your existing account
          </router-link>
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="onSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="firstName" class="sr-only">First name</label>
            <input
              id="firstName"
              v-model="form.firstName"
              name="firstName"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
              placeholder="First name"
            />
          </div>
          <div>
            <label for="lastName" class="sr-only">Last name</label>
            <input
              id="lastName"
              v-model="form.lastName"
              name="lastName"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
              placeholder="Last name"
            />
          </div>
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
          <div>
            <label for="passwordConfirmation" class="sr-only">Confirm password</label>
            <input
              id="passwordConfirmation"
              v-model="form.passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              autocomplete="new-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
              placeholder="Confirm password"
            />
          </div>
        </div>

        <div class="flex items-center">
          <input
            id="acceptedTermsAndPrivacy"
            v-model="form.acceptedTermsAndPrivacy"
            name="acceptedTermsAndPrivacy"
            type="checkbox"
            class="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
          />
          <label for="acceptedTermsAndPrivacy" class="ml-2 block text-sm text-gray-900">
            I agree to the
            <a href="#" class="text-brand-600 hover:text-brand-500">Terms of Service</a>
            and
            <a href="#" class="text-brand-600 hover:text-brand-500">Privacy Policy</a>
          </label>
        </div>

        <!-- Error messages -->
        <div v-if="errorMessage" class="text-red-600 text-sm">
          {{ errorMessage }}
        </div>

        <div v-if="validationErrors.length > 0" class="text-red-600 text-sm space-y-1">
          <div v-for="error in validationErrors" :key="error">
            {{ error }}
          </div>
        </div>

        <div>
          <button
            id="submit"
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Creating account...' : 'Sign up' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { AuthService } from '@/modules/auth/services/auth.service';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const errorMessage = ref('');
const validationErrors = ref<string[]>([]);

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  acceptedTermsAndPrivacy: false,
});

const validateForm = (): boolean => {
  validationErrors.value = [];

  if (!form.firstName.trim()) {
    validationErrors.value.push('This field is required');
    return false;
  }

  if (!form.lastName.trim()) {
    validationErrors.value.push('This field is required');
    return false;
  }

  if (!form.email.trim()) {
    validationErrors.value.push('This field is required');
    return false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    validationErrors.value.push('Please input correct email address');
    return false;
  }

  if (!form.password) {
    validationErrors.value.push('This field is required');
    return false;
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])([^ \t]{8,})$/;
  if (!passwordRegex.test(form.password)) {
    validationErrors.value.push('Password must contain at least one letter, one number, and one special character, and be at least 8 characters long');
    return false;
  }

  if (!form.passwordConfirmation) {
    validationErrors.value.push('This field is required');
    return false;
  }

  if (form.password !== form.passwordConfirmation) {
    validationErrors.value.push('Passwords do not match');
    return false;
  }

  if (!form.acceptedTermsAndPrivacy) {
    validationErrors.value.push('Please accept terms of service and privacy policy');
    return false;
  }

  return true;
};

const onSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  validationErrors.value = [];

  try {
    await AuthService.signUp(
      form.email,
      form.password,
      route.query.invitationToken as string,
      null, // tenantId
      form.firstName,
      form.lastName,
      form.acceptedTermsAndPrivacy,
    );

    // Success - redirect to signin
    router.push('/auth/signin');
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.response?.status === 400) {
      const errorCode = error.response?.data?.error;
      switch (errorCode) {
        case 'auth.emailAlreadyInUse':
          errorMessage.value = 'This email is already registered. Please sign in instead.';
          break;
        case 'auth.passwordInvalid':
          errorMessage.value = 'Password must contain at least one letter, one number, and one special character, and be at least 8 characters long.';
          break;
        default:
          errorMessage.value = error.response?.data?.message || 'An error occurred during signup.';
      }
    } else {
      errorMessage.value = 'An unexpected error occurred. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<script lang="ts">
export default {
  name: 'AuthSignupPage',
};
</script>