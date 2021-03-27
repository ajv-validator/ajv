<template>
  <div>
    <div v-for="(post, i) in posts" class="post">
      <Columns>
        <Column side="left">
          <h3>{{ post.frontmatter.title }}</h3>
          <NewsPostMeta :date="post.frontmatter.date" />
        </Column>

        <Column side="right">
          <div v-html="post.excerpt"></div>
          <Button :link="post.path" cssClass="read-more">Read more</Button>
        </Column>
      </Columns>
    </div>
    <p><a href="/news/" class="previous">All news</a></p>
  </div>
</template>

<script>
export default {
  computed: {
    posts() {
      return this.$site.pages
        .filter((x) => x.path.startsWith("/news/") && !x.frontmatter.newsIndex)
        .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
        .slice(0, 3)
    },
  },
}
</script>

<style lang="stylus" scoped>
.post
  display flex
  border-bottom 1px solid #eaecef

  &:last-child
    border-bottom none

  a.read-more
    float right
    margin 28px 0

a.previous
  display inline-block
  float right
</style>
