<template>
  <div class="art-card h-105 p-4 box-border mb-5 max-sm:mb-4">
    <ArtBarChart
      class="box-border p-2"
      barWidth="50%"
      height="13.7rem"
      :showAxisLine="false"
      :data="chartData"
      :xAxisData="xAxisLabels"
    />
    <div class="ml-1">
      <h3 class="mt-5 text-lg font-medium">文书处理概览</h3>
      <p class="mt-1 text-sm">比上月 <span class="text-success font-medium">+18%</span></p>
      <p class="mt-1 text-sm">系统智能化处理文书，提供结构化提取、智能比对和自动审查等功能</p>
    </div>
    <div class="flex-b mt-2">
      <div class="flex-1" v-for="(item, index) in list" :key="index">
        <p class="text-2xl text-g-900">{{ item.num }}</p>
        <p class="text-xs text-g-500">{{ item.name }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface DocStatItem {
    name: string
    num: string
  }

  // 最近9个月
  const xAxisLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月']

  // 每月处理文书数
  const chartData = [85, 92, 108, 95, 125, 110, 138, 115, 142]

  /**
   * 文书统计数据列表
   * 包含总文书量、提取次数、比对次数和审查通过率等关键指标
   */
  const list: DocStatItem[] = [
    { name: '总文书量', num: '1.2k' },
    { name: '提取次数', num: '856' },
    { name: '比对次数', num: '342' },
    { name: '通过率', num: '94%' }
  ]
</script>
