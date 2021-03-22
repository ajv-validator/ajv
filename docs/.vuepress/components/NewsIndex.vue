<template>
  <div>
    <div v-for="post in posts">
      <h2>{{ post.frontmatter.title }}</h2>

      <router-link :to="post.path">
        <NewsPostMeta :date="post.frontmatter.date" />
      </router-link>

      <div v-html="post.excerpt"></div>

      <p v-if="post.frontmatter.more !== false">
        <router-link :to="post.path">Read more</router-link>
      </p>
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
