<template>
  <div class="columns">
    <slot />
  </div>
</template>

<style lang="stylus" scoped>
@media only screen and (min-width: $MQMobile)
  .columns
    display flex
</style>
