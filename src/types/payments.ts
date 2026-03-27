export interface Invoice {
  id: string;
  invoiceNumber: string;
  requestId: string;
  customerId: string;
  providerId: string;
  subtotal: string;
  materialCost: string;
  laborCost: string;
  taxAmount: string;
  taxRate: string;
  discountAmount: string;
  platformFeeRate: string;
  platformFee: string;
  providerEarning: string;
  totalAmount: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  invoiceDate: string;
  dueDate?: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentId?: string;
  transactionId?: string;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  lineItems?: InvoiceLineItem[];
  serviceRequest?: {
    id: string;
    title: string;
    serviceType: string;
  };
  provider?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: string;
  total: string;
  itemType: 'service' | 'material' | 'tax' | 'discount' | 'additional_charge';
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: string;
  currency: string;
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet';
  gateway?: string;
  gatewayTransactionId?: string;
  gatewayPaymentId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  initiatedAt: string;
  completedAt?: string;
  failedAt?: string;
  refundedAt?: string;
  refundAmount?: string;
  refundReason?: string;
  metadata?: {
    cardLast4Digits?: string;
    cardBrand?: string;
    upiId?: string;
    bankName?: string;
  };
  createdAt: string;
  updatedAt: string;
}
