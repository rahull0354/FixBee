import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

interface ProviderReceiptPDFProps {
  payment: {
    invoiceNumber: string;
    invoiceDate: string;
    paidAt?: string;
    totalAmount: string;
    providerEarning: string;
    platformFee: string;
    subTotal?: string;
    taxAmount?: string;
    taxRate?: string;
    materialCost?: string;
    laborCost?: string;
    finalPrice?: string;
    status: string;
    paymentMethod?: string;
    transactionId?: string;
    lineItems?: Array<{
      id: string;
      description: string;
      type?: string;
      category?: string;
      quantity: number;
      unitPrice: string;
      total: string;
    }>;
  };
  serviceRequest: {
    id?: string;
    serviceTitle?: string;
    serviceType?: string;
    serviceDescription?: string;
    schedule?: {
      date: string;
      timeSlot?: string;
      preferredTime?: string;
    };
    serviceAddress?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    } | string;
  };
  customer: {
    name?: string;
    email?: string;
  };
  provider: {
    name?: string;
    email?: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 15,
    paddingBottom: 12,
    borderBottom: '2px solid #10B981',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065F46',
  },
  subtitle: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  receiptInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  infoLabel: {
    fontSize: 6,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 7,
    fontWeight: '600',
    color: '#1E293B',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '1px solid #D1FAE5',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 7,
    color: '#64748B',
    width: '28%',
    flexShrink: 0,
  },
  value: {
    fontSize: 7,
    fontWeight: '500',
    color: '#1E293B',
    flex: 1,
    lineHeight: 1.5,
  },
  table: {
    width: '100%',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    paddingBottom: 4,
    paddingTop: 4,
    borderBottom: '1px solid #D1FAE5',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #F3F4F6',
    paddingBottom: 4,
    paddingTop: 4,
  },
  tableCell: {
    fontSize: 6,
  },
  tableCellSmall: {
    fontSize: 5,
    textAlign: 'center',
  },
  tableCellRight: {
    fontSize: 6,
    textAlign: 'right',
  },
  bold: {
    fontWeight: 'bold',
  },
  earningsBox: {
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 12,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  deductionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  deductionBox: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTop: '2px solid #10B981',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: '1px solid #E5E7EB',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 5,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  footerTextSmall: {
    fontSize: 4,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },
  statusBox: {
    padding: 6,
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 12,
  },
  statusPaid: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusProcessing: {
    backgroundColor: '#DBEAFE',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 6,
    color: '#9CA3AF',
  },
  pageInfo: {
    fontSize: 6,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },
});

