import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'danger'
type ButtonSize = 'default' | 'sm' | 'icon'

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center rounded-lg text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
        size === 'default' && 'min-h-9 px-3 py-2',
        size === 'sm' && 'min-h-8 px-2.5 py-1.5 text-xs',
        size === 'icon' && 'size-9 p-0',
        variant === 'default' && 'border border-amber-300/35 bg-amber-300/15 text-amber-100 hover:bg-amber-300/25',
        variant === 'secondary' && 'border border-cyan-200/25 bg-cyan-200/10 text-cyan-100 hover:bg-cyan-200/15',
        variant === 'ghost' && 'text-stone-200 hover:bg-white/10',
        variant === 'outline' && 'border border-white/15 bg-black/10 text-stone-100 hover:border-amber-300/40 hover:bg-amber-300/10',
        (variant === 'danger' || variant === 'destructive') && 'border border-red-400/35 bg-red-500/15 text-red-100 hover:bg-red-500/25',
        className,
      )}
    />
  )
}
