<template>
  <div>
    <div v-for="post in posts">
      <h2>
        <router-link :to="post.path">{{ post.frontmatter.title }}</router-link>
      </h2>

      <BlogPostMeta :date="post.frontmatter.date" />

      <p>{{ post.frontmatter.description }}</p>

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
    },
  },
}
</script>
