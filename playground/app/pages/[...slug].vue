<script lang="ts" setup>
import { computed, queryContent, useAsyncData, useRoute, useSeoMeta } from '#imports'

const route = useRoute()

// pages with a matching asset folder may be served with a trailing slash in dev
const path = route.path.replace(/(.)\/$/, '$1')

const { data: page } = await useAsyncData(path, () => queryContent(path).findOne())

// content sources, and their folders in the repo (external files include the source's "external/" prefix)
const folders: Record<string, string> = {
  content: 'playground/content',
  ds: 'playground',
}

const links = computed(() => {
  const folder = page.value && folders[page.value._source]
  return folder
    ? [{
        label: 'Open page',
        icon: 'i-simple-icons-github',
        to: `https://github.com/davestewart/nuxt-content-assets/blob/main/${folder}/${page.value!._file}?plain=1`,
        target: '_blank',
        color: 'neutral' as const,
        variant: 'subtle' as const,
      }]
    : []
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
