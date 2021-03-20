<template>
  <main class="page">
    <slot name="top" />

    <div class="theme-default-content" style="padding-bottom: 0px">
      <h1>{{ $page.frontmatter.title }}</h1>
      <BlogPostMeta :date="$page.frontmatter.date" />
    </div>

    <Content class="theme-default-content" style="padding-top: 0px" />

    <slot name="bottom" />
  </main>
</template>

<style lang="stylus">
@require '../theme/styles/wrapper.styl';

.page {
  padding-bottom: 2rem;
  display: block;
}
</style>
