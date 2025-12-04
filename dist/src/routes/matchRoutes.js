"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const matchService_1 = require("../services/matchService");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use(auth_1.requireAdmin);
const listQuerySchema = zod_1.z.object({
    tournamentId: zod_1.z.string().uuid().optional(),
    scope: zod_1.z.enum(["upcoming", "completed", "all"]).optional(),
});
router.get("/", async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "Invalid filters", issues: parsed.error.flatten().fieldErrors });
    }
    const filters = {};
    if (parsed.data.tournamentId !== undefined) {
        filters.tournamentId = parsed.data.tournamentId;
    }
    if (parsed.data.scope !== undefined) {
        filters.scope = parsed.data.scope;
    }
    const matches = await (0, matchService_1.listMatches)(filters);
    return res.json(matches);
});
const baseMatchSchema = zod_1.z
    .object({
    tournamentId: zod_1.z.string().uuid(),
    playerAId: zod_1.z.string().uuid(),
    playerBId: zod_1.z.string().uuid(),
    tableNumber: zod_1.z.number().int().positive().optional().nullable(),
    scheduledAt: zod_1.z.string().datetime().optional().nullable(),
})
    .refine((data) => data.playerAId !== data.playerBId, {
    message: "Players must be different",
    path: ["playerBId"],
});
router.post("/", async (_req, res) => {
    const parsed = baseMatchSchema.safeParse(_req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "Invalid payload", issues: parsed.error.flatten().fieldErrors });
    }
    try {
        const payload = {
            ...parsed.data,
            tableNumber: parsed.data.tableNumber ?? null,
            scheduledAt: parsed.data.scheduledAt ?? null,
        };
        const match = await (0, matchService_1.createMatch)(payload);
        return res.status(201).json(match);
    }
    catch (error) {
        console.error("Unable to create match", error);
        return res.status(500).json({ message: "Unable to create match" });
    }
});
const paramsSchema = zod_1.z.object({
    matchId: zod_1.z.string().uuid(),
});
const updateSchema = zod_1.z
    .object({
    playerAId: zod_1.z.string().uuid().optional(),
    playerBId: zod_1.z.string().uuid().optional(),
    tableNumber: zod_1.z.number().int().positive().optional().nullable(),
    scheduledAt: zod_1.z.string().datetime().optional().nullable(),
    completedAt: zod_1.z.string().datetime().optional().nullable(),
    winnerId: zod_1.z.string().uuid().optional().nullable(),
})
    .refine((data) => {
    if (data.playerAId && data.playerBId) {
        return data.playerAId !== data.playerBId;
    }
    return true;
}, {
    message: "Players must be different",
    path: ["playerBId"],
});
router.patch("/:matchId", async (req, res) => {
    const paramResult = paramsSchema.safeParse(req.params);
    if (!paramResult.success) {
        return res.status(400).json({ message: "Invalid match id" });
    }
    const updateResult = updateSchema.safeParse(req.body);
    if (!updateResult.success) {
        return res
            .status(400)
            .json({ message: "Invalid payload", issues: updateResult.error.flatten().fieldErrors });
    }
    const existing = await (0, matchService_1.getMatchById)(paramResult.data.matchId);
    if (!existing) {
        return res.status(404).json({ message: "Match not found" });
    }
    const nextPlayerA = updateResult.data.playerAId ?? existing.playerAId;
    const nextPlayerB = updateResult.data.playerBId ?? existing.playerBId;
    if (nextPlayerA === nextPlayerB) {
        return res.status(400).json({ message: "Players must be different" });
    }
    let nextWinnerId = updateResult.data.winnerId;
    if (nextWinnerId === undefined) {
        nextWinnerId = existing.winnerId ?? undefined;
    }
    if (nextWinnerId && nextWinnerId !== nextPlayerA && nextWinnerId !== nextPlayerB) {
        return res.status(400).json({ message: "Winner must be one of the assigned players" });
    }
    let completedAt = updateResult.data.completedAt;
    if (completedAt === undefined) {
        if (nextWinnerId && !existing.completedAt) {
            completedAt = new Date().toISOString();
        }
        else if (!nextWinnerId) {
            completedAt = null;
        }
    }
    const payload = {};
    if (updateResult.data.playerAId) {
        payload.playerAId = updateResult.data.playerAId;
    }
    if (updateResult.data.playerBId) {
        payload.playerBId = updateResult.data.playerBId;
    }
    if (updateResult.data.tableNumber !== undefined) {
        payload.tableNumber = updateResult.data.tableNumber ?? null;
    }
    if (updateResult.data.scheduledAt !== undefined) {
        payload.scheduledAt = updateResult.data.scheduledAt ?? null;
    }
    if (completedAt !== undefined) {
        payload.completedAt = completedAt;
    }
    if (nextWinnerId !== undefined) {
        payload.winnerId = nextWinnerId;
    }
    try {
        const updated = await (0, matchService_1.updateMatch)(existing.id, payload);
        return res.json(updated);
    }
    catch (error) {
        console.error("Unable to update match", error);
        return res.status(500).json({ message: "Unable to update match" });
    }
});
exports.matchRoutes = router;
//# sourceMappingURL=matchRoutes.js.map