'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { CREDIT_PACKS, getStripe } from '@/lib/stripe'
import { CreditCard, Check } from 'lucide-react'
import { format } from 'date-fns'

interface Payment {
  id: string
  amount_cents: number
  credits_added: number
  status: string
  created_at: string
}

export default function BillingPage() {
  const [balance, setBalance] = useState(0)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    const supabase = createSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get balance
    const { data: balanceData } = await supabase
      .from('balances')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    if (balanceData) {
      setBalance(balanceData.credits)
    }

    // Get payment history
    const { data: paymentData } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (paymentData) {
      setPayments(paymentData)
    }

    setLoading(false)
  }

  const purchaseCredits = async (packId: string) => {
    setPurchasing(packId)

    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ packId }),
      })

      const { url, error } = await response.json()

      if (error) {
        alert(error)
      } else if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Failed to create checkout session')
    }

    setPurchasing(null)
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing</h1>

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white mb-8">
        <div className="text-sm opacity-90 mb-2">Current Balance</div>
        <div className="text-5xl font-bold mb-2">${balance.toFixed(2)}</div>
        <div className="text-sm opacity-90">Available credits</div>
      </div>

      {/* Credit Packs */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Purchase Credits</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
                pack.popular ? 'border-indigo-500' : 'border-gray-200'
              } relative`}
            >
              {pack.popular && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg rounded-tr-lg">
                  POPULAR
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{pack.name}</h3>
              <div className="text-4xl font-bold text-indigo-600 mb-2">
                ${(pack.price / 100).toFixed(0)}
              </div>
              <div className="text-gray-600 mb-4">${pack.credits} in credits</div>
              <p className="text-sm text-gray-600 mb-6">{pack.description}</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-green-500" />
                  <span>${pack.credits} credits</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-green-500" />
                  <span>No expiration</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-green-500" />
                  <span>All models included</span>
                </li>
              </ul>
              <button
                onClick={() => purchaseCredits(pack.id)}
                disabled={purchasing === pack.id}
                className={`w-full py-3 rounded-lg font-semibold ${
                  pack.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:bg-gray-400`}
              >
                {purchasing === pack.id ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Payments Yet
            </h3>
            <p className="text-gray-600">
              Your payment history will appear here
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(payment.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      ${(payment.amount_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      +${payment.credits_added.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'succeeded'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
