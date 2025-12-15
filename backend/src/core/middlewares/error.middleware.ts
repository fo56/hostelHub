import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger.js'

class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
  }
}

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  logger.error(`[${err.statusCode}] ${err.message}`)

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  })
}

export default errorMiddleware
export { AppError }
