<template>
  <div class="gallery">
    <div class="columns is-multiline">
      <div v-for="item in items" :key="item.src" class="column is-half">
        <NuxtLink :to="item.route">
          <img
            :src="item.src"
            :width="item.width"
            :height="item.height"
            :alt="item.title"
          >
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    data: {
      type: Array,
      required: true,
    }
  },

  computed: {
    items () {
      return this.data.map(item => {
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
