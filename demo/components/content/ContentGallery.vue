<template>
  <div class="gallery">
    <div class="columns is-multiline">
      <div v-for="item in data" :key="item.src" class="column is-half">
        <NuxtLink :to="item.route">
          <ContentImage :src="item.image" :title="item.title" />
        </NuxtLink>
        <p>{{ item.title }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ContentImage from './ContentImage.vue'

export default {
  components: {
    ContentImage,
  },

  props: {
    data: {
      type: Array,
      required: true,
    }
  },
}
</script>
