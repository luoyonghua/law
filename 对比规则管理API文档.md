# 对比规则管理API文档

## 基础信息

- **基础路径**: `/api/comparison-rules`
- **标签**: 对比规则管理
- **说明**: 提供对比规则的增删改查功能

---

## 接口列表

### 1. 获取对比阶段列表

#### 1.1 获取所有对比阶段

- **请求路径**: `/api/comparison-rules/stages`
- **请求方法**: GET
- **请求参数**: 无
- **响应数据**:

```json
{
  "success": true,
  "data": {
    "stages": [
      {
        "id": "arrest_request_vs_arrest_review",
        "name": "逮捕阶段对比",
        "file": "prompts/comparison/arrest_stage/arrest_comparison_rules.json"
      },
      {
        "id": "prosecution_opinion_vs_prosecution_review",
        "name": "起诉阶段对比",
        "file": "prompts/comparison/prosecution_stage/prosecution_comparison_rules.json"
      },
      {
        "id": "indictment_vs_judgment",
        "name": "审判阶段对比",
        "file": "prompts/comparison/trial_stage/trial_comparison_rules.json"
      }
    ],
    "total": 3
  }
}
```

---

### 2. 获取统计信息

#### 2.1 获取对比规则统计信息

- **请求路径**: `/api/comparison-rules/statistics`
- **请求方法**: GET
- **请求参数**: 无
- **响应数据**:

```json
{
  "success": true,
  "data": {
    "total_rules": 45,
    "rules_by_stage": {
      "arrest_request_vs_arrest_review": 9,
      "prosecution_opinion_vs_prosecution_review": 15,
      "indictment_vs_judgment": 21
    },
    "rules_by_severity": {
      "严重": 15,
      "中等": 20,
      "轻微": 10
    },
    "rules_by_category": {
      "基础信息核对": 3,
      "罪名认定": 5,
      "事实认定": 9,
      "证据充分性": 4,
      "证据链条": 4,
      "法律适用": 5,
      "量刑对比": 4,
      "审查结论": 4,
      "程序合规": 4,
      "风险评估": 3
    }
  }
}
```

---

### 3. 获取规则列表

#### 3.1 获取指定阶段的所有规则

- **请求路径**: `/api/comparison-rules/{stage}`
- **请求方法**: GET
- **路径参数**:
  - `stage`: 对比阶段ID（必填）
    - `arrest_request_vs_arrest_review` - 逮捕阶段
    - `prosecution_opinion_vs_prosecution_review` - 起诉阶段
    - `indictment_vs_judgment` - 审判阶段
- **响应数据**:

```json
{
  "success": true,
  "data": {
    "stage": "prosecution_opinion_vs_prosecution_review",
    "stage_name": "起诉阶段对比",
    "rules": [
      {
        "code": "PROS-CMP-001",
        "name": "基础信息一致性",
        "category": "基础信息核对",
        "severity": "严重",
        "description": "检查案号、被告人基本信息、移送时间等基础信息是否一致",
        "check_points": [
          "案号是否一致",
          "犯罪嫌疑人/被告人姓名、性别、出生日期、身份证号是否一致",
          "案发时间、案发地点是否一致"
        ],
        "rule_for_llm": "逐项对比基础信息，任何不一致都要单独列出。即使是轻微差异（如时间精确度不同），也必须报告。",
        "legal_basis": "《刑事诉讼法》第176条",
        "stage": "prosecution_opinion_vs_prosecution_review"
      }
    ],
    "total": 15,
    "statistics": {
      "total_rules": 15,
      "by_category": {
        "基础信息核对": 1,
        "罪名认定": 2,
        "事实认定": 3
      },
      "by_severity": {
        "严重": 5,
        "中等": 7,
        "轻微": 3
      }
    }
  }
}
```

---

### 4. 搜索规则

#### 4.1 搜索对比规则

- **请求路径**: `/api/comparison-rules/search`
- **请求方法**: POST
- **请求参数**:

