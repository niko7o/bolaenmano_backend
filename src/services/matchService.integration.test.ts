import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { prisma } from "../lib/prisma";
import { generateBracket } from "./bracketService";
import { updateMatch } from "./matchService";

/**
 * Integration Tests for Match Service
 * These tests use a real database connection and test the full flow
 * of match completion triggering bracket advancement.
 */

describe("Match Service Integration Tests", () => {
  // Helper to create test users
  const createTestUser = async (email: string, displayName: string) => {
    return await prisma.user.create({
      data: {
        email,
        googleId: `google-${email}`,
        displayName,
      },
    });
  };

  // Helper to create test tournament
  const createTestTournament = async (name: string) => {
    return await prisma.tournament.create({
      data: {
        name,
        startDate: new Date(),
        status: "IN_PROGRESS",
      },
    });
  };

  // Helper to add participants to tournament
  const addParticipants = async (tournamentId: string, userIds: string[]) => {
    for (const userId of userIds) {
      await prisma.participation.create({
        data: {
          tournamentId,
          userId,
        },
      });
    }
  };

  // Cleanup helper
  const cleanup = async () => {
    await prisma.match.deleteMany({});
    await prisma.participation.deleteMany({});
    await prisma.tournament.deleteMany({});
    await prisma.user.deleteMany({});
  };

  beforeAll(async () => {
    // Ensure clean state before all tests
    await cleanup();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanup();
  });

  describe("Bracket Advancement", () => {
    it("should advance bracket when all first round matches are completed", async () => {
      // Create 4 test users
      const user1 = await createTestUser(
        "player1@integration.test",
        "Player 1"
      );
      const user2 = await createTestUser(
        "player2@integration.test",
        "Player 2"
      );
      const user3 = await createTestUser(
        "player3@integration.test",
        "Player 3"
      );
      const user4 = await createTestUser(
        "player4@integration.test",
        "Player 4"
      );

      // Create tournament
      const tournament = await createTestTournament(
        "Integration Test Tournament"
      );

      // Add participants
      await addParticipants(tournament.id, [
        user1.id,
        user2.id,
        user3.id,
        user4.id,
      ]);

      // Generate bracket - should create 2 first-round matches
      const bracket = await generateBracket(tournament.id);
      expect(bracket.matches).toHaveLength(2);
      expect(bracket.numRounds).toBe(2); // 4 players = 2 rounds

      // Get the first round matches
      const firstRoundMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          roundNumber: 1,
        },
        orderBy: { createdAt: "asc" },
      });

      expect(firstRoundMatches).toHaveLength(2);

      // Complete first match
      const match1Winner = firstRoundMatches[0].playerAId;
      await updateMatch(firstRoundMatches[0].id, {
        winnerId: match1Winner,
        completedAt: new Date().toISOString(),
      });

      // Check that second round hasn't been created yet
      let secondRoundMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          roundNumber: 2,
        },
      });
      expect(secondRoundMatches).toHaveLength(0);

      // Complete second match
      const match2Winner = firstRoundMatches[1].playerAId;
      await updateMatch(firstRoundMatches[1].id, {
        winnerId: match2Winner,
        completedAt: new Date().toISOString(),
      });

      // Now second round should be created
      secondRoundMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          roundNumber: 2,
        },
      });
      expect(secondRoundMatches).toHaveLength(1);

      // Verify the winners advanced to the final
      const finalMatch = secondRoundMatches[0];
      expect(finalMatch.playerAId).toBe(match1Winner);
      expect(finalMatch.playerBId).toBe(match2Winner);

      // Verify participation stats were updated
      const participant1 = await prisma.participation.findFirst({
        where: {
          tournamentId: tournament.id,
          userId: match1Winner,
        },
      });
      expect(participant1?.wins).toBe(1);
      expect(participant1?.losses).toBe(0);

      const loser1 = firstRoundMatches[0].playerBId;
      const participantLoser1 = await prisma.participation.findFirst({
        where: {
          tournamentId: tournament.id,
          userId: loser1,
        },
      });
      expect(participantLoser1?.wins).toBe(0);
      expect(participantLoser1?.losses).toBe(1);
    });

    it("should not create next round until all matches are complete", async () => {
      // Create 4 test users
      const user1 = await createTestUser("p1@partial.test", "P1");
      const user2 = await createTestUser("p2@partial.test", "P2");
      const user3 = await createTestUser("p3@partial.test", "P3");
      const user4 = await createTestUser("p4@partial.test", "P4");

      // Create tournament
      const tournament = await createTestTournament("Partial Completion Test");

      // Add participants
      await addParticipants(tournament.id, [
        user1.id,
        user2.id,
        user3.id,
        user4.id,
      ]);

      // Generate bracket
      await generateBracket(tournament.id);

      // Get first round matches
      const firstRoundMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          roundNumber: 1,
        },
        orderBy: { createdAt: "asc" },
      });

      // Complete only the first match
      await updateMatch(firstRoundMatches[0].id, {
        winnerId: firstRoundMatches[0].playerAId,
        completedAt: new Date().toISOString(),
      });

      // Verify second round was NOT created
      const secondRoundMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          roundNumber: 2,
        },
      });
      expect(secondRoundMatches).toHaveLength(0);
    });
  });

  describe("Bye Match Handling", () => {
    it("should handle bye matches correctly without updating stats", async () => {
      // Create 3 test users (odd number for bye)
      const user1 = await createTestUser("player1@bye.test", "Player 1");
      const user2 = await createTestUser("player2@bye.test", "Player 2");
      const user3 = await createTestUser("player3@bye.test", "Player 3");

      // Create tournament
      const tournament = await createTestTournament("Bye Test Tournament");

      // Add participants
      await addParticipants(tournament.id, [user1.id, user2.id, user3.id]);

      // Generate bracket - should create 1 regular match and 1 bye match
      const bracket = await generateBracket(tournament.id);
      expect(bracket.matches).toHaveLength(2);
      expect(bracket.numByes).toBe(1);

      // Find the bye match (where playerA === playerB)
      const byeMatch = bracket.matches.find(
        (m) => m.playerAId === m.playerBId
      );
      expect(byeMatch).toBeDefined();
      expect(byeMatch?.winnerId).toBe(byeMatch?.playerAId);
      expect(byeMatch?.completedAt).toBeTruthy();

      // Find the regular match
      const regularMatch = bracket.matches.find(
        (m) => m.playerAId !== m.playerBId
      );
      expect(regularMatch).toBeDefined();

      // Get participation for the bye player
      const byePlayerId = byeMatch!.playerAId;
      const byeParticipation = await prisma.participation.findFirst({
        where: {
          tournamentId: tournament.id,
          userId: byePlayerId,
        },
      });

      // Bye match should not have updated stats (wins/losses should be 0)
      expect(byeParticipation?.wins).toBe(0);
      expect(byeParticipation?.losses).toBe(0);

      // Complete the regular match
      const regularWinner = regularMatch!.playerAId;
      await updateMatch(regularMatch!.id, {
        winnerId: regularWinner,
        completedAt: new Date().toISOString(),
      });

      // Verify regular match updated stats
      const regularWinnerParticipation = await prisma.participation.findFirst({
        where: {
          tournamentId: tournament.id,
          userId: regularWinner,
        },
      });
      expect(regularWinnerParticipation?.wins).toBe(1);

      // Verify second round was created with bye player and regular match winner
      const secondRoundMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          roundNumber: 2,
        },
      });
      expect(secondRoundMatches).toHaveLength(1);

      const finalMatch = secondRoundMatches[0];
      const finalPlayers = [finalMatch.playerAId, finalMatch.playerBId];
      expect(finalPlayers).toContain(byePlayerId);
      expect(finalPlayers).toContain(regularWinner);
    });

    it("should still advance bye player even with no stat changes", async () => {
      // Create 3 users
      const user1 = await createTestUser("u1@bye2.test", "U1");
      const user2 = await createTestUser("u2@bye2.test", "U2");
      const user3 = await createTestUser("u3@bye2.test", "U3");

      // Create tournament
      const tournament = await createTestTournament("Bye Advancement Test");

      // Add participants
      await addParticipants(tournament.id, [user1.id, user2.id, user3.id]);

      // Generate bracket
      const bracket = await generateBracket(tournament.id);

      // Find bye and regular matches
      const byeMatch = bracket.matches.find((m) => m.playerAId === m.playerBId);
      const regularMatch = bracket.matches.find(
        (m) => m.playerAId !== m.playerBId
      );

      // Verify bye match is already complete
      expect(byeMatch?.completedAt).not.toBeNull();
      expect(byeMatch?.winnerId).toBe(byeMatch?.playerAId);

      // Complete regular match to trigger advancement
      await updateMatch(regularMatch!.id, {
        winnerId: regularMatch!.playerAId,
        completedAt: new Date().toISOString(),
      });

      // Verify round 2 was created with both winners
      const round2Matches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          roundNumber: 2,
        },
      });

      expect(round2Matches).toHaveLength(1);
      expect([round2Matches[0].playerAId, round2Matches[0].playerBId]).toContain(
        byeMatch!.winnerId
      );
      expect([round2Matches[0].playerAId, round2Matches[0].playerBId]).toContain(
        regularMatch!.playerAId
      );
    });
  });

  describe("Tournament Completion", () => {
    it("should not create additional rounds after final match is completed", async () => {
      // Create 2 users for a simple final match
      const user1 = await createTestUser("finalist1@test.com", "Finalist 1");
      const user2 = await createTestUser("finalist2@test.com", "Finalist 2");

      // Create tournament
      const tournament = await createTestTournament("Final Match Test");

      // Add participants
      await addParticipants(tournament.id, [user1.id, user2.id]);

      // Generate bracket - should create 1 match (the final)
      const bracket = await generateBracket(tournament.id);
      expect(bracket.matches).toHaveLength(1);
      expect(bracket.numRounds).toBe(1);

      // Complete the final match
      const finalMatch = bracket.matches[0];
      await updateMatch(finalMatch.id, {
        winnerId: finalMatch.playerAId,
        completedAt: new Date().toISOString(),
      });

      // Verify no additional rounds were created
      const allMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
        },
      });
      expect(allMatches).toHaveLength(1);

      // Verify the winner was set correctly
      const completedMatch = await prisma.match.findUnique({
        where: { id: finalMatch.id },
      });
      expect(completedMatch?.winnerId).toBe(finalMatch.playerAId);
      expect(completedMatch?.completedAt).not.toBeNull();
    });
  });
});
