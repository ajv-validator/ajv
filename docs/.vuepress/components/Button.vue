<template>
  <a :href="link" :class="cssClass" class="button"><slot /></a>
</template>

<script>
export default {
  props: {
    link: {
      type: String,
    },
    cssClass: {
      type: String,
    },
  },
}
</script>

<style lang="stylus" scoped>
a.button
  display block
  width 114px
  height 38px
  line-height 38px
  background-color $ajvGreenColor
  border-radius 6px
  color white
  text-align center
  font-weight 600
</style>
