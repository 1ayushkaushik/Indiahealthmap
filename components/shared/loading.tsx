"use client"

interface LoadingProps {
  height?: number | string;
}

export function Loading({ height = 700 }: LoadingProps) {
  return (
    <div 
      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 dark:border-slate-200" />
      </div>
    </div>
  )
} 