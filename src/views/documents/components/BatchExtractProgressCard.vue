<template>
  <Teleport to="body">
    <Transition name="slide-fade">
      <div v-if="visible" class="extract-progress-card">
        <div class="card-header">
          <div class="header-left">
            <el-icon class="loading-icon" :class="{ spinning: isExtracting }">
              <Loading v-if="isExtracting" />
              <CircleCheck v-else-if="isCompleted && failCount === 0" />
              <Warning v-else-if="isCompleted && failCount > 0" />
            </el-icon>
            <span class="title">批量提取</span>
          </div>
          <el-icon class="close-icon" @click="handleMinimize">
            <Close />
          </el-icon>
        </div>

        <div class="card-body">
          <div class="progress-info">
            <div class="progress-text">
              <span class="current">{{ completedCount }}</span>
              <span class="separator">/</span>
              <span class="total">{{ totalCount }}</span>
            </div>
            <div class="status-text">
              {{ statusText }}
            </div>
          </div>

          <el-progress
            :percentage="progressPercentage"
            :status="progressStatus"
            :show-text="false"
            :stroke-width="6"
          />

          <div v-if="isCompleted" class="result-summary">
            <span class="success-count">成功 {{ successCount }} 个</span>
            <span v-if="failCount > 0" class="fail-count">失败 {{ failCount }} 个</span>
          </div>
        </div>

        <div class="card-footer">
          <el-button
            type="primary"
            size="small"
            :disabled="!isCompleted"
            @click="handleViewHistory"
          >
            去查看
          </el-button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Loading, CircleCheck, Warning, Close } from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  totalCount: number
  completedCount: number
  successCount: number
  failCount: number
  isExtracting: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'minimize'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()

const isCompleted = computed(() => {
  return !props.isExtracting && props.completedCount === props.totalCount && props.totalCount > 0
})

const progressPercentage = computed(() => {
  if (props.totalCount === 0) return 0
  return Math.round((props.completedCount / props.totalCount) * 100)
})

const progressStatus = computed(() => {
  if (!isCompleted.value) return ''
  if (props.failCount > 0) return 'warning'
  return 'success'
})

const statusText = computed(() => {
  if (props.completedCount === 0) {
    return '正在提交任务...'
  } else if (props.isExtracting) {
    return '正在提取中...'
  } else if (isCompleted.value) {
    return '提取完成'
  }
  return '处理中...'
})

const handleMinimize = () => {
  emit('minimize')
}

const handleViewHistory = () => {
  // 跳转到提取历史页面，传递提取数量以便显示多条记录
  router.push({
    path: '/documents/history',
    query: { 
      autoOpen: 'latest',
      count: props.totalCount.toString(),
      refresh: Date.now().toString() // 强制刷新
    }
  })
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
.extract-progress-card {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  overflow: hidden;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #ebeef5;
    background: #f5f7fa;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .loading-icon {
        font-size: 20px;
        color: #409eff;

        &.spinning {
          animation: rotate 1s linear infinite;
        }
      }

      .title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .close-icon {
      font-size: 16px;
      color: #909399;
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: #303133;
      }
    }
  }

  .card-body {
    padding: 20px 16px;

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .progress-text {
        font-size: 24px;
        font-weight: 600;
        color: #303133;

        .current {
          color: #409eff;
        }

        .separator {
          margin: 0 4px;
          color: #909399;
        }

        .total {
          color: #606266;
        }
      }

      .status-text {
        font-size: 14px;
        color: #606266;
      }
    }

    .result-summary {
      margin-top: 12px;
      display: flex;
      gap: 12px;
      font-size: 14px;

      .success-count {
        color: #67c23a;
      }

      .fail-count {
        color: #f56c6c;
      }
    }
  }

  .card-footer {
    padding: 12px 16px;
    border-top: 1px solid #ebeef5;
    background: #fafafa;
    display: flex;
    justify-content: flex-end;

    .el-button {
      width: 100%;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
