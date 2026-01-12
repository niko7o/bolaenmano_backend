import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { advanceBracket } from "./bracketService";

type MatchScope = "upcoming" | "completed" | "all";

type ListMatchesFilters = {
  tournamentId?: string;
  scope?: MatchScope;
};

export type CreateMatchPayload = {
  tournamentId: string;
  playerAId: string;
  playerBId: string;
  tableNumber?: number | null | undefined;
  scheduledAt?: string | null | undefined;
  roundNumber?: number;
};

export type UpdateMatchPayload = {
  playerAId?: string;
  playerBId?: string;
  tableNumber?: number | null | undefined;
  scheduledAt?: string | null | undefined;
  completedAt?: string | null | undefined;
  winnerId?: string | null | undefined;
};

const matchInclude = {
  playerA: true,
  playerB: true,
  winner: true,
};

const toDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  return new Date(value);
};

export const listMatches = ({ tournamentId, scope = "all" }: ListMatchesFilters) => {
  const where: Prisma.MatchWhereInput = {};

  if (tournamentId) {
    where.tournamentId = tournamentId;
  }

  if (scope === "upcoming") {
    where.completedAt = null;
  }

  if (scope === "completed") {
    where.completedAt = { not: null };
  }

  const orderBy: Prisma.MatchOrderByWithRelationInput[] =
    scope === "completed"
      ? [
          { completedAt: "desc" as const },
          { scheduledAt: "desc" as const },
          { createdAt: "desc" as const },
        ]
      : [
          { scheduledAt: "asc" as const },
          { createdAt: "asc" as const },
        ];

  return prisma.match.findMany({
    where,
    include: matchInclude,
    orderBy,
  });
};

export const getMatchById = (matchId: string) =>
  prisma.match.findUnique({
    where: { id: matchId },
    include: matchInclude,
  });

export const createMatch = (payload: CreateMatchPayload) =>
  prisma.match.create({
    data: {
      tournamentId: payload.tournamentId,
      playerAId: payload.playerAId,
      playerBId: payload.playerBId,
      tableNumber: payload.tableNumber ?? null,
      scheduledAt: toDate(payload.scheduledAt),
      roundNumber: payload.roundNumber ?? 1,
    },
    include: matchInclude,
  });

export const updateMatch = async (matchId: string, payload: UpdateMatchPayload) => {
  const data: Prisma.MatchUpdateInput = {};

  if (payload.playerAId) {
    data.playerA = {
      connect: { id: payload.playerAId },
    };
  }

  if (payload.playerBId) {
    data.playerB = {
      connect: { id: payload.playerBId },
    };
  }

  if (payload.tableNumber !== undefined) {
    data.tableNumber = payload.tableNumber;
  }

  if (payload.scheduledAt !== undefined) {
    data.scheduledAt = toDate(payload.scheduledAt);
    data.reminderSentAt = null;
  }

  if (payload.completedAt !== undefined) {
    data.completedAt = toDate(payload.completedAt);
  }

  if (payload.winnerId !== undefined) {
    data.winner = payload.winnerId
      ? {
          connect: { id: payload.winnerId },
        }
      : {
          disconnect: true,
        };
  }

  const updatedMatch = await prisma.match.update({
    where: { id: matchId },
    data,
    include: matchInclude,
  });

  // If a winner was set, update participation stats and advance bracket
  if (payload.winnerId) {
    // Skip stats update for bye matches (where playerA and playerB are the same)
    const isByeMatch = updatedMatch.playerAId === updatedMatch.playerBId;
    
    if (!isByeMatch) {
      const loserId = updatedMatch.playerAId === payload.winnerId 
        ? updatedMatch.playerBId 
        : updatedMatch.playerAId;
      
      // Increment winner's wins
      await prisma.participation.updateMany({
        where: { 
          tournamentId: updatedMatch.tournamentId, 
          userId: payload.winnerId 
        },
        data: { wins: { increment: 1 } }
      });
      
      // Increment loser's losses
      await prisma.participation.updateMany({
        where: { 
          tournamentId: updatedMatch.tournamentId, 
          userId: loserId 
        },
        data: { losses: { increment: 1 } }
      });
    }

    // Try to advance the bracket
    await advanceBracket(updatedMatch.tournamentId);
  }

  return updatedMatch;
};


