"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.getUserProfile = exports.upsertGoogleUser = void 0;
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
//# sourceMappingURL=userService.js.map