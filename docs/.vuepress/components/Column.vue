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
  &.left
    width 33%
    margin-right 5%

  &.right
    width 62%
</style>
