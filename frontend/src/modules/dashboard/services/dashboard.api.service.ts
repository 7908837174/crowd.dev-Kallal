import authAxios from '@/shared/axios/auth-axios';

export class DashboardApiService {
  static async fetchChartData({ period, platform, segment }) {
    const response = await authAxios.get(
      '/dashboard',
      {
        params: {
          timeframe: period,
          platform,
          segment,
          excludeSegments: true,
        },
      },
    );

    return response.data;
  }

  static async fetchLocationMapData({ type = 'both', segments = [] }) {
    const response = await authAxios.get(
      '/dashboard/location-map',
      {
        params: {
          type,
          segments: segments.join(','),
        },
      },
    );

    return response.data;
  }
}
