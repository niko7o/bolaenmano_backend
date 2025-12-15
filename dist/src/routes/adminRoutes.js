"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const Sentry = __importStar(require("@sentry/node"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const matchService_1 = require("../services/matchService");
const admin_1 = require("../lib/admin");
const router = (0, express_1.Router)();
const captureRouteException = (error, route, extra = {}) => {
    Sentry.captureException(error, {
        tags: { route },
        extra,
    });
};
// All admin routes require authentication + admin status
router.use(auth_1.requireAuth, auth_1.requireAdmin);
// ====== Players ======
router.get("/players", async (_req, res) => {
    try {
        const players = await prisma_1.prisma.user.findMany({
            orderBy: { displayName: "asc" },
        });
        // Add isAdmin flag to each player
        const playersWithAdmin = players.map((player) => ({
            ...player,
            isAdmin: (0, admin_1.isAdminEmail)(player.email),
        }));
        return res.json(playersWithAdmin);
    }
    catch (error) {
        console.error("Error fetching players:", error);
        return res.status(500).json({ message: "Failed to fetch players" });
    }
});
// ====== Tournaments ======
router.get("/tournaments", async (_req, res) => {
    try {
        const tournaments = await prisma_1.prisma.tournament.findMany({
            orderBy: { startDate: "desc" },
            include: {
                matches: {
                    include: {
                        playerA: true,
                        playerB: true,
                        winner: true,
                    },
                },
                participations: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        return res.json(tournaments);
    }
    catch (error) {
        console.error("Error fetching tournaments:", error);
        captureRouteException(error, "admin:tournaments:list");
        return res.status(500).json({ message: "Failed to fetch tournaments" });
    }
});
const dateSchema = zod_1.z
    .coerce
    .date()
    .refine((value) => !Number.isNaN(value.getTime()), { message: "Invalid date" });
const createTournamentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    location: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    startDate: dateSchema,
    endDate: dateSchema.optional(),
});
router.post("/tournaments", async (req, res) => {
    const parsed = createTournamentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid payload",
            issues: parsed.error.flatten().fieldErrors
        });
    }
    try {
        const tournament = await prisma_1.prisma.tournament.create({
            data: {
                name: parsed.data.name,
                location: parsed.data.location ?? null,
                description: parsed.data.description ?? null,
                startDate: new Date(parsed.data.startDate),
                endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
                status: "UPCOMING",
            },
            include: {
                matches: {
                    include: {
                        playerA: true,
                        playerB: true,
                        winner: true,
                    },
                },
                participations: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        return res.status(201).json(tournament);
    }
    catch (error) {
        console.error("Error creating tournament:", error);
        captureRouteException(error, "admin:tournaments:create", {
            payload: parsed.data,
        });
        return res.status(500).json({ message: "Failed to create tournament" });
    }
});
const updateTournamentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    location: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    status: zod_1.z.enum(["UPCOMING", "ACTIVE", "COMPLETED"]).optional(),
});
router.patch("/tournaments/:tournamentId", async (req, res) => {
    const { tournamentId } = req.params;
    const parsed = updateTournamentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid payload",
            issues: parsed.error.flatten().fieldErrors
        });
    }
    try {
        const tournament = await prisma_1.prisma.tournament.update({
            where: { id: tournamentId },
            data: {
                ...(parsed.data.name && { name: parsed.data.name }),
                ...(parsed.data.location !== undefined && { location: parsed.data.location }),
                ...(parsed.data.description !== undefined && { description: parsed.data.description }),
                ...(parsed.data.startDate && { startDate: new Date(parsed.data.startDate) }),
                ...(parsed.data.endDate && { endDate: new Date(parsed.data.endDate) }),
                ...(parsed.data.status && { status: parsed.data.status }),
            },
            include: {
                matches: {
                    include: {
                        playerA: true,
                        playerB: true,
                        winner: true,
                    },
                },
                participations: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        return res.json(tournament);
    }
    catch (error) {
        console.error("Error updating tournament:", error);
        captureRouteException(error, "admin:tournaments:update", {
            tournamentId,
            payload: parsed.data,
        });
        return res.status(500).json({ message: "Failed to update tournament" });
    }
});
// ====== Tournament Players ======
const addPlayerSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    seed: zod_1.z.number().optional(),
});
router.post("/tournaments/:tournamentId/players", async (req, res) => {
    const { tournamentId } = req.params;
    const parsed = addPlayerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid payload",
            issues: parsed.error.flatten().fieldErrors
        });
    }
    try {
        await prisma_1.prisma.participation.create({
            data: {
                userId: parsed.data.userId,
                tournamentId,
                seed: parsed.data.seed ?? null,
            },
        });
        return res.status(201).json({ message: "Player added to tournament" });
    }
    catch (error) {
        console.error("Error adding player to tournament:", error);
        captureRouteException(error, "admin:tournaments:players:add", {
            tournamentId,
            payload: parsed.data,
        });
        return res.status(500).json({ message: "Failed to add player to tournament" });
    }
});
router.delete("/tournaments/:tournamentId/players/:userId", async (req, res) => {
    const { tournamentId, userId } = req.params;
    try {
        await prisma_1.prisma.participation.deleteMany({
            where: {
                tournamentId,
                userId,
            },
        });
        return res.json({ message: "Player removed from tournament" });
    }
    catch (error) {
        console.error("Error removing player from tournament:", error);
        captureRouteException(error, "admin:tournaments:players:remove", {
            tournamentId,
            userId,
        });
        return res.status(500).json({ message: "Failed to remove player from tournament" });
    }
});
// ====== Matches ======
const createMatchSchema = zod_1.z.object({
    tournamentId: zod_1.z.string().uuid(),
    playerAId: zod_1.z.string().uuid(),
    playerBId: zod_1.z.string().uuid(),
    scheduledAt: dateSchema.optional(),
    tableNumber: zod_1.z.number().optional(),
});
router.post("/matches", async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid payload",
            issues: parsed.error.flatten().fieldErrors
        });
    }
    try {
        const match = await (0, matchService_1.createMatch)({
            tournamentId: parsed.data.tournamentId,
            playerAId: parsed.data.playerAId,
            playerBId: parsed.data.playerBId,
            scheduledAt: parsed.data.scheduledAt?.toISOString() ?? null,
            tableNumber: parsed.data.tableNumber,
        });
        return res.status(201).json(match);
    }
    catch (error) {
        console.error("Error creating match:", error);
        return res.status(500).json({ message: "Failed to create match" });
    }
});
const updateMatchSchema = zod_1.z.object({
    winnerId: zod_1.z.string().uuid().nullable().optional(),
    scheduledAt: dateSchema.nullable().optional(),
    tableNumber: zod_1.z.number().nullable().optional(),
    completedAt: dateSchema.nullable().optional(),
});
router.patch("/matches/:matchId", async (req, res) => {
    const { matchId } = req.params;
    const parsed = updateMatchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid payload",
            issues: parsed.error.flatten().fieldErrors
        });
    }
    try {
        const match = await (0, matchService_1.updateMatch)(matchId, {
            ...parsed.data,
            scheduledAt: parsed.data.scheduledAt?.toISOString() ?? null,
            completedAt: parsed.data.completedAt?.toISOString() ?? null,
        });
        return res.json(match);
    }
    catch (error) {
        console.error("Error updating match:", error);
        return res.status(500).json({ message: "Failed to update match" });
    }
});
router.delete("/matches/:matchId", async (req, res) => {
    const { matchId } = req.params;
    try {
        await prisma_1.prisma.match.delete({
            where: { id: matchId },
        });
        return res.json({ message: "Match deleted" });
    }
    catch (error) {
        console.error("Error deleting match:", error);
        return res.status(500).json({ message: "Failed to delete match" });
    }
});
// ====== Users ======
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    displayName: zod_1.z.string().min(1),
});
router.post("/users", async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid payload",
            issues: parsed.error.flatten().fieldErrors
        });
    }
    try {
        // Generate a placeholder googleId for manually created users
        const user = await prisma_1.prisma.user.create({
            data: {
                email: parsed.data.email,
                displayName: parsed.data.displayName,
                googleId: `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            },
        });
        return res.status(201).json(user);
    }
    catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Failed to create user" });
    }
});
exports.adminRoutes = router;
//# sourceMappingURL=adminRoutes.js.map