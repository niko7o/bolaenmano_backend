import { describe, it, expect } from "vitest";
import { generateBracket, advanceBracket, getBracketData } from "../bracketService";
import { updateMatch } from "../matchService";
import { createTournamentWithParticipants } from "../../test/fixtures";
import { prisma } from "../../lib/prisma";

describe("Tournament Integration Tests", () => {
  describe("Full 4-player tournament lifecycle", () => {
    it("should complete a full tournament from generation to winner", async () => {
      // Setup: Create tournament with 4 participants
      const { tournament, users } = await createTournamentWithParticipants(4);

      // Step 1: Generate bracket
      const bracket = await generateBracket(tournament.id);
      expect(bracket.numParticipants).toBe(4);
      expect(bracket.numByes).toBe(0);
      expect(bracket.matches).toHaveLength(2); // 2 first round matches

      // Step 2: Complete first round
      const round1Matches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 1 },
        orderBy: { createdAt: "asc" },
      });

      const winner1 = round1Matches[0].playerAId;
      const winner2 = round1Matches[1].playerBId;

      await updateMatch(round1Matches[0].id, { winnerId: winner1 });
      await updateMatch(round1Matches[1].id, { winnerId: winner2 });

      // Verify stats after first round
      const stats1 = await prisma.participation.findFirst({
        where: { tournamentId: tournament.id, userId: winner1 },
      });
      expect(stats1!.wins).toBe(1);
      expect(stats1!.losses).toBe(0);

      const loser1 = round1Matches[0].playerBId;
      const statsLoser1 = await prisma.participation.findFirst({
        where: { tournamentId: tournament.id, userId: loser1 },
      });
      expect(statsLoser1!.wins).toBe(0);
      expect(statsLoser1!.losses).toBe(1);

      // Step 3: Verify finals were created
      const finalsMatches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 2 },
      });
      expect(finalsMatches).toHaveLength(1);
      expect(finalsMatches[0].playerAId).toBe(winner1);
      expect(finalsMatches[0].playerBId).toBe(winner2);

      // Step 4: Complete finals
      const tournamentWinner = finalsMatches[0].playerAId;
      await updateMatch(finalsMatches[0].id, { winnerId: tournamentWinner });

      // Verify final stats
      const winnerStats = await prisma.participation.findFirst({
        where: { tournamentId: tournament.id, userId: tournamentWinner },
      });
      expect(winnerStats!.wins).toBe(2);
      expect(winnerStats!.losses).toBe(0);

      const runnerUp = finalsMatches[0].playerBId;
      const runnerUpStats = await prisma.participation.findFirst({
        where: { tournamentId: tournament.id, userId: runnerUp },
      });
      expect(runnerUpStats!.wins).toBe(1);
      expect(runnerUpStats!.losses).toBe(1);

      // Step 5: Verify tournament is complete (no more matches to create)
      const noNewMatches = await advanceBracket(tournament.id);
      expect(noNewMatches).toHaveLength(0);

      // Verify bracket data
      const bracketData = await getBracketData(tournament.id);
      expect(bracketData.rounds).toHaveLength(2);
      expect(bracketData.rounds[0].roundName).toBe("Round 1");
      expect(bracketData.rounds[1].roundName).toBe("Final");
    });
  });

  describe("Full 8-player tournament lifecycle", () => {
    it("should complete an 8-player tournament through all rounds", async () => {
      // Setup
      const { tournament, users } = await createTournamentWithParticipants(8);

      // Generate bracket
      await generateBracket(tournament.id);

      // Round 1: 4 matches
      let matches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 1 },
        orderBy: { createdAt: "asc" },
      });
      expect(matches).toHaveLength(4);

      const round1Winners = matches.map(m => m.playerAId);
      for (const match of matches) {
        await updateMatch(match.id, { winnerId: match.playerAId });
      }

      // Verify semi-finals created
      matches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 2 },
        orderBy: { createdAt: "asc" },
      });
      expect(matches).toHaveLength(2);

      // Complete semi-finals
      const round2Winners = matches.map(m => m.playerBId);
      for (const match of matches) {
        await updateMatch(match.id, { winnerId: match.playerBId });
      }

      // Verify finals created
      matches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 3 },
      });
      expect(matches).toHaveLength(1);

      // Complete finals
      await updateMatch(matches[0].id, { winnerId: matches[0].playerAId });

      // Verify bracket structure
      const bracketData = await getBracketData(tournament.id);
      expect(bracketData.rounds).toHaveLength(3);
      expect(bracketData.rounds[0].roundName).toBe("Round 1");
      expect(bracketData.rounds[1].roundName).toBe("Semi-Finals");
      expect(bracketData.rounds[2].roundName).toBe("Final");
    });
  });

  describe("Tournament with byes (3 participants)", () => {
    it("should handle byes correctly and advance to finals", async () => {
      // Setup: 3 participants means 1 bye
      const { tournament, users } = await createTournamentWithParticipants(3);

      // Generate bracket
      const bracket = await generateBracket(tournament.id);
      expect(bracket.numParticipants).toBe(3);
      expect(bracket.numByes).toBe(1);
      expect(bracket.matches).toHaveLength(2); // 1 real match + 1 bye match

      // Find the real match and bye match
      const allMatches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 1 },
      });

      const byeMatch = allMatches.find(m => m.playerAId === m.playerBId);
      const realMatch = allMatches.find(m => m.playerAId !== m.playerBId);

      expect(byeMatch).toBeDefined();
      expect(realMatch).toBeDefined();

      // Bye match should already be complete
      expect(byeMatch!.winnerId).toBe(byeMatch!.playerAId);
      expect(byeMatch!.completedAt).not.toBeNull();

      // Verify bye participant stats weren't updated
      const byeParticipation = await prisma.participation.findFirst({
        where: { tournamentId: tournament.id, userId: byeMatch!.playerAId },
      });
      expect(byeParticipation!.wins).toBe(0);
      expect(byeParticipation!.losses).toBe(0);

      // Complete the real match
      const realMatchWinner = realMatch!.playerAId;
      await updateMatch(realMatch!.id, { winnerId: realMatchWinner });

      // Verify real match stats were updated
      const winnerParticipation = await prisma.participation.findFirst({
        where: { tournamentId: tournament.id, userId: realMatchWinner },
      });
      expect(winnerParticipation!.wins).toBe(1);

      // Finals should be created
      const finalsMatches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 2 },
      });
      expect(finalsMatches).toHaveLength(1);

      // Finals should match bye winner vs real match winner
      expect(finalsMatches[0].playerAId).toBe(byeMatch!.winnerId);
      expect(finalsMatches[0].playerBId).toBe(realMatchWinner);

      // Complete finals
      await updateMatch(finalsMatches[0].id, {
        winnerId: finalsMatches[0].playerAId,
      });

      // Verify final stats
      const champion = await prisma.participation.findFirst({
        where: {
          tournamentId: tournament.id,
          userId: finalsMatches[0].playerAId,
        },
      });
      // Champion should have 1 win (0 from bye, 1 from finals)
      expect(champion!.wins).toBe(1);
    });
  });

  describe("Stats accuracy across full tournament", () => {
    it("should maintain accurate win/loss stats for all participants", async () => {
      const { tournament, users } = await createTournamentWithParticipants(4);

      // Generate and complete tournament
      await generateBracket(tournament.id);

      // Round 1
      const round1Matches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 1 },
        orderBy: { createdAt: "asc" },
      });

      const semifinalist1 = round1Matches[0].playerAId;
      const semifinalist2 = round1Matches[1].playerBId;
      const eliminated1 = round1Matches[0].playerBId;
      const eliminated2 = round1Matches[1].playerAId;

      await updateMatch(round1Matches[0].id, { winnerId: semifinalist1 });
      await updateMatch(round1Matches[1].id, { winnerId: semifinalist2 });

      // Finals
      const finalsMatch = await prisma.match.findFirst({
        where: { tournamentId: tournament.id, roundNumber: 2 },
      });

      const champion = finalsMatch!.playerAId; // semifinalist1
      const runnerUp = finalsMatch!.playerBId; // semifinalist2

      await updateMatch(finalsMatch!.id, { winnerId: champion });

      // Verify all stats
      const allParticipations = await prisma.participation.findMany({
        where: { tournamentId: tournament.id },
        include: { user: true },
      });

      expect(allParticipations).toHaveLength(4);

      // Champion: 2 wins, 0 losses
      const championStats = allParticipations.find(p => p.userId === champion);
      expect(championStats!.wins).toBe(2);
      expect(championStats!.losses).toBe(0);

      // Runner-up: 1 win, 1 loss
      const runnerUpStats = allParticipations.find(p => p.userId === runnerUp);
      expect(runnerUpStats!.wins).toBe(1);
      expect(runnerUpStats!.losses).toBe(1);

      // Eliminated in round 1: 0 wins, 1 loss each
      const elim1Stats = allParticipations.find(p => p.userId === eliminated1);
      expect(elim1Stats!.wins).toBe(0);
      expect(elim1Stats!.losses).toBe(1);

      const elim2Stats = allParticipations.find(p => p.userId === eliminated2);
      expect(elim2Stats!.wins).toBe(0);
      expect(elim2Stats!.losses).toBe(1);

      // Verify total wins equals total losses
      const totalWins = allParticipations.reduce((sum, p) => sum + p.wins, 0);
      const totalLosses = allParticipations.reduce((sum, p) => sum + p.losses, 0);
      expect(totalWins).toBe(totalLosses);
      expect(totalWins).toBe(3); // 3 matches total (2 in round 1, 1 in finals)
    });
  });

  describe("Large tournament (16 participants)", () => {
    it("should complete a 16-player tournament efficiently", async () => {
      const { tournament } = await createTournamentWithParticipants(16);

      // Generate bracket
      const bracket = await generateBracket(tournament.id);
      expect(bracket.numParticipants).toBe(16);
      expect(bracket.numByes).toBe(0);
      expect(bracket.numRounds).toBe(4);

      // Complete all rounds
      for (let round = 1; round <= 4; round++) {
        const matches = await prisma.match.findMany({
          where: { tournamentId: tournament.id, roundNumber: round },
        });

        if (round === 1) expect(matches).toHaveLength(8);
        if (round === 2) expect(matches).toHaveLength(4);
        if (round === 3) expect(matches).toHaveLength(2);
        if (round === 4) expect(matches).toHaveLength(1);

        // Complete all matches in this round
        for (const match of matches) {
          await updateMatch(match.id, { winnerId: match.playerAId });
        }
      }

      // Verify bracket data
      const bracketData = await getBracketData(tournament.id);
      expect(bracketData.rounds).toHaveLength(4);
      expect(bracketData.rounds[0].roundName).toBe("Round 1");
      expect(bracketData.rounds[1].roundName).toBe("Quarter-Finals");
      expect(bracketData.rounds[2].roundName).toBe("Semi-Finals");
      expect(bracketData.rounds[3].roundName).toBe("Final");

      // Verify winner has 4 wins
      const matches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 4 },
      });
      const winnerId = matches[0].winnerId;

      const winnerStats = await prisma.participation.findFirst({
        where: { tournamentId: tournament.id, userId: winnerId! },
      });
      expect(winnerStats!.wins).toBe(4);
      expect(winnerStats!.losses).toBe(0);
    });
  });

  describe("Partial completion scenarios", () => {
    it("should not advance round if any match is incomplete", async () => {
      const { tournament } = await createTournamentWithParticipants(4);
      await generateBracket(tournament.id);

      const round1Matches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 1 },
      });

      // Complete only first match
      await updateMatch(round1Matches[0].id, {
        winnerId: round1Matches[0].playerAId,
      });

      // Try to advance (should not create new matches)
      const newMatches = await advanceBracket(tournament.id);
      expect(newMatches).toHaveLength(0);

      // Verify no round 2 matches exist
      const round2Matches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 2 },
      });
      expect(round2Matches).toHaveLength(0);
    });

    it("should allow completing matches out of order", async () => {
      const { tournament } = await createTournamentWithParticipants(4);
      await generateBracket(tournament.id);

      const round1Matches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 1 },
        orderBy: { createdAt: "asc" },
      });

      // Complete second match first
      await updateMatch(round1Matches[1].id, {
        winnerId: round1Matches[1].playerBId,
      });

      // Complete first match second
      await updateMatch(round1Matches[0].id, {
        winnerId: round1Matches[0].playerAId,
      });

      // Finals should still be created correctly
      const finalsMatches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, roundNumber: 2 },
      });
      expect(finalsMatches).toHaveLength(1);
    });
  });
});
