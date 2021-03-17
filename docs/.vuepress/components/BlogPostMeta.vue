<template>
  <div>
    <time pubdate itemprop="datePublished" :datetime="date">
      {{ resolvedDate }}
    </time>
  </div>
</template>

<script>
import dayjs from "dayjs"
import dayjsPluginUTC from "dayjs/plugin/utc"

dayjs.extend(dayjsPluginUTC)

export default {
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
