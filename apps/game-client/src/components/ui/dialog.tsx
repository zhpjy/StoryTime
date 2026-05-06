import type { HTMLAttributes, PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

export function DialogOverlay({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  const overlay = <div {...props} className={cn('fixed inset-0 z-[200] grid place-items-center bg-black/70 p-4 backdrop-blur-sm', className)} />
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body)
}

export function DialogContent({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={cn('w-full max-w-2xl rounded-lg border border-white/10 bg-stone-950 text-stone-100 shadow-2xl shadow-black/40', className)} />
}

export function DialogHeader({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={cn('border-b border-white/10 px-5 py-4', className)} />
}

export function DialogTitle({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return <h2 {...props} className={cn('text-xl font-semibold text-amber-100', className)} />
}

export function DialogBody({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={cn('p-5', className)} />
}
