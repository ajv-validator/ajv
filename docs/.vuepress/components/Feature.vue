<template>
  <div :class="type">
    <p id="title">{{ title }}</p>
    <slot />
    <a :href="link">→</a>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
    },
    type: {
      type: String,
    },
    link: {
      type: String,
    },
  },
}
</script>


<style lang="stylus" scoped>
div {
  display: inline-block;
  float: left;
  margin-right: 2%;
  width: 32%;
  height: 225px;
  border-radius: 8px;
  position: relative;

  &.less-code {
    background-color: #23c8d2;
  }

  &.fast-secure {
    background-color: #409cff;
  }

  &.multi-spec {
    background-color: #f5775b;
  }
}

div:last-child {
  margin-right: 0px;
}

p#title {
  font-family: 'IstokWeb';
  font-weight: normal;
  font-size: 1.5rem;
  margin: 2rem 2rem 0 2rem;
  color: #ffffff;
}

p {
  margin: 1rem 2rem 0 2rem;
  color: #ffffff;
}

a {
  color: #ffffff;
  position: absolute;
  bottom: 25px;
  right: 25px;
}
</style>
