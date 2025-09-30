import { Request, Response, NextFunction } from 'express';
type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        firstName: string;
        lastName: string;
    };
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireRole: (roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireProvider: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireCustomer: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
//# sourceMappingURL=auth.d.ts.map