<template>
  <ClientOnly>
    <span>
      <a
        class="github-button"
        href="https://github.com/ajv-validator/ajv"
        data-show-count="true"
        data-size="large"
        aria-label="Star ajv-validator/ajv on GitHub"
      >
        Star
      </a>
    </span>
  </ClientOnly>
</template>

<script>
export default {
  mounted() {
    let githubScript = document.createElement("script")
    githubScript.setAttribute("src", "https://buttons.github.io/buttons.js")
    document.head.appendChild(githubScript)
  },
}
</script>

<style lang="stylus" scoped>
span
  vertical-align -8px
  padding-left 20px
  @media only screen and (max-width: $MQMobile)
    vertical-align -21px
</style>
