import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'

export default function Sparkline({ data, positive = true, height = 32 }) {
  if (!data || data.length < 2) return null
  const points = data.map((v, i) => ({ i, v }))
  const color = positive ? '#4fa391' : '#d9756c'

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <defs>
            <linearGradient id={`spark-${positive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#spark-${positive ? 'up' : 'down'})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
