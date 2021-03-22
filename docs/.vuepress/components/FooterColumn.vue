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

.column
  img
    display block
    margin 0 auto

  &.ajv
    img
      margin 0 0
      width 100px

  &.links a
    color $textColor
    font-weight normal

  &.sponsors
    img
      width 140px
      padding 0 20px 15px
</style>
