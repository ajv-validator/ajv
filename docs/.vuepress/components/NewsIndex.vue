<template>
  <div>
    <div v-for="post in posts">
      <h2>
        <router-link :to="post.path">{{ post.frontmatter.title }}</router-link>
      </h2>

      <NewsPostMeta :date="post.frontmatter.date" />

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
        .filter((x) => x.path.startsWith("/news/") && !x.frontmatter.newsIndex)
        .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
    },
  },
}
</script>
