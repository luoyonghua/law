<template>
  <ElRow :gutter="20" class="flex">
    <ElCol v-for="(item, index) in dataList" :key="index" :sm="12" :md="6" :lg="6">
      <div class="art-card relative flex flex-col justify-center h-35 px-5 mb-5 max-sm:mb-4">
        <span class="text-g-700 text-sm">{{ item.des }}</span>
        <ArtCountTo class="text-[26px] font-medium mt-2" :target="item.num" :duration="1300" />
        <div class="flex-c mt-1">
          <span class="text-xs text-g-600">较上月</span>
          <span
            class="ml-1 text-xs font-semibold"
            :class="[item.change.indexOf('+') === -1 ? 'text-danger' : 'text-success']"
          >
            {{ item.change }}
          </span>
        </div>
        <div
          class="absolute top-0 bottom-0 right-5 m-auto size-12.5 rounded-xl flex-cc bg-theme/10"
        >
          <ArtSvgIcon :icon="item.icon" class="text-xl text-theme" />
        </div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  interface CardDataItem {
    des: string
    icon: string
    startVal: number
    duration: number
    num: number
    change: string
  }

  /**
   * 卡片统计数据列表
   * 展示文书总数、待审查文书、本月提取数和比对次数等核心数据指标
   */
  const dataList = reactive<CardDataItem[]>([
    {
      des: '文书总数',
      icon: 'ri:file-text-line',
      startVal: 0,
      duration: 1000,
      num: 1248,
      change: '+18%'
    },
    {
      des: '待审查文书',
      icon: 'ri:file-warning-line',
      startVal: 0,
      duration: 1000,
      num: 86,
      change: '-12%'
    },
    {
      des: '本月提取数',
      icon: 'ri:file-search-line',
      startVal: 0,
      duration: 1000,
      num: 342,
      change: '+25%'
    },
    {
      des: '比对次数',
      icon: 'ri:file-copy-2-line',
      startVal: 0,
      duration: 1000,
      num: 128,
      change: '+15%'
    }
  ])
</script>
