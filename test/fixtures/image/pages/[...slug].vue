<template>
  <main>
    <ContentRenderer
      v-if="data"
      :value="data"
    />
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const { data } = await useAsyncData(route.path, () => queryCollection('content').path(route.path).first())

// 404 rather than an empty page, so tests can tell unserved assets apart
if (!data.value && import.meta.server) {
  setResponseStatus(useRequestEvent()!, 404)
}
</script>
