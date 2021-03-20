<template>
  <main class="page">
    <slot name="top" />

    <Content class="theme-default-content" />

    <slot name="bottom" />
  </main>
</template>

<style lang="stylus">
@require '../theme/styles/wrapper.styl'

.page
  padding-bottom 2rem
  display block

</style>
