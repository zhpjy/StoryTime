import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '@/lib/cn'

export function ScrollArea({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={cn('min-h-0 overflow-auto', className)} />
}
