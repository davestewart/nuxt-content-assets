<template>
  <div class="gallery">
    <div class="columns is-multiline">
      <div v-for="image in images" class="column is-half">
        <NuxtLink :to="image.route">
          <img :src="image.src"
               :width="image.width"
               :height="image.height"
               :alt="image.title"
          >
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
  },

  computed: {
    images () {
      return this.items.map(item => {
        const { route, title, image } = item
        return {
          route,
          title,
          ...parseImageInfo(image)
        }
      })
    }
  }
}

/**
 * Parse src, width and height from URL
 */
function parseImageInfo (url) {
  const [src, query] = url.split('?')
  const params = new URLSearchParams(query)
  return {
    src,
    width: Number(params.get('width')) || undefined,
    height: Number(params.get('height')) || undefined,
  }
}

</script>
