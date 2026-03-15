<template>
  <Teleport to="body">
    <Transition name="slide-fade">
      <div v-if="visible" class="extract-progress-card">
        <div class="card-header">
          <div class="header-left">
            <el-icon class="loading-icon" :class="{ spinning: isExtracting }">
              <Loading v-if="isExtracting" />
              <CircleCheck v-else-if="isCompleted && !hasFailed" />
              <CircleClose v-else-if="isCompleted && hasFailed" />
            </el-icon>
            <span class="title">结构化提取</span>
          </div>
          <el-icon class="close-icon" @click="handleClose">
            <Close />
          </el-icon>
        </div>

        <div class="card-body">
          <div class="file-info">
            <el-icon class="file-icon"><Document /></el-icon>
            <div class="file-name">{{ fileName }}</div>
          </div>

          <div class="status-info">
            <div class="status-text">
              {{ statusText }}
            </div>
            <el-progress
              v-if="isExtracting"
              :percentage="100"
              :indeterminate="true"
              :show-text="false"
              :stroke-width="4"
            />
          </div>

          <div v-if="isCompleted" class="result-info">
            <el-tag v-if="!hasFailed" type="success" size="large">
              <el-icon><CircleCheck /></el-icon>
              提取成功
            </el-tag>
            <el-tag v-else type="danger" size="large">
              <el-icon><CircleClose /></el-icon>
              提取失败
            </el-tag>
          </div>
        </div>

        <div v-if="isCompleted && !hasFailed" class="card-footer">
          <el-button type="primary" size="small" @click="handleViewExtractResult">
            查看结果
          </el-button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Loading, CircleCheck, CircleClose, Close, Document } from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  fileName: string
  isExtracting: boolean
  isCompleted: boolean
  hasFailed: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'view-result'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()

const statusText = computed(() => {
  if (props.isExtracting) {
    return '正在提取中，请稍候...'
  } else if (props.isCompleted && !props.hasFailed) {
    return '提取完成'
  } else if (props.isCompleted && props.hasFailed) {
    return '提取失败'
  }
  return '准备中...'
})

const handleClose = () => {
  emit('update:visible', false)
}

const handleViewExtractResult = () => {
  // 跳转到提取历史页面，单个提取只显示1条
  router.push({
    path: '/documents/history',
    query: { 
      autoOpen: 'latest',
      count: '1',
      refresh: Date.now().toString() // 强制刷新
    }
  })
  emit('update:visible', false)
  emit('view-result')
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

    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;

      .file-icon {
        font-size: 20px;
        color: #409eff;
        flex-shrink: 0;
      }

      .file-name {
        flex: 1;
        font-size: 14px;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .status-info {
      .status-text {
        font-size: 14px;
        color: #606266;
        margin-bottom: 12px;
        text-align: center;
      }
    }

    .result-info {
      display: flex;
      justify-content: center;
      margin-top: 12px;

      .el-tag {
        padding: 8px 16px;
        
        .el-icon {
          margin-right: 4px;
        }
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
