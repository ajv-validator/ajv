<template>
  <main class="page">
    <slot name="top" />

    <div class="theme-default-content" style="padding-bottom: 0px">
      <h1>{{ $page.frontmatter.title }}</h1>
      <NewsPostMeta :date="$page.frontmatter.date" />
    </div>

    <Content class="theme-default-content" style="padding-top: 0px" />
    <PageEdit />

    <slot name="bottom" />
  </main>
</template>

<script>
import PageEdit from "@theme/components/PageEdit.vue"

export default {
  components: {PageEdit},
}
</script>

<style lang="stylus" scoped>
@require '../theme/styles/wrapper.styl'

.page
  padding-bottom 2rem
  display block
</style>
