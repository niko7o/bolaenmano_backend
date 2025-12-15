"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
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
const pushTokenSchema = zod_1.z.object({
    expoPushToken: zod_1.z
        .string()
        .regex(/^Expo(nent)?PushToken\[[A-Za-z0-9+=/-]+\]$/, "Invalid Expo push token format"),
});
router.post("/me/push-token", auth_1.requireAuth, async (req, res) => {
    const parsed = pushTokenSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "Invalid push token", issues: parsed.error.issues });
    }
    try {
        await (0, userService_1.saveExpoPushToken)(req.userId, parsed.data.expoPushToken);
        return res.json({ ok: true });
    }
    catch (error) {
        console.error("Unable to save Expo push token", error);
        return res.status(500).json({ message: "Unable to save push token" });
    }
});
const userParamsSchema = zod_1.z.object({
    userId: zod_1.z.string().regex(/^[0-9a-fA-F-]{36}$/, { message: "Invalid user id" }),
});
router.get("/:userId", async (req, res) => {
    const parsed = userParamsSchema.safeParse(req.params);
    if (!parsed.success) {
        return res.status(400).json({ message: "Invalid user id" });
    }
    const profile = await (0, userService_1.getUserProfileWithMatches)(parsed.data.userId);
    if (!profile) {
        return res.status(404).json({ message: "User not found" });
    }
    const { matches, ...user } = profile;
    return res.json({
        ...user,
        isAdmin: (0, admin_1.isAdminEmail)(user.email),
        matches,
    });
});
exports.userRoutes = router;
//# sourceMappingURL=userRoutes.js.map