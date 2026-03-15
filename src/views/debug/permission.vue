<template>
  <div class="permission-debug">
    <el-card>
      <template #header>
        <h2>权限调试信息</h2>
      </template>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="访问模式">
          {{ accessMode }}
        </el-descriptions-item>
        <el-descriptions-item label="用户ID">
          {{ userInfo.userId }}
        </el-descriptions-item>
        <el-descriptions-item label="用户名">
          {{ userInfo.userName }}
        </el-descriptions-item>
        <el-descriptions-item label="角色列表">
          <el-tag v-for="role in userInfo.roles" :key="role" style="margin-right: 8px">
            {{ role }}
          </el-tag>
          <span v-if="!userInfo.roles || userInfo.roles.length === 0" style="color: red">
            ❌ 未设置角色
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="按钮权限">
          <el-tag
            v-for="btn in userInfo.buttons"
            :key="btn"
            type="success"
            style="margin-right: 8px; margin-bottom: 8px"
          >
            {{ btn }}
          </el-tag>
          <span v-if="!userInfo.buttons || userInfo.buttons.length === 0" style="color: red">
            ❌ 未设置按钮权限
          </span>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <h3>权限测试</h3>
      <el-space wrap>
        <el-tag :type="hasAuth('upload') ? 'success' : 'danger'">
          upload: {{ hasAuth('upload') ? '✅' : '❌' }}
        </el-tag>
        <el-tag :type="hasAuth('batch-extract') ? 'success' : 'danger'">
          batch-extract: {{ hasAuth('batch-extract') ? '✅' : '❌' }}
        </el-tag>
        <el-tag :type="hasAuth('compare') ? 'success' : 'danger'">
          compare: {{ hasAuth('compare') ? '✅' : '❌' }}
        </el-tag>
        <el-tag :type="hasAuth('review') ? 'success' : 'danger'">
          review: {{ hasAuth('review') ? '✅' : '❌' }}
        </el-tag>
        <el-tag :type="hasAuth('extract') ? 'success' : 'danger'">
          extract: {{ hasAuth('extract') ? '✅' : '❌' }}
        </el-tag>
        <el-tag :type="hasAuth('download') ? 'success' : 'danger'">
          download: {{ hasAuth('download') ? '✅' : '❌' }}
        </el-tag>
      </el-space>

      <el-divider />

      <h3>完整用户信息（JSON）</h3>
      <el-input
        v-model="userInfoJson"
        type="textarea"
        :rows="15"
        readonly
        style="font-family: monospace"
      />

      <el-divider />

      <el-button type="primary" @click="copyToClipboard">复制用户信息</el-button>
      <el-button @click="refreshUserInfo">刷新</el-button>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/modules/user'
import { useAuth } from '@/hooks/core/useAuth'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const { info } = storeToRefs(userStore)
const { hasAuth } = useAuth()

const accessMode = import.meta.env.VITE_ACCESS_MODE

const userInfo = computed(() => info.value || {})

const userInfoJson = computed(() => {
  return JSON.stringify(
    {
      accessMode: import.meta.env.VITE_ACCESS_MODE,
      apiUrl: import.meta.env.VITE_API_URL,
      documentApiUrl: import.meta.env.VITE_DOCUMENT_API_URL,
      userInfo: info.value
    },
    null,
    2
  )
})

const copyToClipboard = () => {
  navigator.clipboard.writeText(userInfoJson.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  })
}

const refreshUserInfo = () => {
  location.reload()
}
</script>

<style scoped lang="scss">
.permission-debug {
  padding: 20px;

  h3 {
    margin: 16px 0;
    font-size: 16px;
    font-weight: 600;
  }
}
</style>
