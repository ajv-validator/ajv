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

  a
    display inline-block
    height 40px
    line-height 40px
    vertical-align middle
    margin 0 36px 30px 0
    font-size 28px
    font-weight 500
    color $textColor

    &:hover
      text-decoration none

    span
      display none
</style>
