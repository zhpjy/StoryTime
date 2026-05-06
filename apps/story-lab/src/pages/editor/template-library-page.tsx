import { useState } from 'react'
import {
  Database
} from 'lucide-react'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui'
import {
  PageHeader
} from '../../components/common'
import { templateCategories } from '../../editor/template-catalog'

export function TemplateLibraryPage() {
  const [activeCategoryId, setActiveCategoryId] = useState(templateCategories[0]?.id ?? '')
  const activeCategory = templateCategories.find((category) => category.id === activeCategoryId) ?? templateCategories[0]

  return (
    <>
      <PageHeader
        eyebrow="Templates"
        testId="templates-header"
        title="功能模板"
        description="按系统模块查看当前内容包支持的参数、字段、可选值和运行影响。"
      />

      <section className="template-layout" data-test-id="templates-layout">
        <Card data-test-id="templates-category-card">
          <CardHeader>
            <CardTitle>模板分类</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="object-list">
              {templateCategories.map((category) => (
                <button
                  key={category.id}
                  className={activeCategory.id === category.id ? 'object-row is-selected' : 'object-row'}
                  data-test-id={`template-category-${category.id}`}
                  type="button"
                  onClick={() => setActiveCategoryId(category.id)}
                >
                  <Database size={16} />
                  <span>{category.name}</span>
                  <Badge data-test-id={`template-category-count-${category.id}`}>{category.fields.length}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-test-id="templates-fields-card">
          <CardHeader>
            <CardTitle>{activeCategory.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="lead-text">{activeCategory.description}</p>
            {activeCategory.allowedValues && (
              <div className="allowed-value-list">
                {activeCategory.allowedValues.map((group) => (
                  <div key={group.label} className="allowed-value-group" data-test-id={`template-allowed-values-${group.label}`}>
                    <strong>{group.label}</strong>
                    <div className="badge-wrap">
                      {group.values.map((value) => (
                        <Badge key={value} data-test-id={`template-allowed-value-${group.label}-${value}`}>{value}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="template-field-list">
              {activeCategory.fields.map((field) => (
                <div key={`${activeCategory.id}:${field.name}`} className="field-row" data-test-id={`template-field-${activeCategory.id}-${field.name}`}>
                  <div className="field-main">
                    <strong>{field.name}</strong>
                    <span>{field.description}</span>
                  </div>
                  <div className="field-meta">
                    <Badge data-test-id={`template-field-type-${activeCategory.id}-${field.name}`}>{field.type}</Badge>
                    <Badge className={field.required ? 'warn' : 'muted'} data-test-id={`template-field-required-${activeCategory.id}-${field.name}`}>{field.required ? '必填' : '可选'}</Badge>
                    <code>{field.example}</code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
