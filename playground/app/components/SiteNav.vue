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

<script lang="ts">
import { defineNuxtComponent } from '#imports'

function link (href: string, text: string) {
  return { href, text }
}

export default defineNuxtComponent({
  computed: {
    links () {
      const links = [
        link('/', 'Home'),
      ]
      const path = this.$route.path
      const segments = path.replace(/\/$/, '').split('/')
      if (path !== '/') {
        links.push({
          href: path,
          text: segments[segments.length - 1].replace(/\W/g, ' ')
        })
      }
      return links
    }
  }
})
</script>

<style scoped>
.breadcrumb {
  text-transform: capitalize;
}
</style>
