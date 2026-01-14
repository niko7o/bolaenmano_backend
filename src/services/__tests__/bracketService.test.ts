import { describe, it, expect, beforeEach } from "vitest";
import { generateBracket, getBracketData, advanceBracket } from "../bracketService";
import { createTournamentWithParticipants, createTournament } from "../../test/fixtures";
import { prisma } from "../../lib/prisma";

describe("Bracket Service", () => {
  describe("generateBracket", () => {
    it("should generate a perfect bracket for power of 2 participants (4 players)", async () => {
      const { tournament } = await createTournamentWithParticipants(4);

      const result = await generateBracket(tournament.id);

      expect(result.numParticipants).toBe(4);
      expect(result.numByes).toBe(0);
      expect(result.numRounds).toBe(2); // 4 players = 2 rounds
      expect(result.matches).toHaveLength(2); // 2 first round matches
      
      // All matches should have 2 different players
      result.matches.forEach(match => {
        expect(match.playerAId).not.toBe(match.playerBId);
        expect(match.roundNumber).toBe(1);
        expect(match.winnerId).toBeNull();
      });
    });

    it("should generate a perfect bracket for 8 players", async () => {
      const { tournament } = await createTournamentWithParticipants(8);

      const result = await generateBracket(tournament.id);

      expect(result.numParticipants).toBe(8);
      expect(result.numByes).toBe(0);
      expect(result.numRounds).toBe(3); // 8 players = 3 rounds
      expect(result.matches).toHaveLength(4); // 4 first round matches
    });

    it("should handle 3 participants with 1 bye", async () => {
      const { tournament } = await createTournamentWithParticipants(3);

      const result = await generateBracket(tournament.id);

      expect(result.numParticipants).toBe(3);
      expect(result.numByes).toBe(1); // 4 - 3 = 1 bye
      expect(result.numRounds).toBe(2);
      expect(result.matches).toHaveLength(2); // 1 real match + 1 bye match
      
      // One match should be a bye (playerA vs playerA with winner set)
      const byeMatches = result.matches.filter(m => m.playerAId === m.playerBId);
      expect(byeMatches).toHaveLength(1);
      expect(byeMatches[0].winnerId).toBe(byeMatches[0].playerAId);
      expect(byeMatches[0].completedAt).not.toBeNull();
    });

    it("should handle 5 participants with 3 byes", async () => {
      const { tournament } = await createTournamentWithParticipants(5);

      const result = await generateBracket(tournament.id);

      expect(result.numParticipants).toBe(5);
      expect(result.numByes).toBe(3); // 8 - 5 = 3 byes
      expect(result.numRounds).toBe(3);
      expect(result.matches).toHaveLength(4); // 1 real match + 3 bye matches
      
      const byeMatches = result.matches.filter(m => m.playerAId === m.playerBId);
      expect(byeMatches).toHaveLength(3);
      
      // All bye matches should have winner set
      byeMatches.forEach(bye => {
        expect(bye.winnerId).toBe(bye.playerAId);
        expect(bye.completedAt).not.toBeNull();
      });
    });

    it("should handle 7 participants with 1 bye", async () => {
      const { tournament } = await createTournamentWithParticipants(7);

      const result = await generateBracket(tournament.id);

      expect(result.numParticipants).toBe(7);
      expect(result.numByes).toBe(1); // 8 - 7 = 1 bye
      expect(result.numRounds).toBe(3);
      expect(result.matches).toHaveLength(4);
    });

    it("should handle minimum 2 participants", async () => {
      const { tournament } = await createTournamentWithParticipants(2);

      const result = await generateBracket(tournament.id);

      expect(result.numParticipants).toBe(2);
      expect(result.numByes).toBe(0);
      expect(result.numRounds).toBe(1); // Just finals
      expect(result.matches).toHaveLength(1);
    });

    it("should error with less than 2 participants", async () => {
      const { tournament } = await createTournamentWithParticipants(1);

      await expect(generateBracket(tournament.id)).rejects.toThrow(
        "Need at least 2 participants"
      );
    });

    it("should error with 0 participants", async () => {
      const tournament = await createTournament();

      await expect(generateBracket(tournament.id)).rejects.toThrow(
        "Need at least 2 participants"
      );
    });

    it("should error if bracket already exists", async () => {
      const { tournament } = await createTournamentWithParticipants(4);

      // Generate bracket once
      await generateBracket(tournament.id);

      // Try to generate again
      await expect(generateBracket(tournament.id)).rejects.toThrow(
        "Bracket already exists"
      );
    });

    it("should error if tournament not found", async () => {
      await expect(generateBracket("non-existent-id")).rejects.toThrow(
        "Tournament not found"
      );
    });

    it("should reset all participation stats to 0", async () => {
      const { tournament, participations } = await createTournamentWithParticipants(4);
      
      // Set some initial wins/losses
      await prisma.participation.update({
        where: { id: participations[0].id },
        data: { wins: 5, losses: 3 },
      });

      await generateBracket(tournament.id);

      // Check that stats were reset
      const updatedParticipations = await prisma.participation.findMany({
        where: { tournamentId: tournament.id },
      });

      updatedParticipations.forEach(p => {
        expect(p.wins).toBe(0);
        expect(p.losses).toBe(0);
      });
    });

    it("should handle 16 participants perfectly", async () => {
      const { tournament } = await createTournamentWithParticipants(16);

      const result = await generateBracket(tournament.id);

      expect(result.numParticipants).toBe(16);
      expect(result.numByes).toBe(0);
      expect(result.numRounds).toBe(4);
      expect(result.matches).toHaveLength(8); // 8 first round matches
    });
  });

  describe("getBracketData", () => {
    it("should return empty rounds for tournament with no matches", async () => {
      const { tournament } = await createTournamentWithParticipants(4);

      const result = await getBracketData(tournament.id);

      expect(result.rounds).toHaveLength(0);
      expect(result.numRounds).toBe(2);
      expect(result.numParticipants).toBe(4);
    });

    it("should organize matches by round number", async () => {
      const { tournament } = await createTournamentWithParticipants(4);
      await generateBracket(tournament.id);

      const result = await getBracketData(tournament.id);

      expect(result.rounds).toHaveLength(1); // Only first round created
      expect(result.rounds[0].roundNumber).toBe(1);
      expect(result.rounds[0].matches).toHaveLength(2);
      expect(result.rounds[0].roundName).toBe("Round 1");
    });

    it("should correctly name rounds (Finals, Semi-Finals, Quarter-Finals)", async () => {
      const { tournament } = await createTournamentWithParticipants(8);
      await generateBracket(tournament.id);

      // Complete first round to create second round
      const firstRoundMatches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 1 },
      });

      for (const match of firstRoundMatches) {
        await prisma.match.update({
          where: { id: match.id },
          data: { winnerId: match.playerAId, completedAt: new Date() },
        });
      }

      await advanceBracket(tournament.id);

      // Complete second round to create finals
      const secondRoundMatches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 2 },
      });

      for (const match of secondRoundMatches) {
        await prisma.match.update({
          where: { id: match.id },
          data: { winnerId: match.playerAId, completedAt: new Date() },
        });
      }

      await advanceBracket(tournament.id);

      const result = await getBracketData(tournament.id);

      expect(result.rounds).toHaveLength(3);
      expect(result.rounds[0].roundName).toBe("Round 1");
      expect(result.rounds[1].roundName).toBe("Semi-Finals");
      expect(result.rounds[2].roundName).toBe("Final");
    });

    it("should error if tournament not found", async () => {
      await expect(getBracketData("non-existent-id")).rejects.toThrow(
        "Tournament not found"
      );
    });
  });

  describe("advanceBracket", () => {
    it("should create next round matches when current round is complete", async () => {
      const { tournament } = await createTournamentWithParticipants(4);
      await generateBracket(tournament.id);

      // Complete all first round matches
      const firstRoundMatches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 1 },
      });

      expect(firstRoundMatches).toHaveLength(2);

      for (const match of firstRoundMatches) {
        await prisma.match.update({
          where: { id: match.id },
          data: { winnerId: match.playerAId, completedAt: new Date() },
        });
      }

      const newMatches = await advanceBracket(tournament.id);

      expect(newMatches).toHaveLength(1); // Finals
      expect(newMatches[0].roundNumber).toBe(2);
      expect(newMatches[0].playerAId).toBe(firstRoundMatches[0].playerAId);
      expect(newMatches[0].playerBId).toBe(firstRoundMatches[1].playerAId);
    });

    it("should return empty array when round is not complete", async () => {
      const { tournament } = await createTournamentWithParticipants(4);
      await generateBracket(tournament.id);

      // Complete only first match
      const firstMatch = await prisma.match.findFirst({
        where: { tournamentId: tournament.id, roundNumber: 1 },
      });

      await prisma.match.update({
        where: { id: firstMatch!.id },
        data: { winnerId: firstMatch!.playerAId, completedAt: new Date() },
      });

      const newMatches = await advanceBracket(tournament.id);

      expect(newMatches).toHaveLength(0);
    });

    it("should return empty array for final match (tournament complete)", async () => {
      const { tournament } = await createTournamentWithParticipants(2);
      await generateBracket(tournament.id);

      const finalMatch = await prisma.match.findFirst({
        where: { tournamentId: tournament.id },
      });

      await prisma.match.update({
        where: { id: finalMatch!.id },
        data: { winnerId: finalMatch!.playerAId, completedAt: new Date() },
      });

      const newMatches = await advanceBracket(tournament.id);

      expect(newMatches).toHaveLength(0);
    });

    it("should return empty array if no matches exist", async () => {
      const { tournament } = await createTournamentWithParticipants(4);

      const newMatches = await advanceBracket(tournament.id);

      expect(newMatches).toHaveLength(0);
    });

    it("should correctly pair winners (match 0 vs 1, match 2 vs 3)", async () => {
      const { tournament, users } = await createTournamentWithParticipants(8);
      await generateBracket(tournament.id);

      const firstRoundMatches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 1 },
        orderBy: { createdAt: "asc" },
      });

      expect(firstRoundMatches).toHaveLength(4);

      // Set specific winners
      await prisma.match.update({
        where: { id: firstRoundMatches[0].id },
        data: { winnerId: firstRoundMatches[0].playerAId, completedAt: new Date() },
      });
      await prisma.match.update({
        where: { id: firstRoundMatches[1].id },
        data: { winnerId: firstRoundMatches[1].playerBId, completedAt: new Date() },
      });
      await prisma.match.update({
        where: { id: firstRoundMatches[2].id },
        data: { winnerId: firstRoundMatches[2].playerAId, completedAt: new Date() },
      });
      await prisma.match.update({
        where: { id: firstRoundMatches[3].id },
        data: { winnerId: firstRoundMatches[3].playerBId, completedAt: new Date() },
      });

      const newMatches = await advanceBracket(tournament.id);

      expect(newMatches).toHaveLength(2); // Semi-finals
      expect(newMatches[0].roundNumber).toBe(2);
      expect(newMatches[1].roundNumber).toBe(2);

      // Check pairing: match 0 winner vs match 1 winner
      expect(newMatches[0].playerAId).toBe(firstRoundMatches[0].playerAId);
      expect(newMatches[0].playerBId).toBe(firstRoundMatches[1].playerBId);

      // Check pairing: match 2 winner vs match 3 winner
      expect(newMatches[1].playerAId).toBe(firstRoundMatches[2].playerAId);
      expect(newMatches[1].playerBId).toBe(firstRoundMatches[3].playerBId);
    });

    it("should advance through multiple rounds correctly", async () => {
      const { tournament } = await createTournamentWithParticipants(8);
      await generateBracket(tournament.id);

      // Round 1 -> Round 2
      let matches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 1 },
      });
      for (const match of matches) {
        await prisma.match.update({
          where: { id: match.id },
          data: { winnerId: match.playerAId, completedAt: new Date() },
        });
      }
      let newMatches = await advanceBracket(tournament.id);
      expect(newMatches).toHaveLength(2);

      // Round 2 -> Finals
      matches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 2 },
      });
      for (const match of matches) {
        await prisma.match.update({
          where: { id: match.id },
          data: { winnerId: match.playerAId, completedAt: new Date() },
        });
      }
      newMatches = await advanceBracket(tournament.id);
      expect(newMatches).toHaveLength(1);
      expect(newMatches[0].roundNumber).toBe(3);

      // Finals -> Tournament complete
      const finalMatch = await prisma.match.findFirst({
        where: { tournamentId: tournament.id, roundNumber: 3 },
      });
      await prisma.match.update({
        where: { id: finalMatch!.id },
        data: { winnerId: finalMatch!.playerAId, completedAt: new Date() },
      });
      newMatches = await advanceBracket(tournament.id);
      expect(newMatches).toHaveLength(0);
    });
  });
});
