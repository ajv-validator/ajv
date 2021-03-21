<template>
  <div>
    <a
      v-for="(contributor, i) in contributors"
      class="contributor"
      :style="'background-position: ' + (100 * i) / (contributors.length - 1) + '% 0'"
      :href="'https://github.com/' + contributor"
    >
      {{ contributor }}
    </a>
  </div>
</template>

<script>
import contributors from "./Contributors/_contributors.js"
export default {
  data() {
    return {
      contributors: contributors,
    }
  },
}
</script>

<style lang="stylus" scoped>
.contributor
  width 3.2em
  height 3.2em
  border-radius 50%
  text-indent -9999px
  display inline-block
  background no-repeat url('./Contributors/contributors.jpg')
  background-size auto 102%
  margin 0 0.8em 0.8em 0
  border 2px solid var(--second)
</style>
