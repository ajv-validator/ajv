<template>
  <main class="homepage">
    <slot name="top" />

    <Content />

    <slot name="bottom" />
  </main>
</template>

<style scoped lang="stylus">
@require '../theme/styles/wrapper.styl';

.homepage {
  padding: 0 0 0 $sidebarWidth; // should dynamically change on sidebar toggle
}
</style>
