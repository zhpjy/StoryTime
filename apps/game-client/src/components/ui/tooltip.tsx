import type { HTMLAttributes, PropsWithChildren } from 'react'

export function TooltipLabel({ title, ...props }: PropsWithChildren<HTMLAttributes<HTMLSpanElement> & { title: string }>) {
  return <span {...props} title={title} />
}
