import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { money } from '../utils/format.js'

const tooltipStyle = {
  background: '#151c2c',
  border: '1px solid #27324a',
  borderRadius: 12,
  color: '#e6edf7',
  fontSize: 13,
}

export function Donut({ data, centerLabel, centerValue, currency }) {
  return (
    <div className="donut-wrap">
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, n) => [money(v, currency), n]}
            contentStyle={tooltipStyle}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <span>{centerLabel}</span>
        <strong>{centerValue}</strong>
      </div>
    </div>
  )
}

export function DonutLegend({ data, currency }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  return (
    <ul className="legend">
      {data.map((d) => (
        <li key={d.name}>
          <span className="dot" style={{ background: d.color }} />
          <span className="legend-name">
            {d.emoji} {d.name}
          </span>
          <span className="legend-pct">{Math.round((d.value / total) * 100)}%</span>
          <span className="legend-val">{money(d.value, currency)}</span>
        </li>
      ))}
    </ul>
  )
}

export function MonthBars({ data, currency }) {
  const compact = (v) => {
    if (v >= 100000) return `${(v / 100000).toFixed(1)}L`
    if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`
    return v
  }
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} barGap={4} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#232c41" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#93a1b5', fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#93a1b5', fontSize: 10 }}
            tickFormatter={compact}
            width={48}
          />
          <Tooltip
            cursor={{ fill: 'rgba(148,163,184,0.08)' }}
            formatter={(v, n) => [money(v, currency), n === 'income' ? 'Income' : 'Expense']}
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#93a1b5' }}
          />
          <Bar dataKey="income" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={22} />
          <Bar dataKey="expense" fill="#fb7185" radius={[6, 6, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-key">
        <span>
          <i className="dot" style={{ background: '#34d399' }} /> Income
        </span>
        <span>
          <i className="dot" style={{ background: '#fb7185' }} /> Expense
        </span>
      </div>
    </div>
  )
}
