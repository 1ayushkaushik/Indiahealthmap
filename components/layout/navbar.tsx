"use client"

import { Button } from "@/components/ui/button"
import { GitCompareIcon, MapIcon, Microscope, Upload, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navbar() {
  const pathname = usePathname()

  const NavLinks = () => (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        asChild
      >
        <Link href="/" className={`${pathname === '/' ? 'bg-slate-300 border-slate-800' : ''}`}>
          <MapIcon className="h-4 w-4" />
          <span>Map Dashboard</span>
        </Link>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        asChild
      >
        <Link href="/compare" className={`${pathname === '/compare' ? 'bg-slate-300 border-slate-800' : ''}`}>
          <GitCompareIcon className="h-4 w-4" />
          <span>Compare Maps</span>
        </Link>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        asChild
      >
        <Link href="/upload" className={`${pathname === '/upload' ? 'bg-slate-300 border-slate-800' : ''}`}>
          <Upload className="h-4 w-4" />
          <span>Upload Data</span>
        </Link>
      </Button>
    </>
  )

  return (
    <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <Microscope className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          <h1 className="text-xl font-bold hidden sm:block">Disease Visualization Dashboard</h1>
          <h1 className="text-xl font-bold sm:hidden">Disease Dashboard</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <NavLinks />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 mt-8">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
} 