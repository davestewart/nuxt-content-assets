<script setup lang="ts">
/**
 * Example ProseImg that renders all content images with Nuxt Image
 *
 * To use, replace app/components/content/ProseImg.vue with this file
 *
 * The module writes the following attributes into the parsed HTML:
 *
 * - style="aspect-ratio:640/480"
 * - width="640"
 * - height="480"
 */
import { computed, useAttrs } from '#imports'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

const size = computed(() => {
  const { width, height } = attrs
  return width && height
    ? ` (${width}px x ${height}px)`
    : ''
})
</script>

<template>
  <figure class="p-4 border border-default rounded-lg">
    <NuxtImg
      :src="attrs.src as string"
      :alt="attrs.alt as string"
      :width="attrs.width as string"
      :height="attrs.height as string"
      :title="attrs.src as string"
      class="rounded-md bg-elevated"
    />
    <figcaption class="mt-2 text-sm text-center text-muted">
      {{ attrs.title || attrs.alt || 'Image' }}{{ size }}
    </figcaption>
  </figure>
</template>
