import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Invoice } from "@/types";

interface AdminInvoicePDFProps {
  invoice: Invoice;
  serviceRequest?: any;
  provider?: any;
  customer?: any;
}

export const AdminInvoicePDF: React.FC<AdminInvoicePDFProps> = ({
  invoice,
  serviceRequest,
  provider,
  customer,
}) => {
  // Use customer from prop, or fallback to invoice.customer
  const customerData = customer || invoice?.customer;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `₹${num.toFixed(2)}`;
  };

  const calculateSubtotal = () => {
    const serviceChargeItem = invoice.lineItems?.find(
      (item: any) => item.itemType === "service",
    );
    const serviceCharge = serviceChargeItem
      ? parseFloat(serviceChargeItem.total)
      : parseFloat(invoice.laborCost || "0") || 0;
    const materialCost = parseFloat(invoice.materialCost || "0") || 0;
    return serviceCharge + materialCost;
  };

  const subtotal = calculateSubtotal();
  const totalAmount = parseFloat(invoice.totalAmount || "0");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContentWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.companyName}>FixBee</Text>
              <Text style={styles.companyTagline}>Home Services Marketplace</Text>
              <Text style={styles.companyAddress}>
                Platform Administration Portal
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.documentType}>ADMIN INVOICE</Text>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
              <Text style={styles.documentDate}>
                Generated: {formatDate(new Date().toISOString())}
              </Text>
            </View>
          </View>

          {/* Invoice Info Bar - 2x2 Grid */}
          <View style={styles.infoBar}>
            <View style={styles.infoRow}>
              <View style={styles.infoItemHalf}>
                <Text style={styles.infoLabel}>Invoice ID</Text>
                <Text style={styles.infoValue}>{invoice.id}</Text>
              </View>
              <View style={styles.infoItemHalf}>
                <Text style={styles.infoLabel}>Invoice Date</Text>
                <Text style={styles.infoValue}>{formatDate(invoice.invoiceDate)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoItemHalf}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>
                  {formatDate(invoice.dueDate) || "N/A"}
                </Text>
              </View>
              <View style={styles.infoItemHalf}>
                <Text style={styles.infoLabel}>Paid Date</Text>
                <Text style={styles.infoValue}>
                  {invoice.paidAt ? formatDate(invoice.paidAt) : "N/A"}
                </Text>
              </View>
            </View>
          </View>

          {/* Parties Involved Section */}
          <View style={styles.partiesSection}>
            {/* Customer */}
            <View style={styles.partyColumn}>
              <Text style={styles.partyTitle}>BILL TO (Customer)</Text>
              <View style={styles.partyDetails}>
                <Text style={styles.partyName}>{customerData?.name || "N/A"}</Text>
                {customerData?.email ? (
                  <Text style={styles.partyContact}>{customerData.email}</Text>
                ) : (
                  <Text style={styles.partyContact}>No email provided</Text>
                )}
                {customerData?.phone ? (
                  <Text style={styles.partyContact}>{customerData.phone}</Text>
                ) : (
                  <Text style={styles.partyContact}>No phone provided</Text>
                )}
                {/* Use customer address if available, otherwise use service address */}
                {(customerData?.address || serviceRequest?.serviceAddress) && (
                  <View style={styles.addressContainer}>
                    {customerData?.address ? (
                      <>
                        {customerData.address.street && (
                          <Text style={styles.partyAddress}>{customerData.address.street}</Text>
                        )}
                        {(customerData.address.city || customerData.address.state) && (
                          <Text style={styles.partyAddress}>
                            {[customerData.address.city, customerData.address.state].filter(Boolean).join(", ")}
                          </Text>
                        )}
                        {customerData.address.zipCode && (
                          <Text style={styles.partyAddress}>{customerData.address.zipCode}</Text>
                        )}
                      </>
                    ) : serviceRequest?.serviceAddress ? (
                      <>
                        {serviceRequest.serviceAddress.street && (
                          <Text style={styles.partyAddress}>{serviceRequest.serviceAddress.street}</Text>
                        )}
                        {(serviceRequest.serviceAddress.city || serviceRequest.serviceAddress.state) && (
                          <Text style={styles.partyAddress}>
                            {[serviceRequest.serviceAddress.city, serviceRequest.serviceAddress.state].filter(Boolean).join(", ")}
                          </Text>
                        )}
                        {serviceRequest.serviceAddress.pincode && (
                          <Text style={styles.partyAddress}>{serviceRequest.serviceAddress.pincode}</Text>
                        )}
                      </>
                    ) : null}
                  </View>
                )}
                <Text style={styles.partyLabel}>
                  ID: {customerData?.id || "N/A"}
                </Text>
              </View>
            </View>

            {/* Provider */}
            <View style={styles.partyColumn}>
              <Text style={styles.partyTitle}>SERVICE PROVIDER</Text>
              <View style={styles.partyDetails}>
                <Text style={styles.partyName}>{provider?.name || "N/A"}</Text>
                {provider?.email && (
                  <Text style={styles.partyContact}>{provider.email}</Text>
                )}
                {provider?.phone && (
                  <Text style={styles.partyContact}>{provider.phone}</Text>
                )}
                <Text style={styles.partyLabel}>
                  ID: {provider?.id || "N/A"}
                </Text>
              </View>
            </View>
          </View>

          {/* Service Details */}
          {serviceRequest && (
            <View style={styles.serviceSection}>
              <Text style={styles.sectionTitle}>Service Details</Text>
              <View style={styles.serviceDetails}>
                <View style={styles.serviceRow}>
                  <Text style={styles.serviceLabel}>Service Title:</Text>
                  <Text style={styles.serviceValue}>
                    {serviceRequest.title || serviceRequest.serviceTitle || "N/A"}
                  </Text>
                </View>
                {serviceRequest.serviceType && (
                  <View style={styles.serviceRow}>
                    <Text style={styles.serviceLabel}>Service Type:</Text>
                    <Text style={styles.serviceValue}>
                      {serviceRequest.serviceType}
                    </Text>
                  </View>
                )}
                {serviceRequest.description && (
                  <View style={styles.serviceRow}>
                    <Text style={styles.serviceLabel}>Description:</Text>
                    <Text style={styles.serviceValue}>
                      {serviceRequest.description}
                    </Text>
                  </View>
                )}
                {invoice.requestId && (
                  <View style={styles.serviceRow}>
                    <Text style={styles.serviceLabel}>Request ID:</Text>
                    <Text style={styles.serviceValue}>{invoice.requestId}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Spacer to push footer to bottom */}
        <View style={styles.flexSpacer} />

        {/* Footer - Page 1 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is an official administrative document for FixBee platform records.
          </Text>
          <View style={styles.footerLine} />
          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} FixBee. All rights reserved. | Page 1 of 2
          </Text>
        </View>
      </Page>

      {/* Second Page - Charges Breakdown & Payment Info */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContentWrapper}>
          {/* Page 2 Header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageHeaderText}>Charges & Payment Details</Text>
            <Text style={styles.pageHeaderSubtext}>{invoice.invoiceNumber}</Text>
          </View>

          {/* Line Items */}
          <View style={styles.lineItemsSection}>
          <Text style={styles.sectionTitle}>Charges Breakdown</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCol1}>Description</Text>
              <Text style={styles.tableHeaderCol2}>Amount</Text>
            </View>

            {/* Table Body */}
            {(() => {
              const serviceChargeItem = invoice.lineItems?.find(
                (item: any) => item.itemType === "service",
              );
              const serviceCharge = serviceChargeItem
                ? parseFloat(serviceChargeItem.total)
                : parseFloat(invoice.laborCost || "0") || 0;

              return (
                <>
                  {/* Service Charge */}
                  {serviceCharge > 0 && (
                    <View style={styles.tableRow}>
                      <View style={styles.tableCol1}>
                        <Text style={styles.itemDescription}>
                          Service Charges
                        </Text>
                        <Text style={styles.itemSubtext}>
                          Final charge by service provider
                        </Text>
                      </View>
                      <Text style={styles.tableCol2}>
                        {formatCurrency(serviceCharge)}
                      </Text>
                    </View>
                  )}

                  {/* Material Cost */}
                  {invoice.materialCost &&
                    parseFloat(invoice.materialCost) > 0 && (
                      <View style={styles.tableRow}>
                        <View style={styles.tableCol1}>
                          <Text style={styles.itemDescription}>
                            Material Charges
                          </Text>
                          <Text style={styles.itemSubtext}>
                            Cost of materials used
                          </Text>
                        </View>
                        <Text style={styles.tableCol2}>
                          {formatCurrency(invoice.materialCost)}
                        </Text>
                      </View>
                    )}

                  {/* Subtotal */}
                  {(invoice.laborCost || invoice.materialCost) && (
                    <View style={styles.tableRowSubtotal}>
                      <Text style={styles.subtotalLabel}>Subtotal</Text>
                      <Text style={styles.subtotalValue}>
                        {formatCurrency(subtotal)}
                      </Text>
                    </View>
                  )}

                  {/* Tax */}
                  {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
                    <View style={styles.tableRow}>
                      <View style={styles.tableCol1}>
                        <Text style={styles.itemDescription}>
                          Tax ({invoice.taxRate || "N/A"} GST)
                        </Text>
                        <Text style={styles.itemSubtext}>
                          Government taxes
                        </Text>
                      </View>
                      <Text style={styles.tableCol2}>
                        {formatCurrency(invoice.taxAmount)}
                      </Text>
                    </View>
                  )}

                  {/* Platform Fee */}
                  {invoice.platformFee &&
                    parseFloat(invoice.platformFee) > 0 && (
                      <View style={styles.tableRow}>
                        <View style={styles.tableCol1}>
                          <Text style={styles.itemDescription}>
                            Platform Fee
                          </Text>
                          <Text style={styles.itemSubtext}>
                            FixBee service charges
                          </Text>
                        </View>
                        <Text style={styles.tableCol2}>
                          {formatCurrency(invoice.platformFee)}
                        </Text>
                      </View>
                    )}
                </>
              );
            })()}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
          </View>
          <Text style={styles.totalNote}>
            Including all taxes and platform charges
          </Text>
        </View>

        {/* Earnings Distribution - Admin Only */}
        {(subtotal ||
          invoice.taxAmount ||
          invoice.platformFee ||
          invoice.providerEarning) && (
          <View style={styles.distributionSection}>
            <Text style={styles.sectionTitle}>Earnings Distribution</Text>
            <View style={styles.distributionGrid}>
              {/* Provider Share */}
              {(() => {
                const serviceChargeItem = invoice.lineItems?.find(
                  (item: any) => item.itemType === "service",
                );
                const serviceCharge = serviceChargeItem
                  ? parseFloat(serviceChargeItem.total)
                  : parseFloat(invoice.laborCost || "0") || 0;
                const materialCost = parseFloat(invoice.materialCost || "0") || 0;
                const providerShare = serviceCharge + materialCost;

                return providerShare > 0 ? (
                  <View style={styles.distributionItem}>
                    <Text style={styles.distributionLabel}>Provider Share</Text>
                    <Text style={styles.distributionValue}>
                      {formatCurrency(providerShare)}
                    </Text>
                    <Text style={styles.distributionPercent}>
                      {((providerShare / totalAmount) * 100).toFixed(1)}%
                    </Text>
                    <Text style={styles.distributionNote}>
                      Service + Material charges
                    </Text>
                  </View>
                ) : null;
              })()}

              {/* Tax */}
              {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
                <View style={styles.distributionItem}>
                  <Text style={styles.distributionLabel}>Government Tax</Text>
                  <Text style={styles.distributionValue}>
                    {formatCurrency(invoice.taxAmount)}
                  </Text>
                  <Text style={styles.distributionPercent}>
                    {((parseFloat(invoice.taxAmount) / totalAmount) * 100).toFixed(
                      1,
                    )}%
                  </Text>
                  <Text style={styles.distributionNote}>
                    {invoice.taxRate} GST
                  </Text>
                </View>
              )}

              {/* Platform/Admin Share */}
              {invoice.platformFee && parseFloat(invoice.platformFee) > 0 && (
                <View style={styles.distributionItem}>
                  <Text style={styles.distributionLabel}>Platform Revenue</Text>
                  <Text style={styles.distributionValue}>
                    {formatCurrency(invoice.platformFee)}
                  </Text>
                  <Text style={styles.distributionPercent}>
                    {((parseFloat(invoice.platformFee) / totalAmount) * 100).toFixed(
                      1,
                    )}%
                  </Text>
                  <Text style={styles.distributionNote}>
                    FixBee commission
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.paymentDetails}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Status:</Text>
              <Text style={[
                styles.paymentValue,
                invoice.status === 'paid' ? styles.statusPaid :
                invoice.status === 'pending' ? styles.statusPending :
                invoice.status === 'overdue' ? styles.statusOverdue :
                styles.statusCancelled
              ]}>
                {invoice.status.toUpperCase()}
              </Text>
            </View>
            {invoice.paymentMethod && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment Method:</Text>
                <Text style={styles.paymentValue}>
                  {invoice.paymentMethod.toUpperCase()}
                </Text>
              </View>
            )}
            {invoice.paymentId && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment ID:</Text>
                <Text style={styles.paymentValue}>{invoice.paymentId}</Text>
              </View>
            )}
            {invoice.paidAt && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Paid On:</Text>
                <Text style={styles.paymentValue}>{formatDate(invoice.paidAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Spacer to push footer to bottom */}
        <View style={styles.flexSpacer} />

        {/* Footer - Page 2 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For any queries, contact: admin@fixbee.com | Support: support@fixbee.com
          </Text>
          <View style={styles.footerLine} />
          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} FixBee. All rights reserved. | Page 2 of 2
          </Text>
        </View>
        </View>
      </Page>
    </Document>
  );
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  pageContentWrapper: {
    flex: 1,
    flexDirection: "column",
  },
  flexSpacer: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#1E40AF",
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1E40AF",
    marginBottom: 3,
  },
  companyTagline: {
    fontSize: 9,
    color: "#64748B",
    marginBottom: 1,
  },
  companyAddress: {
    fontSize: 8,
    color: "#64748B",
  },
  documentType: {
    fontSize: 9,
    color: "#64748B",
    marginBottom: 2,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E40AF",
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 7,
    color: "#64748B",
  },
  // Page Header (for page 2)
  pageHeader: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#1E40AF",
  },
  pageHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E40AF",
    marginBottom: 3,
  },
  pageHeaderSubtext: {
    fontSize: 9,
    color: "#64748B",
  },
  // Info Bar
  infoBar: {
    backgroundColor: "#F1F5F9",
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  infoItemHalf: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: "#64748B",
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1E293B",
  },
  // Parties Section
  partiesSection: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 12,
  },
  partyColumn: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  partyTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1E40AF",
    marginBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "#1E40AF",
    paddingBottom: 3,
  },
  partyDetails: {},
  partyName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 3,
  },
  partyContact: {
    fontSize: 8,
    color: "#1E293B",
    marginBottom: 1,
  },
  addressContainer: {
    marginTop: 3,
  },
  partyAddress: {
    fontSize: 7,
    color: "#1E293B",
    marginBottom: 1,
    lineHeight: 1.1,
  },
  partyLabel: {
    fontSize: 7,
    color: "#94A3B8",
    marginTop: 3,
  },
  // Service Section
  serviceSection: {
    marginBottom: 15,
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },
  serviceDetails: {},
  serviceRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  serviceLabel: {
    fontSize: 8,
    color: "#64748B",
    width: 80,
  },
  serviceValue: {
    fontSize: 8,
    color: "#1E293B",
    flex: 1,
  },
  // Line Items Table
  lineItemsSection: {
    marginBottom: 15,
  },
  table: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1E40AF",
    padding: 10,
  },
  tableHeaderCol1: {
    flex: 2,
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  tableHeaderCol2: {
    flex: 1,
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tableRowSubtotal: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tableCol1: {
    flex: 2,
    paddingRight: 5,
  },
  tableCol2: {
    flex: 1,
    fontSize: 10,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "right",
  },
  itemDescription: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 2,
  },
  itemSubtext: {
    fontSize: 8,
    color: "#64748B",
  },
  subtotalLabel: {
    flex: 2,
    fontSize: 10,
    fontWeight: "bold",
    color: "#1E293B",
  },
  subtotalValue: {
    flex: 1,
    fontSize: 10,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "right",
  },
  // Total Section
  totalSection: {
    backgroundColor: "#1E40AF",
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  totalNote: {
    fontSize: 7,
    color: "#DBEAFE",
    textAlign: "right",
  },
  // Distribution Section
  distributionSection: {
    marginBottom: 15,
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  distributionGrid: {
    flexDirection: "row",
    gap: 10,
  },
  distributionItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  distributionLabel: {
    fontSize: 7,
    color: "#64748B",
    marginBottom: 2,
  },
  distributionValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 2,
  },
  distributionPercent: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 2,
  },
  distributionNote: {
    fontSize: 6,
    color: "#64748B",
  },
  // Payment Section
  paymentSection: {
    marginBottom: 20,
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  paymentDetails: {},
  paymentRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 8,
    color: "#64748B",
    width: 90,
  },
  paymentValue: {
    fontSize: 8,
    color: "#1E293B",
    fontWeight: "bold",
  },
  statusPaid: {
    color: "#059669",
  },
  statusPending: {
    color: "#D97706",
  },
  statusOverdue: {
    color: "#DC2626",
  },
  statusCancelled: {
    color: "#64748B",
  },
  // Footer
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#1E40AF",
  },
  footerText: {
    fontSize: 7,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 2,
  },
  footerLine: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 5,
  },
  footerCopyright: {
    fontSize: 7,
    color: "#94A3B8",
    textAlign: "center",
  },
});

export default AdminInvoicePDF;
