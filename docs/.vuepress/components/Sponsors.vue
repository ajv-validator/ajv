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
    width 45%
    display inline-block

  a:first-child
    margin-right 8%
</style>
