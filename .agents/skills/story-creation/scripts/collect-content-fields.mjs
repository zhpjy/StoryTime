#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../../..', '..')
const templatePath = resolve(root, 'apps/story-lab/src/editor/template-catalog.ts')
const schemaPath = resolve(root, 'packages/schema/src/types.ts')

function read(path) {
  return readFileSync(path, 'utf8')
}

function collectTemplateFields(source) {
  const fields = []
  const fieldPattern = /\{\s*name:\s*'([^']+)'\s*,\s*type:\s*'([^']+)'\s*,\s*required:\s*(true|false)\s*,\s*description:\s*'([^']+)'/g
  for (const match of source.matchAll(fieldPattern)) {
    fields.push({
      name: match[1],
      type: match[2],
      required: match[3] === 'true',
      description: match[4],
    })
  }
  return fields
}

function collectSchemaTypes(source) {
  const names = []
  const typePattern = /^export type ([A-Za-z0-9_]+)/gm
  for (const match of source.matchAll(typePattern)) names.push(match[1])
  return names
}

const templateSource = read(templatePath)
const schemaSource = read(schemaPath)
const fields = collectTemplateFields(templateSource)
const typeNames = collectSchemaTypes(schemaSource)

console.log('# StoryTime 内容字段摘要')
console.log('')
console.log(`模板字段数量：${fields.length}`)
console.log(`schema 类型数量：${typeNames.length}`)
console.log('')
console.log('## 模板字段')
for (const field of fields) {
  const required = field.required ? 'required' : 'optional'
  console.log(`- ${field.name} (${field.type}, ${required})：${field.description}`)
}
console.log('')
console.log('## Schema 类型')
for (const name of typeNames) console.log(`- ${name}`)
