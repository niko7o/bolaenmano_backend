import { Request, Response, NextFunction, RequestHandler } from "express";
export type AuthedRequest = Request & {
    userId?: string;
    isAdmin?: boolean;
};
export declare const requireAuth: (req: AuthedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireAdmin: RequestHandler;
//# sourceMappingURL=auth.d.ts.map