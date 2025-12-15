import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hostelhub',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpire: process.env.JWT_EXPIRE || '24h',
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}

export default config
