import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { config } from "dotenv";

config();

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const players = [
  {
    googleId: "demo-google-id-1",
    email: "daniela@gmail.com",
    displayName: "Daniela Pinos",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
  },
  {
    googleId: "demo-google-id-2",
    email: "nikoto@gmail.com",
    displayName: "Nikoto",
    avatarUrl: "https://i.pravatar.cc/150?img=31",
  },
  {
    googleId: "demo-google-id-3",
    email: "benji@gmail.com",
    displayName: "Benjamin",
    avatarUrl: "https://i.pravatar.cc/150?img=15",
  },
  {
    googleId: "demo-google-id-4",
    email: "antoine@gmail.com",
    displayName: "Antoine Radier",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
  },
];

const main = async () => {
  await prisma.match.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.user.deleteMany();

  const seededPlayers = [];

  for (const player of players) {
    seededPlayers.push(await prisma.user.create({ data: player }));
  }

  const currentTournament = await prisma.tournament.create({
    data: {
      name: "Winter Open Doubles",
      location: "Bola En Mano Bar",
      description: "Friendly 8-ball bracket using race-to-3 racks.",
      startDate: new Date(),
      status: "ACTIVE",
      participations: {
        create: seededPlayers.map((player, idx) => ({
          userId: player.id,
          seed: idx + 1,
          wins: idx % 2 === 0 ? 3 : 1,
          losses: idx % 2 === 0 ? 0 : 2,
        })),
      },
    },
    include: {
      participations: true,
    },
  });

  const [playerOne, playerTwo, playerThree, playerFour] = seededPlayers;

  if (!playerOne || !playerTwo || !playerThree || !playerFour) {
    throw new Error("Seed data failed to create all demo players");
  }

  await prisma.match.createMany({
    data: [
      {
        tournamentId: currentTournament.id,
        playerAId: playerOne.id,
        playerBId: playerTwo.id,
        tableNumber: 4,
        scheduledAt: new Date(),
      },
      {
        tournamentId: currentTournament.id,
        playerAId: playerThree.id,
        playerBId: playerFour.id,
        tableNumber: 2,
        scheduledAt: new Date(Date.now() + 30 * 60000),
      },
    ],
  });

  await prisma.tournament.create({
    data: {
      name: "Fall Invitational",
      location: "Bola En Mano Bar",
      description: "Eight player single elimination.",
      startDate: new Date("2025-09-15T18:00:00Z"),
      endDate: new Date("2025-09-16T23:00:00Z"),
      status: "COMPLETED",
      participations: {
        create: [playerOne, playerTwo, playerThree, playerFour].map((player, idx) => ({
          userId: player.id,
          seed: idx + 1,
          wins: Math.max(0, 3 - idx),
          losses: idx,
        })),
      },
    },
  });

  console.log("✅ Seed data created");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

