import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '@/lib/cn'

export function Badge({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLSpanElement>>) {
  return <span {...props} className={cn('inline-flex rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] text-stone-200', className)} />
}
