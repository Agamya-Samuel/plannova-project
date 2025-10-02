// Shared type definitions for the server

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
}

export interface DatabaseConfig {
  uri: string;
  options?: any;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
}