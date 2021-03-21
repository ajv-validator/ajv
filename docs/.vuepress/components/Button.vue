<template>
  <a :href="link" :class="class">{{ text }}</a>
</template>

<script>
export default {
  props: {
    link: {
      type: String,
    },
    class: {
      type: String,
    },
    text: {
      type: String,
    },
  },
}
</script>

<style lang="stylus" scoped>
a
  display block
  width 114px
  height 40px
  line-height 40px
  background-color $ajvGreenColor
  border-radius 6px
  color white
  text-align center
  font-weight 600
</style>
