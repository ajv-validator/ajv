<template>
<div class="hero-section">
  <div class="section-content">
    <img src="./HeroSection/hero-desktop.svg" class="hero-image">
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

  .section-content
    position relative
    max-width 1000px
    margin 0 auto

    .section-content-wrapper
      position relative
      z-index 10

  .hero-image
    position absolute
    bottom 125px
    left 250px
    z-index 1

  background linear-gradient(304.46deg, rgba(198, 225, 255, 0.7) 27.73%, rgba(237, 237, 237, 0.26) 82.77%)

  .header-anchor
    display none

  h1
    font-size 64px
    margin-top 230px

  h2
    font-size 36px

  h1, h2
    margin-left 64px
</style>