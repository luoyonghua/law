import { AppRouteRecord } from '@/types/router'

export const rulesRoutes: AppRouteRecord = {
  path: '/rules',
  name: 'Rules',
  redirect: '/rules/list',
  component: '/index/index',
  meta: {
    title: 'menus.rules.title',
    icon: 'icon-park-outline:list-view',
    order: 3,
    roles: ['R_SUPER', 'R_ADMIN', 'R_USER']
  },
  children: [
    {
      path: 'list',
      name: 'RulesList',
      component: '/rules/list',
      meta: {
        title: 'menus.rules.list',
        icon: 'icon-park-outline:list',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN', 'R_USER']
      }
    },
    {
      path: 'test-manual',
      name: 'RulesTestManual',
      component: '/rules/test-manual',
      meta: {
        title: 'menus.rules.testManual',
        icon: 'icon-park-outline:edit',
        roles: ['R_SUPER', 'R_ADMIN', 'R_USER']
      }
    },
    {
      path: 'test-document',
      name: 'RulesTestDocument',
      component: '/rules/test-document',
      meta: {
        title: 'menus.rules.testDocument',
        icon: 'icon-park-outline:file-text',
        roles: ['R_SUPER', 'R_ADMIN', 'R_USER']
      }
    },
    {
      path: 'comparison-rules',
      name: 'ComparisonRulesList',
      component: '/rules/comparison-rules',
      meta: {
        title: 'menus.rules.comparisonRules',
        icon: 'icon-park-outline:comparison',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN', 'R_USER']
      }
    },
    {
      path: 'system-prompts',
      name: 'SystemPrompts',
      component: '/system-prompts/index',
      meta: {
        title: 'menus.rules.systemPrompts',
        icon: 'icon-park-outline:setting-config',
        roles: ['R_SUPER', 'R_ADMIN']
      }
    }
  ]
}

export default rulesRoutes
