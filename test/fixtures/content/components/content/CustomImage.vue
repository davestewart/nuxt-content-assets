<template>
  <img
    :src="src"
    class="custom-image"
  >
</template>

<script setup lang="ts">
defineProps<{ src: string }>()
</script>
