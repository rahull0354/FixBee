import { pdf } from '@react-pdf/renderer';
import React from 'react';

interface InvoiceData {
  invoice: any;
  serviceRequest: any;
  provider: any;
  user: any;
  InvoicePDFComponent: React.ComponentType<any>;
}

export const downloadInvoicePDF = async ({
  invoice,
  serviceRequest,
  provider,
  user,
  InvoicePDFComponent,
}: InvoiceData): Promise<boolean> => {
  try {
    // Generate PDF blob using React.createElement instead of JSX
    const blob = await pdf(
      React.createElement(InvoicePDFComponent, {
        invoice,
        serviceRequest,
        provider,
        user,
      })
    ).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoice.invoiceNumber}.pdf`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    throw error;
  }
};

export const downloadElementAsPDF = async (
  elementId: string,
  filename: string
): Promise<boolean> => {
  throw new Error('Please use downloadInvoicePDF with invoice data instead.');
};
