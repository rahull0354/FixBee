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
    // Log incoming data for debugging
    console.log('📄 PDF Generation - Input Data:');
    console.log('  Invoice:', JSON.stringify(invoice, null, 2));
    console.log('  Service Request:', JSON.stringify(serviceRequest, null, 2));
    console.log('  Provider:', JSON.stringify(provider, null, 2));
    console.log('  User:', JSON.stringify(user, null, 2));

    // Generate PDF blob using React.createElement instead of JSX
    const blob = await pdf(
      React.createElement(InvoicePDFComponent, {
        invoice,
        serviceRequest,
        provider,
        user,
      })
    ).toBlob();

    console.log('✅ PDF Blob generated successfully:', blob.size, 'bytes');

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
    console.error('❌ PDF generation failed:', error);
    throw error;
  }
};

export const downloadElementAsPDF = async (
  elementId: string,
  filename: string
): Promise<boolean> => {
  console.warn('downloadElementAsPDF is deprecated. Use downloadInvoicePDF instead.');
  throw new Error('Please use downloadInvoicePDF with invoice data instead.');
};
