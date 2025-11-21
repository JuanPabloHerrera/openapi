'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { Activity } from 'lucide-react'

interface UsageLog {
  id: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost_usd: number
  credits_deducted: number
  status: string
  created_at: string
}

export default function UsagePage() {
  const [logs, setLogs] = useState<UsageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 50

  useEffect(() => {
    loadLogs()
  }, [page])

  const loadLogs = async () => {
    const supabase = createSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (!error && data) {
      setLogs(data)
      setHasMore(data.length === pageSize)
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Usage History</h1>

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Activity size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Usage Yet
          </h3>
          <p className="text-gray-600">
            Your API usage will appear here once you start making requests
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {log.model}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>
                          <span className="text-green-600">
                            {log.prompt_tokens.toLocaleString()}
                          </span>
                          {' + '}
                          <span className="text-blue-600">
                            {log.completion_tokens.toLocaleString()}
                          </span>
                          {' = '}
                          {log.total_tokens.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        ${log.credits_deducted.toFixed(4)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            log.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Previous
            </button>
            <span className="text-gray-600">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}
