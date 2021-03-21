<template>
  <div>
    <div v-for="(post, i) in posts" class="post">
      <Column side="left">
        <h3>{{ post.frontmatter.title }}</h3>
        <BlogPostMeta :date="post.frontmatter.date" />
      </Column>

      <Column side="right">
        <div v-html="post.excerpt"></div>
        <Button :link="post.path" class="read-more" text="Read more" />
      </Column>
    </div>
    <p><a href="/blog/" class="previous">Previous news</a></p>
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

<style lang="stylus" scoped>
.post
  display flex
  border-bottom 1px solid #eaecef

  &:last-child
    border-bottom none

  a.read-more
    display block
    width 114px
    height 40px
    line-height 40px
    background-color $ajvGreenColor
    border-radius 6px
    color white
    text-align center
    float right
    margin 28px 0
    font-weight 600

a.previous
  display inline-block
  float right
</style>
