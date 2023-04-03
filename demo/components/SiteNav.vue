<template>
  <nav class="breadcrumb" aria-label="breadcrumbs">
    <ul>
      <template v-for="(link, index) in links" :key="link.href">
        <li v-if="index < links.length - 1">
          <NuxtLink :to="link.href">{{ link.text }}</NuxtLink>
        </li>
        <li v-else class="is-active">
          <NuxtLink to="#" aria-current="page">{{ link.text }}</NuxtLink>
        </li>
      </template>
    </ul>
  </nav>
</template>

<script lang="ts">
import { defineNuxtComponent } from '#app'

function link (href: string, text: string) {
  return { href, text }
}

const links = [
  link('/', 'Home'),
  link('/:slug', ':slug'),
  link('/recipes/:slug', ':slug'),
]

export default defineNuxtComponent({
  computed: {
    links () {
      const path = this.$route.path
      if (path === '/') {
        return links.slice(0, 1)
      }
      const depth = path.split('/').length
      const segments = path.split('/')
      return links
        .slice(0, depth)
        .map((link, index) => {
          if (index === 0) {
            return link
          }
          return {
            href: segments.slice(0, index + 1).join('/'),
            text: segments[index].replace(/\W/g, ' ')
          }
        })
    }
  }
})
</script>

<style scoped>
.breadcrumb {
  text-transform: capitalize;
}
</style>
