<template>
  <div class="testimonial-content">
    <img :src="'/img/testimonials-' + bracketsClr + '.svg'" />
    <div class="testimonial-content-wrapper">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    bracketsClr: {
      type: String,
    },
  },
}
</script>

<style lang="stylus" scoped>
div.testimonial-content
  position relative

  @media only screen and (min-width $MQMobile)
    width 50%

  img
    width 100%

div.testimonial-content-wrapper
  position absolute
  top 0
  left 25%
  width 50%

.header-anchor
  display none
</style>
