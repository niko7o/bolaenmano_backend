"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const userService_1 = require("../services/userService");
const admin_1 = require("../lib/admin");
const router = (0, express_1.Router)();
router.get("/me", auth_1.requireAuth, async (req, res) => {
    const profile = await (0, userService_1.getUserProfile)(req.userId);
    if (!profile) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.json({ ...profile, isAdmin: (0, admin_1.isAdminEmail)(profile.email) });
});
exports.userRoutes = router;
//# sourceMappingURL=userRoutes.js.map