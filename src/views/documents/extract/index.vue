<template>
  <div class="extract-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>批量结构化提取</span>
          <el-button type="primary" :disabled="!hasResults" @click="handleExportAll">
            导出全部结果
          </el-button>
        </div>
      </template>

      <!-- 选择文档 -->
      <div v-if="!extracting && results.length === 0" class="select-section">
        <el-alert
          title="请从文档列表中选择需要提取的文书，或在此处手动选择"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        />

        <el-button type="primary" @click="handleSelectDocs">
          选择文档
        </el-button>
      </div>

      <!-- 提取进度 -->
      <div v-if="extracting" class="progress-section">
        <el-progress
          :percentage="progress"
          :status="progressStatus"
          :stroke-width="20"
        />
        <p class="progress-text">
          正在提取：{{ currentIndex }}/{{ totalDocs }}
        </p>
      </div>

      <!-- 提取结果 -->
      <div v-if="results.length > 0" class="results-section">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane
            v-for="(result, index) in results"
            :key="result.doc_id"
            :label="result.file_name"
            :name="String(index)"
          >
            <div class="result-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="案号">
                  {{ result.data.案号 }}
                </el-descriptions-item>
                <el-descriptions-item label="案件名称">
                  {{ result.data.案件名称 }}
                </el-descriptions-item>
                <el-descriptions-item label="文书类型">
                  <el-tag>{{ result.data.文书类型 }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="处理时间">
                  {{ result.processing_time.toFixed(2) }}秒
                </el-descriptions-item>
              </el-descriptions>

              <el-divider content-position="left">被告人信息</el-divider>
              <el-table :data="result.data.被告人信息" border>
                <el-table-column prop="姓名" label="姓名" width="100" />
                <el-table-column prop="性别" label="性别" width="80" />
                <el-table-column prop="出生日期" label="出生日期" width="150" />
                <el-table-column prop="身份证号" label="身份证号" width="180" />
                <el-table-column prop="住址" label="住址" show-overflow-tooltip />
              </el-table>

              <el-divider content-position="left">指控罪名</el-divider>
              <div class="tag-list">
                <el-tag
                  v-for="(crime, idx) in result.data.指控罪名"
                  :key="idx"
                  type="danger"
                  size="large"
                >
                  {{ crime }}
                </el-tag>
              </div>

              <el-divider content-position="left">事实概要</el-divider>
              <div class="content-box">
                {{ result.data.事实概要 }}
              </div>

              <el-divider content-position="left">证据列表</el-divider>
              <ul class="evidence-list">
                <li v-for="(evidence, idx) in result.data.证据列表" :key="idx">
                  {{ evidence }}
                </li>
              </ul>

              <el-divider content-position="left">法律依据</el-divider>
              <div class="tag-list">
                <el-tag
                  v-for="(law, idx) in result.data.法律依据"
                  :key="idx"
                  type="warning"
                >
                  {{ law }}
                </el-tag>
              </div>

              <el-divider content-position="left">处理结果</el-divider>
              <div class="content-box result">
                {{ result.data.处理结果 }}
              </div>

              <div class="action-buttons">
                <el-button type="primary" @click="handleExportSingle(result)">
                  导出此结果
                </el-button>
                <el-button @click="handleEdit(result)">
                  编辑
                </el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { batchStructuredExtract } from '@/api/documents'

const extracting = ref(false)
const progress = ref(0)
const progressStatus = ref<'' | 'success' | 'exception' | 'warning'>('')
const currentIndex = ref(0)
const totalDocs = ref(0)
const results = ref<Api.Documents.ExtractionResult[]>([])
const activeTab = ref('0')

const hasResults = computed(() => results.value.length > 0)

const handleSelectDocs = () => {
  ElMessage.info('请从文档列表页面选择文档后进行批量提取')
}

const handleExportAll = () => {
  ElMessage.info('导出功能开发中')
}

const handleExportSingle = (result: Api.Documents.ExtractionResult) => {
  ElMessage.info('导出功能开发中')
}

const handleEdit = (result: Api.Documents.ExtractionResult) => {
  ElMessage.info('编辑功能开发中')
}

// 模拟批量提取（实际使用时从路由参数获取文档ID）
const startExtract = async (docIds: string[]) => {
  extracting.value = true
  totalDocs.value = docIds.length
  currentIndex.value = 0
  progress.value = 0

  try {
    const response = await batchStructuredExtract(docIds)
    results.value = response.results
    progress.value = 100
    progressStatus.value = 'success'
    ElMessage.success(`提取完成，成功 ${response.success_count} 个`)
  } catch (error) {
    progressStatus.value = 'exception'
    ElMessage.error('提取失败')
  } finally {
    extracting.value = false
  }
}

// 暴露方法供外部调用
defineExpose({
  startExtract
})
</script>

<style scoped lang="scss">
.extract-container {
  padding: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .select-section {
    padding: 40px;
    text-align: center;
  }

  .progress-section {
    padding: 40px;

    .progress-text {
      margin-top: 16px;
      text-align: center;
      font-size: 14px;
      color: #606266;
    }
  }

  .results-section {
    .result-content {
      padding: 16px;

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

      .action-buttons {
        margin-top: 24px;
        display: flex;
        gap: 12px;
        justify-content: center;
      }
    }
  }
}
</style>
