import * as React from 'react'
import { cn } from '@/lib/utils'

export function Tabs({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('flex flex-col gap-2', className)} {...props} /> }
export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground', className)} {...props} /> }
export function TabsTrigger({ active, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) { return <button className={cn('inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50', active && 'bg-card text-foreground shadow-sm', className)} {...props} /> }
