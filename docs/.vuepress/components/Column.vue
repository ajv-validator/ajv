<template>
  <div :class="side" class="column">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    side: {
      type: String,
    },
  },
}
</script>

<style lang="stylus" scoped>
.column
  margin-bottom 22px

  @media only screen and (min-width: $MQMobile)
    &.left
      width 33%
      margin-right 5%

    &.right
      width 62%
</style>
