<template>
  <div :class="type">
    <slot />
    <a class="read-more" :href="link">
      <img src="./Feature/arrow.svg" />
    </a>
  </div>
</template>

<script>
export default {
  props: {
    type: {
      type: String,
    },
    link: {
      type: String,
    },
  },
}
</script>


<style lang="stylus" scoped>
div
  margin-right 3%
  height 225px
  box-sizing border-box
  padding 28px
  border-radius 8px
  position relative
  color #fff
  margin-bottom 25px

  @media only screen and (min-width: $MQMobile)
    width 31.25%
    margin-bottom 0

  h3
    margin 0 0
    font-size 28px

    .header-anchor
      display none

  p
    font-size 20px

  &.less-code
    background-color $ajvBlueColor

  &.fast-secure
    background-color $ajvGreenColor

  &.multi-spec
    background-color $ajvRedColor

@media only screen and (min-width: $MQMobile)
  div:last-child
    margin-right 0px

a
  position absolute
  bottom 28px
  right 28px
  color #fff
</style>
