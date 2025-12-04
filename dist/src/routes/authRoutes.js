"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const google_1 = require("../lib/google");
const token_1 = require("../lib/token");
const userService_1 = require("../services/userService");
const admin_1 = require("../lib/admin");
const router = (0, express_1.Router)();
const authSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(10),
});
router.post("/google", async (req, res) => {
    const parseResult = authSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid payload", issues: parseResult.error.flatten().fieldErrors });
    }
    try {
        const googleProfile = await (0, google_1.verifyGoogleToken)(parseResult.data.idToken);
        const user = await (0, userService_1.upsertGoogleUser)(googleProfile);
        const token = (0, token_1.createToken)({ userId: user.id });
        return res.json({
            token,
            user: { ...user, isAdmin: (0, admin_1.isAdminEmail)(user.email) },
        });
    }
    catch (error) {
        console.error("Google auth failed", error);
        return res.status(401).json({ message: "Unable to verify Google token" });
    }
});
exports.authRoutes = router;
//# sourceMappingURL=authRoutes.js.map