```json
{
  "keyword": "基础信息",     // 可选，关键词（搜索code、name、description）
  "stage": "prosecution_opinion_vs_prosecution_review",  // 可选，对比阶段
  "category": "基础信息核对",  // 可选，规则类别
  "severity": "严重"          // 可选，严重程度（严重/中等/轻微）
}
```

- **响应数据**:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "code": "PROS-CMP-001",
        "name": "基础信息一致性",
        "category": "基础信息核对",
        "severity": "严重",
        "description": "检查案号、被告人基本信息、移送时间等基础信息是否一致",
        "check_points": [
          "案号是否一致",
          "犯罪嫌疑人/被告人姓名、性别、出生日期、身份证号是否一致"
        ],
        "rule_for_llm": "逐项对比基础信息，任何不一致都要单独列出。",
        "legal_basis": "《刑事诉讼法》第176条",
        "stage": "prosecution_opinion_vs_prosecution_review"
      }
    ],
    "total": 1
  }
}
```

---

### 5. 添加规则

#### 5.1 添加对比规则

- **请求路径**: `/api/comparison-rules/{stage}`
- **请求方法**: POST
- **路径参数**:
  - `stage`: 对比阶段ID（必填）
- **请求参数**:

```json
{
  "code": "PROS-CMP-016",              // 必填，规则编号（唯一）
  "name": "新规则名称",                 // 必填，规则名称
  "category": "基础信息核对",           // 必填，规则类别
  "severity": "中等",                   // 必填，严重程度（严重/中等/轻微）
  "description": "规则描述说明",        // 必填，规则描述
  "check_points": [                     // 可选，检查点列表
    "检查点1",
    "检查点2"
  ],
  "rule_for_llm": "给LLM的审查指令",   // 必填，审查指令
  "legal_basis": "《刑事诉讼法》第XX条" // 可选，法律依据
}
```

- **响应数据**:

```json
{
  "success": true,
  "message": "规则添加成功",
  "data": {
    "rule": {
      "code": "PROS-CMP-016",
      "name": "新规则名称",
      "category": "基础信息核对",
      "severity": "中等",
      "description": "规则描述说明",
      "check_points": [
        "检查点1",
        "检查点2"
      ],
      "rule_for_llm": "给LLM的审查指令",
      "legal_basis": "《刑事诉讼法》第XX条"
    }
  }
}
```

- **错误响应**:

```json
{
  "detail": "规则编号 PROS-CMP-016 已存在"
}
```

---

### 6. 更新规则

#### 6.1 更新对比规则

- **请求路径**: `/api/comparison-rules/{stage}/{rule_code}`
- **请求方法**: PUT
- **路径参数**:
  - `stage`: 对比阶段ID（必填）
  - `rule_code`: 规则编号（必填）
- **请求参数**:

```json
{
  "code": "PROS-CMP-001",              // 必填，规则编号
  "name": "更新后的规则名称",           // 必填，规则名称
  "category": "基础信息核对",           // 必填，规则类别
  "severity": "严重",                   // 必填，严重程度
  "description": "更新后的规则描述",    // 必填，规则描述
  "check_points": [                     // 可选，检查点列表
    "更新后的检查点1",
    "更新后的检查点2"
  ],
  "rule_for_llm": "更新后的审查指令",  // 必填，审查指令
  "legal_basis": "《刑事诉讼法》第176条" // 可选，法律依据
}
```

- **响应数据**:

```json
{
  "success": true,
  "message": "规则更新成功",
  "data": {
    "rule": {
      "code": "PROS-CMP-001",
      "name": "更新后的规则名称",
      "category": "基础信息核对",
      "severity": "严重",
      "description": "更新后的规则描述",
      "check_points": [
        "更新后的检查点1",
        "更新后的检查点2"
      ],
      "rule_for_llm": "更新后的审查指令",
      "legal_basis": "《刑事诉讼法》第176条"
    }
  }
}
```

- **错误响应**:

```json
{
  "detail": "未找到规则: PROS-CMP-999"
}
```

---

### 7. 删除规则

#### 7.1 删除对比规则

- **请求路径**: `/api/comparison-rules/{stage}/{rule_code}`
- **请求方法**: DELETE
- **路径参数**:
  - `stage`: 对比阶段ID（必填）
  - `rule_code`: 规则编号（必填）
- **响应数据**:

```json
{
  "success": true,
  "message": "规则删除成功",
  "data": {
    "deleted_rule": {
      "code": "PROS-CMP-001",
      "name": "基础信息一致性",
      "category": "基础信息核对",
      "severity": "严重",
      "description": "检查案号、被告人基本信息、移送时间等基础信息是否一致",
      "check_points": [
        "案号是否一致"
      ],
      "rule_for_llm": "逐项对比基础信息",
      "legal_basis": "《刑事诉讼法》第176条"
    }
  }
}
```

- **错误响应**:

```json
{
  "detail": "未找到规则: PROS-CMP-999"
}
```

---

### 8. 预览提示词

#### 8.1 预览对比提示词

- **请求路径**: `/api/comparison-rules/preview-prompt`
- **请求方法**: POST
- **请求参数**:

```json
{
  "stage": "prosecution_opinion_vs_prosecution_review",  // 必填，对比阶段
  "selected_rules": [                                     // 可选，选中的规则编号列表
    "PROS-CMP-001",
    "PROS-CMP-002",
    "PROS-CMP-003"
  ],
  "doc_a_content": "文书A的实际内容...",                  // 可选，文书A内容
  "doc_b_content": "文书B的实际内容..."                   // 可选，文书B内容
}
```

- **响应数据**:

```json
{
  "success": true,
  "data": {
    "prompt": "# 角色定义\n你是一名专业的起诉阶段对比文书比对专家...\n\n# 对比说明\n这是起诉阶段对比的文书对比。\n- 文书A：起诉意见书\n- 文书B：审查起诉报告\n\n# 对比原则\n1. **逐项对比**: 按照规则逐项对比...\n\n# 对比规则\n请按照以下3条规则进行对比：\n\n## 基础信息核对\n\n### PROS-CMP-001 - 基础信息一致性\n**严重程度**: 严重\n**描述**: 检查案号、被告人基本信息...\n\n**检查点**:\n- 案号是否一致\n- 犯罪嫌疑人/被告人姓名...\n\n**审查指令**:\n逐项对比基础信息，任何不一致都要单独列出。\n\n**法律依据**: 《刑事诉讼法》第176条\n\n# 待对比文书\n\n## 文书A：起诉意见书\n```\n文书A的实际内容...\n```\n\n## 文书B：审查起诉报告\n```\n文书B的实际内容...\n```\n\n# 重要提示\n⚠️ 必须逐项对比每个规则\n⚠️ 每个差异都要单独列出，不能合并\n...",
    "statistics": {
      "length": 12580,
      "rules_count": 3,
      "estimated_tokens": 6290
    }
  },
  "message": "提示词生成成功"
}
```

- **错误响应**:

```json
{
  "detail": "缺少对比阶段参数"
}
```

---



---

## 规则化对比接口

### 9. 执行规则化对比

#### 9.1 规则化对比文书

- **请求路径**: `/api/comparison/rule-based-compare`
- **请求方法**: POST
- **请求参数**:

```json
{
  "doc_ids": [                          // 必填，文档ID列表（至少2个）
    "doc_abc123",
    "doc_def456"
  ],
  "comparison_type": "rule_based",      // 可选，对比类型
  "custom_elements": []                 // 可选，自定义要素
}
```

- **响应数据**:

```json
{
  "code": 200,
  "msg": "规则化对比完成（使用15条规则）",
  "data": {
    "comparison_id": "rule_comp_abc123def456",
    "doc_ids": ["doc_abc123", "doc_def456"],
    "comparison_stage": "prosecution_opinion_vs_prosecution_review",
    "rules_count": 15,
    "total_differences": 5,
    "severity_breakdown": {
      "严重": 2,
      "中等": 2,
      "轻微": 1
    },
    "match_rate": 0.85,
    "consistency_level": "基本一致",
    "differences": [
      {
        "rule_code": "PROS-CMP-003",
        "category": "罪名认定",
        "item": "罪名一致性",
        "doc_a_content": "盗窃罪",
        "doc_b_content": "诈骗罪",
        "difference_type": "罪名不一致",
        "severity": "严重",
        "analysis": "两份文书认定的罪名不一致，存在重大差异",
        "reason": "事实认定存在差异，导致罪名适用不同",
        "suggestion": "需要重新核实案件事实，确定正确的罪名"
      }
    ],
    "summary": "🎯 规则化对比完成。两份文书基本一致，但存在5处差异需要关注。主要问题：罪名认定不一致; 证据链条不完整",
    "checked_rules": [
      {
        "code": "PROS-CMP-001",
        "name": "基础信息一致性",
        "category": "基础信息核对",
        "status": "passed"
      },
      {
        "code": "PROS-CMP-002",
        "name": "案件事实完整性",
        "category": "事实认定",
        "status": "passed"
      },
      {
        "code": "PROS-CMP-003",
        "name": "罪名一致性",
        "category": "罪名认定",
        "status": "failed",
        "differences_count": 1
      }
    ],
    "created_at": "2026-03-08T10:30:00",
    "comparison_method": "rule_based",
    "prompt_length": 12580
  }
}
```

- **错误响应**:

```json
{
  "detail": "至少需要2份文书进行规则化对比"
}
```

```json
{
  "detail": "无法确定对比阶段，不支持的文书类型组合: 起诉书 vs 判决书"
}
```

- **使用示例**:

```bash
curl -X POST "http://localhost:8000/api/comparison/rule-based-compare" \
  -H "Content-Type: application/json" \
  -d '{
    "doc_ids": ["doc_abc123", "doc_def456"],
    "comparison_type": "rule_based"
  }'
