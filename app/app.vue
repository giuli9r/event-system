<script setup lang="ts">
import { Analytics } from '@vercel/analytics/vue'

useHead({
  titleTemplate: (chunk?: string) =>
    (chunk && !chunk.includes('Tripu Producciones'))
      ? `${chunk} | Tripu Producciones`
      : (chunk || 'Tripu Producciones')
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Analytics />
  </UApp>
</template>
