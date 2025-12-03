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

