import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import DashboardLocationService from '../../services/dashboardLocationService'

/**
 * GET /dashboard/location-map
 * @summary Get members and organizations grouped by location for world map visualization
 * @tag Dashboard
 * @security Bearer
 * @description Get location data for world map visualization showing members and organizations distribution.
 * @queryParam {string} [type] - Filter by type: 'members', 'organizations', or 'both' (default)
 * @queryParam {string} [segments] - Comma-separated segment IDs
 * @response 200 - Ok
 * @responseContent {LocationMapData} 200.application/json
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  const dashboardLocationService = new DashboardLocationService(req)

  const type = req.query.type || 'both'
  const segments = req.query.segments ? req.query.segments.split(',') : []

  const payload = await dashboardLocationService.getLocationMap({
    type,
    segments,
  })

  await req.responseHandler.success(req, res, payload)
}