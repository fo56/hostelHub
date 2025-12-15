import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.js'
import { CustomRequest } from '../types/express.js'

const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export default authMiddleware
