<template>
  <div class="features">
    <slot />
  </div>
</template>

<style lang="stylus" scoped>
.features
  padding 90px 0

  &:after
    content ''
    display block
    clear both
</style>
