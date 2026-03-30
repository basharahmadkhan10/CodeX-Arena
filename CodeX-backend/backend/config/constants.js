import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const MONGODB_URI = process.env.MONGODB_URI;
export const JWT_SECRET = process.env.JWT_SECRET || "fallback_jwt_secret_change_in_prod";
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
export const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID;
export const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;
export const BATTLE_TIME_LIMIT = 30 * 60; // 30 minutes in seconds
