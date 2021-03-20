<template>
  <main class="page">
    <slot name="top" />

    <div class="theme-default-content" style="padding-bottom: 0px">
      <h1>{{ $page.frontmatter.title }}</h1>
      <BlogPostMeta :date="$page.frontmatter.date" />
    </div>

    <Content class="theme-default-content" style="padding-top: 0px" />

    <PageEdit />

    <PageNav v-bind="{sidebarItems}" />

    <slot name="bottom" />
  </main>
</template>

<script>
import PageEdit from "@theme/components/PageEdit.vue"
import PageNav from "@theme/components/PageNav.vue"

export default {
  components: {PageEdit, PageNav},
  props: ["sidebarItems"],
}
</script>

<style lang="stylus">
@require '../theme/styles/wrapper.styl';

.page {
  padding-bottom: 2rem;
  display: block;
}
</style>
