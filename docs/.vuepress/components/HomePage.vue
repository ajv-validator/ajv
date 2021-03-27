<template>
  <main class="homepage">
    <slot name="top" />

    <Content />

    <slot name="bottom" />
  </main>
</template>

<style lang="stylus" scoped>
@require '../theme/styles/wrapper.styl'

.homepage
  padding 0 0 0 0
  box-sizing content-box
</style>
