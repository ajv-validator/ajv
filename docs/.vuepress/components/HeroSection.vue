<template>
  <div id="hero">
    <p id="title">{{ title }}</p>
    <p id="description">{{ description }}</p>
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
  },
}
</script>

<style lang="stylus" scoped>
div#hero {
  background: linear-gradient(304.46deg, rgba(198, 225, 255, 0.7) 27.73%, rgba(237, 237, 237, 0.26) 82.77%);
}

p#title {
  font-family: 'IstokWeb';
  font-weight: normal;
  font-size: 2.5rem;
  padding-top: 230px;
  padding-left: 120px;
}

p#description {
  font-family: 'IstokWeb';
  font-weight: normal;
  font-size: 2rem;
  padding-top: 8px;
  padding-left: 120px;
}
</style>
