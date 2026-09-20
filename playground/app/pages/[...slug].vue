<script lang="ts" setup>
import { queryCollection, useAsyncData, useRoute } from '#imports'

const route = useRoute()
const path = route.path.replace(/\/$/, '') || '/'
const { data, error } = await useAsyncData(path, () => queryCollection('content').path(path).first())
</script>

<template>
  <main>
    <article v-if="data">
      <ContentRenderer :value="data" />
    </article>

    <!-- 404 not found -->
    <template v-else>
      <p>No content found for "{{ route.path }}"</p>
      <pre v-if="error">{{ error }}</pre>
    </template>
  </main>
</template>
