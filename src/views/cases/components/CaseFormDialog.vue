<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑案件' : '新建案件'"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="案件编号" prop="case_number">
            <el-input v-model="formData.case_number" placeholder="请输入案件编号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="案件名称" prop="case_name">
            <el-input v-model="formData.case_name" placeholder="请输入案件名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="被告人姓名" prop="defendant_name">
            <el-input v-model="formData.defendant_name" placeholder="请输入被告人姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="身份证号" prop="defendant_id_number">
            <el-input v-model="formData.defendant_id_number" placeholder="请输入身份证号" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="性别" prop="defendant_gender">
            <el-select v-model="formData.defendant_gender" placeholder="请选择性别" style="width: 100%">
              <el-option
                v-for="item in GENDER_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="出生日期" prop="defendant_birth_date">
            <el-date-picker
              v-model="formData.defendant_birth_date"
              type="date"
              placeholder="请选择出生日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="住址" prop="defendant_address">
        <el-input v-model="formData.defendant_address" placeholder="请输入住址" />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="案件类型" prop="case_type">
            <el-select v-model="formData.case_type" placeholder="请选择案件类型" style="width: 100%">
              <el-option
                v-for="item in CASE_TYPE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="罪名" prop="crime_name">
            <el-input v-model="formData.crime_name" placeholder="请输入罪名" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="涉案金额" prop="crime_amount">
            <el-input v-model="formData.crime_amount" placeholder="请输入涉案金额" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="案件状态" prop="case_status">
            <el-input v-model="formData.case_status" placeholder="请输入案件状态" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="立案日期" prop="filing_date">
            <el-date-picker
              v-model="formData.filing_date"
              type="date"
              placeholder="请选择立案日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="逮捕日期" prop="arrest_date">
            <el-date-picker
              v-model="formData.arrest_date"
              type="date"
              placeholder="请选择逮捕日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="承办人" prop="handler">
            <el-input v-model="formData.handler" placeholder="请输入承办人" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="部门" prop="department">
            <el-input v-model="formData.department" placeholder="请输入部门" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="案件来源" prop="case_source">
        <el-input v-model="formData.case_source" placeholder="请输入案件来源" />
      </el-form-item>

      <el-form-item label="案情摘要" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入案情摘要"
          :rows="3"
        />
      </el-form-item>

      <el-form-item label="备注" prop="remarks">
        <el-input
          v-model="formData.remarks"
          type="textarea"
          placeholder="请输入备注"
          :rows="2"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createCase, updateCase, fetchCaseDetail } from '@/api/cases'
import { CASE_TYPE_OPTIONS, GENDER_OPTIONS } from '@/constants/caseTypes'

interface Props {
  visible: boolean
  caseId?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:visible', 'success'])

const formRef = ref<FormInstance>()
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = computed(() => !!props.caseId)

// 表单数据
const formData = reactive<Api.Cases.CaseFormData>({
  case_number: '',
  case_name: '',
  defendant_name: '',
  defendant_id_number: '',
  defendant_gender: undefined,
  defendant_birth_date: undefined,
  defendant_address: '',
  case_type: undefined,
  crime_name: '',
  crime_amount: '',
  case_status: 'pending',
  filing_date: undefined,
  arrest_date: undefined,
  handler: '',
  department: '',
  case_source: '',
  description: '',
  remarks: ''
})

// 表单验证规则
const rules: FormRules = {
  case_number: [{ required: true, message: '请输入案件编号', trigger: 'blur' }],
  case_name: [{ required: true, message: '请输入案件名称', trigger: 'blur' }],
  defendant_name: [{ required: true, message: '请输入被告人姓名', trigger: 'blur' }]
}

// 加载案件详情
const loadCaseDetail = async () => {
  if (!props.caseId) return

  loading.value = true
  try {
    const data = await fetchCaseDetail(props.caseId)
    Object.assign(formData, {
      case_number: data.case_number,
      case_name: data.case_name,
      defendant_name: data.defendant_name,
      defendant_id_number: data.defendant_id_number,
      defendant_gender: data.defendant_gender,
      defendant_birth_date: data.defendant_birth_date,
      defendant_address: data.defendant_address,
      case_type: data.case_type,
      crime_name: data.crime_name,
      crime_amount: data.crime_amount,
      case_status: data.case_status,
      filing_date: data.filing_date,
      arrest_date: data.arrest_date,
      handler: data.handler,
      department: data.department,
      case_source: data.case_source,
      description: data.description,
      remarks: data.remarks
    })
  } catch (error) {
    ElMessage.error('加载案件详情失败')
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    if (isEdit.value && props.caseId) {
      await updateCase(props.caseId, formData)
      ElMessage.success('更新成功')
    } else {
      await createCase(formData)
      ElMessage.success('创建成功')
    }

    emit('success')
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    }
  } finally {
    loading.value = false
  }
}

// 取消
const handleCancel = () => {
  dialogVisible.value = false
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    case_number: '',
    case_name: '',
    defendant_name: '',
    defendant_id_number: '',
    defendant_gender: undefined,
    defendant_birth_date: undefined,
    defendant_address: '',
    case_type: undefined,
    crime_name: '',
    crime_amount: '',
    case_status: 'pending',
    filing_date: undefined,
    arrest_date: undefined,
    handler: '',
    department: '',
    case_source: '',
    description: '',
    remarks: ''
  })
}

// 监听对话框显示
watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    if (props.caseId) {
      loadCaseDetail()
    } else {
      resetForm()
    }
  }
})

watch(dialogVisible, (val) => {
  if (!val) {
    emit('update:visible', false)
  }
})
</script>
