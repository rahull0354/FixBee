import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image as PDFImage,
} from '@react-pdf/renderer';

// Register fonts (optional, using system fonts for now)
// Font.register({
//   family: 'Helvetica',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
// });

interface InvoicePDFProps {
  invoice: {
    invoiceNumber: string;
    invoiceDate: string;
    paidAt?: string;
    totalAmount: string;
    subTotal: string;
    taxAmount: string;
    taxRate: string;
    platformFee: string;
    status: string;
    paymentMethod?: string;
    laborCost?: string;
    materialCost?: string;
    lineItems?: Array<{
      id: string;
      description: string;
      type?: string;
      category?: string;
      quantity: number;
      unitPrice: string;
      total: string;
    }>;
    discountAmount?: string;
  };
  serviceRequest: {
    serviceTitle?: string;
    serviceType?: string;
    serviceDescription?: string;
    id?: string;
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
  provider: {
    name?: string;
  };
  user: {
    name?: string;
    email?: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 22,
    paddingBottom: 18,
    borderBottom: '2px solid #0EA5E9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  infoLabel: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 11,
  },
  grid: {
    flexDirection: 'row',
    gap: 28,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  description: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },
  table: {
    width: '100%',
    marginBottom: 18,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderBottom: '1px solid #E2E8F0',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1px solid #F1F5F9',
  },
  cellRef: {
    width: '15%',
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
  },
  cellDescription: {
    width: '45%',
    fontSize: 9,
    color: '#0F172A',
  },
  cellRight: {
    width: '20%',
    fontSize: 9,
    color: '#0F172A',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  summary: {
    marginTop: 18,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '45%',
    marginBottom: 7,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '45%',
    marginTop: 14,
    paddingTop: 14,
    borderTop: '2px solid #0EA5E9',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0EA5E9',
  },
  badge: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    padding: 5,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  footer: {
    position: 'absolute',
    bottom: 35,
    left: 35,
    right: 35,
    borderTop: '1px solid #E2E8F0',
    paddingTop: 14,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatAddress = (address: any) => {
  if (typeof address === 'string') return address;
  if (typeof address === 'object' && address !== null) {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean);
    return parts.join(', ');
  }
  return '';
};

export const InvoicePDF = ({
  invoice,
  serviceRequest,
  provider,
  user,
}: InvoicePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>FixBee</Text>
            <Text style={styles.subtitle}>Home Services Platform</Text>
          </View>
          <View style={styles.badge}>
            <Text>
              {invoice.status === 'paid' ? 'PAID' : invoice.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceInfo}>
          <View>
            <Text style={styles.infoLabel}>Invoice Number</Text>
            <Text style={styles.infoValue}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.infoLabel}>Invoice Date</Text>
            <Text style={styles.infoValue}>{formatDate(invoice.invoiceDate)}</Text>
          </View>
        </View>
      </View>

      {/* Bill To & Provider */}
      <View style={styles.section}>
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.value}>{user?.name || 'Customer'}</Text>
            <Text style={styles.description}>{user?.email || ''}</Text>
            {serviceRequest?.serviceAddress && (
              <Text style={styles.description}>
                {formatAddress(serviceRequest.serviceAddress)}
              </Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Service Provider</Text>
            <Text style={styles.value}>
              {provider?.name || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Service Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Details</Text>

        {/* Service Title and Request ID */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.label}>Service Title</Text>
          <Text style={styles.value}>{serviceRequest?.serviceTitle || 'Service Request'}</Text>
          <Text style={styles.description}>Request ID: {serviceRequest?.id || 'N/A'}</Text>
        </View>

        {/* Service Type */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.label}>Service Type</Text>
          <Text style={styles.description}>{serviceRequest?.serviceType || 'N/A'}</Text>
        </View>

        {/* Description */}
        {serviceRequest?.serviceDescription && (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.description}>{serviceRequest.serviceDescription}</Text>
          </View>
        )}

        {/* Service Date and Address */}
        <View style={styles.grid}>
          {serviceRequest?.schedule?.date && (
            <View style={styles.col}>
              <Text style={styles.label}>Service Date</Text>
              <Text style={styles.description}>
                {formatDate(serviceRequest.schedule.date)}
              </Text>
            </View>
          )}
          {serviceRequest?.serviceAddress && (
            <View style={styles.col}>
              <Text style={styles.label}>Service Address</Text>
              <Text style={styles.description}>{formatAddress(serviceRequest.serviceAddress)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Line Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Details</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellRef}>Item Ref</Text>
            <Text style={styles.cellDescription}>Description</Text>
            <Text style={styles.cellRight}>Unit Price</Text>
            <Text style={styles.cellRight}>Amount</Text>
          </View>
          {invoice.lineItems?.slice(0, 5).map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.cellRef}>#{String(index + 1).padStart(3, '0')}</Text>
              <Text style={styles.cellDescription}>{item.description}</Text>
              <Text style={styles.cellRight}>
                ₹{(parseFloat(item.unitPrice) || 0).toFixed(2)}
              </Text>
              <Text style={styles.cellRight}>
                ₹{parseFloat(item.total).toFixed(2)}
              </Text>
            </View>
          ))}
          {invoice.lineItems && invoice.lineItems.length > 5 && (
            <View style={styles.tableRow}>
              <Text style={styles.cellRef}></Text>
              <Text style={styles.cellDescription}>
                + {invoice.lineItems.length - 5} more item(s)
              </Text>
              <Text style={styles.cellRight}></Text>
              <Text style={styles.cellRight}></Text>
            </View>
          )}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        {/* Calculate breakdown correctly */}
        {(() => {
          // Extract from line items for accurate breakdown
          const serviceChargeItem = invoice.lineItems?.find((item: any) => item.itemType === 'service');
          const materialCostItem = invoice.lineItems?.find((item: any) => item.itemType === 'material');
          const platformFeeItem = invoice.lineItems?.find((item: any) => item.itemType === 'additional_charge');

          // Get actual values from line items or fallback to invoice fields
          const serviceCharge = serviceChargeItem
            ? parseFloat(serviceChargeItem.total)
            : parseFloat(invoice.laborCost || '0');
          const materialCost = materialCostItem
            ? parseFloat(materialCostItem.total)
            : parseFloat(invoice.materialCost || '0');
          const platformFee = platformFeeItem
            ? parseFloat(platformFeeItem.total)
            : parseFloat(invoice.platformFee || '0');

          // Service charges include service + material cost
          const serviceChargesTotal = serviceCharge + materialCost;
          const taxAmount = parseFloat(invoice.taxAmount || '0');
          const totalAmount = parseFloat(invoice.totalAmount || '0');

          return (
            <>
              {/* Service Charges (Service + Material) */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service Charges</Text>
                <Text style={styles.summaryValue}>
                  ₹{serviceChargesTotal.toFixed(2)}
                </Text>
              </View>

              {/* Platform Fee */}
              {platformFee > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Platform Fee</Text>
                  <Text style={styles.summaryValue}>
                    ₹{platformFee.toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Tax (GST) */}
              {taxAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Tax ({invoice.taxRate || 18}% GST)
                  </Text>
                  <Text style={styles.summaryValue}>
                    ₹{taxAmount.toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Discount (if any) */}
              {(parseFloat(invoice.discountAmount || '0') || 0) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                  <Text style={styles.summaryValue}>
                    -₹{parseFloat(invoice.discountAmount || '0').toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Total */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  ₹{totalAmount.toFixed(2)}
                </Text>
              </View>
            </>
          );
        })()}
      </View>

      {/* Payment Info */}
      {invoice.status === 'paid' && invoice.paidAt && (
        <View style={{ marginTop: 20, padding: 12, backgroundColor: '#F0F9FF', borderRadius: 6, borderWidth: 1, borderColor: '#BAE6FD' }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0369A1', marginBottom: 6 }}>
            Payment Information
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={styles.label}>Status:</Text>
            <View style={{ backgroundColor: '#D1FAE5', marginLeft: 6, padding: 3, paddingHorizontal: 8, borderRadius: 3 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#065F46' }}>PAID</Text>
            </View>
          </View>
          <Text style={styles.description}>
            Payment Date: {formatDate(invoice.paidAt)}
          </Text>
          {invoice.paymentMethod && (
            <Text style={styles.description}>
              Payment Method: {invoice.paymentMethod}
            </Text>
          )}
          <Text style={styles.description}>
            Total Amount Paid: ₹{parseFloat(invoice.totalAmount || '0').toFixed(2)}
          </Text>
        </View>
      )}

      {/* Pending Payment Notice */}
      {invoice.status !== 'paid' && (
        <View style={{ marginTop: 20, padding: 12, backgroundColor: '#FEF3C7', borderRadius: 6, borderWidth: 1, borderColor: '#FDE68A' }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#92400E', marginBottom: 4 }}>
            Payment Pending
          </Text>
          <Text style={{ fontSize: 9, color: '#78350F' }}>
            This invoice is awaiting payment. Please complete the payment to confirm your service.
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Thank you for your business! • Generated by FixBee Home Services Platform
        </Text>
      </View>
    </Page>
  </Document>
);
