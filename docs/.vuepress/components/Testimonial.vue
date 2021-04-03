<template>
  <div class="testimonial-content" :class="color">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    color: {
      type: String,
    },
  },
}
</script>

<style lang="stylus" scoped>
div.testimonial-content
  background-position center
  overflow hidden
  width 280px
  background-repeat no-repeat
  &.blue
    background-image url(./Testimonial/testimonials-blue.svg)
  &.green
    background-image url(./Testimonial/testimonials-green.svg)
  p
    margin 0.9em 0
    font-size 15px

  @media only screen and (max-width 374px)
    &.blue, &.green
      background-image none
      padding 0 0
      p
        font-size 15px

  @media only screen and (max-width 500px)
    width 100%
    background-size 350px 156px
    padding 0 calc(50% - 100px)
    box-sizing border-box
    p
      font-size 12px

  @media only screen and (min-width 500px)
    height 212px
    padding 0 75px
    margin 40px auto 0

  @media only screen and (min-width $MQNarrow)
    padding 0 calc(25% - 140px)

.header-anchor
  display none
</style>
