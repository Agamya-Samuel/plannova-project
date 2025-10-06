export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'STAFF' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole | null; // Allow null for new Google users who haven't selected role
  isActive: boolean;
  isVerified: boolean;
  photoURL?: string;
  provider?: string;
  favorites?: string[]; // Array of favorite venue IDs
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  googleSignIn: () => Promise<{ needsRoleSelection?: boolean }>;
  updateRole: (role: UserRole) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
  needsRoleSelection?: boolean; // For Google sign-in new users
}

export interface RoleUpdateRequest {
  role: UserRole;
}

export interface RoleUpdateResponse {
  message: string;
  user: User;
}

export interface ApiError {
  error: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}