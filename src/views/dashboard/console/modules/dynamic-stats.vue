<template>
  <div class="art-card h-128 p-5 mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>系统动态</h4>
        <p>今日新增<span class="text-success">+12</span>条</p>
      </div>
    </div>

    <div class="h-9/10 mt-2 overflow-hidden">
      <ElScrollbar>
        <div
          class="h-17.5 leading-17.5 border-b border-g-300 text-sm overflow-hidden last:border-b-0"
          v-for="(item, index) in list"
          :key="index"
        >
          <span class="text-g-800 font-medium">{{ item.username }}</span>
          <span class="mx-2 text-g-600">{{ item.type }}</span>
          <span class="text-theme">{{ item.target }}</span>
        </div>
      </ElScrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface DynamicItem {
    username: string
    type: string
    target: string
  }

  /**
   * 系统动态列表
   * 记录文书处理、审查、比对等各类操作活动
   */
  const list = reactive<DynamicItem[]>([
    {
      username: '张检察官',
      type: '提取了文书',
      target: '(2024)京0105刑初256号'
    },
    {
      username: '李检察官',
      type: '完成审查',
      target: '(2024)京0106刑初189号'
    },
    {
      username: '王检察官',
      type: '发起比对',
      target: '起诉书与判决书'
    },
    {
      username: '赵检察官',
      type: '上传文书',
      target: '补充侦查报告'
    },
    {
      username: '刘检察官',
      type: '提取了文书',
      target: '(2024)京0108刑初342号'
    },
    {
      username: '陈检察官',
      type: '完成审查',
      target: '(2024)京0105刑初298号'
    },
    {
      username: '杨检察官',
      type: '下载文书',
      target: '(2024)京0109刑初425号'
    },
    {
      username: '周检察官',
      type: '发起比对',
      target: '审查报告与起诉书'
    }
  ])
</script>
