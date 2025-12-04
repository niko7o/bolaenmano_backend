"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTournamentById = exports.getTournamentHistory = exports.getCurrentTournament = void 0;
const prisma_1 = require("../lib/prisma");
const getCurrentTournament = () => prisma_1.prisma.tournament.findFirst({
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
exports.getCurrentTournament = getCurrentTournament;
const getTournamentHistory = () => prisma_1.prisma.tournament.findMany({
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
exports.getTournamentHistory = getTournamentHistory;
const getTournamentById = (tournamentId) => prisma_1.prisma.tournament.findUnique({
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
exports.getTournamentById = getTournamentById;
//# sourceMappingURL=tournamentService.js.map