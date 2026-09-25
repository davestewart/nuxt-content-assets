<template>
  <img
    class="rounded-lg shadow-lg"
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
