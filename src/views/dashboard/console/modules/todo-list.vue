<template>
  <div class="art-card h-128 p-5 mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>待办事项</h4>
        <p>待处理<span class="text-danger">4</span>项</p>
      </div>
    </div>

    <div class="h-[calc(100%-40px)] overflow-auto">
      <ElScrollbar>
        <div
          class="flex-cb h-17.5 border-b border-g-300 text-sm last:border-b-0"
          v-for="(item, index) in list"
          :key="index"
        >
          <div>
            <p class="text-sm">{{ item.task }}</p>
            <p class="text-g-500 mt-1">{{ item.date }}</p>
          </div>
          <ElCheckbox v-model="item.complete" />
        </div>
      </ElScrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface TodoItem {
    task: string
    date: string
    complete: boolean
  }

  /**
   * 待办事项列表
   * 记录文书处理相关的待办任务及完成状态
   */
  const list = reactive<TodoItem[]>([
    {
      task: '审查起诉书(2024)京0105刑初256号',
      date: '上午 09:30',
      complete: true
    },
    {
      task: '比对判决书与起诉书',
      date: '上午 10:30',
      complete: true
    },
    {
      task: '提取补充侦查报告要素',
      date: '上午 11:00',
      complete: true
    },
    {
      task: '审查报告质量检查',
      date: '下午 02:00',
      complete: false
    },
    {
      task: '批量提取本周文书',
      date: '下午 03:30',
      complete: false
    },
    {
      task: '整理文书比对结果',
      date: '下午 04:30',
      complete: false
    },
    {
      task: '导出本月统计报表',
      date: '下午 05:30',
      complete: false
    }
  ])
</script>
