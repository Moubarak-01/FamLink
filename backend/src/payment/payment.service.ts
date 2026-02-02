
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.warn('⚠️ STRIPE_SECRET_KEY not set. Payment features will be disabled.');
    }
    this.stripe = new Stripe(stripeKey || '', {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(planId: string, userId: string) {
    // In a real app, look up price ID based on planId
    const priceId = planId === 'parent_monthly' ? 'price_H5ggYwdDqB' : 'price_H5ggYwdDqB';

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: planId === 'parent_monthly' ? 'Parent Monthly Plan' : 'Parent Annual Plan',
            },
            unit_amount: 500, // 5.00 EUR
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // or 'subscription'
      success_url: `http://localhost:5173?payment_success=true`,
      cancel_url: `http://localhost:5173?payment_canceled=true`,
      metadata: {
        userId
      }
    });

    return { sessionId: session.id, url: session.url };
  }
}
