<template>
  <div class="not-prose grid grid-cols-1 sm:grid-cols-2 gap-6 my-6">
    <figure v-for="item in items" :key="item.image">
      <ContentImage :image="item.image" :title="item.title" />
      <figcaption class="mt-2 text-sm text-center text-muted">
        {{ item.title }}
      </figcaption>
    </figure>
  </div>
</template>

<script setup lang="ts">
import ContentImage from './ContentImage.vue'

defineProps<{
  items: Array<{
    image: string
    title: string
  }>
}>()
</script>
