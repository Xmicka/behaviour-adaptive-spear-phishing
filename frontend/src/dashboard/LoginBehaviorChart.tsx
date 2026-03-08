import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'
import { fetchLoginBehavior, LoginBehaviorEvent } from '../api/client'
import { format, parseISO } from 'date-fns'

interface ChartProps {
    userId: string
}

const LoginBehaviorChart: React.FC<ChartProps> = ({ userId }) => {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setLoading(false)
        }, 5000)

        async function load() {
            try {
                if (!userId) {
                    setLoading(false)
                    clearTimeout(timeout)
                    return
                }
                setLoading(true)
                const events = await fetchLoginBehavior(userId)

                // Process events for chart
                // Convert timestamps to hours (0-24) to show daily patterns
                const processedData = events.map((evt: LoginBehaviorEvent) => {
                    const date = parseISO(evt.timestamp)
                    return {
                        originalDate: date,
                        timeLabel: format(date, 'MMM d, HH:mm'),
                        hourOfDay: date.getHours() + date.getMinutes() / 60,
                        domain: evt.domain,
                        type: 'login'
                    }
                }).reverse() // oldest to newest

                setData(processedData)
                setLoading(false)
            } catch (err) {
                console.error('Login behavior fetch error:', err)
                setLoading(false)
            } finally {
                clearTimeout(timeout)
            }
        }
        load()

        return () => clearTimeout(timeout)
    }, [userId])

    if (loading) {
        return <div className="h-48 flex items-center justify-center text-slate-500 animate-pulse">Loading behavior data...</div>
    }

    if (data.length === 0) {
        return <div className="h-48 flex items-center justify-center text-slate-500 border border-slate-800 border-dashed rounded-xl">No login events captured yet for this user.</div>
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="glass-dark p-3 rounded-lg border border-slate-700 shadow-xl">
                    <p className="font-semibold text-white">{data.timeLabel}</p>
                    <p className="text-cyan-400 text-sm mt-1">Target: {data.domain || 'Unknown app'}</p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="w-full">
            <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Login Time Distribution (24h clock)
            </h4>
            <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="timeLabel"
                            stroke="#475569"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            tickMargin={10}
                            minTickGap={30}
                        />
                        <YAxis
                            domain={[0, 24]}
                            stroke="#475569"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            ticks={[0, 6, 12, 18, 24]}
                            tickFormatter={(val: number) => `${val}:00`}
                        />

                        {/* Highlight normal working hours 8AM - 6PM */}
                        <ReferenceArea y1={8} y2={18} fill="rgba(34, 211, 238, 0.05)" />

                        {/* Highlight unusual hours (Late night) 10PM - 5AM */}
                        <ReferenceArea y1={0} y2={5} fill="rgba(239, 68, 68, 0.05)" />
                        <ReferenceArea y1={22} y2={24} fill="rgba(239, 68, 68, 0.05)" />

                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="hourOfDay"
                            stroke="#22d3ee"
                            strokeWidth={2}
                            dot={{ r: 4, strokeWidth: 2, fill: '#0f172a', stroke: '#22d3ee' }}
                            activeDot={{ r: 6, fill: '#22d3ee', stroke: '#fff' }}
                            isAnimationActive={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mt-4 px-2">
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded bg-[rgba(34,211,238,0.1)] mr-2" />
                    <span>Core Hours (8am-6pm)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded bg-[rgba(239,68,68,0.1)] mr-2" />
                    <span>Anomalous Hours</span>
                </div>
            </div>
        </div>
    )
}

export default LoginBehaviorChart
