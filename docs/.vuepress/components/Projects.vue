<template>
  <div class="projects">
    <slot />
  </div>
</template>

<style lang="stylus" scoped>
.projects
  p
    max-width 1100px
    padding 0

  img
    display inline-block
    max-width 240px
    height 40px
    line-height 40px
    vertical-align middle
    @media only screen and (max-width: $MQMobile)
      max-width 160px
      height 30px
      line-height 30px

  a
    display inline-block
    height 40px
    line-height 40px
    vertical-align middle
    margin 0 36px 30px 0
    font-size 28px
    font-weight 500
    color $textColor
    @media only screen and (max-width: $MQMobile)
      margin 0 24px 20px 0
      height 30px
      line-height 30px
      font-size 20px

    &:hover
      text-decoration none

    span
      display none
</style>
