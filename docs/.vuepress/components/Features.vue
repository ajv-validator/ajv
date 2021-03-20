<template>
  <div id="features">
    <slot />
  </div>
</template>

<style lang="stylus" scoped>
div#features {
  padding: 90px 55px;
  max-width: 100%;
}

div#features:after {
  content: '';
  display: table;
  clear: both;
}
</style>
