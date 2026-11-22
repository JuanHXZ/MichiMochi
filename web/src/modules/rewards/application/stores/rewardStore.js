import { create } from 'zustand';
import { rewardService } from '../../infrastructure/services/rewardService';

export const useRewardStore = create((set) => ({
  summary: null,
  isLoading: false,
  isRedeeming: false,
  error: null,

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await rewardService.getMyRewards();
      set({ summary: data, isLoading: false });
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  redeemReward: async (rewardId) => {
    set({ isRedeeming: true, error: null });
    try {
      const result = await rewardService.redeemReward(rewardId);
      set({ summary: result.summary, isRedeeming: false });
      return result;
    } catch (err) {
      set({ error: err.message, isRedeeming: false });
      throw err;
    }
  },
}));
