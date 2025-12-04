"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const tournamentService_1 = require("../services/tournamentService");
const router = (0, express_1.Router)();
router.get("/current", async (_req, res) => {
    try {
        console.log("[/tournaments/current] Fetching current tournament...");
        const tournament = await (0, tournamentService_1.getCurrentTournament)();
        console.log("[/tournaments/current] Success:", tournament ? `Found tournament ID: ${tournament.id}` : "No current tournament");
        return res.json(tournament);
    }
    catch (error) {
        console.error("[/tournaments/current] Error:", error);
        console.error("[/tournaments/current] Error stack:", error instanceof Error ? error.stack : "No stack trace");
        return res.status(500).json({
            message: "Failed to fetch current tournament",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
router.get("/history", async (_req, res) => {
    try {
        console.log("[/tournaments/history] Fetching tournament history...");
        const history = await (0, tournamentService_1.getTournamentHistory)();
        console.log("[/tournaments/history] Success: Found", history.length, "tournaments");
        return res.json(history);
    }
    catch (error) {
        console.error("[/tournaments/history] Error:", error);
        console.error("[/tournaments/history] Error stack:", error instanceof Error ? error.stack : "No stack trace");
        return res.status(500).json({
            message: "Failed to fetch tournament history",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
const paramsSchema = zod_1.z.object({
    tournamentId: zod_1.z.string().uuid(),
});
router.get("/:tournamentId", async (req, res) => {
    try {
        const parsed = paramsSchema.safeParse(req.params);
        if (!parsed.success) {
            console.log("[/tournaments/:id] Invalid tournament ID:", req.params.tournamentId);
            return res.status(400).json({ message: "Invalid tournament id" });
        }
        console.log("[/tournaments/:id] Fetching tournament:", parsed.data.tournamentId);
        const tournament = await (0, tournamentService_1.getTournamentById)(parsed.data.tournamentId);
        if (!tournament) {
            console.log("[/tournaments/:id] Tournament not found:", parsed.data.tournamentId);
            return res.status(404).json({ message: "Tournament not found" });
        }
        console.log("[/tournaments/:id] Success: Found tournament:", tournament.id);
        return res.json(tournament);
    }
    catch (error) {
        console.error("[/tournaments/:id] Error:", error);
        console.error("[/tournaments/:id] Error stack:", error instanceof Error ? error.stack : "No stack trace");
        return res.status(500).json({
            message: "Failed to fetch tournament",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
exports.tournamentRoutes = router;
//# sourceMappingURL=tournamentRoutes.js.map