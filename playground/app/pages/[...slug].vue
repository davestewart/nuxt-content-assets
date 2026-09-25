<script lang="ts" setup>
import { queryContent, useAsyncData, useRoute, useSeoMeta } from '#imports'

const route = useRoute()

// pages with a matching asset folder may be served with a trailing slash in dev
const path = route.path.replace(/(.)\/$/, '$1')

const { data: page } = await useAsyncData(path, () => queryContent(path).findOne())

useSeoMeta({
  title: page.value?.title,
  description: page.value?.description,
})
</script>

<template>
  <template v-if="page">
    <UPageHeader :title="page.title" :description="page.description" :ui="{ root: 'border-none pb-0' }" />
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
