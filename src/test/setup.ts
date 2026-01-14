import { beforeEach } from "vitest";
import { prisma } from "../lib/prisma";

// Clean up database before each test
beforeEach(async () => {
  // Delete in order to respect foreign key constraints
  await prisma.match.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.user.deleteMany();
});
