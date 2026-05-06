import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

type TestableAttributes = {
  'data-test-id'?: string
}

const buttonVariants = cva('ui-button', {
  variants: {
    variant: {
      default: 'primary',
      primary: 'primary',
      secondary: 'secondary',
      outline: 'outline',
      ghost: 'ghost',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const badgeVariants = cva('ui-badge', {
  variants: {
    variant: {
      default: '',
      secondary: 'muted',
      outline: 'outline',
      destructive: 'danger',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  TestableAttributes &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Card({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLElement> & TestableAttributes>) {
  return <section {...props} className={cn('ui-card', className)} />
}
export function CardHeader({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={cn('ui-card-header', className)} />
}
export function CardTitle({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return <h2 {...props} className={cn('ui-card-title', className)} />
}
export function CardContent({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={cn('ui-card-content', className)} />
}
export function Button({ asChild = false, className, type = 'button', variant, ...props }: PropsWithChildren<ButtonProps>) {
  const Comp = asChild ? Slot : 'button'
  return <Comp type={asChild ? undefined : type} {...props} className={cn(buttonVariants({ variant }), className)} />
}
export function Badge({ className, variant, ...props }: PropsWithChildren<HTMLAttributes<HTMLSpanElement> & TestableAttributes & VariantProps<typeof badgeVariants>>) {
  return <span {...props} className={cn(badgeVariants({ variant }), className)} />
}
