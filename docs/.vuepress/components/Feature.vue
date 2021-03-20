<template>
<div :class="type" class="feature">
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
  display inline-block
  float left
  margin 10px
  width 220px
  height 200px
  border-radius 8px

  &.less-code
    background-color #23c8d2
  &.fast-secure
    background-color #409cff
  &.multi-spec
    background-color #f5775b
</style>
