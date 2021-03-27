<template>
  <div class="hero-section">
    <div class="section-content">
      <img src="./HeroSection/hero-image.svg" class="hero-image" />
      <div class="section-content-wrapper">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.hero-section
  width 100%
  padding 50px 0
  padding-top $navbarHeight
  overflow hidden

  .section-content
    position relative
    max-width 1000px
    padding 0 50px
    margin 0 auto
    @media only screen and (max-width: $MQMobile)
      padding 0 40px
    @media only screen and (max-width: $MQMobileNarrow)
      padding 0 30px

    .section-content-wrapper
      position relative
      z-index 2

  .hero-image
    position absolute
    z-index 1
    width 658px
    top -400px
    left -25px

    @media only screen and (min-width: $MQMobileNarrow)
      width 823px
      top -500px
      left 50px

    @media only screen and (min-width: $MQMobile)
      top -430px
      left 330px

    @media only screen and (min-width: $MQNarrow)
      width 1097px
      top -575px
      left 425px

  background linear-gradient(304.33deg, rgba(237, 237, 237, 0.31) -7.48%, #C6E1FF 30.07%, rgba(237, 237, 237, 0.26) 82.76%)

  .header-anchor
    display none

  h1
    font-size 2em
    margin-top 200px
  h2
    border-bottom none

  @media only screen and (min-width: $MQMobileNarrow)
    h1
      font-size 3em
    h2
      font-size 1.75em

  @media only screen and (min-width: $MQMobile)
    h1, h2
      margin-left 48px

  @media only screen and (min-width: $MQNarrow)
    h1
      font-size 4em
    h2
      font-size 2.25em
    h1, h2
      margin-left 64px
</style>