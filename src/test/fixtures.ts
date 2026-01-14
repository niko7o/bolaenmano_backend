import { prisma } from "../lib/prisma";
import type { User, Tournament, Participation } from "@prisma/client";

/**
 * Test fixtures for creating test data
 */

export async function createUser(overrides?: Partial<User>): Promise<User> {
  const randomId = Math.random().toString(36).substring(7);
  return prisma.user.create({
    data: {
      email: overrides?.email || `test${randomId}@example.com`,
      googleId: overrides?.googleId || `google${randomId}`,
      displayName: overrides?.displayName || `Test User ${randomId}`,
      avatarUrl: overrides?.avatarUrl || null,
      expoPushToken: overrides?.expoPushToken || null,
      winstreak: overrides?.winstreak || 0,
      currentLossStreak: overrides?.currentLossStreak || 0,
    },
  });
}

export async function createUsers(count: number): Promise<User[]> {
  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    users.push(await createUser({ displayName: `Player ${i + 1}` }));
  }
  return users;
}

export async function createTournament(
  overrides?: Partial<Tournament>
): Promise<Tournament> {
  const randomId = Math.random().toString(36).substring(7);
  return prisma.tournament.create({
    data: {
      name: overrides?.name || `Test Tournament ${randomId}`,
      location: overrides?.location || "Test Location",
      description: overrides?.description || "Test Description",
      startDate: overrides?.startDate || new Date(),
      endDate: overrides?.endDate || null,
      status: overrides?.status || "UPCOMING",
    },
  });
}

export async function createParticipation(
  tournamentId: string,
  userId: string,
  overrides?: Partial<Participation>
): Promise<Participation> {
  return prisma.participation.create({
    data: {
      tournamentId,
      userId,
      seed: overrides?.seed || null,
      wins: overrides?.wins || 0,
      losses: overrides?.losses || 0,
    },
  });
}

export async function createTournamentWithParticipants(
  participantCount: number,
  tournamentOverrides?: Partial<Tournament>
): Promise<{
  tournament: Tournament;
  users: User[];
  participations: Participation[];
}> {
  const tournament = await createTournament(tournamentOverrides);
  const users = await createUsers(participantCount);
  const participations: Participation[] = [];

  for (const user of users) {
    const participation = await createParticipation(tournament.id, user.id);
    participations.push(participation);
  }

  return { tournament, users, participations };
}
