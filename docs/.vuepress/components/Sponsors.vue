<template>
  <div class="sponsors">
    <slot />
  </div>
</template>

<style lang="stylus" scoped>
.sponsors
  max-width 800px
  margin 0 auto

  p
    font-size 24px

  img
    width 100%

  a
    width 100%
    display block
    margin-bottom 10px
    @media only screen and (min-width: $MQMobileNarrow)
      width 45%
      display inline-block
      margin-bottom 0

  a:first-child
    margin-right 8%
</style>