```

---

## 对比历史接口

### 10. 获取对比历史列表

#### 10.1 分页获取所有对比历史

- **请求路径**: `/api/comparison/history/list`
- **请求方法**: GET
- **请求参数**:
  - `page`: 页码（可选，默认1，最小1）
  - `page_size`: 每页数量（可选，默认20，范围1-100）

- **响应数据**:

```json
{
  "success": true,
  "data": {
    "comparisons": [
      {
        "comparison_id": "log_abc123def456",
        "doc_ids": ["doc_abc123", "doc_def456"],
        "doc_names": ["起诉意见书_张三.docx", "审查起诉报告_张三.docx"],
        "doc_types": ["起诉意见书", "审查起诉报告"],
        "operation": "rule_based_compare",
        "similarity": 0.85,
        "differences_count": 5,
        "created_at": "2026-03-08 10:30:00",
        "created_by": "user_123"
      },
      {
        "comparison_id": "log_xyz789abc012",
        "doc_ids": ["doc_xyz789", "doc_abc012"],
        "doc_names": ["提请批准逮捕书_李四.docx", "审查逮捕报告_李四.docx"],
        "doc_types": ["提请批准逮捕书", "审查逮捕报告"],
        "operation": "llm_compare",
        "similarity": 0.92,
        "differences_count": 2,
        "created_at": "2026-03-08 09:15:00",
        "created_by": "user_456"
      }
    ],
    "total": 156,
    "page": 1,
    "page_size": 20,
    "total_pages": 8
  },
  "message": "获取对比历史成功，共 156 条记录"
}
```

- **使用示例**:

```bash
# 获取第1页，每页20条
curl -X GET "http://localhost:8000/api/comparison/history/list?page=1&page_size=20"

