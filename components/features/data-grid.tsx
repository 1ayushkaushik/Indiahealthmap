"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search } from "@/components/ui/search"
import { useFilterStore } from "@/lib/store"
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

interface RegionData {
  name: string
  cases: number
  deaths: number
}

type SortField = 'name' | 'cases' | 'deaths' | 'mortality'
type SortOrder = 'asc' | 'desc'

const PAGE_SIZE = 10

export function DataGrid() {
  const { view, disease, timeRange } = useFilterStore()
  const [data, setData] = useState<RegionData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('cases')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    setIsLoading(true)
    setPage(1) // Reset page when data changes

    const params = new URLSearchParams({
      disease: encodeURIComponent(disease),
      view,
      start: timeRange.start,
      end: timeRange.end
    })

    fetch(`/api/disease-data?${params}`)
      .then(res => res.json())
      .then(responseData => {
        const formattedData = Object.entries(responseData).map(([name, stats]) => {
          const casesValue = stats && typeof stats === 'object' && 'cases' in stats ? 
            (stats.cases as number) : 0;
          const deathsValue = stats && typeof stats === 'object' && 'deaths' in stats ? 
            (stats.deaths as number) : 0;
          
          return {
            name,
            cases: casesValue,
            deaths: deathsValue
          };
        });
        setData(formattedData)
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error fetching data:', error)
        setIsLoading(false)
      })
  }, [view, disease, timeRange])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-2" />
    return sortOrder === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-2" />
      : <ArrowDown className="h-4 w-4 ml-2" />
  }

  const sortedData = [...data].sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1

    switch (sortField) {
      case 'name':
        return a.name.localeCompare(b.name) * modifier
      case 'cases':
        return (a.cases - b.cases) * modifier
      case 'deaths':
        return (a.deaths - b.deaths) * modifier
      case 'mortality':
        const mortalityA = a.cases > 0 ? (a.deaths / a.cases) : 0
        const mortalityB = b.cases > 0 ? (b.deaths / b.cases) : 0
        return (mortalityA - mortalityB) * modifier
      default:
        return 0
    }
  })

  const filteredData = sortedData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE)
  const startIndex = (page - 1) * PAGE_SIZE
  const paginatedData = filteredData.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <div className="data-grid rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="p-4">
        <Search
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(1) // Reset page when searching
          }}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="font-mono cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                Region {getSortIcon('name')}
              </div>
            </TableHead>
            <TableHead
              className="font-mono text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
              onClick={() => handleSort('cases')}
            >
              <div className="flex items-center justify-end">
                Cases {getSortIcon('cases')}
              </div>
            </TableHead>
            <TableHead
              className="font-mono text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
              onClick={() => handleSort('deaths')}
            >
              <div className="flex items-center justify-end">
                Deaths {getSortIcon('deaths')}
              </div>
            </TableHead>
            <TableHead
              className="font-mono text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
              onClick={() => handleSort('mortality')}
            >
              <div className="flex items-center justify-end">
                Mortality Rate {getSortIcon('mortality')}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                Loading...
              </TableCell>
            </TableRow>
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                No data found
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((item) => (
              <TableRow key={item.name}>
                <TableCell className="font-mono">{item.name}</TableCell>
                <TableCell className="font-mono text-right">{item.cases.toLocaleString()}</TableCell>
                <TableCell className="font-mono text-right">{item.deaths.toLocaleString()}</TableCell>
                <TableCell className="font-mono text-right">
                  {item.cases > 0 ? ((item.deaths / item.cases) * 100).toFixed(2) + '%' : '0%'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Showing {startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filteredData.length)} of {filteredData.length}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
