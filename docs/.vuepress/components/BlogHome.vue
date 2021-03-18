<template>
  <div>
    <div v-for="(post, i) in posts">
      <div class="row">
        <div class="column left">
          <h3>{{ post.frontmatter.title }}</h3>
        </div>

        <div class="column right">
          <div v-html="post.excerpt"></div>
          <p><router-link :to="post.path">Read more</router-link></p>
        </div>
      </div>

      <hr v-if="i < posts.length - 1" />
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

<style scoped>
.column {
  box-sizing: border-box;
  /* background-color: rgba(0, 0, 0, 0); */
  float: left;
  padding: 10px;
}

.left {
  width: 35%;
}

.right {
  width: 65%;
}

.row:after {
  box-sizing: border-box;
  content: "";
  display: table;
  clear: both;
}
</style>
