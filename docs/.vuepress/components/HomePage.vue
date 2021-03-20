<template>
<main class="homepage">
  <slot name="top" />

  <Content />
  <PageEdit />

  <slot name="bottom" />
</main>
</template>

<script>
import PageEdit from '@theme/components/PageEdit.vue'

export default {
  components: {PageEdit},
}
</script>

<style scoped lang="stylus">
@require '../theme/styles/wrapper.styl';

.homepage 
  padding 0 0 0 $sidebarWidth
  box-sizing content-box
</style>
