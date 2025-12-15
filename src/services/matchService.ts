import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

type MatchScope = "upcoming" | "completed" | "all";

type ListMatchesFilters = {
  tournamentId?: string;
  scope?: MatchScope;
};

export type CreateMatchPayload = {
  tournamentId: string;
  playerAId: string;
  playerBId: string;
  tableNumber?: number | null;
  scheduledAt?: string | null;
};

export type UpdateMatchPayload = {
  playerAId?: string;
  playerBId?: string;
  tableNumber?: number | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  winnerId?: string | null;
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
    },
    include: matchInclude,
  });

export const updateMatch = (matchId: string, payload: UpdateMatchPayload) => {
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

  return prisma.match.update({
    where: { id: matchId },
    data,
    include: matchInclude,
  });
};


