import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendChart } from "./trend-chart"
import { Separator } from "@/components/ui/separator"
import { Activity, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

export function DashboardStats() {
  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <CardTitle className="text-sm font-medium font-mono">Epidemiological Data</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-mono">Total Cases</p>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums">3.431 × 10³</p>
            <div className="text-xs text-muted-foreground font-mono">
              CI: ±2.3% (95% confidence)
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-mono">Mean Cases/State</p>
              <TrendingUp className="h-4 w-4 text-teal-500" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums">6.86 × 10²</p>
            <div className="text-xs text-muted-foreground font-mono">
              σ = 127.4 (n=28)
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-mono">Peak Incidence</p>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums">8.39 × 10²</p>
            <div className="text-xs text-muted-foreground font-mono">
              R₀ = 1.2 (95% CI: 1.1-1.3)
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium font-mono">Temporal Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart />
          <div className="mt-2 text-xs text-muted-foreground font-mono">
            7-day moving average (shaded area: 95% CI)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

