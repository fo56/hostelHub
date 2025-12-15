import { Express } from 'express'

// Import module routes
import authRoutes from './modules/auth/auth.routes'
import userRoutes from './modules/users/user.routes'
import issueRoutes from './modules/issues/issue.routes'
import messRoutes from './modules/mess/mess.routes'

export const setupRoutes = (app: Express) => {

  // Auth routes
  app.use('/api/auth', authRoutes)

  // User routes
  app.use('/api/users', userRoutes)

  // Issue routes
  app.use('/api/issues', issueRoutes)

  // Mess routes
  app.use('/api/mess', messRoutes)

}

export default setupRoutes
