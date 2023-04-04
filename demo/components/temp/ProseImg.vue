<template>
  <span class="image">
    <img
      :src="$attrs.src"
      :alt="$attrs.title"
      :width="$attrs.width"
      :height="$attrs.height"
      :title="$attrs.src"
    >
    <label>{{ $attrs.title || $attrs.alt || 'Image' }}{{ size }}</label>
  </span>
</template>

<script>

/**
 * The following attributes are written into the parsed HTML:
 *
 * - style="aspect-ratio=640/480"
 * - data-width="640"
 * - data-height="480"
 */
export default {
  inheritAttrs: false,

  computed: {
    size () {
      const width = this.$attrs['data-width']
      const height = this.$attrs['data-height']
      return width && height
        ? ` (${width}px x ${height}px)`
        : ''
    }
  }
}
</script>

<style>
.image {
  padding: 1rem;
  border: 1px solid #EEE;
  border-radius: 8px;
  margin: .5rem 0;
}

.image img {
  background: #EEE;
  border-radius: 3px;
}

.image label {
  display: block;
  margin-top: .5rem;
  margin-bottom: -.5rem;
  text-align: center;
  font-size: .8em;
}
</style>
