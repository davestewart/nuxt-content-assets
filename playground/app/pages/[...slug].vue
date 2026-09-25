<script lang="ts" setup>
import { computed, queryCollection, useAsyncData, useRoute, useSeoMeta } from '#imports'

const route = useRoute()

// pages with a matching asset folder may be served with a trailing slash in dev
const path = route.path.replace(/(.)\/$/, '$1')

const { data: page } = await useAsyncData(path, () => queryCollection('content').path(path).first())

// the page's file in the repo (external pages are cloned from the repo's playground/external/ folder)
const links = computed(() => {
  if (!page.value) {
    return []
  }
  const { path, stem, extension } = page.value
  const file = path.startsWith('/external')
    ? `playground/${stem}.${extension}`
    : `playground/content/${stem}.${extension}`
  return [{
    label: 'Open page',
    icon: 'i-simple-icons-github',
    to: `https://github.com/davestewart/nuxt-content-assets/blob/main/${file}?plain=1`,
    target: '_blank',
    color: 'neutral' as const,
    variant: 'subtle' as const,
  }]
})

useSeoMeta({
  title: page.value?.title,
  description: page.value?.description,
})
</script>

<template>
  <template v-if="page">
    <UPageHeader :title="page.title" :description="page.description" :links="links" :ui="{ root: 'border-none pb-0' }" />
    <UPageBody>
      <ContentRenderer :value="page" />
    </UPageBody>
  </template>

  <UPageBody v-else>
    <UAlert
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Page not found"
      :description="`No content found for ${path}`"
    />
  </UPageBody>
</template>
