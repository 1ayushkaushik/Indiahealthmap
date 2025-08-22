"use client"

import dynamic from 'next/dynamic'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DataGrid } from '@/components/features/data-grid'
import { Filters } from '@/components/features/filters'
import { DiseaseCharts } from '@/components/charts/disease-charts'
import { Navbar } from '@/components/layout/navbar'
import UI_Layout from '@/components/layout/ui-layout'
import { Loading } from '@/components/shared/loading'

const MapWrapper = dynamic(
  () => import('@/components/maps/map-wrapper').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => <Loading height={700} />
  }
)

export default function DashboardPage() {
  return (
    <UI_Layout>
      {/* Main content grid - stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4">
        <div className="space-y-4">
          <MapWrapper type="disease" />
        </div>
        <Filters />
      </div>
      <DiseaseCharts />
      <DataGrid />
    </UI_Layout>
  )
}