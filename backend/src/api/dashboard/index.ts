import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/dashboard`, safeWrap(require('./dashboardGet').default))
  app.get(`/dashboard/location-map`, safeWrap(require('./dashboardLocationMap').default))
}
