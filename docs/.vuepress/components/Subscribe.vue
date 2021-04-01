<template>
  <form
    action="https://ajv.us1.list-manage.com/subscribe/post?u=4343a2a251fa30892c2360003&amp;id=304f51cbc3"
    method="post"
    target="_blank"
    novalidate
  >
    <label for="subscription-email">Subscribe to Ajv news</label>
    <input id="subscription-email" name="EMAIL" placeholder="Your email" />
    <div style="position: absolute; left: -5000px;" aria-hidden="true">
      <input type="text" name="b_4343a2a251fa30892c2360003_304f51cbc3" tabindex="-1" value="">
    </div>
    <button type="submit">Submit</button>
  </form>
</template>

<style lang="stylus" scoped>
form
  display inline-block

label
  display block
  margin-bottom 1rem
  @media only screen and (min-width: $MQMobile)
    display inline-block
    margin-bottom 0

input, button
  font-family Raleway
  font-size 16px
  border 0px solid
  outline none

input
  border 1px solid #cfd4db
  height 2rem
  width 180px
  border-radius 2rem
  padding 0 0.5rem
  margin 0 0.5rem 0 0
  &:focus
    border-color: $accentColor
  @media only screen and (min-width: $MQMobile)
    width 200px
    margin 0 1rem


button
  width 114px
  height 36px
  line-height 36px
  padding-top 0
  background-color $ajvGreenColor
  border-radius 6px
  color white
  text-align center
  font-weight 600
  display block
  margin-top 1em
  @media only screen and (min-width: $MQMobileSmall)
    display inline-block
    margin-top 0
</style>
