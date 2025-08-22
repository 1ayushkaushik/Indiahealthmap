"use client"

import UI_Layout from '@/components/layout/ui-layout'
import dynamic from 'next/dynamic'
import ComparisonContent from '@/components/comparison-content'

export default function ComparePage() {
  return (
    <UI_Layout>
      <ComparisonContent />
    </UI_Layout>
  )
} 