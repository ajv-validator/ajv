<template>
  <div>
    <slot />
    <PageEdit />
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

.edit-link
  a
    padding 0 0 120px
    margin auto
</style>
