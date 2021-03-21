<template>
  <div :class="type" class="column">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    type: {
      type: String,
    },
  },
}
</script>

<style lang="stylus" scoped>
div
  width 25%
  margin auto

.column
  img
    display block
    margin-left auto
    margin-right auto

  &.ajv
    img
      width 80px
      filter grayscale(100%)

  &.links
    a
      color #292828

  &.sponsors
    img
      width 140px
</style>
