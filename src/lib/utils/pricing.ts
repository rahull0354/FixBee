/**
 * Pricing Calculation Utility
 * Calculates service prices with admin commission and provider earnings
 */

export interface AdminCommission {
  type: 'fixed' | 'percentage' | 'hybrid';
  fixed?: number;
  percentage?: number;
  minCommission?: number;
  maxCommission?: number;
}

export interface PricingDetails {
  providerCharge: number;        // What provider earns
  adminCharge: number;           // Platform commission
  additionalCharge?: number;     // Extra fees (materials, urgency)
  additionalBreakdown?: string;  // Explanation of additional charges
  subtotal?: number;             // Before additional charges
  total?: number;                // Final total customer pays
  commissionRate?: number;       // Percentage used
  commissionType?: 'fixed' | 'percentage' | 'hybrid';
}

export interface ServicePricingResult {
  providerCharge: number;
  adminCharge: number;
  additionalCharge: number;
  subtotal: number;
  total: number;
  commissionRate?: number;
  commissionType: 'fixed' | 'percentage' | 'hybrid';
  pricingDetails: PricingDetails;
}

/**
 * Calculate service price with admin commission
 * @param providerRate - Provider's base rate (what they want to earn)
 * @param adminCommission - Admin's commission settings
 * @param additionalCharge - Extra fees (materials, urgency, etc.)
 * @returns Complete pricing breakdown
 */
export function calculateServicePrice(
  providerRate: number,
  adminCommission: AdminCommission,
  additionalCharge: number = 0
): ServicePricingResult {
  // Validate inputs
  const validProviderRate = Math.max(0, Number(providerRate) || 0);
  const validAdditionalCharge = Math.max(0, Number(additionalCharge) || 0);

  let adminCharge = 0;
  let commissionRate: number | undefined;

  // Calculate admin's commission based on type
  switch (adminCommission.type) {
    case 'percentage':
      // Percentage of provider's rate
      const percentage = adminCommission.percentage || 0;
      commissionRate = percentage;
      adminCharge = (validProviderRate * percentage) / 100;

      // Apply min/max constraints
      if (adminCommission.minCommission !== undefined) {
        adminCharge = Math.max(adminCharge, adminCommission.minCommission);
      }
      if (adminCommission.maxCommission !== undefined) {
        adminCharge = Math.min(adminCharge, adminCommission.maxCommission);
      }
      break;

    case 'fixed':
      // Fixed amount
      adminCharge = adminCommission.fixed || 0;
      break;

    case 'hybrid':
      // Combination of fixed + percentage
      const fixedPart = adminCommission.fixed || 0;
      const percentPart = adminCommission.percentage
        ? (validProviderRate * (adminCommission.percentage || 0)) / 100
        : 0;
      adminCharge = fixedPart + percentPart;

      // Apply min/max constraints
      if (adminCommission.minCommission !== undefined) {
        adminCharge = Math.max(adminCharge, adminCommission.minCommission);
      }
      if (adminCommission.maxCommission !== undefined) {
        adminCharge = Math.min(adminCharge, adminCommission.maxCommission);
      }
      commissionRate = adminCommission.percentage;
      break;

    default:
      // Default to fixed commission of 0
      adminCharge = 0;
  }

  // Provider earns their full rate
  const providerCharge = validProviderRate;

  // Calculate totals
  const subtotal = providerCharge + adminCharge;
  const total = subtotal + validAdditionalCharge;

  // Build pricing details object
  const pricingDetails: PricingDetails = {
    providerCharge,
    adminCharge,
    additionalCharge: validAdditionalCharge || undefined,
    subtotal,
    total,
    commissionRate,
    commissionType: adminCommission.type,
  };

  // Add additional breakdown if provided
  if (validAdditionalCharge > 0) {
    pricingDetails.additionalBreakdown = `Additional charges: ${validAdditionalCharge > 0 ? '₹' + validAdditionalCharge.toFixed(2) : '₹0.00'}`;
  }

  return {
    providerCharge,
    adminCharge,
    additionalCharge: validAdditionalCharge,
    subtotal,
    total,
    commissionRate,
    commissionType: adminCommission.type,
    pricingDetails,
  };
}

/**
 * Format price for display
 * @param amount - Price amount
 * @param currency - Currency symbol (default: ₹)
 * @returns Formatted price string
 */
export function formatPrice(amount: number | string, currency: string = '₹'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return `${currency}0.00`;
  return `${currency}${numAmount.toFixed(2)}`;
}

/**
 * Parse pricing details from database format
 * @param pricingDetails - Raw pricing details from database
 * @returns Parsed pricing details object
 */
export function parsePricingDetails(pricingDetails: any): PricingDetails | null {
  if (!pricingDetails) return null;

  return {
    providerCharge: Number(pricingDetails.providerCharge) || 0,
    adminCharge: Number(pricingDetails.adminCharge) || 0,
    additionalCharge: pricingDetails.additionalCharge
      ? Number(pricingDetails.additionalCharge)
      : undefined,
    additionalBreakdown: pricingDetails.additionalBreakdown,
    subtotal: pricingDetails.subtotal ? Number(pricingDetails.subtotal) : undefined,
    total: pricingDetails.total ? Number(pricingDetails.total) : undefined,
    commissionRate: pricingDetails.commissionRate
      ? Number(pricingDetails.commissionRate)
      : undefined,
    commissionType: pricingDetails.commissionType,
  };
}

/**
 * Default admin commission settings
 */
export const DEFAULT_ADMIN_COMMISSION: AdminCommission = {
  type: 'fixed',
  fixed: 0,
};

/**
 * Get admin commission from service category
 * @param category - Service category object
 * @returns Admin commission settings
 */
export function getAdminCommissionFromCategory(category: any): AdminCommission {
  if (!category || !category.adminCommission) {
    return DEFAULT_ADMIN_COMMISSION;
  }

  return {
    type: category.adminCommission.type || 'fixed',
    fixed: category.adminCommission.fixed,
    percentage: category.adminCommission.percentage,
    minCommission: category.adminCommission.minCommission,
    maxCommission: category.adminCommission.maxCommission,
  };
}
