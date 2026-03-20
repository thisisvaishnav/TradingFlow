import jwt, { type JwtPayload } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

export type AuthenticatedRequest = Request & {
    userId?: string;
};

const JWT_EXPIRY = "7d";



const getJwtSecret = () => {
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
        return jwtSecret;
    }
    console.warn("JWT_SECRET is not set. Using a fallback secret for development.");
    return "dev_jwt_secret_change_me";
};


export const createToken = (userId: string, username: string) => {
    return jwt.sign(
        { userId, username },
        getJwtSecret(),
        { expiresIn: JWT_EXPIRY }
    );
};


export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Unauthorized: missing bearer token"
        });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized: invalid bearer token"
        });
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload & { userId?: string };
        if (!decoded.userId) {
            return res.status(401).json({
                message: "Unauthorized: invalid token payload"
            });
        }

        req.userId = decoded.userId;
        return next();
    } catch {
        return res.status(401).json({
            message: "Unauthorized: token verification failed"
        });
    }
};
