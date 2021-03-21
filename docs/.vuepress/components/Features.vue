<template>
  <div class="features">
    <slot />
  </div>
</template>

<style lang="stylus" scoped>
.features
  padding 60px 0

  @media only screen and (min-width: $MQMobile)
    display flex
</style>
