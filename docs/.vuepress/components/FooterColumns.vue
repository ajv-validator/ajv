<template>
  <div class="footer-columns">
    <slot />
  </div>
</template>

<style lang="stylus" scoped>
.footer-columns
  padding 20px 0 60px
  border-bottom 1px solid #C4C4C4

  @media only screen and (min-width: $MQMobile)
    display flex
</style>
