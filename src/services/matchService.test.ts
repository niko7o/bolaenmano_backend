import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "../lib/prisma";
import {
  listMatches,
  getMatchById,
  createMatch,
  updateMatch,
  CreateMatchPayload,
  UpdateMatchPayload,
} from "./matchService";
import * as bracketService from "./bracketService";

// Mock Prisma client
vi.mock("../lib/prisma", () => ({
  prisma: {
    match: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    participation: {
      updateMany: vi.fn(),
    },
  },
}));

// Mock bracketService
vi.mock("./bracketService", () => ({
  advanceBracket: vi.fn(),
}));

describe("matchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test data fixtures
  const mockUser1 = {
    id: "user-1",
    email: "player1@test.com",
    googleId: "google-1",
    displayName: "Player 1",
    avatarUrl: null,
    expoPushToken: null,
    winstreak: 0,
    currentLossStreak: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser2 = {
    id: "user-2",
    email: "player2@test.com",
    googleId: "google-2",
    displayName: "Player 2",
    avatarUrl: null,
    expoPushToken: null,
    winstreak: 0,
    currentLossStreak: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTournamentId = "tournament-1";

  const mockMatch = {
    id: "match-1",
    tournamentId: mockTournamentId,
    playerAId: "user-1",
    playerBId: "user-2",
    winnerId: null,
    roundNumber: 1,
    tableNumber: null,
    scheduledAt: null,
    completedAt: null,
    reminderSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    playerA: mockUser1,
    playerB: mockUser2,
    winner: null,
  };

  describe("listMatches", () => {
    it("should list all matches with no filters", async () => {
      const mockMatches = [mockMatch];
      vi.mocked(prisma.match.findMany).mockResolvedValue(mockMatches);

      const result = await listMatches({});

      expect(prisma.match.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
        orderBy: [
          { scheduledAt: "asc" },
          { createdAt: "asc" },
        ],
      });
      expect(result).toEqual(mockMatches);
    });

    it("should filter matches by tournamentId", async () => {
      const mockMatches = [mockMatch];
      vi.mocked(prisma.match.findMany).mockResolvedValue(mockMatches);

      const result = await listMatches({ tournamentId: mockTournamentId });

      expect(prisma.match.findMany).toHaveBeenCalledWith({
        where: { tournamentId: mockTournamentId },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
        orderBy: [
          { scheduledAt: "asc" },
          { createdAt: "asc" },
        ],
      });
      expect(result).toEqual(mockMatches);
    });

    it("should filter upcoming matches (completedAt is null)", async () => {
      const mockMatches = [mockMatch];
      vi.mocked(prisma.match.findMany).mockResolvedValue(mockMatches);

      const result = await listMatches({ scope: "upcoming" });

      expect(prisma.match.findMany).toHaveBeenCalledWith({
        where: { completedAt: null },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
        orderBy: [
          { scheduledAt: "asc" },
          { createdAt: "asc" },
        ],
      });
      expect(result).toEqual(mockMatches);
    });

    it("should filter completed matches with correct orderBy", async () => {
      const completedMatch = {
        ...mockMatch,
        completedAt: new Date(),
        winnerId: "user-1",
      };
      vi.mocked(prisma.match.findMany).mockResolvedValue([completedMatch]);

      const result = await listMatches({ scope: "completed" });

      expect(prisma.match.findMany).toHaveBeenCalledWith({
        where: { completedAt: { not: null } },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
        orderBy: [
          { completedAt: "desc" },
          { scheduledAt: "desc" },
          { createdAt: "desc" },
        ],
      });
      expect(result).toEqual([completedMatch]);
    });

    it("should list all matches when scope is 'all'", async () => {
      const mockMatches = [mockMatch];
      vi.mocked(prisma.match.findMany).mockResolvedValue(mockMatches);

      const result = await listMatches({ scope: "all" });

      expect(prisma.match.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
        orderBy: [
          { scheduledAt: "asc" },
          { createdAt: "asc" },
        ],
      });
      expect(result).toEqual(mockMatches);
    });
  });

  describe("getMatchById", () => {
    it("should retrieve an existing match with includes", async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue(mockMatch);

      const result = await getMatchById("match-1");

      expect(prisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: "match-1" },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
      });
      expect(result).toEqual(mockMatch);
    });

    it("should return null for non-existent match", async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue(null);

      const result = await getMatchById("non-existent");

      expect(prisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: "non-existent" },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
      });
      expect(result).toBeNull();
    });
  });

  describe("createMatch", () => {
    it("should create a match with required fields only", async () => {
      const payload: CreateMatchPayload = {
        tournamentId: mockTournamentId,
        playerAId: "user-1",
        playerBId: "user-2",
      };
      vi.mocked(prisma.match.create).mockResolvedValue(mockMatch);

      const result = await createMatch(payload);

      expect(prisma.match.create).toHaveBeenCalledWith({
        data: {
          tournamentId: mockTournamentId,
          playerAId: "user-1",
          playerBId: "user-2",
          tableNumber: null,
          scheduledAt: null,
          roundNumber: 1,
        },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
      });
      expect(result).toEqual(mockMatch);
    });

    it("should create a match with all optional fields", async () => {
      const scheduledDate = "2024-01-15T10:00:00Z";
      const payload: CreateMatchPayload = {
        tournamentId: mockTournamentId,
        playerAId: "user-1",
        playerBId: "user-2",
        tableNumber: 5,
        scheduledAt: scheduledDate,
        roundNumber: 2,
      };
      const matchWithOptionals = {
        ...mockMatch,
        tableNumber: 5,
        scheduledAt: new Date(scheduledDate),
        roundNumber: 2,
      };
      vi.mocked(prisma.match.create).mockResolvedValue(matchWithOptionals);

      const result = await createMatch(payload);

      expect(prisma.match.create).toHaveBeenCalledWith({
        data: {
          tournamentId: mockTournamentId,
          playerAId: "user-1",
          playerBId: "user-2",
          tableNumber: 5,
          scheduledAt: new Date(scheduledDate),
          roundNumber: 2,
        },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
      });
      expect(result).toEqual(matchWithOptionals);
    });

    it("should default roundNumber to 1 when not provided", async () => {
      const payload: CreateMatchPayload = {
        tournamentId: mockTournamentId,
        playerAId: "user-1",
        playerBId: "user-2",
      };
      vi.mocked(prisma.match.create).mockResolvedValue(mockMatch);

      await createMatch(payload);

      expect(prisma.match.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roundNumber: 1,
          }),
        })
      );
    });

    it("should convert scheduledAt string to Date", async () => {
      const scheduledDate = "2024-01-15T10:00:00Z";
      const payload: CreateMatchPayload = {
        tournamentId: mockTournamentId,
        playerAId: "user-1",
        playerBId: "user-2",
        scheduledAt: scheduledDate,
      };
      vi.mocked(prisma.match.create).mockResolvedValue(mockMatch);

      await createMatch(payload);

      expect(prisma.match.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scheduledAt: new Date(scheduledDate),
          }),
        })
      );
    });

    it("should handle null scheduledAt", async () => {
      const payload: CreateMatchPayload = {
        tournamentId: mockTournamentId,
        playerAId: "user-1",
        playerBId: "user-2",
        scheduledAt: null,
      };
      vi.mocked(prisma.match.create).mockResolvedValue(mockMatch);

      await createMatch(payload);

      expect(prisma.match.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scheduledAt: null,
          }),
        })
      );
    });
  });

  describe("updateMatch - basic operations", () => {
    it("should update player assignments", async () => {
      const payload: UpdateMatchPayload = {
        playerAId: "user-3",
        playerBId: "user-4",
      };
      const updatedMatch = {
        ...mockMatch,
        playerAId: "user-3",
        playerBId: "user-4",
      };
      vi.mocked(prisma.match.update).mockResolvedValue(updatedMatch);

      const result = await updateMatch("match-1", payload);

      expect(prisma.match.update).toHaveBeenCalledWith({
        where: { id: "match-1" },
        data: {
          playerA: { connect: { id: "user-3" } },
          playerB: { connect: { id: "user-4" } },
        },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
      });
      expect(result).toEqual(updatedMatch);
    });

    it("should update tableNumber and scheduledAt", async () => {
      const scheduledDate = "2024-01-20T14:00:00Z";
      const payload: UpdateMatchPayload = {
        tableNumber: 3,
        scheduledAt: scheduledDate,
      };
      const updatedMatch = {
        ...mockMatch,
        tableNumber: 3,
        scheduledAt: new Date(scheduledDate),
      };
      vi.mocked(prisma.match.update).mockResolvedValue(updatedMatch);

      const result = await updateMatch("match-1", payload);

      expect(prisma.match.update).toHaveBeenCalledWith({
        where: { id: "match-1" },
        data: {
          tableNumber: 3,
          scheduledAt: new Date(scheduledDate),
          reminderSentAt: null,
        },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
      });
      expect(result).toEqual(updatedMatch);
    });

    it("should reset reminderSentAt when scheduledAt is updated", async () => {
      const payload: UpdateMatchPayload = {
        scheduledAt: "2024-01-20T14:00:00Z",
      };
      vi.mocked(prisma.match.update).mockResolvedValue(mockMatch);

      await updateMatch("match-1", payload);

      expect(prisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reminderSentAt: null,
          }),
        })
      );
    });

    it("should update completedAt", async () => {
      const completedDate = "2024-01-15T16:30:00Z";
      const payload: UpdateMatchPayload = {
        completedAt: completedDate,
      };
      const updatedMatch = {
        ...mockMatch,
        completedAt: new Date(completedDate),
      };
      vi.mocked(prisma.match.update).mockResolvedValue(updatedMatch);

      const result = await updateMatch("match-1", payload);

      expect(prisma.match.update).toHaveBeenCalledWith({
        where: { id: "match-1" },
        data: {
          completedAt: new Date(completedDate),
        },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
      });
      expect(result).toEqual(updatedMatch);
    });

    it("should set tableNumber to null when explicitly passed as null", async () => {
      const payload: UpdateMatchPayload = {
        tableNumber: null,
      };
      vi.mocked(prisma.match.update).mockResolvedValue(mockMatch);

      await updateMatch("match-1", payload);

      expect(prisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tableNumber: null,
          }),
        })
      );
    });
  });

  describe("updateMatch - winner logic", () => {
    it("should set winner and update participation stats", async () => {
      const payload: UpdateMatchPayload = {
        winnerId: "user-1",
      };
      const updatedMatch = {
        ...mockMatch,
        winnerId: "user-1",
        winner: mockUser1,
      };
      vi.mocked(prisma.match.update).mockResolvedValue(updatedMatch);
      vi.mocked(prisma.participation.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(bracketService.advanceBracket).mockResolvedValue([]);

      const result = await updateMatch("match-1", payload);

      expect(prisma.match.update).toHaveBeenCalledWith({
        where: { id: "match-1" },
        data: {
          winner: { connect: { id: "user-1" } },
        },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
      });

      // Check winner's wins were incremented
      expect(prisma.participation.updateMany).toHaveBeenCalledWith({
        where: {
          tournamentId: mockTournamentId,
          userId: "user-1",
        },
        data: { wins: { increment: 1 } },
      });

      // Check loser's losses were incremented
      expect(prisma.participation.updateMany).toHaveBeenCalledWith({
        where: {
          tournamentId: mockTournamentId,
          userId: "user-2",
        },
        data: { losses: { increment: 1 } },
      });

      expect(result).toEqual(updatedMatch);
    });

    it("should trigger bracket advancement when winner is set", async () => {
      const payload: UpdateMatchPayload = {
        winnerId: "user-1",
      };
      const updatedMatch = {
        ...mockMatch,
        winnerId: "user-1",
        winner: mockUser1,
      };
      vi.mocked(prisma.match.update).mockResolvedValue(updatedMatch);
      vi.mocked(prisma.participation.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(bracketService.advanceBracket).mockResolvedValue([]);

      await updateMatch("match-1", payload);

      expect(bracketService.advanceBracket).toHaveBeenCalledWith(mockTournamentId);
    });

    it("should NOT update stats for bye matches (playerA === playerB)", async () => {
      const byeMatch = {
        ...mockMatch,
        playerAId: "user-1",
        playerBId: "user-1",
        playerB: mockUser1,
      };
      const payload: UpdateMatchPayload = {
        winnerId: "user-1",
      };
      const updatedByeMatch = {
        ...byeMatch,
        winnerId: "user-1",
        winner: mockUser1,
      };
      vi.mocked(prisma.match.update).mockResolvedValue(updatedByeMatch);
      vi.mocked(bracketService.advanceBracket).mockResolvedValue([]);

      await updateMatch("match-1", payload);

      // Participation stats should NOT be updated for bye matches
      expect(prisma.participation.updateMany).not.toHaveBeenCalled();

      // But bracket advancement should still be triggered
      expect(bracketService.advanceBracket).toHaveBeenCalledWith(mockTournamentId);
    });

    it("should disconnect winner when winnerId is null", async () => {
      const payload: UpdateMatchPayload = {
        winnerId: null,
      };
      const updatedMatch = {
        ...mockMatch,
        winnerId: null,
        winner: null,
      };
      vi.mocked(prisma.match.update).mockResolvedValue(updatedMatch);

      const result = await updateMatch("match-1", payload);

      expect(prisma.match.update).toHaveBeenCalledWith({
        where: { id: "match-1" },
        data: {
          winner: { disconnect: true },
        },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
      });
      expect(result).toEqual(updatedMatch);
    });

    it("should correctly identify loser when playerB wins", async () => {
      const payload: UpdateMatchPayload = {
        winnerId: "user-2",
      };
      const updatedMatch = {
        ...mockMatch,
        winnerId: "user-2",
        winner: mockUser2,
      };
      vi.mocked(prisma.match.update).mockResolvedValue(updatedMatch);
      vi.mocked(prisma.participation.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(bracketService.advanceBracket).mockResolvedValue([]);

      await updateMatch("match-1", payload);

      // Check winner's wins were incremented
      expect(prisma.participation.updateMany).toHaveBeenCalledWith({
        where: {
          tournamentId: mockTournamentId,
          userId: "user-2",
        },
        data: { wins: { increment: 1 } },
      });

      // Check loser's (playerA) losses were incremented
      expect(prisma.participation.updateMany).toHaveBeenCalledWith({
        where: {
          tournamentId: mockTournamentId,
          userId: "user-1",
        },
        data: { losses: { increment: 1 } },
      });
    });
  });

});

/**
 * Integration Tests - Bracket Advancement
 * 
 * Note: These integration tests require a real database and should be run separately.
 * To run them, create a separate test file: matchService.integration.test.ts
 * without the vi.mock() calls at the top.
 * 
 * The tests below provide a template for integration testing:
 */

/*
describe("Match Service Integration Tests", () => {
  // Import real implementations (no mocks)
  import { prisma } from "../lib/prisma";
  import { generateBracket } from "./bracketService";
  import { updateMatch } from "./matchService";

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

  afterEach(async () => {
    await cleanup();
  });

  it("should advance bracket when all first round matches are completed", async () => {
    // Create 4 test users
    const user1 = await createTestUser("player1@integration.test", "Player 1");
    const user2 = await createTestUser("player2@integration.test", "Player 2");
    const user3 = await createTestUser("player3@integration.test", "Player 3");
    const user4 = await createTestUser("player4@integration.test", "Player 4");

    // Create tournament
    const tournament = await createTestTournament("Integration Test Tournament");

    // Add participants
    await addParticipants(tournament.id, [user1.id, user2.id, user3.id, user4.id]);

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

    // Get participation for the bye player before completing regular match
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
});
*/

