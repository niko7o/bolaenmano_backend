import jwt from "jsonwebtoken";
type TokenPayload = {
    userId: string;
};
export declare const createToken: (payload: TokenPayload) => string;
export declare const verifyToken: (token: string) => TokenPayload & jwt.JwtPayload;
export {};
//# sourceMappingURL=token.d.ts.map