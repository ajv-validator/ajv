<template>
  <div
    class="theme-container"
    :class="pageClasses"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <Navbar
      v-if="shouldShowNavbar"
      @toggle-sidebar="toggleSidebar"
    />

    <div
      class="sidebar-mask"
      @click="toggleSidebar(false)"
    />

    <Sidebar
      :items="sidebarItems"
      @toggle-sidebar="toggleSidebar"
    >
      <template #top>
        <slot name="sidebar-top" />
      </template>
      <template #bottom>
        <slot name="sidebar-bottom" />
      </template>
    </Sidebar>

    <div
      class="sidebar-toggle-button"
      @click="toggleSidebar()"
    />

    <div class="variable-page-container">
      <HomePage
        v-if="$page.frontmatter.homepage"
        :sidebar-items="sidebarItems"
      >
        <template #top>
          <slot name="page-top" />
        </template>
        <template #bottom>
          <slot name="page-bottom" />
        </template>
      </HomePage>

      <NewsPost
        v-else-if="$page.frontmatter.news"
        :sidebar-items="sidebarItems"
      >
        <template #top>
          <slot name="page-top" />
        </template>
        <template #bottom>
          <slot name="page-bottom" />
        </template>
      </NewsPost>

      <Page
        v-else
        :sidebar-items="sidebarItems"
      >
        <template #top>
          <slot name="page-top" />
        </template>
        <template #bottom>
          <slot name="page-bottom" />
        </template>
      </Page>
    </div>
  </div>
</template>

<script>
import Home from '@theme/components/Home.vue'
import Navbar from '@theme/components/Navbar.vue'
import Page from '@theme/components/Page.vue'
import Sidebar from '@theme/components/Sidebar.vue'
import { resolveSidebarItems } from '../util'

export default {
  name: 'Layout',

  components: {
    Home,
    Page,
    Sidebar,
    Navbar
  },

  data () {
    return {
      isSidebarOpen: false
    }
  },

  computed: {
    shouldShowNavbar () {
      const { themeConfig } = this.$site
      const { frontmatter } = this.$page
      if (
        frontmatter.navbar === false
        || themeConfig.navbar === false) {
        return false
      }
      return (
        this.$title
        || themeConfig.logo
        || themeConfig.repo
        || themeConfig.nav
        || this.$themeLocaleConfig.nav
      )
    },

    shouldShowSidebar () {
      const { frontmatter } = this.$page
      return (
        !frontmatter.home
        && frontmatter.sidebar !== false
        && this.sidebarItems.length
      )
    },

    sidebarItems () {
      return resolveSidebarItems(
        this.$page,
        this.$page.regularPath,
        this.$site,
        this.$localePath
      )
    },

    pageClasses () {
      const userPageClass = this.$page.frontmatter.pageClass
      return [
        {
          'no-navbar': !this.shouldShowNavbar,
          'sidebar-open': this.isSidebarOpen,
          'no-sidebar': !this.shouldShowSidebar
        },
        userPageClass
      ]
    }
  },

  mounted () {
    this.$router.afterEach(() => {
      this.isSidebarOpen = false
    })
  },

  methods: {
    toggleSidebar (to) {
      this.isSidebarOpen = typeof to === 'boolean' ? to : !this.isSidebarOpen
      this.$emit('toggle-sidebar', this.isSidebarOpen)
    },

    // side swipe
    onTouchStart (e) {
      this.touchStart = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      }
    },

    onTouchEnd (e) {
      const dx = e.changedTouches[0].clientX - this.touchStart.x
      const dy = e.changedTouches[0].clientY - this.touchStart.y
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx > 0 && this.touchStart.x <= 80) {
          this.toggleSidebar(true)
        } else {
          this.toggleSidebar(false)
        }
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
@keyframes page-container {
  from {margin-left: 2.8rem;}
  to {margin-left: $sidebarWidth;}
}

@keyframes sidebar-toggle {
  from {left: 1.4rem;}
  to {left: $sidebarWidth - 1.4rem;}
}

.theme-container
  .sidebar-toggle-button
    width 2.8rem
    height 2.8rem
    background-color $ajvBlueColor
    position fixed
    left 1.4rem
    top $navbarHeight - 1.4rem
    z-index 22

  .variable-page-container
    position relative
    background-color white
    z-index 11
    margin-left 2.8rem

    main.page
      padding-left 0

  &.sidebar-open
    .sidebar-toggle-button
      animation sidebar-toggle 0.1s
      animation-fill-mode forwards

    .variable-page-container
      animation page-container 0.1s
      animation-fill-mode forwards

</style>