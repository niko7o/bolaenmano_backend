import { prisma } from "../lib/prisma";
import { createMatch } from "./matchService";

/**
 * Generates a single-elimination bracket for a tournament
 * Randomly assigns participants to matches
 */
export async function generateBracket(tournamentId: string) {
  // Get tournament with participants
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participations: {
        include: {
          user: true,
        },
      },
      matches: true,
    },
  });

  if (!tournament) {
    throw new Error("Tournament not found");
  }

  // Check if bracket already exists
  if (tournament.matches.length > 0) {
    throw new Error("Bracket already exists. Delete existing matches first.");
  }

  const participants = tournament.participations;
  
  if (participants.length < 2) {
    throw new Error("Need at least 2 participants to generate a bracket");
  }

  // Shuffle participants randomly
  const shuffled = [...participants].sort(() => Math.random() - 0.5);

  // Calculate number of rounds needed
  const numParticipants = shuffled.length;
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
  const numRounds = Math.log2(nextPowerOf2);
  const numByes = nextPowerOf2 - numParticipants;

  // Create matches for first round
  const firstRoundMatches: Array<{
    playerAId: string | null;
    playerBId: string | null;
  }> = [];

  let participantIndex = 0;

  // Create matches with actual participants
  for (let i = 0; i < numParticipants - numByes; i += 2) {
    firstRoundMatches.push({
      playerAId: shuffled[participantIndex]?.userId || null,
      playerBId: shuffled[participantIndex + 1]?.userId || null,
    });
    participantIndex += 2;
  }

  // Add byes (single participant matches)
  for (let i = 0; i < numByes; i++) {
    firstRoundMatches.push({
      playerAId: shuffled[participantIndex]?.userId || null,
      playerBId: null, // Bye - no opponent
    });
    participantIndex++;
  }

  // Create all first round matches in database
  const createdMatches = [];
  for (const match of firstRoundMatches) {
    if (match.playerBId) {
      // Regular match with two players
      const created = await createMatch({
        tournamentId,
        playerAId: match.playerAId!,
        playerBId: match.playerBId,
      });
      createdMatches.push(created);
    } else if (match.playerAId) {
      // Bye - player advances automatically without a match
      // We'll skip creating a match for byes and handle them in bracket progression
      // For now, we'll create a placeholder match that's already completed
      // In a real bracket system, you'd handle byes when advancing to next round
      // For simplicity, we create a match with playerA vs playerA and mark playerA as winner
      const created = await createMatch({
        tournamentId,
        playerAId: match.playerAId,
        playerBId: match.playerAId, // Placeholder - represents a bye
      });
      // Mark playerA as winner immediately for bye
      const updated = await prisma.match.update({
        where: { id: created.id },
        data: {
          winnerId: match.playerAId,
          completedAt: new Date(),
        },
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
      });
      createdMatches.push(updated);
    }
  }

  return {
    tournamentId,
    numRounds,
    numParticipants,
    numByes,
    matches: createdMatches,
  };
}

/**
 * Gets bracket data organized by rounds
 */
export async function getBracketData(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      matches: {
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      participations: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!tournament) {
    throw new Error("Tournament not found");
  }

  const matches = tournament.matches;
  const numParticipants = tournament.participations.length;

  if (matches.length === 0) {
    return {
      rounds: [],
      numRounds: 0,
      numParticipants,
    };
  }

  // Calculate number of rounds based on participants
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
  const numRounds = Math.log2(nextPowerOf2);

  // For now, we only create first round matches in generateBracket
  // So we'll organize matches by creation order and group them logically
  // First round matches are those created initially
  const firstRoundMatchCount = Math.ceil(numParticipants / 2);
  const firstRoundMatches = matches.slice(0, firstRoundMatchCount);
  const subsequentMatches = matches.slice(firstRoundMatchCount);

  // Organize matches by round
  const rounds: Array<{
    roundNumber: number;
    roundName: string;
    matches: typeof matches;
  }> = [];

  // First round
  if (firstRoundMatches.length > 0) {
    rounds.push({
      roundNumber: 1,
      roundName: getRoundName(1, numRounds),
      matches: firstRoundMatches,
    });
  }

  // Subsequent rounds (if any matches exist beyond first round)
  // In a full bracket system, these would be created as winners advance
  // For now, we'll show any additional matches as subsequent rounds
  if (subsequentMatches.length > 0) {
    let currentRound = 2;
    let remainingMatches = [...subsequentMatches];
    
    while (remainingMatches.length > 0 && currentRound <= numRounds) {
      const expectedMatchesInRound = Math.pow(2, numRounds - currentRound);
      const matchesInRound = remainingMatches.slice(0, expectedMatchesInRound);
      
      if (matchesInRound.length > 0) {
        rounds.push({
          roundNumber: currentRound,
          roundName: getRoundName(currentRound, numRounds),
          matches: matchesInRound,
        });
        remainingMatches = remainingMatches.slice(expectedMatchesInRound);
      }
      currentRound++;
    }
  }

  return {
    rounds,
    numRounds,
    numParticipants,
  };
}

function getRoundName(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Final";
  if (round === totalRounds - 1) return "Semi-Finals";
  if (round === totalRounds - 2) return "Quarter-Finals";
  return `Round ${round}`;
}

