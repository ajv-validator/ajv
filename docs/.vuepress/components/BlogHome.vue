// practically duplicate of BlogIndex, but will probably have different style

<template>
  <div>
    <div v-for="post in posts">
      <h3>
        <router-link :to="post.path">{{ post.frontmatter.title }}</router-link>
      </h3>

      <BlogPostMeta :date="post.frontmatter.date" />

      <div v-html="post.excerpt"></div>

      <p><router-link :to="post.path">Read more</router-link></p>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    posts() {
      return this.$site.pages
        .filter((x) => x.path.startsWith("/blog/") && !x.frontmatter.blog_index)
        .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
        .slice(0, 3)
    },
  },
}
</script>
