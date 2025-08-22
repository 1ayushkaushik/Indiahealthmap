"use client"

import Input from "./input"
import { Search as SearchIcon } from "lucide-react"

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Search({ className, ...props }: SearchProps) {
  return (
    <div className={`relative ${className}`}>
      <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
      <Input
        {...props}
        className="pl-8 bg-slate-50 dark:bg-slate-800"
        placeholder="Search regions..."
      />
    </div>
  )
} 