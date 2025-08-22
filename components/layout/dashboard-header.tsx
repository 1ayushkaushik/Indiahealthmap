"use client"

import { Microscope } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">Disease Visualization Dashboard</h1>
          <p className="text-sm text-muted-foreground font-mono">Data updated: 2025-01-17 14:24:11 UTC</p>
        </div>
      </div>
      
      <div>
        <Link href="/compare">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
          >
            <span>Compare Maps</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}

