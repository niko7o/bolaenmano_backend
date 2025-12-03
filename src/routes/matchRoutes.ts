import { Router } from "express";
import { z } from "zod";
import { AuthedRequest, requireAdmin, requireAuth } from "../middleware/auth";
import {
  createMatch,
  CreateMatchPayload,
  getMatchById,
  listMatches,
  updateMatch,
  UpdateMatchPayload,
} from "../services/matchService";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

const listQuerySchema = z.object({
  tournamentId: z.string().uuid().optional(),
  scope: z.enum(["upcoming", "completed", "all"]).optional(),
});

router.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid filters", issues: parsed.error.flatten().fieldErrors });
  }

  const filters: { tournamentId?: string; scope?: "upcoming" | "completed" | "all" } = {};
  if (parsed.data.tournamentId !== undefined) {
    filters.tournamentId = parsed.data.tournamentId;
  }
  if (parsed.data.scope !== undefined) {
    filters.scope = parsed.data.scope;
  }

  const matches = await listMatches(filters);

  return res.json(matches);
});

const baseMatchSchema = z
  .object({
    tournamentId: z.string().uuid(),
    playerAId: z.string().uuid(),
    playerBId: z.string().uuid(),
    tableNumber: z.number().int().positive().optional().nullable(),
    scheduledAt: z.string().datetime().optional().nullable(),
  })
  .refine((data) => data.playerAId !== data.playerBId, {
    message: "Players must be different",
    path: ["playerBId"],
  });

router.post("/", async (_req: AuthedRequest, res) => {
  const parsed = baseMatchSchema.safeParse(_req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid payload", issues: parsed.error.flatten().fieldErrors });
  }

  try {
    const payload: CreateMatchPayload = {
      ...parsed.data,
      tableNumber: parsed.data.tableNumber ?? null,
      scheduledAt: parsed.data.scheduledAt ?? null,
    };
    const match = await createMatch(payload);

    return res.status(201).json(match);
  } catch (error) {
    console.error("Unable to create match", error);
    return res.status(500).json({ message: "Unable to create match" });
  }
});

const paramsSchema = z.object({
  matchId: z.string().uuid(),
});

const updateSchema = z
  .object({
    playerAId: z.string().uuid().optional(),
    playerBId: z.string().uuid().optional(),
    tableNumber: z.number().int().positive().optional().nullable(),
    scheduledAt: z.string().datetime().optional().nullable(),
    completedAt: z.string().datetime().optional().nullable(),
    winnerId: z.string().uuid().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.playerAId && data.playerBId) {
        return data.playerAId !== data.playerBId;
      }
      return true;
    },
    {
      message: "Players must be different",
      path: ["playerBId"],
    }
  );

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

  const existing = await getMatchById(paramResult.data.matchId);

  if (!existing) {
    return res.status(404).json({ message: "Match not found" });
  }

  const nextPlayerA = updateResult.data.playerAId ?? existing.playerAId;
  const nextPlayerB = updateResult.data.playerBId ?? existing.playerBId;

  if (nextPlayerA === nextPlayerB) {
    return res.status(400).json({ message: "Players must be different" });
  }

  let nextWinnerId: string | null | undefined = updateResult.data.winnerId;

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
    } else if (!nextWinnerId) {
      completedAt = null;
    }
  }

  const payload: UpdateMatchPayload = {};

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
    const updated = await updateMatch(existing.id, payload);
    return res.json(updated);
  } catch (error) {
    console.error("Unable to update match", error);
    return res.status(500).json({ message: "Unable to update match" });
  }
});

export const matchRoutes = router;