# 获取第2页，每页50条
curl -X GET "http://localhost:8000/api/comparison/history/list?page=2&page_size=50"
```

---

### 11. 根据文档ID获取对比历史

#### 11.1 获取指定文档的所有对比历史

- **请求路径**: `/api/comparison/history/by-doc/{doc_id}`
- **请求方法**: GET
- **路径参数**:
  - `doc_id`: 文档ID（必填）
- **请求参数**:
  - `limit`: 返回记录数量（可选，默认20）

- **响应数据**:

```json
{
  "success": true,
  "data": {
    "doc_id": "doc_abc123",
    "file_name": "起诉意见书_张三.docx",
    "doc_type": "起诉意见书",
    "total_comparisons": 3,
    "comparisons": [
      {
        "comparison_id": "log_abc123def456",
        "doc_ids": ["doc_abc123", "doc_def456"],
        "doc_names": ["起诉意见书_张三.docx", "审查起诉报告_张三.docx"],
        "doc_types": ["起诉意见书", "审查起诉报告"],
        "operation": "rule_based_compare",
        "similarity": 0.85,
        "differences_count": 5,
        "created_at": "2026-03-08 10:30:00",
        "created_by": "user_123"
      },
      {
        "comparison_id": "log_abc123ghi789",
        "doc_ids": ["doc_abc123", "doc_ghi789"],
        "doc_names": ["起诉意见书_张三.docx", "起诉书_张三.docx"],
        "doc_types": ["起诉意见书", "起诉书"],
        "operation": "llm_compare",
        "similarity": 0.90,
        "differences_count": 3,
        "created_at": "2026-03-07 15:20:00",
        "created_by": "user_123"
      }
    ]
  },
  "message": "成功获取 3 条对比历史"
}
```

- **错误响应**:

```json
{
  "detail": "未找到文档: doc_abc123"
}
```

- **使用示例**:

```bash
# 获取文档的对比历史，默认20条
curl -X GET "http://localhost:8000/api/comparison/history/by-doc/doc_abc123"

