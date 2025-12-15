import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken'
import { config } from '../../config/env.js'

export interface JWTPayload {
  id: string
  email: string
  role: string
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtSecret as string, {
    expiresIn: config.jwtExpire,
  } as any)
}

export const verifyToken = (token: string): JWTPayload => {
  const options: VerifyOptions = {}
  return jwt.verify(token, config.jwtSecret as string, options) as JWTPayload
}

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}

export default {
  generateToken,
  verifyToken,
  decodeToken,
}
