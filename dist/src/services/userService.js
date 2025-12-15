"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveExpoPushToken = exports.getUserProfileWithMatches = exports.getUserById = exports.getUserProfile = exports.upsertGoogleUser = void 0;
const prisma_1 = require("../lib/prisma");
const upsertGoogleUser = async (payload) => {
    const user = await prisma_1.prisma.user.upsert({
        where: { googleId: payload.googleId },
        create: {
            googleId: payload.googleId,
            email: payload.email,
            displayName: payload.displayName,
            avatarUrl: payload.avatarUrl ?? null,
        },
        update: {
            email: payload.email,
            displayName: payload.displayName,
            avatarUrl: payload.avatarUrl ?? null,
        },
    });
    return user;
};
exports.upsertGoogleUser = upsertGoogleUser;
const getUserProfile = async (userId) => prisma_1.prisma.user.findUnique({
    where: { id: userId },
    include: {
        participations: {
            include: {
                tournament: true,
            },
        },
    },
});
exports.getUserProfile = getUserProfile;
const getUserById = (userId) => prisma_1.prisma.user.findUnique({
    where: { id: userId },
});
exports.getUserById = getUserById;
const matchHistoryInclude = {
    playerA: true,
    playerB: true,
    winner: true,
    tournament: true,
};
const getUserProfileWithMatches = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            participations: {
                include: {
                    tournament: true,
                },
            },
        },
    });
    if (!user) {
        return null;
    }
    const matches = await prisma_1.prisma.match.findMany({
        where: {
            completedAt: { not: null },
            OR: [{ playerAId: userId }, { playerBId: userId }],
        },
        include: matchHistoryInclude,
        orderBy: [
            { completedAt: "desc" },
            { scheduledAt: "desc" },
            { createdAt: "desc" },
        ],
    });
    return { ...user, matches };
};
exports.getUserProfileWithMatches = getUserProfileWithMatches;
const saveExpoPushToken = async (userId, expoPushToken) => {
    // Ensure token is unique across users
    await prisma_1.prisma.user.updateMany({
        where: { expoPushToken },
        data: { expoPushToken: null },
    });
    return prisma_1.prisma.user.update({
        where: { id: userId },
        data: { expoPushToken },
    });
};
exports.saveExpoPushToken = saveExpoPushToken;
//# sourceMappingURL=userService.js.map