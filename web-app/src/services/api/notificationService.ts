import { apiClient } from "./apiClient";
import type { Notification } from "./types";

export const notificationService = {
  getByUserId: async (limit = 20): Promise<Notification[]> => {
    return apiClient.get<Notification[]>("/notifications", { limit: String(limit) });
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${encodeURIComponent(id)}/read`);
  },

  markAllRead: async (ids: string[]): Promise<void> => {
    await apiClient.post("/notifications/read-all", { ids });
  },
};
