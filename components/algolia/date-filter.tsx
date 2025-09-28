'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

interface DateFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void
  className?: string
}

export function DateFilter({ onDateRangeChange, className = '' }: DateFilterProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleApplyFilter = () => {
    onDateRangeChange(startDate, endDate)
  }

  const handleClearFilter = () => {
    setStartDate('')
    setEndDate('')
    onDateRangeChange('', '')
  }

  // Quick date presets
  const setPreset = (preset: 'today' | 'week' | 'month' | 'year') => {
    const end = new Date()
    const start = new Date()

    switch (preset) {
      case 'today':
        // Today only
        break
      case 'week':
        start.setDate(start.getDate() - 7)
        break
      case 'month':
        start.setMonth(start.getMonth() - 1)
        break
      case 'year':
        start.setFullYear(start.getFullYear() - 1)
        break
    }

    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
    onDateRangeChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0])
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        <span>Filter by Date</span>
        {(startDate || endDate) && (
          <span className="ml-2 px-2 py-0.5 bg-primary/20 rounded-full text-xs">
            Active
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute z-10 mt-2 p-4 w-80 shadow-lg">
          <CardContent className="p-0 space-y-4">
            <div>
              <Label htmlFor="start-date" className="text-sm font-medium mb-1 block">
                From Date
              </Label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="end-date" className="text-sm font-medium mb-1 block">
                To Date
              </Label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreset('today')}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreset('week')}
              >
                Last 7 days
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreset('month')}
              >
                Last month
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreset('year')}
              >
                Last year
              </Button>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleApplyFilter}
                className="flex-1"
              >
                Apply Filter
              </Button>
              <Button
                onClick={handleClearFilter}
                variant="outline"
                className="flex-1"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}