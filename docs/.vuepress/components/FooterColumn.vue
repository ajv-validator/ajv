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
    color #292828

  &.sponsors
    img
      width 140px

    p:last-child img
      width 140px
      display block
      padding 10px 20px
      box-sizing border-box
      background-color white
</style>