# 获取文档的对比历史，限制10条
curl -X GET "http://localhost:8000/api/comparison/history/by-doc/doc_abc123?limit=10"
```

---

### 12. 根据案件ID获取对比历史

#### 12.1 获取指定案件的所有对比历史

- **请求路径**: `/api/comparison/history/by-case/{case_id}`
- **请求方法**: GET
- **路径参数**:
  - `case_id`: 案件ID（必填）

- **响应数据**:

```json
{
  "success": true,
  "data": {
    "case_id": "case_20260308001",
    "case_info": {
      "case_name": "张三盗窃案",
      "case_number": "京检刑诉〔2026〕001号"
    },
    "total_documents": 5,
    "total_comparisons": 8,
    "comparisons": [
      {
        "comparison_id": "log_abc123def456",
        "doc_ids": ["doc_abc123", "doc_def456"],
        "doc_names": ["起诉意见书_张三.docx", "审查起诉报告_张三.docx"],
        "doc_types": ["起诉意见书", "审查起诉报告"],
        "operation": "rule_based_compare",
        "similarity": 0.85,
        "differences_count": 5,
        "created_at": "2026-03-08 10:30:00",
        "created_by": "user_123"
      }
    ]
  },
  "message": "成功获取案件 case_20260308001 的对比历史，共 8 条记录（从 12 条中过滤）"
}
```

- **说明**:
  - 只返回两个文档都属于该案件的对比记录
  - 如果对比涉及其他案件的文档，会被过滤掉

- **使用示例**:

```bash
curl -X GET "http://localhost:8000/api/comparison/history/by-case/case_20260308001"
```

---

### 13. 根据文件名获取最新对比

#### 13.1 根据文件名获取最新对比结果

- **请求路径**: `/api/comparison/history/latest/by-filename`
- **请求方法**: GET
- **请求参数**:
  - `file_name`: 文件名（必填，支持模糊匹配）

- **响应数据**:

```json
{
  "success": true,
  "data": {
    "doc_id": "doc_abc123",
    "file_name": "起诉意见书_张三.docx",
    "doc_type": "起诉意见书",
    "has_comparison": true,
    "comparison": {
      "comparison_id": "log_abc123def456",
      "operation": "rule_based_compare",
      "details": {
        "comparison_type": "rule_based",
        "comparison_stage": "prosecution_opinion_vs_prosecution_review",
        "compared_docs": ["doc_abc123", "doc_def456"],
        "rules_count": 15
      },
      "results": {
        "comparison_id": "rule_comp_abc123def456",
        "doc_ids": ["doc_abc123", "doc_def456"],
        "comparison_stage": "prosecution_opinion_vs_prosecution_review",
        "rules_count": 15,
        "total_differences": 5,
        "match_rate": 0.85,
        "differences": [],
        "checked_rules": []
      },
      "created_at": "2026-03-08 10:30:00",
      "user_id": "user_123"
    }
  },
  "message": "成功获取文件 '起诉意见书_张三.docx' 的最新对比结果"
}
```

- **无对比记录响应**:

```json
{
  "success": true,
  "data": {
    "doc_id": "doc_abc123",
    "file_name": "起诉意见书_张三.docx",
    "doc_type": "起诉意见书",
    "has_comparison": false,
    "message": "该文档尚未进行对比"
  },
  "message": "文档存在但未对比"
}
```

- **错误响应**:

```json
{
  "detail": "未找到文件名包含 '起诉意见书_王五' 的文档"
}
```

- **使用示例**:

```bash
curl -X GET "http://localhost:8000/api/comparison/history/latest/by-filename?file_name=起诉意见书_张三"
```

---

## 数据模型说明

### 规则对象 (Rule)

```typescript
{
  code: string;              // 规则编号（唯一标识）
  name: string;              // 规则名称
  category: string;          // 规则类别
  severity: string;          // 严重程度（严重/中等/轻微）
  description: string;       // 规则描述
  check_points: string[];    // 检查点列表
  rule_for_llm: string;      // 给LLM的审查指令
  legal_basis?: string;      // 法律依据（可选）
  stage?: string;            // 所属对比阶段（查询时返回）
}
```

### 差异对象 (Difference)

```typescript
{
  rule_code: string;         // 规则编号
  category: string;          // 规则类别
  item: string;              // 对比项
  doc_a_content: string;     // 文书A的内容
  doc_b_content: string;     // 文书B的内容
  difference_type: string;   // 差异类型
  severity: string;          // 严重程度（严重/中等/轻微）
  analysis: string;          // 差异分析
  reason: string;            // 可能原因
  suggestion: string;        // 建议
}
```

### 规则检查结果 (CheckedRule)

```typescript
{
  code: string;              // 规则编号
  name: string;              // 规则名称
  category: string;          // 规则类别
  status: 'passed' | 'failed';  // 检查状态
  differences_count?: number;   // 差异数量（仅failed时有）
}
```

### 对比历史记录 (ComparisonHistory)

```typescript
{
  comparison_id: string;     // 对比ID
  doc_ids: string[];         // 文档ID列表
  doc_names: string[];       // 文档名称列表
  doc_types: string[];       // 文档类型列表
  operation: string;         // 操作类型
  similarity: number;        // 相似度（0-1）
  differences_count: number; // 差异数量
  created_at: string;        // 创建时间（北京时间）
  created_by: string;        // 创建人
}
```

---

## 对比阶段ID说明

| 阶段ID | 阶段名称 | 文书类型组合 | 规则文件 |
|--------|---------|-------------|---------|
| `arrest_request_vs_arrest_review` | 逮捕阶段对比 | 提请批准逮捕书 vs 审查逮捕报告 | `prompts/comparison/arrest_stage/arrest_comparison_rules.json` |
| `prosecution_opinion_vs_prosecution_review` | 起诉阶段对比 | 起诉意见书 vs 审查起诉报告 | `prompts/comparison/prosecution_stage/prosecution_comparison_rules.json` |
| `indictment_vs_judgment` | 审判阶段对比 | 起诉书 vs 判决书 | `prompts/comparison/trial_stage/trial_comparison_rules.json` |

**跨阶段对比支持**：
- 逮捕→起诉：使用起诉阶段规则
- 起诉→审判：使用审判阶段规则
- 逮捕→审判：使用审判阶段规则

---

## 规则类别说明

### 逮捕阶段（9条规则）
- 基础信息核对
- 罪名认定
- 事实认定
- 证据充分性
- 逮捕必要性
- 程序合规
- 风险评估

### 起诉阶段（15条规则）
- 基础信息核对
- 罪名认定
- 事实认定
- 证据充分性
- 证据链条
- 法律适用
- 量刑建议
- 程序合规
- 风险评估

### 审判阶段（21条规则）
- 基础信息核对
- 罪名认定
- 事实认定
- 证据充分性
- 证据链条
- 法律适用
- 量刑对比
- 审查结论
- 程序合规
- 风险评估

---

## 操作类型说明

| 操作类型 | 说明 | 特点 |
|---------|------|------|
| `compare` | 传统要素对比 | 基于提取的要素进行对比 |
| `llm_compare` | LLM智能对比 | 使用LLM进行全文对比 |
| `compare_llm_elements` | LLM要素对比 | 基于要素的LLM对比 |
| `compare_llm_fallback` | LLM降级对比 | 要素提取失败时的降级方案 |
| `rule_based_compare` | 规则化对比 | 使用规则库动态生成提示词对比 |

---

## 错误码说明

| 错误码 | 说明 | 解决方案 |
|--------|------|---------|
| 400 | 请求参数错误 | 检查请求参数是否完整和正确 |
| 404 | 资源不存在 | 检查规则编号、阶段ID、文档ID是否正确 |
| 409 | 资源冲突 | 规则编号已存在，使用不同的编号 |
| 500 | 服务器内部错误 | 查看服务器日志，联系管理员 |

---

## 注意事项

### 对比规则管理
1. **规则编号唯一性**: 同一阶段内规则编号必须唯一
2. **规则编号格式**: 建议使用 `阶段前缀-CMP-序号` 格式，如 `PROS-CMP-001`
3. **严重程度**: 只能是"严重"、"中等"、"轻微"三个值之一
4. **规则类别**: 建议使用预定义的类别，保持一致性
5. **检查点**: 建议3-5个检查点，清晰具体
6. **审查指令**: 必须明确告诉LLM如何检查，避免模糊表述

### 规则化对比
1. **文档数量**: 必须恰好2个文档
2. **文书类型**: 必须是支持的文书类型组合
3. **对比阶段**: 系统自动识别，支持跨阶段对比
4. **规则加载**: 自动加载对应阶段的所有规则
5. **超时设置**: LLM调用超时时间为120秒
6. **结果保存**: 自动保存到审计日志，可在对比历史中查看

### 对比历史
1. **时间格式**: 所有时间都转换为北京时间（UTC+8）
2. **分页查询**: 建议每页20-50条，避免一次加载过多数据
3. **文档过滤**: 按案件查询时，只返回该案件内的对比记录
4. **操作类型**: 包含5种对比类型，可根据operation字段区分
5. **相似度**: 范围0-1，越接近1表示越相似
6. **差异数量**: 表示发现的差异项数量，不是规则数量

---

## 使用流程

### 规则化对比完整流程

1. **准备文档**
   - 上传2个需要对比的文档
   - 确保文档类型正确（如"起诉意见书"、"审查起诉报告"）

2. **执行对比**
   ```bash
   curl -X POST "http://localhost:8000/api/comparison/rule-based-compare" \
     -H "Content-Type: application/json" \
     -d '{"doc_ids": ["doc_abc123", "doc_def456"]}'
   ```

3. **查看结果**
   - 返回的结果包含差异详情、规则检查结果、相似度等
   - `checked_rules` 字段显示每条规则的通过/未通过状态

4. **查看历史**
   ```bash
   curl -X GET "http://localhost:8000/api/comparison/history/list?page=1&page_size=20"
   ```

5. **查看详情**
   - 在对比历史页面点击"查看详情"
   - 可以看到通过的规则和未通过的规则
   - 按类别分组显示，便于分析

---

## 相关文档

- [规则化对比快速参考](规则化对比快速参考.md)
- [规则化对比支持的文书类型](规则化对比支持的文书类型.md)
- [规则化对比提示词来源说明](规则化对比提示词来源说明.md)
- [规则化对比历史记录说明](规则化对比历史记录说明.md)
- [API快速参考](API快速参考.md)
- [API接口文档](API接口文档.md)