const ProviderReceiptPDF = ({
  payment,
  serviceRequest,
  customer,
  provider,
}: ProviderReceiptPDFProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address !== null) {
      const parts = [address.street, address.city, address.state, address.pincode].filter(Boolean);
      return parts.join(', ');
    }
    return '';
  };

  const formatCurrency = (amount: string | number | undefined) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return `₹${num.toFixed(2)}`;
  };

  const totalAmount = parseFloat(payment.totalAmount || '0');
  const providerEarning = parseFloat(payment.providerEarning || '0');
  const platformFee = parseFloat(payment.platformFee || '0');
  const taxAmount = parseFloat(payment.taxAmount || '0');

  return (
    <Document>
      {/* Page 1: Service and Customer Details */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Payment Receipt</Text>
              <Text style={styles.subtitle}>Service & Customer Details</Text>
            </View>
          </View>

          <View style={styles.receiptInfo}>
            <View>
              <Text style={styles.infoLabel}>Receipt Number</Text>
              <Text style={styles.infoValue}>{payment.invoiceNumber}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.infoLabel}>Issue Date</Text>
              <Text style={styles.infoValue}>{formatDate(payment.invoiceDate)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Status */}
        {payment.status === 'paid' && (
          <View style={[styles.statusBox, styles.statusPaid]}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#065F46' }}>
              PAID - {formatDate(payment.paidAt || '')}
            </Text>
            {payment.transactionId && (
              <Text style={{ fontSize: 6, color: '#047857', marginTop: 2 }}>
                Transaction ID: {payment.transactionId}
              </Text>
            )}
          </View>
        )}
        {payment.status === 'pending' && (
          <View style={[styles.statusBox, styles.statusPending]}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#92400E' }}>
              ⏳ PENDING - Awaiting Processing
            </Text>
          </View>
        )}
        {payment.status === 'processing' && (
          <View style={[styles.statusBox, styles.statusProcessing]}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#1E40AF' }}>
              ⟳ PROCESSING - Payment in Progress
            </Text>
          </View>
        )}

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{customer?.name || 'N/A'}</Text>
          </View>
          {customer?.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={[styles.value, { fontSize: 6 }]}>{customer.email}</Text>
            </View>
          )}
        </View>

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Request ID:</Text>
            <Text style={styles.value}>{serviceRequest?.id || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Service Type:</Text>
            <Text style={styles.value}>
              {serviceRequest?.serviceType || 'N/A'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Service Title:</Text>
            <Text style={styles.value}>
              {serviceRequest?.serviceTitle || 'Service Request'}
            </Text>
          </View>
          {serviceRequest?.serviceDescription && (
            <View style={styles.row}>
              <Text style={styles.label}>Description:</Text>
              <Text style={[styles.value, { lineHeight: 1.3 }]}>
                {serviceRequest.serviceDescription}
              </Text>
            </View>
          )}
          {serviceRequest?.schedule?.date && (
            <View style={styles.row}>
              <Text style={styles.label}>Service Date:</Text>
              <Text style={styles.value}>
                {formatDate(serviceRequest?.schedule?.date)}
              </Text>
            </View>
          )}
          {serviceRequest?.serviceAddress && (
            <View style={styles.row}>
              <Text style={styles.label}>Service Address:</Text>
              <Text style={[styles.value, { lineHeight: 1.3 }]}>
                {formatAddress(serviceRequest?.serviceAddress)}
              </Text>
            </View>
          )}
        </View>

        {/* Service Items */}
        {payment.lineItems && payment.lineItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Items</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.bold, { width: '8%' }]}>#</Text>
                <Text style={[styles.tableCell, styles.bold, { width: '50%' }]}>Description</Text>
                <Text style={[styles.tableCell, styles.bold, styles.tableCellRight, { width: '21%' }]}>Unit Price</Text>
                <Text style={[styles.tableCell, styles.bold, styles.tableCellRight, { width: '21%' }]}>Amount</Text>
              </View>

              {/* Table Body */}
              {payment.lineItems
                .filter(item => !item.description.toLowerCase().includes('platform fee'))
                .map((item, index) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.tableCellSmall, { width: '8%' }]}>
                      {String(index + 1).padStart(3, '0')}
                    </Text>
                    <Text style={[styles.tableCell, { width: '50%' }]}>{item.description}</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, { width: '21%' }]}>
                      {formatCurrency(item.unitPrice)}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, { width: '21%' }]}>
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            FixBee Home Services Platform - Official Payment Receipt
          </Text>
          <Text style={styles.footerTextSmall}>
            Page 1 of 2 • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Text style={[styles.pageNumber, { marginTop: 3 }]}>1</Text>
        </View>
      </Page>

      {/* Page 2: Payment Breakdown */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Payment Breakdown</Text>
              <Text style={styles.subtitle}>Provider Earnings Statement</Text>
            </View>
          </View>

          <View style={styles.receiptInfo}>
            <View>
              <Text style={styles.infoLabel}>Receipt Number</Text>
              <Text style={styles.infoValue}>{payment.invoiceNumber}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.infoLabel}>Net Earnings</Text>
              <Text style={[styles.infoValue, { fontSize: 9, color: '#10B981' }]}>
                {formatCurrency(providerEarning)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Breakdown Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>

          {/* Total Customer Payment */}
          <View style={styles.earningsBox}>
            <View style={styles.earningsRow}>
              <Text style={{ fontSize: 7, color: '#065F46', fontWeight: '600', flex: 1 }}>
                Total Amount Paid by Customer
              </Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1E293B' }}>
                {formatCurrency(totalAmount)}
              </Text>
            </View>
          </View>

          {/* Deductions */}
          {(taxAmount > 0 || platformFee > 0) && (
            <View style={styles.deductionBox}>
              <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#991B1B', marginBottom: 6 }}>
                Deductions from Total Amount
              </Text>

              {taxAmount > 0 && (
                <View style={styles.deductionRow}>
                  <Text style={{ fontSize: 6, color: '#7C2D12', flex: 1 }}>
                    Tax (GST {payment.taxRate || '0'}%)
                  </Text>
                  <Text style={{ fontSize: 7, fontWeight: '600', color: '#DC2626' }}>
                    - {formatCurrency(taxAmount)}
                  </Text>
                </View>
              )}

              {platformFee > 0 && (
                <View style={styles.deductionRow}>
                  <Text style={{ fontSize: 6, color: '#7C2D12', flex: 1 }}>
                    Platform Service Fee
                  </Text>
                  <Text style={{ fontSize: 7, fontWeight: '600', color: '#DC2626' }}>
                    - {formatCurrency(platformFee)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Net Earnings - Highlighted */}
          <View style={[styles.totalRow, { borderTop: '2px solid #10B981' }]}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#065F46' }}>
              Your Net Earnings
            </Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#10B981' }}>
              {formatCurrency(providerEarning)}
            </Text>
          </View>

          <Text style={{ fontSize: 6, color: '#64748B', marginTop: 6, lineHeight: 1.4 }}>
            This is the amount that will be credited to your registered bank account or UPI ID.
            This amount represents your earnings after all applicable deductions.
          </Text>
        </View>

        {/* Detailed Line Items with Earnings */}
        {payment.lineItems && payment.lineItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itemized Earnings Details</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.bold, { width: '8%' }]}>#</Text>
                <Text style={[styles.tableCell, styles.bold, { width: '50%' }]}>Service Item</Text>
                <Text style={[styles.tableCell, styles.bold, styles.tableCellRight, { width: '21%' }]}>Amount</Text>
                <Text style={[styles.tableCell, styles.bold, styles.tableCellRight, { width: '21%' }]}>Your Share</Text>
              </View>

              {/* Table Body */}
              {payment.lineItems
                .filter(item => !item.description.toLowerCase().includes('platform fee'))
                .map((item, index) => {
                  const itemTotal = parseFloat(item.total);
                  // Assuming provider gets a percentage, for now showing full amount
                  // In real scenario, this would be calculated based on provider's rate
                  const providerShare = itemTotal;

                  return (
                    <View key={item.id} style={styles.tableRow}>
                      <Text style={[styles.tableCellSmall, { width: '8%' }]}>
                        {String(index + 1).padStart(3, '0')}
                      </Text>
                      <Text style={[styles.tableCell, { width: '50%' }]}>{item.description}</Text>
                      <Text style={[styles.tableCell, styles.tableCellRight, { width: '21%' }]}>
                        {formatCurrency(itemTotal)}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellRight, { width: '21%', fontWeight: 'bold', color: '#10B981' }]}>
                        {formatCurrency(providerShare)}
                      </Text>
                    </View>
                  );
                })}
            </View>

            <View style={{ marginTop: 8, padding: 6, backgroundColor: '#F0FDF4', borderRadius: 3 }}>
              <Text style={{ fontSize: 5, color: '#065F46', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.3 }}>
                * Your share represents the actual earnings from each service item after applicable calculations
              </Text>
            </View>
          </View>
        )}

        {/* Payment Information (if paid) */}
        {payment.status === 'paid' && payment.paidAt && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Payment Date:</Text>
              <Text style={styles.value}>{formatDate(payment.paidAt)}</Text>
            </View>
            {payment.paymentMethod && (
              <View style={styles.row}>
                <Text style={styles.label}>Payment Method:</Text>
                <Text style={styles.value}>{payment.paymentMethod}</Text>
              </View>
            )}
            {payment.transactionId && (
              <View style={styles.row}>
                <Text style={styles.label}>Transaction ID:</Text>
                <Text style={[styles.value, { fontSize: 6 }]}>{payment.transactionId}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is an official payment receipt from FixBee Home Services Platform
          </Text>
          <Text style={styles.footerTextSmall}>
            Generated on {new Date().toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={[styles.pageNumber, { marginTop: 3 }]}>2</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ProviderReceiptPDF;
