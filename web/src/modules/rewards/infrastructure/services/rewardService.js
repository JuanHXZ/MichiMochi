import { apiClient } from '@shared/services/apiClient';

export const rewardService = {
  async getMyRewards() {
    const response = await apiClient('/rewards/me', { requiresAuth: true });
    return response.data;
  },

  async redeemReward(rewardId) {
    const response = await apiClient('/rewards/redeem', {
      method: 'POST',
      body: { rewardId },
      requiresAuth: true,
    });
    return response.data;
  },
};
