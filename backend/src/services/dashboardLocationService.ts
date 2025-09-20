import { LoggerBase } from '@crowd/logging'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { IServiceOptions } from './IServiceOptions'

interface LocationMapData {
  members: LocationData[]
  organizations: LocationData[]
  totals: {
    members: number
    organizations: number
  }
}

interface LocationData {
  countryCode: string
  countryName: string
  count: number
  latitude?: number
  longitude?: number
}

export default class DashboardLocationService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async getLocationMap({ type, segments }): Promise<LocationMapData> {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    
    const segmentCondition = segments.length > 0 
      ? `AND "segmentId" = ANY($1::uuid[])`
      : ''
    
    const result: LocationMapData = {
      members: [],
      organizations: [],
      totals: { members: 0, organizations: 0 }
    }

    // Country code to country name mapping
    const countryNames = {
      'US': 'United States',
      'CA': 'Canada', 
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'ES': 'Spain',
      'IT': 'Italy',
      'NL': 'Netherlands',
      'BE': 'Belgium',
      'CH': 'Switzerland',
      'AT': 'Austria',
      'SE': 'Sweden',
      'NO': 'Norway',
      'DK': 'Denmark',
      'FI': 'Finland',
      'JP': 'Japan',
      'CN': 'China',
      'IN': 'India',
      'AU': 'Australia',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'AR': 'Argentina',
      'CL': 'Chile',
      'CO': 'Colombia',
      'PE': 'Peru',
      'RU': 'Russia',
      'UA': 'Ukraine',
      'PL': 'Poland',
      'CZ': 'Czech Republic',
      'HU': 'Hungary',
      'RO': 'Romania',
      'GR': 'Greece',
      'PT': 'Portugal',
      'IE': 'Ireland',
      'ZA': 'South Africa',
      'EG': 'Egypt',
      'NG': 'Nigeria',
      'KE': 'Kenya',
      'MA': 'Morocco'
    }

    // Country coordinates for map visualization
    const countryCoordinates = {
      'US': [39.8283, -98.5795],
      'CA': [56.1304, -106.3468],
      'GB': [55.3781, -3.4360],
      'DE': [51.1657, 10.4515],
      'FR': [46.2276, 2.2137],
      'ES': [40.4637, -3.7492],
      'IT': [41.8719, 12.5674],
      'NL': [52.1326, 5.2913],
      'BE': [50.5039, 4.4699],
      'CH': [46.8182, 8.2275],
      'AT': [47.5162, 14.5501],
      'SE': [60.1282, 18.6435],
      'NO': [60.4720, 8.4689],
      'DK': [56.2639, 9.5018],
      'FI': [61.9241, 25.7482],
      'JP': [36.2048, 138.2529],
      'CN': [35.8617, 104.1954],
      'IN': [20.5937, 78.9629],
      'AU': [-25.2744, 133.7751],
      'BR': [-14.2350, -51.9253],
      'MX': [23.6345, -102.5528],
      'AR': [-38.4161, -63.6167],
      'CL': [-35.6751, -71.5430],
      'CO': [4.5709, -74.2973],
      'PE': [-9.1900, -75.0152],
      'RU': [61.5240, 105.3188],
      'UA': [48.3794, 31.1656],
      'PL': [51.9194, 19.1451],
      'CZ': [49.8175, 15.4730],
      'HU': [47.1625, 19.5033],
      'RO': [45.9432, 24.9668],
      'GR': [39.0742, 21.8243],
      'PT': [39.3999, -8.2245],
      'IE': [53.1424, -7.6921],
      'ZA': [-30.5595, 22.9375],
      'EG': [26.0975, 30.0444],
      'NG': [9.0820, 8.6753],
      'KE': [-0.0236, 37.9062],
      'MA': [31.7917, -7.0926]
    }

    if (type === 'members' || type === 'both') {
      const memberQuery = `
        SELECT 
          "countryCode",
          COUNT(*) as count,
          AVG("latitude") as avg_latitude,
          AVG("longitude") as avg_longitude
        FROM members 
        WHERE "countryCode" IS NOT NULL 
          AND "deletedAt" IS NULL
          ${segmentCondition}
        GROUP BY "countryCode"
        ORDER BY count DESC
      `
      
      const memberResults = await qx.select(memberQuery, segments.length > 0 ? [segments] : [])
      
      result.members = memberResults.map(row => ({
        countryCode: row.countryCode,
        countryName: countryNames[row.countryCode] || row.countryCode,
        count: parseInt(row.count),
        latitude: row.avg_latitude || countryCoordinates[row.countryCode]?.[0],
        longitude: row.avg_longitude || countryCoordinates[row.countryCode]?.[1]
      }))

      result.totals.members = result.members.reduce((sum, item) => sum + item.count, 0)
    }

    if (type === 'organizations' || type === 'both') {
      const orgQuery = `
        SELECT 
          "countryCode",
          COUNT(*) as count,
          AVG("latitude") as avg_latitude,
          AVG("longitude") as avg_longitude
        FROM organizations 
        WHERE "countryCode" IS NOT NULL 
          AND "deletedAt" IS NULL
          ${segmentCondition}
        GROUP BY "countryCode"
        ORDER BY count DESC
      `
      
      const orgResults = await qx.select(orgQuery, segments.length > 0 ? [segments] : [])
      
      result.organizations = orgResults.map(row => ({
        countryCode: row.countryCode,
        countryName: countryNames[row.countryCode] || row.countryCode,
        count: parseInt(row.count),
        latitude: row.avg_latitude || countryCoordinates[row.countryCode]?.[0],
        longitude: row.avg_longitude || countryCoordinates[row.countryCode]?.[1]
      }))

      result.totals.organizations = result.organizations.reduce((sum, item) => sum + item.count, 0)
    }

    return result
  }
}