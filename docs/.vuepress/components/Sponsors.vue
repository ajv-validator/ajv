<template>
  <div class="sponsors" :class="level">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    level: {
      type: String,
    },
  },
}
</script>

<style lang="stylus" scoped>
.sponsors
  max-width 800px
  margin 0 auto

  h2
    margin-left 0
    text-decoration none

    a.header-anchor
      width auto
      margin-right 0
  p
    font-size 24px

  &.platinum, &.gold, &.bronze
    img
      width 100%
    a
      margin-bottom 10px
      display inline-block
      @media only screen and (min-width: $MQMobileNarrow)
        margin-bottom 0
    a:last-child
      margin-right 0

  &.platinum
    a
      width 100%
      display block
      @media only screen and (min-width: $MQMobileNarrow)
        display inline-block
        width 45%
        margin-right 8%

  &.gold
    a
      width 45%
      margin-right 4%
      @media only screen and (min-width: $MQMobileNarrow)
        width 31%
        margin-right 2%

  &.bronze
    a
      width 45%
      margin-right 4%
      @media only screen and (min-width: $MQMobileNarrow)
        width 22%
        margin-right 3%

</style>
