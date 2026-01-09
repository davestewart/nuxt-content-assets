<script lang="ts" setup>
import { queryContent, useRoute } from '#imports'
import { useAsyncData } from '#app'

const route = useRoute()
const { data, error } = await useAsyncData(route.path, () => queryContent(route.path ?? '/').findOne())
</script>

<template>
  <main>
    <article v-if="data">
      <!-- 'list' transformer content -->
      <template v-if="data._extension === 'list'">
        <p>This is a custom "list" transformer:</p>
        <ul>
          <li v-for="item in data.body" :key="item">{{ item }}</li>
        </ul>
      </template>

      <!-- any other markdown content -->
      <article v-else>
        <ContentRenderer :value="data" />
      </article>
    </article>

    <!-- 404 not found -->
    <template v-else-if="error">
      <p>No content found for "{{ route.path }}"</p>
      <pre>{{ error.data }}</pre>
    </template>
  </main>
</template>
