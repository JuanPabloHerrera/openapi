'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { DollarSign, Activity, Zap, TrendingUp } from 'lucide-react'

interface Stats {
  credits: number
  totalRequests: number
  totalTokens: number
  totalSpent: number
  activeKeys: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const supabase = createSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get user stats
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!error && data) {
      setStats({
        credits: data.credits || 0,
        totalRequests: data.total_requests || 0,
        totalTokens: data.total_tokens_used || 0,
        totalSpent: data.total_credits_spent || 0,
        activeKeys: data.active_api_keys || 0,
      })
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Available Credits"
          value={`$${stats?.credits.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Requests"
          value={stats?.totalRequests.toLocaleString() || '0'}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Tokens Used"
          value={stats?.totalTokens.toLocaleString() || '0'}
          icon={Zap}
          color="yellow"
        />
        <StatCard
          title="Total Spent"
          value={`$${stats?.totalSpent.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <ActionCard
            title="Add Credits"
            description="Purchase credit packs"
            href="/dashboard/billing"
            buttonText="Buy Credits"
          />
          <ActionCard
            title="Create API Key"
            description="Generate a new API key"
            href="/dashboard/keys"
            buttonText="New Key"
          />
          <ActionCard
            title="View Usage"
            description="See your API usage"
            href="/dashboard/usage"
            buttonText="View Stats"
          />
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-indigo-50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-indigo-900 mb-4">
          Getting Started
        </h2>
        <ol className="space-y-3 text-indigo-800">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>Purchase credits from the Billing page</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>Create an API key from the API Keys page</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>Start making requests to the API endpoint</span>
          </li>
        </ol>
        <div className="mt-4 p-4 bg-white rounded-lg">
          <p className="text-sm font-mono text-gray-800 mb-2">
            curl https://your-worker.workers.dev/v1/chat/completions \
          </p>
          <p className="text-sm font-mono text-gray-800 mb-2 ml-4">
            -H "Authorization: Bearer YOUR_API_KEY" \
          </p>
          <p className="text-sm font-mono text-gray-800 ml-4">
            -d '{"{"}"model": "gpt-3.5-turbo", "messages": [...]{"}"}'
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  icon: any
  color: 'green' | 'blue' | 'yellow' | 'purple'
}) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  )
}

function ActionCard({
  title,
  description,
  href,
  buttonText,
}: {
  title: string
  description: string
  href: string
  buttonText: string
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <a
        href={href}
        className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
      >
        {buttonText}
      </a>
    </div>
  )
}
