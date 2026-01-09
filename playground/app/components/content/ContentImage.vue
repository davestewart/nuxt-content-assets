<template>
  <img
    class="content-image"
    :src="info.src"
    :width="info.width"
    :height="info.height"
    :alt="title ?? ''"
  >
</template>

<script lang="ts" setup>
import { computed } from '#imports'

const props = defineProps<{
  image: string
  title?: string
}>()

const info = computed(() => {
  const [src, query] = props.image.split('?')
  const params = new URLSearchParams(query)
  return {
    src,
    width: Number(params.get('width')) || undefined,
    height: Number(params.get('height')) || undefined,
  }
})
</script>

<style>
.content-image {
  display: block;
  margin: 1rem auto;
  max-width: 100%;
  border-radius: 2%;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.3);
}
</style>
