import { providerApi } from '@/lib/api';

/**
 * Check if provider has completed their profile setup
 * Returns true if profile is complete, false otherwise
 */
export async function checkProviderProfileComplete(): Promise<boolean> {
  try {
    const response = await providerApi.getProfile();
    const apiData = (response as any).data || response;

    // Profile is considered complete if it has:
    // - Bio (at least 20 chars)
    // - At least 3 skills
    // - Base rate set
    const isComplete = !!(
      apiData.bio &&
      apiData.skills?.length >= 3 &&
      apiData.baseRate > 0
    );

    return isComplete;
  } catch (error: any) {
    // 501 means profile doesn't exist yet
    if (error?.response?.status === 501) {
      return false;
    }
    // For other errors, assume incomplete to be safe
    console.error('Error checking profile completion:', error);
    return false;
  }
}

/**
 * Get profile completion status with details
 */
export async function getProviderProfileStatus(): Promise<{
  isComplete: boolean;
  hasBio: boolean;
  hasSkills: boolean;
  hasPricing: boolean;
  skillCount: number;
}> {
  try {
    const response = await providerApi.getProfile();
    const apiData = (response as any).data || response;

    const hasBio = !!apiData.bio;
    const hasSkills = !!(apiData.skills?.length >= 3);
    const hasPricing = !!(apiData.baseRate > 0);
    const isComplete = hasBio && hasSkills && hasPricing;

    return {
      isComplete,
      hasBio,
      hasSkills,
      hasPricing,
      skillCount: apiData.skills?.length || 0,
    };
  } catch (error: any) {
    // 501 means profile doesn't exist yet
    if (error?.response?.status === 501) {
      return {
        isComplete: false,
        hasBio: false,
        hasSkills: false,
        hasPricing: false,
        skillCount: 0,
      };
    }
    // For other errors, assume incomplete
    console.error('Error checking profile status:', error);
    return {
      isComplete: false,
      hasBio: false,
      hasSkills: false,
      hasPricing: false,
      skillCount: 0,
    };
  }
}
