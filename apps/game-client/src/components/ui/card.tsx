import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={cn('rounded-lg border border-white/10 bg-stone-950/60 shadow-2xl shadow-black/30 backdrop-blur', className)} />
}

export function CardHeader({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={cn('border-b border-white/10 px-4 py-3', className)} />
}

export function CardTitle({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return <h2 {...props} className={cn('text-base font-semibold tracking-wide text-amber-100', className)} />
}

export function CardDescription({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLParagraphElement>>) {
  return <p {...props} className={cn('mt-1 text-xs leading-5 text-stone-400', className)} />
}

export function CardContent({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={cn('p-4', className)} />
}

export function CardFooter({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={cn('border-t border-white/10 px-4 py-3', className)} />
}
