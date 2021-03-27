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
  height 200px
  box-sizing border-box
  padding 28px
  border-radius 8px
  position relative
  color #fff
  margin-bottom 25px

  @media only screen and (min-width: $MQMobileNarrow)
    height 160px

  @media only screen and (min-width: $MQMobile)
    width 31.25%
    height 225px
    margin-right 3%
    margin-bottom 0

  h3
    margin 0 0
    @media only screen and (min-width: $MQNarrow)
      font-size 1.75em

    .header-anchor
      display none

  p
    @media only screen and (min-width: $MQNarrow)
      font-size 1.25em

  &.less-code
    background-color $ajvGreenColor

  &.fast-secure
    background-color $ajvBlueColor

  &.multi-spec
    background-color $ajvRedColor

@media only screen and (min-width: $MQMobile)
  div:last-child
    margin-right 0

a
  position absolute
  bottom 24px
  right 24px
  color #fff
</style>
