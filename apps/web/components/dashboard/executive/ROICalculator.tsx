'use client'

import { DollarSign, TrendingUp, Clock, Users, Zap, PieChart, ArrowUp, ArrowDown } from 'lucide-react'

interface ROICalculatorProps {
  metrics: any
  businessImpact: any
  onDrillDown: (category: string) => void
}

export function ROICalculator({ metrics, businessImpact, onDrillDown }: ROICalculatorProps) {
  // Investment costs
  const investment = {
    licensing: {
      annual: 11880, // $99/month * 12
      description: 'CanopyIQ Platform License',
      confidence: 1.0
    },
    implementation: {
      oneTime: 5000,
      description: 'Initial setup and training',
      confidence: 0.95
    },
    maintenance: {
      annual: 2400,
      description: 'Ongoing support and updates',
      confidence: 0.9
    }
  }

  // Returns calculation
  const returns = {
    costSavings: {
      annual: businessImpact.costSavings * 12,
      description: 'From prevented issues and automation',
      confidence: 0.92
    },
    productivityGains: {
      annual: businessImpact.timeSaved * 150 * 12, // hours * rate * months
      description: 'Developer time savings',
      confidence: 0.88
    },
    riskMitigation: {
      annual: 450000,
      description: 'Avoided compliance penalties and breaches',
      confidence: 0.75
    },
    acceleratedDelivery: {
      annual: 280000,
      description: 'Faster time to market',
      confidence: 0.82
    }
  }

  // Calculate ROI metrics
  const totalInvestmentYear1 = investment.licensing.annual + investment.implementation.oneTime + investment.maintenance.annual
  const totalInvestmentYear2Plus = investment.licensing.annual + investment.maintenance.annual
  const totalAnnualReturn = Object.values(returns).reduce((sum, r) => sum + r.annual, 0)

  const roi = {
    year1: ((totalAnnualReturn - totalInvestmentYear1) / totalInvestmentYear1 * 100).toFixed(0),
    year2: ((totalAnnualReturn - totalInvestmentYear2Plus) / totalInvestmentYear2Plus * 100).toFixed(0),
    year3: ((totalAnnualReturn * 3 - (totalInvestmentYear1 + totalInvestmentYear2Plus * 2)) / (totalInvestmentYear1 + totalInvestmentYear2Plus * 2) * 100).toFixed(0),
    paybackPeriod: (totalInvestmentYear1 / (totalAnnualReturn / 12)).toFixed(1),
    npv: calculateNPV([totalAnnualReturn - totalInvestmentYear1, totalAnnualReturn - totalInvestmentYear2Plus, totalAnnualReturn - totalInvestmentYear2Plus], 0.08)
  }

  function calculateNPV(cashFlows: number[], discountRate: number): number {
    return cashFlows.reduce((npv, cf, year) => {
      return npv + cf / Math.pow(1 + discountRate, year + 1)
    }, 0)
  }

  // Value drivers
  const valueDrivers = [
    {
      category: 'Quality Improvement',
      metrics: [
        { name: 'Defect Reduction', value: 73, unit: '%', trend: 12 },
        { name: 'Code Coverage', value: 89, unit: '%', trend: 15 },
        { name: 'Technical Debt', value: -42, unit: '%', trend: -8 }
      ]
    },
    {
      category: 'Speed & Efficiency',
      metrics: [
        { name: 'Deployment Frequency', value: 287, unit: '%', trend: 23 },
        { name: 'Lead Time', value: -61, unit: '%', trend: -15 },
        { name: 'MTTR', value: -78, unit: '%', trend: -18 }
      ]
    },
    {
      category: 'Risk Reduction',
      metrics: [
        { name: 'Security Issues', value: -91, unit: '%', trend: -22 },
        { name: 'Compliance Score', value: 98, unit: '%', trend: 5 },
        { name: 'Audit Readiness', value: 100, unit: '%', trend: 0 }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {/* ROI Summary */}
      <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-600/30 p-6">
        <h2 className="text-2xl font-bold text-text mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-500" />
          Return on Investment Analysis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{roi.year1}%</p>
            <p className="text-sm text-text-muted">Year 1 ROI</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{roi.year2}%</p>
            <p className="text-sm text-text-muted">Year 2 ROI</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{roi.year3}%</p>
            <p className="text-sm text-text-muted">3-Year ROI</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-accent">{roi.paybackPeriod}</p>
            <p className="text-sm text-text-muted">Months to Break-even</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-secondary">${(roi.npv / 1000000).toFixed(1)}M</p>
            <p className="text-sm text-text-muted">3-Year NPV</p>
          </div>
        </div>
      </div>

      {/* Investment vs Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Breakdown */}
        <div className="bg-surface/50 rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-500" />
            Investment Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(investment).map(([key, data]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors cursor-pointer"
                onClick={() => onDrillDown(`investment_${key}`)}
              >
                <div>
                  <p className="text-sm font-medium text-text">{data.description}</p>
                  <p className="text-xs text-text-muted">
                    {key === 'implementation' ? 'One-time' : 'Annual'} • {(data.confidence * 100).toFixed(0)}% confidence
                  </p>
                </div>
                <p className="text-lg font-semibold text-text">
                  ${((key === 'implementation' ? (data as any).oneTime : (data as any).annual) / 1000).toFixed(1)}k
                </p>
              </div>
            ))}
            <div className="pt-3 border-t border-border flex justify-between">
              <span className="font-semibold text-text">Total Year 1</span>
              <span className="text-xl font-bold text-red-500">
                ${(totalInvestmentYear1 / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
        </div>

        {/* Returns Breakdown */}
        <div className="bg-surface/50 rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Returns Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(returns).map(([key, data]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors cursor-pointer"
                onClick={() => onDrillDown(`returns_${key}`)}
              >
                <div>
                  <p className="text-sm font-medium text-text">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                  <p className="text-xs text-text-muted">
                    {data.description} • {(data.confidence * 100).toFixed(0)}% confidence
                  </p>
                </div>
                <p className="text-lg font-semibold text-text">
                  ${(data.annual / 1000).toFixed(0)}k
                </p>
              </div>
            ))}
            <div className="pt-3 border-t border-border flex justify-between">
              <span className="font-semibold text-text">Total Annual Return</span>
              <span className="text-xl font-bold text-green-500">
                ${(totalAnnualReturn / 1000000).toFixed(2)}M
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Value Drivers */}
      <div className="bg-surface/50 rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Key Value Drivers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {valueDrivers.map((driver) => (
            <div key={driver.category}>
              <h4 className="text-sm font-medium text-text-muted mb-3">{driver.category}</h4>
              <div className="space-y-2">
                {driver.metrics.map((metric) => (
                  <div key={metric.name} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                    <span className="text-sm text-text">{metric.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        metric.value > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {metric.value > 0 ? '+' : ''}{metric.value}{metric.unit}
                      </span>
                      {metric.trend !== 0 && (
                        metric.trend > 0 ?
                          <ArrowUp className="w-3 h-3 text-green-500" /> :
                          <ArrowDown className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI Timeline */}
      <div className="bg-surface/50 rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          ROI Timeline & Milestones
        </h3>
        <div className="space-y-3">
          {[
            { month: 'Month 1', milestone: 'Platform deployment', value: -totalInvestmentYear1, cumulative: -totalInvestmentYear1 },
            { month: 'Month 3', milestone: 'First prevented incidents', value: totalAnnualReturn / 12 * 2, cumulative: -totalInvestmentYear1 + totalAnnualReturn / 12 * 2 },
            { month: 'Month 6', milestone: 'Process optimization', value: totalAnnualReturn / 12 * 3, cumulative: -totalInvestmentYear1 + totalAnnualReturn / 12 * 5 },
            { month: `Month ${Math.ceil(Number(roi.paybackPeriod))}`, milestone: 'Break-even point', value: 0, cumulative: 0, highlight: true },
            { month: 'Month 12', milestone: 'Year 1 complete', value: totalAnnualReturn - totalInvestmentYear1, cumulative: totalAnnualReturn - totalInvestmentYear1 },
            { month: 'Month 24', milestone: 'Year 2 complete', value: totalAnnualReturn - totalInvestmentYear2Plus, cumulative: totalAnnualReturn * 2 - totalInvestmentYear1 - totalInvestmentYear2Plus },
            { month: 'Month 36', milestone: 'Year 3 complete', value: totalAnnualReturn - totalInvestmentYear2Plus, cumulative: totalAnnualReturn * 3 - totalInvestmentYear1 - totalInvestmentYear2Plus * 2 }
          ].map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${
                item.highlight ? 'bg-accent/10 border border-accent/30' : 'bg-background/50'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-text">{item.month}</p>
                <p className="text-xs text-text-muted">{item.milestone}</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${
                  item.cumulative >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  ${(Math.abs(item.cumulative) / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-text-muted">
                  {item.cumulative >= 0 ? 'Profit' : 'Investment'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison with Alternatives */}
      <div className="bg-surface/50 rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-text mb-4">CanopyIQ vs Alternatives</h3>
        <div className="space-y-3">
          {[
            { solution: 'CanopyIQ', cost: totalInvestmentYear1, value: totalAnnualReturn, roi: Number(roi.year1) },
            { solution: 'Manual Processes', cost: 0, value: 0, roi: 0 },
            { solution: 'Point Solutions', cost: 45000, value: 180000, roi: 300 },
            { solution: 'Enterprise Suite', cost: 250000, value: 800000, roi: 220 },
            { solution: 'Custom Development', cost: 500000, value: 1200000, roi: 140 }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <div className="flex-1">
                <p className={`text-sm font-medium ${index === 0 ? 'text-accent' : 'text-text'}`}>
                  {item.solution}
                </p>
                <div className="flex gap-6 mt-1">
                  <span className="text-xs text-text-muted">Cost: ${(item.cost / 1000).toFixed(0)}k</span>
                  <span className="text-xs text-text-muted">Value: ${(item.value / 1000).toFixed(0)}k</span>
                </div>
              </div>
              <div className={`text-lg font-bold ${
                index === 0 ? 'text-accent' : item.roi > 0 ? 'text-green-500' : 'text-text-muted'
              }`}>
                {item.roi}% ROI
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}