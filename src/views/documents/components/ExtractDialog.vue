<template>
  <el-dialog
    v-model="visible"
    title="结构化提取结果"
    width="900px"
    :close-on-click-modal="false"
  >
    <div v-if="extractData" class="extract-container">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="案号">
          {{ extractData.data.案号 }}
        </el-descriptions-item>
        <el-descriptions-item label="案件名称">
          {{ extractData.data.案件名称 }}
        </el-descriptions-item>
        <el-descriptions-item label="文书类型">
          <el-tag>{{ extractData.data.文书类型 }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理时间">
          {{ extractData.processing_time.toFixed(2) }}秒
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">被告人信息</el-divider>
      <el-table :data="extractData.data.被告人信息" border>
        <el-table-column prop="姓名" label="姓名" />
        <el-table-column prop="性别" label="性别" />
        <el-table-column prop="出生日期" label="出生日期" />
        <el-table-column prop="身份证号" label="身份证号" />
        <el-table-column prop="住址" label="住址" show-overflow-tooltip />
      </el-table>

      <el-divider content-position="left">指控罪名</el-divider>
      <div class="tag-list">
        <el-tag
          v-for="(crime, index) in extractData.data.指控罪名"
          :key="index"
          type="danger"
          size="large"
        >
          {{ crime }}
        </el-tag>
      </div>

      <el-divider content-position="left">事实概要</el-divider>
      <div class="content-box">
        {{ extractData.data.事实概要 }}
      </div>

      <el-divider content-position="left">证据列表</el-divider>
      <ul class="evidence-list">
        <li v-for="(evidence, index) in extractData.data.证据列表" :key="index">
          {{ evidence }}
        </li>
      </ul>

      <el-divider content-position="left">法律依据</el-divider>
      <div class="tag-list">
        <el-tag
          v-for="(law, index) in extractData.data.法律依据"
          :key="index"
          type="warning"
        >
          {{ law }}
        </el-tag>
      </div>

      <el-divider content-position="left">处理结果</el-divider>
      <div class="content-box result">
        {{ extractData.data.处理结果 }}
      </div>

      <el-divider content-position="left">特定字段</el-divider>
      <el-descriptions :column="1" border>
        <el-descriptions-item
          v-for="(value, key) in extractData.data.特定字段"
          :key="key"
          :label="key"
        >
          <template v-if="Array.isArray(value)">
            <div v-if="value.length > 0">
              <div v-for="(item, idx) in value" :key="idx">{{ item }}</div>
            </div>
            <span v-else class="empty-text">无</span>
          </template>
          <template v-else>
            {{ value || '无' }}
          </template>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <template #footer>
      <el-button type="primary" @click="handleExport">导出结果</el-button>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  extractData: Api.Documents.ExtractionResult | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}
</script>

<style scoped lang="scss">
.extract-container {
  max-height: 70vh;
  overflow-y: auto;

  .el-divider {
    margin: 24px 0 16px;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .content-box {
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    line-height: 1.8;
    color: #606266;

    &.result {
      background-color: #ecf5ff;
      color: #409eff;
      font-weight: 500;
    }
  }

  .evidence-list {
    padding-left: 24px;
    line-height: 2;
    color: #606266;

    li {
      margin-bottom: 8px;
    }
  }

  .empty-text {
    color: #909399;
    font-style: italic;
  }
}
</style>
