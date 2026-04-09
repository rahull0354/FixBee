'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElementsOptions, PaymentIntent } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Lock, CreditCard, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentFormProps {
  clientSecret: string;
  paymentIntentId: string;
  paymentId: string;
  amount: number;
  onSuccess?: (paymentIntent: PaymentIntent) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

function CheckoutForm({
  clientSecret,
  paymentIntentId,
  paymentId,
  amount,
  onSuccess,
  onError,
  onCancel,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Confirm the payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: 'Customer',
          },
        },
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        onError?.(confirmError.message || 'Payment failed');
        toast.error(confirmError.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess?.(paymentIntent);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Element */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-sky-100 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-5 w-5 text-sky-600" />
          <label className="text-sm font-semibold text-gray-900">
            Card Details
          </label>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                  iconColor: '#9e2146',
                },
              },
            }}
          />
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
          <Lock className="h-3 w-3" />
          <span>Secured by 256-bit SSL encryption</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-linear-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:via-blue-600 hover:to-indigo-700 text-white py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-5 w-5" />
              Pay ₹{amount.toLocaleString('en-IN')}
            </>
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={processing}
            className="px-6 py-6 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Payment Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-xs sm:text-sm text-gray-700">
          <strong><Info />Note:</strong> Your payment will be processed securely through Stripe.
          You will receive a confirmation email once the payment is complete.
        </p>
      </div>
    </form>
  );
}

export default function StripePaymentForm({
  clientSecret,
  paymentIntentId,
  paymentId,
  amount,
  onSuccess,
  onError,
  onCancel,
}: StripePaymentFormProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stripePromise.then((stripeInstance) => {
      setStripe(stripeInstance);
      setLoading(false);
    });
  }, []);

  if (loading || !stripe) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 font-semibold">Payment initialization failed</p>
        <p className="text-sm text-gray-600 mt-2">Client secret is missing. Please try again.</p>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0ea5e9',
        colorBackground: '#ffffff',
        colorText: '#424770',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripe} options={options}>
      <CheckoutForm
        clientSecret={clientSecret}
        paymentIntentId={paymentIntentId}
        paymentId={paymentId}
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </Elements>
  );
}
