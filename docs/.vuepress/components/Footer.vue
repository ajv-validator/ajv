<template>
  <div>
    <slot />
    <PageEdit class="footer-edit" />
  </div>
</template>

<script>
import PageEdit from "@theme/components/PageEdit.vue"

export default {
  components: {PageEdit},
}
</script>

<style lang="stylus" scoped>
p
  padding 20px 0 0
  text-align center
  color #292828

.footer-edit
  display flex
  padding 20px 0 120px

  div.edit-link
    margin 0 auto
</style>
