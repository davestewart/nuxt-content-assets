<template>
  <div class="gallery">
    <div class="columns is-multiline">
      <div v-for="item in items" class="column is-half">
        <NuxtLink :to="item.path">
          <img :src="item.image" :alt="item.title">
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: {
      type: Array,
    }
  }
}
</script>
