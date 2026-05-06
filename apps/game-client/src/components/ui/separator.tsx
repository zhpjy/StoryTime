import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Separator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('h-px w-full bg-white/10', className)} />
}
