import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../../app";
import {
  createTournament,
  createTournamentWithParticipants,
  createUser,
} from "../../test/fixtures";
import { generateBracket } from "../../services/bracketService";
import { signToken } from "../../lib/token";
import { prisma } from "../../lib/prisma";

describe("Tournament Routes", () => {
  describe("GET /tournaments/current", () => {
    it("should return current ACTIVE tournament", async () => {
      const { app } = buildApp();
      const { tournament } = await createTournamentWithParticipants(4, {
        status: "ACTIVE",
      });
      await generateBracket(tournament.id);

      const response = await request(app).get("/tournaments/current");

      expect(response.status).toBe(200);
      expect(response.body).not.toBeNull();
      expect(response.body.id).toBe(tournament.id);
      expect(response.body.status).toBe("ACTIVE");
      expect(response.body.matches).toBeDefined();
      expect(response.body.participations).toBeDefined();
    });

    it("should return null when no current tournament exists", async () => {
      const { app } = buildApp();
      await createTournament({ status: "COMPLETED" });

      const response = await request(app).get("/tournaments/current");

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });

    it("should include match and participation relations", async () => {
      const { app } = buildApp();
      const { tournament } = await createTournamentWithParticipants(2, {
        status: "ACTIVE",
      });
      await generateBracket(tournament.id);

      const response = await request(app).get("/tournaments/current");

      expect(response.status).toBe(200);
      expect(response.body.matches).toHaveLength(1);
      expect(response.body.matches[0].playerA).toBeDefined();
      expect(response.body.matches[0].playerB).toBeDefined();
      expect(response.body.participations).toHaveLength(2);
      expect(response.body.participations[0].user).toBeDefined();
    });
  });

  describe("GET /tournaments/history", () => {
    it("should return completed tournaments", async () => {
      const { app } = buildApp();
      await createTournament({
        status: "COMPLETED",
        name: "Past Tournament 1",
        endDate: new Date("2024-12-01"),
      });
      await createTournament({
        status: "COMPLETED",
        name: "Past Tournament 2",
        endDate: new Date("2025-01-01"),
      });
      await createTournament({ status: "ACTIVE" });

      const response = await request(app).get("/tournaments/history");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every((t: any) => t.status === "COMPLETED")).toBe(true);
    });

    it("should return empty array when no completed tournaments", async () => {
      const { app } = buildApp();
      await createTournament({ status: "ACTIVE" });

      const response = await request(app).get("/tournaments/history");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it("should order by endDate descending", async () => {
      const { app } = buildApp();
      await createTournament({
        status: "COMPLETED",
        endDate: new Date("2024-12-01"),
      });
      const mostRecent = await createTournament({
        status: "COMPLETED",
        endDate: new Date("2025-01-15"),
      });

      const response = await request(app).get("/tournaments/history");

      expect(response.status).toBe(200);
      expect(response.body[0].id).toBe(mostRecent.id);
    });
  });

  describe("GET /tournaments/:tournamentId", () => {
    it("should return tournament by id", async () => {
      const { app } = buildApp();
      const { tournament } = await createTournamentWithParticipants(2);

      const response = await request(app).get(`/tournaments/${tournament.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(tournament.id);
      expect(response.body.participations).toHaveLength(2);
    });

    it("should return 404 for non-existent tournament", async () => {
      const { app } = buildApp();

      const response = await request(app).get(
        "/tournaments/00000000-0000-0000-0000-000000000000"
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tournament not found");
    });

    it("should return 400 for invalid tournament id", async () => {
      const { app } = buildApp();

      const response = await request(app).get("/tournaments/invalid-id");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid tournament id");
    });
  });

  describe("GET /tournaments/:tournamentId/bracket", () => {
    it("should return bracket data organized by rounds", async () => {
      const { app } = buildApp();
      const { tournament } = await createTournamentWithParticipants(4);
      await generateBracket(tournament.id);

      const response = await request(app).get(
        `/tournaments/${tournament.id}/bracket`
      );

      expect(response.status).toBe(200);
      expect(response.body.rounds).toBeDefined();
      expect(response.body.numRounds).toBe(2);
      expect(response.body.numParticipants).toBe(4);
      expect(response.body.rounds).toHaveLength(1); // Only first round created
    });

    it("should return empty rounds for tournament without bracket", async () => {
      const { app } = buildApp();
      const { tournament } = await createTournamentWithParticipants(4);

      const response = await request(app).get(
        `/tournaments/${tournament.id}/bracket`
      );

      expect(response.status).toBe(200);
      expect(response.body.rounds).toHaveLength(0);
    });

    it("should return 400 for invalid tournament id", async () => {
      const { app } = buildApp();

      const response = await request(app).get("/tournaments/invalid-id/bracket");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid tournament id");
    });
  });

  describe("POST /tournaments/:tournamentId/join", () => {
    it("should allow authenticated user to join UPCOMING tournament", async () => {
      const { app } = buildApp();
      const user = await createUser();
      const tournament = await createTournament({ status: "UPCOMING" });
      const token = signToken(user.id);

      const response = await request(app)
        .post(`/tournaments/${tournament.id}/join`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(user.id);
      expect(response.body.tournamentId).toBe(tournament.id);
      expect(response.body.wins).toBe(0);
      expect(response.body.losses).toBe(0);
    });

    it("should return 401 for unauthenticated request", async () => {
      const { app } = buildApp();
      const tournament = await createTournament({ status: "UPCOMING" });

      const response = await request(app).post(
        `/tournaments/${tournament.id}/join`
      );

      expect(response.status).toBe(401);
    });

    it("should return 400 when user already joined", async () => {
      const { app } = buildApp();
      const user = await createUser();
      const tournament = await createTournament({ status: "UPCOMING" });
      const token = signToken(user.id);

      // Join once
      await request(app)
        .post(`/tournaments/${tournament.id}/join`)
        .set("Authorization", `Bearer ${token}`);

      // Try to join again
      const response = await request(app)
        .post(`/tournaments/${tournament.id}/join`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Already participating in this tournament"
      );
    });

    it("should return 400 for ACTIVE tournament", async () => {
      const { app } = buildApp();
      const user = await createUser();
      const tournament = await createTournament({ status: "ACTIVE" });
      const token = signToken(user.id);

      const response = await request(app)
        .post(`/tournaments/${tournament.id}/join`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Can only join upcoming tournaments");
    });

    it("should return 400 for COMPLETED tournament", async () => {
      const { app } = buildApp();
      const user = await createUser();
      const tournament = await createTournament({ status: "COMPLETED" });
      const token = signToken(user.id);

      const response = await request(app)
        .post(`/tournaments/${tournament.id}/join`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Can only join upcoming tournaments");
    });

    it("should return 404 for non-existent tournament", async () => {
      const { app } = buildApp();
      const user = await createUser();
      const token = signToken(user.id);

      const response = await request(app)
        .post("/tournaments/00000000-0000-0000-0000-000000000000/join")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tournament not found");
    });

    it("should return 400 for invalid tournament id", async () => {
      const { app } = buildApp();
      const user = await createUser();
      const token = signToken(user.id);

      const response = await request(app)
        .post("/tournaments/invalid-id/join")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid tournament id");
    });
  });

  describe("DELETE /tournaments/:tournamentId/leave", () => {
    it("should allow authenticated user to leave UPCOMING tournament", async () => {
      const { app } = buildApp();
      const user = await createUser();
      const tournament = await createTournament({ status: "UPCOMING" });
      const token = signToken(user.id);

      // Join first
      await request(app)
        .post(`/tournaments/${tournament.id}/join`)
        .set("Authorization", `Bearer ${token}`);

      // Then leave
      const response = await request(app)
        .delete(`/tournaments/${tournament.id}/leave`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Successfully left tournament");

      // Verify participation was deleted
      const participation = await prisma.participation.findFirst({
        where: { tournamentId: tournament.id, userId: user.id },
      });
      expect(participation).toBeNull();
    });

    it("should return 401 for unauthenticated request", async () => {
      const { app } = buildApp();
      const tournament = await createTournament({ status: "UPCOMING" });

      const response = await request(app).delete(
        `/tournaments/${tournament.id}/leave`
      );

      expect(response.status).toBe(401);
    });

    it("should return 400 when user not participating", async () => {
      const { app } = buildApp();
      const user = await createUser();
      const tournament = await createTournament({ status: "UPCOMING" });
      const token = signToken(user.id);

      const response = await request(app)
        .delete(`/tournaments/${tournament.id}/leave`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Not participating in this tournament");
    });

    it("should return 400 for ACTIVE tournament", async () => {
      const { app } = buildApp();
      const user = await createUser();
      const tournament = await createTournament({ status: "UPCOMING" });
      const token = signToken(user.id);

      // Join while UPCOMING
      await request(app)
        .post(`/tournaments/${tournament.id}/join`)
        .set("Authorization", `Bearer ${token}`);

      // Change status to ACTIVE
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { status: "ACTIVE" },
      });

      // Try to leave
      const response = await request(app)
        .delete(`/tournaments/${tournament.id}/leave`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Can only leave upcoming tournaments");
    });

    it("should return 400 for COMPLETED tournament", async () => {
      const { app } = buildApp();
      const user = await createUser();
      const tournament = await createTournament({ status: "UPCOMING" });
      const token = signToken(user.id);

      // Join while UPCOMING
      await request(app)
        .post(`/tournaments/${tournament.id}/join`)
        .set("Authorization", `Bearer ${token}`);

      // Change status to COMPLETED
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { status: "COMPLETED" },
      });

      // Try to leave
      const response = await request(app)
        .delete(`/tournaments/${tournament.id}/leave`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Can only leave upcoming tournaments");
    });

    it("should return 404 for non-existent tournament", async () => {
      const { app } = buildApp();
      const user = await createUser();
      const token = signToken(user.id);

      const response = await request(app)
        .delete("/tournaments/00000000-0000-0000-0000-000000000000/leave")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Tournament not found");
    });

    it("should return 400 for invalid tournament id", async () => {
      const { app } = buildApp();
      const user = await createUser();
      const token = signToken(user.id);

      const response = await request(app)
        .delete("/tournaments/invalid-id/leave")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid tournament id");
    });
  });
});
