<template>
  <nav class="breadcrumb">
    <ul>
      <template v-for="(link, index) in links" :key="link.href">
        <li v-if="index < links.length - 1">
          <NuxtLink :to="link.href">
            {{ link.text }}
          </NuxtLink>
        </li>
        <li v-else class="is-active">
          <NuxtLink to="#" aria-current="page">
            {{ link.text }}
          </NuxtLink>
        </li>
      </template>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed, useRoute } from '#imports'

type Link = {
  href: string
  text: string
}

const links = computed<Link[]>(() => {
  const links = [
    { href: '/', text: 'Home' },
  ]
  const path = useRoute().path
  const segments = path.replace(/\/$/, '').split('/')
  if (path !== '/') {
    links.push({
      href: path,
      text: segments[segments.length - 1].replace(/\W/g, ' ')
    })
  }
  return links
})
</script>

<style scoped>
.breadcrumb {
  text-transform: capitalize;
}
</style>
