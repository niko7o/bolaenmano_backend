import { prisma } from "../lib/prisma";

type UpsertPayload = {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
};

export const upsertGoogleUser = async (payload: UpsertPayload) => {
  const user = await prisma.user.upsert({
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

export const getUserProfile = async (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    include: {
      participations: {
        include: {
          tournament: true,
        },
      },
    },
  });

export const getUserById = (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
  });

const matchHistoryInclude = {
  playerA: true,
  playerB: true,
  winner: true,
  tournament: true,
};

export const getUserProfileWithMatches = async (userId: string) => {
  const user = await prisma.user.findUnique({
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

  const matches = await prisma.match.findMany({
    where: {
      completedAt: { not: null },
      OR: [{ playerAId: userId }, { playerBId: userId }],
    },
    include: matchHistoryInclude,
    orderBy: [
      { completedAt: "desc" as const },
      { scheduledAt: "desc" as const },
      { createdAt: "desc" as const },
    ],
  });

  return { ...user, matches };
};

export const saveExpoPushToken = async (userId: string, expoPushToken: string) => {
  // Ensure token is unique across users
  await prisma.user.updateMany({
    where: { expoPushToken },
    data: { expoPushToken: null },
  });

  return prisma.user.update({
    where: { id: userId },
    data: { expoPushToken },
  });
};

