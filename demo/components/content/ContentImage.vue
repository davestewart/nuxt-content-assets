<template>
  <img
    :src="info.src"
    :width="info.width"
    :height="info.height"
    :alt="title"
  >
</template>

<script>
export default {
  global: true,

  props: {
    image: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
  },

  computed: {
    info () {
      return parseImageInfo(this.image)
    },
  }
}

/**
 * Parse src, width and height from URL
 */
function parseImageInfo (url = '') {
  const [src, query] = url.split('?')
  const params = new URLSearchParams(query)
  return {
    src,
    width: Number(params.get('width')) || undefined,
    height: Number(params.get('height')) || undefined,
  }
}
</script>
