import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { createMatch, updateMatch } from "../services/matchService";
import { isAdminEmail } from "../lib/admin";

const router = Router();

// All admin routes require authentication + admin status
router.use(requireAuth, requireAdmin);

// ====== Players ======

router.get("/players", async (_req, res) => {
  try {
    const players = await prisma.user.findMany({
      orderBy: { displayName: "asc" },
    });

    // Add isAdmin flag to each player
    const playersWithAdmin = players.map((player) => ({
      ...player,
      isAdmin: isAdminEmail(player.email),
    }));

    return res.json(playersWithAdmin);
  } catch (error) {
    console.error("Error fetching players:", error);
    return res.status(500).json({ message: "Failed to fetch players" });
  }
});

// ====== Tournaments ======

router.get("/tournaments", async (_req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
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
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return res.status(500).json({ message: "Failed to fetch tournaments" });
  }
});

const createTournamentSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
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
    const tournament = await prisma.tournament.create({
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
  } catch (error) {
    console.error("Error creating tournament:", error);
    return res.status(500).json({ message: "Failed to create tournament" });
  }
});

const updateTournamentSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED"]).optional(),
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
    const tournament = await prisma.tournament.update({
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
  } catch (error) {
    console.error("Error updating tournament:", error);
    return res.status(500).json({ message: "Failed to update tournament" });
  }
});

// ====== Tournament Players ======

const addPlayerSchema = z.object({
  userId: z.string().uuid(),
  seed: z.number().optional(),
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
    await prisma.participation.create({
      data: {
        userId: parsed.data.userId,
        tournamentId,
        seed: parsed.data.seed ?? null,
      },
    });

    return res.status(201).json({ message: "Player added to tournament" });
  } catch (error) {
    console.error("Error adding player to tournament:", error);
    return res.status(500).json({ message: "Failed to add player to tournament" });
  }
});

router.delete("/tournaments/:tournamentId/players/:userId", async (req, res) => {
  const { tournamentId, userId } = req.params;

  try {
    await prisma.participation.deleteMany({
      where: {
        tournamentId,
        userId,
      },
    });

    return res.json({ message: "Player removed from tournament" });
  } catch (error) {
    console.error("Error removing player from tournament:", error);
    return res.status(500).json({ message: "Failed to remove player from tournament" });
  }
});

// ====== Matches ======

const createMatchSchema = z.object({
  tournamentId: z.string().uuid(),
  playerAId: z.string().uuid(),
  playerBId: z.string().uuid(),
  scheduledAt: z.string().optional(),
  tableNumber: z.number().optional(),
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
    const match = await createMatch({
      tournamentId: parsed.data.tournamentId,
      playerAId: parsed.data.playerAId,
      playerBId: parsed.data.playerBId,
      scheduledAt: parsed.data.scheduledAt,
      tableNumber: parsed.data.tableNumber,
    });

    return res.status(201).json(match);
  } catch (error) {
    console.error("Error creating match:", error);
    return res.status(500).json({ message: "Failed to create match" });
  }
});

const updateMatchSchema = z.object({
  winnerId: z.string().uuid().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  tableNumber: z.number().nullable().optional(),
  completedAt: z.string().nullable().optional(),
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
    const match = await updateMatch(matchId, parsed.data);
    return res.json(match);
  } catch (error) {
    console.error("Error updating match:", error);
    return res.status(500).json({ message: "Failed to update match" });
  }
});

router.delete("/matches/:matchId", async (req, res) => {
  const { matchId } = req.params;

  try {
    await prisma.match.delete({
      where: { id: matchId },
    });

    return res.json({ message: "Match deleted" });
  } catch (error) {
    console.error("Error deleting match:", error);
    return res.status(500).json({ message: "Failed to delete match" });
  }
});

// ====== Users ======

const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
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
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        googleId: `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Failed to create user" });
  }
});

export const adminRoutes = router;

