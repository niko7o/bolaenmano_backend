import { describe, it, expect } from "vitest";
import {
  getCurrentTournament,
  getTournamentHistory,
  getTournamentById,
} from "../tournamentService";
import { createTournament, createTournamentWithParticipants } from "../../test/fixtures";
import { generateBracket } from "../bracketService";

describe("Tournament Service", () => {
  describe("getCurrentTournament", () => {
    it("should return ACTIVE tournament", async () => {
      await createTournament({ status: "COMPLETED" });
      const activeTournament = await createTournament({ status: "ACTIVE" });
      await createTournament({ status: "UPCOMING" });

      const current = await getCurrentTournament();

      expect(current).not.toBeNull();
      expect(current!.id).toBe(activeTournament.id);
      expect(current!.status).toBe("ACTIVE");
    });

    it("should return UPCOMING tournament if no ACTIVE exists", async () => {
      await createTournament({ status: "COMPLETED" });
      const upcomingTournament = await createTournament({ status: "UPCOMING" });

      const current = await getCurrentTournament();

      expect(current).not.toBeNull();
      expect(current!.id).toBe(upcomingTournament.id);
      expect(current!.status).toBe("UPCOMING");
    });

    it("should prioritize earliest startDate", async () => {
      const later = await createTournament({
        status: "UPCOMING",
        startDate: new Date("2025-02-01"),
      });
      const earlier = await createTournament({
        status: "UPCOMING",
        startDate: new Date("2025-01-15"),
      });

      const current = await getCurrentTournament();

      expect(current).not.toBeNull();
      expect(current!.id).toBe(earlier.id);
    });

    it("should return null when no current tournament exists", async () => {
      await createTournament({ status: "COMPLETED" });

      const current = await getCurrentTournament();

      expect(current).toBeNull();
    });

    it("should include matches with related data", async () => {
      const { tournament } = await createTournamentWithParticipants(4, {
        status: "ACTIVE",
      });
      await generateBracket(tournament.id);

      const current = await getCurrentTournament();

      expect(current).not.toBeNull();
      expect(current!.matches).toBeDefined();
      expect(current!.matches.length).toBeGreaterThan(0);
      expect(current!.matches[0].playerA).toBeDefined();
      expect(current!.matches[0].playerB).toBeDefined();
    });

    it("should include participations with user data", async () => {
      const { tournament } = await createTournamentWithParticipants(4, {
        status: "ACTIVE",
      });

      const current = await getCurrentTournament();

      expect(current).not.toBeNull();
      expect(current!.participations).toBeDefined();
      expect(current!.participations).toHaveLength(4);
      expect(current!.participations[0].user).toBeDefined();
      expect(current!.participations[0].user.displayName).toBeDefined();
    });

    it("should order matches by scheduledAt ascending", async () => {
      const { tournament, users } = await createTournamentWithParticipants(2, {
        status: "ACTIVE",
      });

      // Create matches with different scheduled times
      const { createMatch } = await import("../matchService");
      await createMatch({
        tournamentId: tournament.id,
        playerAId: users[0].id,
        playerBId: users[1].id,
        scheduledAt: new Date("2025-01-20T15:00:00Z").toISOString(),
      });
      await createMatch({
        tournamentId: tournament.id,
        playerAId: users[0].id,
        playerBId: users[1].id,
        scheduledAt: new Date("2025-01-20T10:00:00Z").toISOString(),
      });

      const current = await getCurrentTournament();

      expect(current!.matches).toHaveLength(2);
      expect(current!.matches[0].scheduledAt!.getTime()).toBeLessThan(
        current!.matches[1].scheduledAt!.getTime()
      );
    });

    it("should order participations by seed ascending", async () => {
      const { tournament } = await createTournamentWithParticipants(3, {
        status: "ACTIVE",
      });

      const { prisma } = await import("../../lib/prisma");
      const participations = await prisma.participation.findMany({
        where: { tournamentId: tournament.id },
      });

      // Set seeds
      await prisma.participation.update({
        where: { id: participations[0].id },
        data: { seed: 3 },
      });
      await prisma.participation.update({
        where: { id: participations[1].id },
        data: { seed: 1 },
      });
      await prisma.participation.update({
        where: { id: participations[2].id },
        data: { seed: 2 },
      });

      const current = await getCurrentTournament();

      expect(current!.participations).toHaveLength(3);
      expect(current!.participations[0].seed).toBe(1);
      expect(current!.participations[1].seed).toBe(2);
      expect(current!.participations[2].seed).toBe(3);
    });
  });

  describe("getTournamentHistory", () => {
    it("should return only COMPLETED tournaments", async () => {
      await createTournament({ status: "ACTIVE" });
      await createTournament({ status: "UPCOMING" });
      const completed1 = await createTournament({ status: "COMPLETED" });
      const completed2 = await createTournament({ status: "COMPLETED" });

      const history = await getTournamentHistory();

      expect(history).toHaveLength(2);
      expect(history.every(t => t.status === "COMPLETED")).toBe(true);
    });

    it("should return empty array when no completed tournaments", async () => {
      await createTournament({ status: "ACTIVE" });
      await createTournament({ status: "UPCOMING" });

      const history = await getTournamentHistory();

      expect(history).toHaveLength(0);
    });

    it("should order by endDate descending (most recent first)", async () => {
      await createTournament({
        status: "COMPLETED",
        endDate: new Date("2024-12-01"),
      });
      const mostRecent = await createTournament({
        status: "COMPLETED",
        endDate: new Date("2025-01-15"),
      });

      const history = await getTournamentHistory();

      expect(history).toHaveLength(2);
      expect(history[0].id).toBe(mostRecent.id);
    });

    it("should include participations with user data", async () => {
      const { tournament } = await createTournamentWithParticipants(3, {
        status: "COMPLETED",
        endDate: new Date(),
      });

      const history = await getTournamentHistory();

      expect(history).toHaveLength(1);
      expect(history[0].participations).toHaveLength(3);
      expect(history[0].participations[0].user).toBeDefined();
    });

    it("should order participations by wins descending", async () => {
      const { tournament } = await createTournamentWithParticipants(3, {
        status: "COMPLETED",
        endDate: new Date(),
      });

      const { prisma } = await import("../../lib/prisma");
      const participations = await prisma.participation.findMany({
        where: { tournamentId: tournament.id },
      });

      // Set different win counts
      await prisma.participation.update({
        where: { id: participations[0].id },
        data: { wins: 1 },
      });
      await prisma.participation.update({
        where: { id: participations[1].id },
        data: { wins: 3 },
      });
      await prisma.participation.update({
        where: { id: participations[2].id },
        data: { wins: 2 },
      });

      const history = await getTournamentHistory();

      expect(history[0].participations[0].wins).toBe(3);
      expect(history[0].participations[1].wins).toBe(2);
      expect(history[0].participations[2].wins).toBe(1);
    });
  });

  describe("getTournamentById", () => {
    it("should return tournament by id with all relations", async () => {
      const { tournament } = await createTournamentWithParticipants(2);
      await generateBracket(tournament.id);

      const result = await getTournamentById(tournament.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(tournament.id);
      expect(result!.matches).toBeDefined();
      expect(result!.participations).toBeDefined();
    });

    it("should return null for non-existent tournament", async () => {
      const result = await getTournamentById("non-existent-id");

      expect(result).toBeNull();
    });

    it("should include match relations (playerA, playerB, winner)", async () => {
      const { tournament } = await createTournamentWithParticipants(2);
      await generateBracket(tournament.id);

      const result = await getTournamentById(tournament.id);

      expect(result!.matches).toHaveLength(1);
      expect(result!.matches[0].playerA).toBeDefined();
      expect(result!.matches[0].playerB).toBeDefined();
      expect(result!.matches[0].playerA.displayName).toBeDefined();
    });

    it("should include participation relations (user)", async () => {
      const { tournament } = await createTournamentWithParticipants(3);

      const result = await getTournamentById(tournament.id);

      expect(result!.participations).toHaveLength(3);
      expect(result!.participations[0].user).toBeDefined();
      expect(result!.participations[0].user.email).toBeDefined();
    });

    it("should order matches by scheduledAt ascending", async () => {
      const { tournament, users } = await createTournamentWithParticipants(2);

      const { createMatch } = await import("../matchService");
      await createMatch({
        tournamentId: tournament.id,
        playerAId: users[0].id,
        playerBId: users[1].id,
        scheduledAt: new Date("2025-01-20T15:00:00Z").toISOString(),
      });
      await createMatch({
        tournamentId: tournament.id,
        playerAId: users[0].id,
        playerBId: users[1].id,
        scheduledAt: new Date("2025-01-20T10:00:00Z").toISOString(),
      });

      const result = await getTournamentById(tournament.id);

      expect(result!.matches).toHaveLength(2);
      expect(result!.matches[0].scheduledAt!.getTime()).toBeLessThan(
        result!.matches[1].scheduledAt!.getTime()
      );
    });

    it("should order participations by wins desc, then losses asc", async () => {
      const { tournament } = await createTournamentWithParticipants(3);

      const { prisma } = await import("../../lib/prisma");
      const participations = await prisma.participation.findMany({
        where: { tournamentId: tournament.id },
      });

      // Set stats: same wins, different losses
      await prisma.participation.update({
        where: { id: participations[0].id },
        data: { wins: 2, losses: 3 },
      });
      await prisma.participation.update({
        where: { id: participations[1].id },
        data: { wins: 2, losses: 1 },
      });
      await prisma.participation.update({
        where: { id: participations[2].id },
        data: { wins: 3, losses: 2 },
      });

      const result = await getTournamentById(tournament.id);

      // Should be ordered: 3 wins first, then 2 wins with 1 loss, then 2 wins with 3 losses
      expect(result!.participations[0].wins).toBe(3);
      expect(result!.participations[1].wins).toBe(2);
      expect(result!.participations[1].losses).toBe(1);
      expect(result!.participations[2].wins).toBe(2);
      expect(result!.participations[2].losses).toBe(3);
    });
  });
});
