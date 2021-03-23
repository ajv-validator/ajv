<template>
  <div class="home-section" :class="section">
    <div class="section-content">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    section: {
      type: String,
    },
  },
}
</script>

<style lang="stylus" scoped>
.home-section
  width 100%
  padding 50px 0
  padding-top $navbarHeight

  .section-content
    max-width 1000px
    padding 0 50px
    margin 0 auto


  & >>> .theme-code-block
    margin-top 12px

  &.contributors
    background linear-gradient(295.26deg, rgba(232, 232, 232, 0.8) 26.65%, rgba(255, 255, 255, 0.04) 83.48%)

  &.footer
    background linear-gradient(295.26deg, rgba(232, 232, 232, 0.8) 26.65%, rgba(255, 255, 255, 0.04) 83.48%)
</style>