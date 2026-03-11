import { apiClient } from "./apiClient";

export const alertService = {
  getTriggeredCount: async (_userId: string): Promise<number> => {
    const data = await apiClient.get<{ count: number }>("/notifications/alerts/count");
    return data.count;
  },
};
