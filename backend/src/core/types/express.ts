import { Request } from 'express'
import { JWTPayload } from '../utils/jwt'

export interface CustomRequest extends Request {
  user?: JWTPayload
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}
