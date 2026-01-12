import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config } from "dotenv";

config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

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
  {
    googleId: "demo-google-id-5",
    email: "maria@gmail.com",
    displayName: "Maria Santos",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
  },
  {
    googleId: "demo-google-id-6",
    email: "carlos@gmail.com",
    displayName: "Carlos Rodriguez",
    avatarUrl: "https://i.pravatar.cc/150?img=8",
  },
  {
    googleId: "demo-google-id-7",
    email: "elena@gmail.com",
    displayName: "Elena Vasquez",
    avatarUrl: "https://i.pravatar.cc/150?img=9",
  },
  {
    googleId: "demo-google-id-8",
    email: "miguel@gmail.com",
    displayName: "Miguel Torres",
    avatarUrl: "https://i.pravatar.cc/150?img=11",
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

  // Get player references for easier access
  const [daniela, nikoto, benjamin, antoine, maria, carlos, elena, miguel] = seededPlayers;

  // Tournament 1: UPCOMING with 4 participants
  await prisma.tournament.create({
    data: {
      name: "Winter Open Doubles",
      location: "Bola En Mano Bar",
      description: "Friendly 8-ball bracket using race-to-3 racks.",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 1 week + 1 day from now
      status: "UPCOMING",
      participations: {
        create: seededPlayers.slice(0, 4).map((player, idx) => ({
          userId: player.id,
          seed: idx + 1,
          wins: 0,
          losses: 0,
        })),
      },
    },
  });

  // Tournament 2: COMPLETED with 8 participants and full bracket
  // Benjamin wins the tournament!
  const completedTournament = await prisma.tournament.create({
    data: {
      name: "Spring Championship",
      location: "Bola En Mano Bar",
      description: "Eight player single elimination championship.",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      endDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      status: "COMPLETED",
      participations: {
        create: [
          // Benjamin: 3 wins, 0 losses (CHAMPION)
          { userId: benjamin.id, seed: 3, wins: 3, losses: 0 },
          // Elena: 2 wins, 1 loss (Runner-up - lost to Benjamin in final)
          { userId: elena.id, seed: 7, wins: 2, losses: 1 },
          // Nikoto: 1 win, 1 loss (Semi-finalist - lost to Benjamin)
          { userId: nikoto.id, seed: 2, wins: 1, losses: 1 },
          // Carlos: 1 win, 1 loss (Semi-finalist - lost to Elena)
          { userId: carlos.id, seed: 6, wins: 1, losses: 1 },
          // Daniela: 0 wins, 1 loss (Quarter-finalist - lost to Nikoto)
          { userId: daniela.id, seed: 1, wins: 0, losses: 1 },
          // Antoine: 0 wins, 1 loss (Quarter-finalist - lost to Benjamin)
          { userId: antoine.id, seed: 4, wins: 0, losses: 1 },
          // Maria: 0 wins, 1 loss (Quarter-finalist - lost to Carlos)
          { userId: maria.id, seed: 5, wins: 0, losses: 1 },
          // Miguel: 0 wins, 1 loss (Quarter-finalist - lost to Elena)
          { userId: miguel.id, seed: 8, wins: 0, losses: 1 },
        ],
      },
    },
  });

  // Create matches in order (must be created in round order for bracket display)
  const baseDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Start 1 week ago

  // Quarter-Finals (Round 1) - 4 matches
  // Match 1: Daniela vs Nikoto → Nikoto wins
  await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      playerAId: daniela.id,
      playerBId: nikoto.id,
      winnerId: nikoto.id,
      tableNumber: 1,
      scheduledAt: new Date(baseDate.getTime()),
      completedAt: new Date(baseDate.getTime() + 30 * 60 * 1000), // 30 min later
    },
  });

  // Match 2: Benjamin vs Antoine → Benjamin wins
  await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      playerAId: benjamin.id,
      playerBId: antoine.id,
      winnerId: benjamin.id,
      tableNumber: 2,
      scheduledAt: new Date(baseDate.getTime()),
      completedAt: new Date(baseDate.getTime() + 25 * 60 * 1000), // 25 min later
    },
  });

  // Match 3: Maria vs Carlos → Carlos wins
  await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      playerAId: maria.id,
      playerBId: carlos.id,
      winnerId: carlos.id,
      tableNumber: 3,
      scheduledAt: new Date(baseDate.getTime()),
      completedAt: new Date(baseDate.getTime() + 40 * 60 * 1000), // 40 min later
    },
  });

  // Match 4: Elena vs Miguel → Elena wins
  await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      playerAId: elena.id,
      playerBId: miguel.id,
      winnerId: elena.id,
      tableNumber: 4,
      scheduledAt: new Date(baseDate.getTime()),
      completedAt: new Date(baseDate.getTime() + 35 * 60 * 1000), // 35 min later
    },
  });

  // Semi-Finals (Round 2) - 2 matches
  // Match 5: Nikoto vs Benjamin → Benjamin wins
  await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      playerAId: nikoto.id,
      playerBId: benjamin.id,
      winnerId: benjamin.id,
      tableNumber: 1,
      scheduledAt: new Date(baseDate.getTime() + 60 * 60 * 1000), // 1 hour later
      completedAt: new Date(baseDate.getTime() + 90 * 60 * 1000), // 1.5 hours later
    },
  });

  // Match 6: Carlos vs Elena → Elena wins
  await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      playerAId: carlos.id,
      playerBId: elena.id,
      winnerId: elena.id,
      tableNumber: 2,
      scheduledAt: new Date(baseDate.getTime() + 60 * 60 * 1000), // 1 hour later
      completedAt: new Date(baseDate.getTime() + 100 * 60 * 1000), // 1h40min later
    },
  });

  // Final (Round 3) - 1 match
  // Match 7: Benjamin vs Elena → Benjamin wins (CHAMPION!)
  await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      playerAId: benjamin.id,
      playerBId: elena.id,
      winnerId: benjamin.id,
      tableNumber: 1,
      scheduledAt: new Date(baseDate.getTime() + 120 * 60 * 1000), // 2 hours later
      completedAt: new Date(baseDate.getTime() + 150 * 60 * 1000), // 2.5 hours later
    },
  });

  console.log("✅ Seed data created:");
  console.log("   - 8 players");
  console.log("   - 1 upcoming tournament (Winter Open Doubles) with 4 participants");
  console.log("   - 1 completed tournament (Spring Championship) with full bracket");
  console.log("   - 🏆 Champion: Benjamin");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
