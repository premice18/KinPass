import * as React from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }) {
  const variants = { default: 'bg-primary/10 text-primary', secondary: 'bg-secondary text-secondary-foreground', success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', destructive: 'bg-destructive/10 text-destructive' }
  return <div className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', variants[variant], className)} {...props} />
}
