import { apiService } from '@/lib/api';
import { DashboardStats } from '@/types';

export interface DashboardRepository {
  getStats(businessId: number): Promise<DashboardStats>;
}

export const dashboardRepository: DashboardRepository = {
  async getStats(businessId) {
    const response = await apiService.reports.getDashboardStats({ business_id: businessId });
    return response.data;
  },
};
