<template>
  <div class="post-meta">
    <ClockIcon />
    <time class="pub-date" pubdate itemprop="datePublished" :datetime="date">
      {{ resolvedDate }}
    </time>
  </div>
</template>

<script>
import dayjs from "dayjs"
import dayjsPluginUTC from "dayjs/plugin/utc"
import {ClockIcon} from "vue-feather-icons"

dayjs.extend(dayjsPluginUTC)

export default {
  components: {ClockIcon},
  props: {
    date: {
      type: String,
    },
  },
  computed: {
    resolvedDate() {
      return dayjs.utc(this.date).format("MMMM D, YYYY")
    },
  },
}
</script>

<style scoped>
.post-meta > div {
  display: inline-flex;
}

.post-meta svg {
  margin-right: 5px;
  width: 14px;
  height: 14px;
  color: #808080;
}

.pub-date {
  color: #808080;
}
</style>
