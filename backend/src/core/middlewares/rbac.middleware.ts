import { Response, NextFunction } from 'express'
import { CustomRequest } from '../types/express'

export const rbacMiddleware = (allowedRoles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' })
      }

      next()
    } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error' })
    }
  }
}

export default rbacMiddleware
