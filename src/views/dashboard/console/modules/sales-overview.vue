<template>
  <div class="art-card h-105 p-5 mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>文书处理趋势</h4>
        <p>今年增长<span class="text-success">+22%</span></p>
      </div>
    </div>
    <ArtLineChart
      height="calc(100% - 56px)"
      :data="data"
      :xAxisData="xAxisData"
      :showAreaColor="true"
      :showAxisLine="false"
    />
  </div>
</template>

<script setup lang="ts">
  /**
   * 全年文书处理数据
   * 记录每月的文书处理统计
   */
  const data = [68, 72, 85, 78, 95, 88, 102, 96, 108, 98, 115, 122]

  /**
   * X 轴月份标签
   */
  const xAxisData = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月'
  ]
</script>
