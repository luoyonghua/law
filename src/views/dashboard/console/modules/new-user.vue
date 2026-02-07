<template>
  <div class="art-card p-5 h-128 overflow-hidden mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>最近处理文书</h4>
        <p>本月新增<span class="text-success">+342</span>份</p>
      </div>
      <ElRadioGroup v-model="radio2">
        <ElRadioButton value="本月" label="本月"></ElRadioButton>
        <ElRadioButton value="上月" label="上月"></ElRadioButton>
        <ElRadioButton value="今年" label="今年"></ElRadioButton>
      </ElRadioGroup>
    </div>
    <ArtTable
      class="w-full"
      :data="tableData"
      style="width: 100%"
      size="large"
      :border="false"
      :stripe="false"
      :header-cell-style="{ background: 'transparent' }"
    >
      <template #default>
        <ElTableColumn label="案件编号" prop="caseId" width="180px" />
        <ElTableColumn label="文书类型" prop="docType">
          <template #default="scope">
            <ElTag :type="getDocTypeTag(scope.row.docType)">{{ scope.row.docType }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="处理状态" prop="status">
          <template #default="scope">
            <ElTag :type="getStatusTag(scope.row.status)">{{ scope.row.status }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="完成进度" width="240">
          <template #default="scope">
            <ElProgress
              :percentage="scope.row.pro"
              :color="scope.row.color"
              :stroke-width="4"
              :aria-label="`${scope.row.caseId}的完成进度: ${scope.row.pro}%`"
            />
          </template>
        </ElTableColumn>
      </template>
    </ArtTable>
  </div>
</template>

<script setup lang="ts">
  interface DocTableItem {
    caseId: string
    docType: string
    status: string
    percentage: number
    pro: number
    color: string
  }

  const ANIMATION_DELAY = 100

  const radio2 = ref('本月')

  /**
   * 文书处理表格数据
   * 包含案件编号、文书类型和处理进度
   */
  const tableData = reactive<DocTableItem[]>([
    {
      caseId: '(2024)京0105刑初256号',
      docType: '起诉书',
      status: '已提取',
      percentage: 100,
      pro: 0,
      color: 'var(--art-success)'
    },
    {
      caseId: '(2024)京0106刑初189号',
      docType: '判决书',
      status: '审查中',
      percentage: 65,
      pro: 0,
      color: 'var(--art-primary)'
    },
    {
      caseId: '(2024)京0108刑初342号',
      docType: '审查报告',
      status: '已完成',
      percentage: 100,
      pro: 0,
      color: 'var(--art-success)'
    },
    {
      caseId: '(2024)京0105刑初298号',
      docType: '补充侦查报告',
      status: '处理中',
      percentage: 45,
      pro: 0,
      color: 'var(--art-warning)'
    },
    {
      caseId: '(2024)京0109刑初425号',
      docType: '起诉书',
      status: '待审查',
      percentage: 30,
      pro: 0,
      color: 'var(--art-info)'
    },
    {
      caseId: '(2024)京0107刑初567号',
      docType: '判决书',
      status: '已提取',
      percentage: 100,
      pro: 0,
      color: 'var(--art-success)'
    }
  ])

  /**
   * 获取文书类型标签颜色
   */
  const getDocTypeTag = (type: string) => {
    const tagMap: Record<string, any> = {
      起诉书: 'primary',
      判决书: 'success',
      审查报告: 'warning',
      补充侦查报告: 'danger'
    }
    return tagMap[type] || ''
  }

  /**
   * 获取状态标签颜色
   */
  const getStatusTag = (status: string) => {
    const tagMap: Record<string, any> = {
      已完成: 'success',
      已提取: 'success',
      审查中: 'warning',
      处理中: 'warning',
      待审查: 'info'
    }
    return tagMap[status] || 'info'
  }

  /**
   * 添加进度条动画效果
   * 延迟后将进度值从 0 更新到目标百分比，触发动画
   */
  const addAnimation = (): void => {
    setTimeout(() => {
      tableData.forEach((item) => {
        item.pro = item.percentage
      })
    }, ANIMATION_DELAY)
  }

  onMounted(() => {
    addAnimation()
  })
</script>

<style lang="scss" scoped>
  .art-card {
    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      color: var(--el-color-primary) !important;
      background: transparent !important;
    }
  }
</style>
