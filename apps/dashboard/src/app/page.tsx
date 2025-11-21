import Link from 'next/link'
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">
            AI Reseller API
          </div>
          <div className="space-x-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Access Leading AI Models
            <span className="block text-indigo-600">With Simple Pricing</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get unified access to GPT-4, Claude, and more through our simple API.
            Pay only for what you use with transparent, credit-based billing.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 flex items-center gap-2"
            >
              Get Started <ArrowRight size={20} />
            </Link>
            <Link
              href="/docs"
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 border-2 border-indigo-600"
            >
              View Docs
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-indigo-600" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Globally distributed edge network ensures low latency responses
              from anywhere in the world.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="text-indigo-600" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">
              Enterprise-grade security with API key authentication and
              rate limiting built-in.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="text-indigo-600" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Usage Analytics</h3>
            <p className="text-gray-600">
              Track your API usage, costs, and performance with detailed
              analytics and insights.
            </p>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="mt-32 text-center">
          <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 mb-12">
            Pay only for what you use. No subscriptions, no commitments.
          </p>
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
            <div className="text-5xl font-bold text-indigo-600 mb-2">$10</div>
            <div className="text-gray-600 mb-6">gets you started</div>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Access to all models</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Pay per token used</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>No expiration on credits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Full usage analytics</span>
              </li>
            </ul>
            <Link
              href="/auth/signup"
              className="block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Start Building
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-32 border-t">
        <div className="text-center text-gray-600">
          <p>&copy; 2024 AI Reseller API. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
