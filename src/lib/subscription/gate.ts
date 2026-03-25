/**
 * Check if a user has an active subscription.
 * Currently stubbed to return false for all users.
 * TODO: W-000021 Stripe integration
 */
export async function isSubscribed(_userId: string): Promise<boolean> {
  return false;
}
