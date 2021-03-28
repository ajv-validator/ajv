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
    @media only screen and (max-width: $MQMobile)
      padding 0 40px
    @media only screen and (max-width: $MQMobileNarrow)
      padding 0 30px

  & >>> .theme-code-group
    button
      position relative
      outline none
      z-index 1

  &.testimonials
    background linear-gradient(295.26deg, rgba(232, 232, 232, 0.8) 26.65%, rgba(255, 255, 255, 0.04) 83.48%)

  &.contributors
    background linear-gradient(295.26deg, rgba(232, 232, 232, 0.8) 26.65%, rgba(255, 255, 255, 0.04) 83.48%)

  &.footer
    background linear-gradient(295.26deg, rgba(232, 232, 232, 0.8) 26.65%, rgba(255, 255, 255, 0.04) 83.48%)

    p
      padding 20px 0 0
      text-align center
      color #292828

      a
        color $textColor
        font-weight normal
        &:hover
          text-decoration underline
</style>