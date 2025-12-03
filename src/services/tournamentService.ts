import { prisma } from "../lib/prisma";

export const getCurrentTournament = () =>
  prisma.tournament.findFirst({
    where: {
      status: {
        in: ["ACTIVE", "UPCOMING"],
      },
    },
    orderBy: {
      startDate: "asc",
    },
    include: {
      matches: {
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
        orderBy: {
          scheduledAt: "asc",
        },
      },
      participations: {
        include: {
          user: true,
        },
        orderBy: {
          seed: "asc",
        },
      },
    },
  });

export const getTournamentHistory = () =>
  prisma.tournament.findMany({
    where: {
      status: "COMPLETED",
    },
    orderBy: {
      endDate: "desc",
    },
    include: {
      participations: {
        include: {
          user: true,
        },
        orderBy: {
          wins: "desc",
        },
      },
    },
  });

export const getTournamentById = (tournamentId: string) =>
  prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      matches: {
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
        orderBy: {
          scheduledAt: "asc",
        },
      },
      participations: {
        include: {
          user: true,
        },
        orderBy: [
          { wins: "desc" },
          { losses: "asc" },
        ],
      },
    },
  });

