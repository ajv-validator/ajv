<template>
  <div class="testimonials">
    <slot />
  </div>
</template>

<style lang="stylus" scoped>
.testimonials
  padding 20px 0
  @media only screen and (min-width $MQNarrow)
    display flex
</style>
