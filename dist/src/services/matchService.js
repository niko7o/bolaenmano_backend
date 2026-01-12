"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMatch = exports.createMatch = exports.getMatchById = exports.listMatches = void 0;
const prisma_1 = require("../lib/prisma");
const bracketService_1 = require("./bracketService");
const matchInclude = {
    playerA: true,
    playerB: true,
    winner: true,
};
const toDate = (value) => {
    if (!value) {
        return null;
    }
    return new Date(value);
};
const listMatches = ({ tournamentId, scope = "all" }) => {
    const where = {};
    if (tournamentId) {
        where.tournamentId = tournamentId;
    }
    if (scope === "upcoming") {
        where.completedAt = null;
    }
    if (scope === "completed") {
        where.completedAt = { not: null };
    }
    const orderBy = scope === "completed"
        ? [
            { completedAt: "desc" },
            { scheduledAt: "desc" },
            { createdAt: "desc" },
        ]
        : [
            { scheduledAt: "asc" },
            { createdAt: "asc" },
        ];
    return prisma_1.prisma.match.findMany({
        where,
        include: matchInclude,
        orderBy,
    });
};
exports.listMatches = listMatches;
const getMatchById = (matchId) => prisma_1.prisma.match.findUnique({
    where: { id: matchId },
    include: matchInclude,
});
exports.getMatchById = getMatchById;
const createMatch = (payload) => prisma_1.prisma.match.create({
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
exports.createMatch = createMatch;
const updateMatch = async (matchId, payload) => {
    const data = {};
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
    const updatedMatch = await prisma_1.prisma.match.update({
        where: { id: matchId },
        data,
        include: matchInclude,
    });
    // If a winner was set, try to advance the bracket
    if (payload.winnerId) {
        await (0, bracketService_1.advanceBracket)(updatedMatch.tournamentId);
    }
    return updatedMatch;
};
exports.updateMatch = updateMatch;
//# sourceMappingURL=matchService.js.map