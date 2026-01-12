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
  // Original 8 players
  {
    googleId: "demo-google-id-1",
    email: "daniela@gmail.com",
    displayName: "Daniela Pinos",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
  },
  {
    googleId: "demo-google-id-2",
    email: "david@gmail.com",
    displayName: "David Perez",
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
  // New 8 players for 16-player tournament
  {
    googleId: "demo-google-id-9",
    email: "sofia@gmail.com",
    displayName: "Sofia Garcia",
    avatarUrl: "https://i.pravatar.cc/150?img=24",
  },
  {
    googleId: "demo-google-id-10",
    email: "diego@gmail.com",
    displayName: "Diego Fernandez",
    avatarUrl: "https://i.pravatar.cc/150?img=33",
  },
  {
    googleId: "demo-google-id-11",
    email: "isabella@gmail.com",
    displayName: "Isabella Martinez",
    avatarUrl: "https://i.pravatar.cc/150?img=25",
  },
  {
    googleId: "demo-google-id-12",
    email: "lucas@gmail.com",
    displayName: "Lucas Herrera",
    avatarUrl: "https://i.pravatar.cc/150?img=51",
  },
  {
    googleId: "demo-google-id-13",
    email: "valentina@gmail.com",
    displayName: "Valentina Lopez",
    avatarUrl: "https://i.pravatar.cc/150?img=26",
  },
  {
    googleId: "demo-google-id-14",
    email: "mateo@gmail.com",
    displayName: "Mateo Silva",
    avatarUrl: "https://i.pravatar.cc/150?img=52",
  },
  {
    googleId: "demo-google-id-15",
    email: "camila@gmail.com",
    displayName: "Camila Moreno",
    avatarUrl: "https://i.pravatar.cc/150?img=27",
  },
  {
    googleId: "demo-google-id-16",
    email: "andres@gmail.com",
    displayName: "Andres Ruiz",
    avatarUrl: "https://i.pravatar.cc/150?img=53",
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
  const [
    daniela, david, benjamin, antoine, maria, carlos, elena, miguel,
    sofia, diego, isabella, lucas, valentina, mateo, camila, andres
  ] = seededPlayers;

  // TypeScript non-null assertions since we know we have exactly 16 players
  if (!daniela || !david || !benjamin || !antoine || !maria || !carlos || !elena || !miguel ||
      !sofia || !diego || !isabella || !lucas || !valentina || !mateo || !camila || !andres) {
    throw new Error("Failed to seed all players");
  }

  // Tournament 1: UPCOMING with 4 participants
  await prisma.tournament.create({
    data: {
      name: "Winter Open Doubles",
      location: "Bola En Mano Bar",
      description: "Friendly 8-ball bracket using race-to-3 racks.",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
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

  // Tournament 2: COMPLETED 8-player (Spring Championship)
  const spring8Tournament = await prisma.tournament.create({
    data: {
      name: "Spring Championship",
      location: "Bola En Mano Bar",
      description: "Eight player single elimination championship.",
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
      participations: {
        create: [
          { userId: benjamin?.id || 'aaaa', seed: 3, wins: 3, losses: 0 },
          { userId: elena?.id || 'bbbb', seed: 7, wins: 2, losses: 1 },
          { userId: david?.id || 'cccc', seed: 2, wins: 1, losses: 1 },
          { userId: carlos?.id || 'dddd', seed: 6, wins: 1, losses: 1 },
          { userId: daniela?.id || 'eeee', seed: 1, wins: 0, losses: 1 },
          { userId: antoine?.id || 'ffff', seed: 4, wins: 0, losses: 1 },
          { userId: maria?.id || 'gggg', seed: 5, wins: 0, losses: 1 },
          { userId: miguel?.id || 'hhhh', seed: 8, wins: 0, losses: 1 },
        ],
      },
    },
  });

  // Spring 8-player matches (8 players = 3 rounds: QF, SF, Final)
  const springBase = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  
  // QF (Round 1)
  await prisma.match.create({ data: { tournamentId: spring8Tournament.id, playerAId: daniela?.id || 'aaaa', playerBId: david?.id || 'bbbb', winnerId: david?.id || 'bbbb', roundNumber: 1, tableNumber: 1, scheduledAt: springBase, completedAt: new Date(springBase.getTime() + 30 * 60000) } });
  await prisma.match.create({ data: { tournamentId: spring8Tournament.id, playerAId: benjamin?.id || 'cccc', playerBId: antoine?.id || 'dddd', winnerId: benjamin?.id || 'cccc', roundNumber: 1, tableNumber: 2, scheduledAt: springBase, completedAt: new Date(springBase.getTime() + 25 * 60000) } });
  await prisma.match.create({ data: { tournamentId: spring8Tournament.id, playerAId: maria?.id || 'eeee', playerBId: carlos?.id || 'ffff', winnerId: carlos?.id || 'ffff', roundNumber: 1, tableNumber: 3, scheduledAt: springBase, completedAt: new Date(springBase.getTime() + 40 * 60000) } });
  await prisma.match.create({ data: { tournamentId: spring8Tournament.id, playerAId: elena?.id || 'gggg', playerBId: miguel?.id || 'hhhh', winnerId: elena?.id || 'gggg', roundNumber: 1, tableNumber: 4, scheduledAt: springBase, completedAt: new Date(springBase.getTime() + 35 * 60000) } });
  // SF (Round 2)
  await prisma.match.create({ data: { tournamentId: spring8Tournament.id, playerAId: david?.id || 'cccc', playerBId: benjamin?.id || 'cccc', winnerId: benjamin?.id || 'cccc', roundNumber: 2, tableNumber: 1, scheduledAt: new Date(springBase.getTime() + 60 * 60000), completedAt: new Date(springBase.getTime() + 90 * 60000) } });
  await prisma.match.create({ data: { tournamentId: spring8Tournament.id, playerAId: carlos?.id || 'dddd', playerBId: elena?.id || 'gggg', winnerId: elena?.id || 'gggg', roundNumber: 2, tableNumber: 2, scheduledAt: new Date(springBase.getTime() + 60 * 60000), completedAt: new Date(springBase.getTime() + 100 * 60000) } });
  // Final (Round 3)
  await prisma.match.create({ data: { tournamentId: spring8Tournament.id, playerAId: benjamin?.id || 'cccc', playerBId: elena?.id || 'gggg', winnerId: benjamin?.id || 'cccc', roundNumber: 3, tableNumber: 1, scheduledAt: new Date(springBase.getTime() + 120 * 60000), completedAt: new Date(springBase.getTime() + 150 * 60000) } });

  // Tournament 3: COMPLETED 16-player (Summer Championship)
  // Benjamin wins again!
  const summer16Tournament = await prisma.tournament.create({
    data: {
      name: "Summer Championship",
      location: "Bola En Mano Bar",
      description: "Sixteen player single elimination championship - the biggest tournament of the year!",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
      participations: {
        create: [
          // Champion: Benjamin (4 wins)
          { userId: benjamin!.id, seed: 3, wins: 4, losses: 0 },
          // Runner-up: Camila (3 wins, lost final)
          { userId: camila!.id, seed: 15, wins: 3, losses: 1 },
          // Semi-finalists (2 wins each)
          { userId: elena!.id, seed: 7, wins: 2, losses: 1 },
          { userId: lucas!.id, seed: 12, wins: 2, losses: 1 },
          // Quarter-finalists (1 win each)
          { userId: david!.id, seed: 2, wins: 1, losses: 1 },
          { userId: carlos!.id, seed: 6, wins: 1, losses: 1 },
          { userId: sofia!.id, seed: 9, wins: 1, losses: 1 },
          { userId: mateo!.id, seed: 14, wins: 1, losses: 1 },
          // Round of 16 losers (0 wins)
          { userId: daniela!.id, seed: 1, wins: 0, losses: 1 },
          { userId: antoine!.id, seed: 4, wins: 0, losses: 1 },
          { userId: maria!.id, seed: 5, wins: 0, losses: 1 },
          { userId: miguel!.id, seed: 8, wins: 0, losses: 1 },
          { userId: diego!.id, seed: 10, wins: 0, losses: 1 },
          { userId: isabella!.id, seed: 11, wins: 0, losses: 1 },
          { userId: valentina!.id, seed: 13, wins: 0, losses: 1 },
          { userId: andres!.id, seed: 16, wins: 0, losses: 1 },
        ],
      },
    },
  });

  // 16-player bracket matches (16 players = 4 rounds: R16, QF, SF, Final)
  const summerBase = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Round of 16 (Round 1, 8 matches)
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: daniela!.id, playerBId: david!.id, winnerId: david!.id, roundNumber: 1, tableNumber: 1, scheduledAt: summerBase, completedAt: new Date(summerBase.getTime() + 25 * 60000) } });
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: benjamin!.id, playerBId: antoine!.id, winnerId: benjamin!.id, roundNumber: 1, tableNumber: 2, scheduledAt: summerBase, completedAt: new Date(summerBase.getTime() + 20 * 60000) } });
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: maria!.id, playerBId: carlos!.id, winnerId: carlos!.id, roundNumber: 1, tableNumber: 3, scheduledAt: summerBase, completedAt: new Date(summerBase.getTime() + 30 * 60000) } });
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: elena!.id, playerBId: miguel!.id, winnerId: elena!.id, roundNumber: 1, tableNumber: 4, scheduledAt: summerBase, completedAt: new Date(summerBase.getTime() + 22 * 60000) } });
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: sofia!.id, playerBId: diego!.id, winnerId: sofia!.id, roundNumber: 1, tableNumber: 5, scheduledAt: summerBase, completedAt: new Date(summerBase.getTime() + 28 * 60000) } });
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: isabella!.id, playerBId: lucas!.id, winnerId: lucas!.id, roundNumber: 1, tableNumber: 6, scheduledAt: summerBase, completedAt: new Date(summerBase.getTime() + 35 * 60000) } });
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: valentina!.id, playerBId: mateo!.id, winnerId: mateo!.id, roundNumber: 1, tableNumber: 7, scheduledAt: summerBase, completedAt: new Date(summerBase.getTime() + 27 * 60000) } });
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: camila!.id, playerBId: andres!.id, winnerId: camila!.id, roundNumber: 1, tableNumber: 8, scheduledAt: summerBase, completedAt: new Date(summerBase.getTime() + 18 * 60000) } });

  // Quarter-Finals (Round 2, 4 matches)
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: david!.id, playerBId: benjamin!.id, winnerId: benjamin!.id, roundNumber: 2, tableNumber: 1, scheduledAt: new Date(summerBase.getTime() + 60 * 60000), completedAt: new Date(summerBase.getTime() + 85 * 60000) } });
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: carlos!.id, playerBId: elena!.id, winnerId: elena!.id, roundNumber: 2, tableNumber: 2, scheduledAt: new Date(summerBase.getTime() + 60 * 60000), completedAt: new Date(summerBase.getTime() + 90 * 60000) } });
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: sofia!.id, playerBId: lucas!.id, winnerId: lucas!.id, roundNumber: 2, tableNumber: 3, scheduledAt: new Date(summerBase.getTime() + 60 * 60000), completedAt: new Date(summerBase.getTime() + 95 * 60000) } });
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: mateo!.id, playerBId: camila!.id, winnerId: camila!.id, roundNumber: 2, tableNumber: 4, scheduledAt: new Date(summerBase.getTime() + 60 * 60000), completedAt: new Date(summerBase.getTime() + 80 * 60000) } });

  // Semi-Finals (Round 3, 2 matches)
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: benjamin!.id, playerBId: elena!.id, winnerId: benjamin!.id, roundNumber: 3, tableNumber: 1, scheduledAt: new Date(summerBase.getTime() + 120 * 60000), completedAt: new Date(summerBase.getTime() + 150 * 60000) } });
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: lucas!.id, playerBId: camila!.id, winnerId: camila!.id, roundNumber: 3, tableNumber: 2, scheduledAt: new Date(summerBase.getTime() + 120 * 60000), completedAt: new Date(summerBase.getTime() + 155 * 60000) } });

  // Final (Round 4, 1 match)
  await prisma.match.create({ data: { tournamentId: summer16Tournament.id, playerAId: benjamin!.id, playerBId: camila!.id, winnerId: benjamin!.id, roundNumber: 4, tableNumber: 1, scheduledAt: new Date(summerBase.getTime() + 180 * 60000), completedAt: new Date(summerBase.getTime() + 220 * 60000) } });

  console.log("✅ Seed data created:");
  console.log("   - 16 players");
  console.log("   - 1 upcoming tournament (Winter Open Doubles) with 4 participants");
  console.log("   - 1 completed 8-player tournament (Spring Championship)");
  console.log("   - 1 completed 16-player tournament (Summer Championship)");
  console.log("   - 🏆 Champion: Benjamin (won both completed tournaments!)");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
