<template>
  <div>
    <ContentRenderer v-if="page" :value="page" />
    <pre id="meta">{{ JSON.stringify({ cover: page?.cover, gallery: page?.meta?.gallery }) }}</pre>
  </div>
</template>

<script setup lang="ts">
const { data: page } = await useAsyncData('post', () => queryCollection('content').path('/posts').first())
</script>
