"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
const token_1 = require("../lib/token");
const userService_1 = require("../services/userService");
const admin_1 = require("../lib/admin");
const requireAuth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing authorization token" });
    }
    const token = header.slice("Bearer ".length);
    try {
        const payload = (0, token_1.verifyToken)(token);
        req.userId = payload.userId;
        next();
    }
    catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = async (req, res, next) => {
    if (!req.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }
    try {
        const user = await (0, userService_1.getUserById)(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!(0, admin_1.isAdminEmail)(user.email)) {
            return res.status(403).json({ message: "Admin access required" });
        }
        req.isAdmin = true;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.js.map