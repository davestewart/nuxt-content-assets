<script setup lang="ts">
import { computed, useRoute } from '#imports'
import { menu } from './menu'

const route = useRoute()

// pages with a matching asset folder may be served with a trailing slash in dev
const items = computed(() => {
  const path = route.path.replace(/(.)\/$/, '$1')
  return menu.map(group => group.map(item => item.to ? { ...item, active: item.to === path } : item))
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <UHeader title="Nuxt Content Assets">
      <template #right>
        <UButton
          to="https://github.com/davestewart/nuxt-content-assets"
          target="_blank"
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          aria-label="GitHub"
        />
      </template>

      <template #body>
        <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>

    <UMain>
      <UContainer>
        <UPage>
          <template #left>
            <UPageAside>
              <UNavigationMenu :items="items" orientation="vertical" highlight class="-mx-2.5" />
            </UPageAside>
          </template>

          <NuxtPage />
        </UPage>
      </UContainer>
    </UMain>
  </UApp>
</template>
