<script setup lang="ts">
/**
 * Replaces Nuxt UI's ProseImg (which renders through NuxtImg and adds zoom)
 * so the playground shows the markup the module outputs
 */
defineOptions({ inheritAttrs: false })
</script>

<template>
  <img v-bind="$attrs" class="rounded-md">
</template>
