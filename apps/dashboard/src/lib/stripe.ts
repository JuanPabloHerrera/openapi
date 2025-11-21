import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Credit pack configurations
export const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 1000, // $10.00 in cents
    description: 'Perfect for testing and small projects',
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 50,
    price: 4500, // $45.00 in cents (10% discount)
    description: 'Best value for regular usage',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 200,
    price: 16000, // $160.00 in cents (20% discount)
    description: 'For high-volume applications',
  },
]
