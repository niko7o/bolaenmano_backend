import { Router } from "express";
import { z } from "zod";
import { getCurrentTournament, getTournamentById, getTournamentHistory } from "../services/tournamentService";
import { getBracketData } from "../services/bracketService";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/current", async (_req, res) => {
  try {
    console.log("[/tournaments/current] Fetching current tournament...");
    const tournament = await getCurrentTournament();
    console.log("[/tournaments/current] Success:", tournament ? `Found tournament ID: ${tournament.id}` : "No current tournament");
    return res.json(tournament);
  } catch (error) {
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
    const history = await getTournamentHistory();
    console.log("[/tournaments/history] Success: Found", history.length, "tournaments");
    return res.json(history);
  } catch (error) {
    console.error("[/tournaments/history] Error:", error);
    console.error("[/tournaments/history] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return res.status(500).json({ 
      message: "Failed to fetch tournament history", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

const paramsSchema = z.object({
  tournamentId: z.string().uuid(),
});

router.get("/:tournamentId", async (req, res) => {
  try {
    const parsed = paramsSchema.safeParse(req.params);

    if (!parsed.success) {
      console.log("[/tournaments/:id] Invalid tournament ID:", req.params.tournamentId);
      return res.status(400).json({ message: "Invalid tournament id" });
    }

    console.log("[/tournaments/:id] Fetching tournament:", parsed.data.tournamentId);
    const tournament = await getTournamentById(parsed.data.tournamentId);

    if (!tournament) {
      console.log("[/tournaments/:id] Tournament not found:", parsed.data.tournamentId);
      return res.status(404).json({ message: "Tournament not found" });
    }

    console.log("[/tournaments/:id] Success: Found tournament:", tournament.id);
    return res.json(tournament);
  } catch (error) {
    console.error("[/tournaments/:id] Error:", error);
    console.error("[/tournaments/:id] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return res.status(500).json({ 
      message: "Failed to fetch tournament", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

router.get("/:tournamentId/bracket", async (req, res) => {
  try {
    const parsed = paramsSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid tournament id" });
    }

    const bracket = await getBracketData(parsed.data.tournamentId);
    return res.json(bracket);
  } catch (error) {
    console.error("[/tournaments/:id/bracket] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch bracket";
    return res.status(500).json({ 
      message, 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Join a tournament (authenticated)
router.post("/:tournamentId/join", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const parsed = paramsSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid tournament id" });
    }

    const { tournamentId } = parsed.data;
    const userId = req.userId!;

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Only allow joining UPCOMING tournaments
    if (tournament.status !== "UPCOMING") {
      return res.status(400).json({ 
        message: "Can only join upcoming tournaments" 
      });
    }

    // Check if already participating
    const existingParticipation = await prisma.participation.findFirst({
      where: {
        tournamentId,
        userId,
      },
    });

    if (existingParticipation) {
      return res.status(400).json({ 
        message: "Already participating in this tournament" 
      });
    }

    // Create participation
    const participation = await prisma.participation.create({
      data: {
        tournamentId,
        userId,
        wins: 0,
        losses: 0,
      },
      include: {
        user: true,
        tournament: true,
      },
    });

    console.log(`[/tournaments/${tournamentId}/join] User ${userId} joined tournament`);
    return res.status(201).json(participation);
  } catch (error) {
    console.error("[/tournaments/:id/join] Error:", error);
    return res.status(500).json({ 
      message: "Failed to join tournament",
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Leave a tournament (authenticated)
router.delete("/:tournamentId/leave", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const parsed = paramsSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid tournament id" });
    }

    const { tournamentId } = parsed.data;
    const userId = req.userId!;

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Only allow leaving UPCOMING tournaments
    if (tournament.status !== "UPCOMING") {
      return res.status(400).json({ 
        message: "Can only leave upcoming tournaments" 
      });
    }

    // Check if participating
    const existingParticipation = await prisma.participation.findFirst({
      where: {
        tournamentId,
        userId,
      },
    });

    if (!existingParticipation) {
      return res.status(400).json({ 
        message: "Not participating in this tournament" 
      });
    }

    // Delete participation
    await prisma.participation.delete({
      where: {
        id: existingParticipation.id,
      },
    });

    console.log(`[/tournaments/${tournamentId}/leave] User ${userId} left tournament`);
    return res.status(200).json({ message: "Successfully left tournament" });
  } catch (error) {
    console.error("[/tournaments/:id/leave] Error:", error);
    return res.status(500).json({ 
      message: "Failed to leave tournament",
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

export const tournamentRoutes = router;

