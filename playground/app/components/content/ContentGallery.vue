<template>
  <div class="gallery">
    <div class="columns is-multiline">
      <div v-for="item in items" :key="item.image" class="column is-half">
        <ContentImage :image="item.image" :title="item.title" />
        <p>{{ item.title }}</p>
      </div>
    </div>
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
