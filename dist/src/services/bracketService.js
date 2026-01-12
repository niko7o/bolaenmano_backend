"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBracket = generateBracket;
exports.getBracketData = getBracketData;
exports.advanceBracket = advanceBracket;
const prisma_1 = require("../lib/prisma");
const matchService_1 = require("./matchService");
/**
 * Generates a single-elimination bracket for a tournament
 * Randomly assigns participants to matches
 */
async function generateBracket(tournamentId) {
    // Get tournament with participants
    const tournament = await prisma_1.prisma.tournament.findUnique({
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
    const firstRoundMatches = [];
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
            const created = await (0, matchService_1.createMatch)({
                tournamentId,
                playerAId: match.playerAId,
                playerBId: match.playerBId,
                roundNumber: 1,
            });
            createdMatches.push(created);
        }
        else if (match.playerAId) {
            // Bye - player advances automatically without a match
            // We'll skip creating a match for byes and handle them in bracket progression
            // For now, we'll create a placeholder match that's already completed
            // In a real bracket system, you'd handle byes when advancing to next round
            // For simplicity, we create a match with playerA vs playerA and mark playerA as winner
            const created = await (0, matchService_1.createMatch)({
                tournamentId,
                playerAId: match.playerAId,
                playerBId: match.playerAId, // Placeholder - represents a bye
                roundNumber: 1,
            });
            // Mark playerA as winner immediately for bye
            const updated = await prisma_1.prisma.match.update({
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
async function getBracketData(tournamentId) {
    const tournament = await prisma_1.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            matches: {
                include: {
                    playerA: true,
                    playerB: true,
                    winner: true,
                },
                orderBy: [
                    { roundNumber: "asc" },
                    { createdAt: "asc" },
                ],
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
    // Group matches by roundNumber
    const matchesByRound = new Map();
    for (const match of matches) {
        const roundMatches = matchesByRound.get(match.roundNumber) || [];
        roundMatches.push(match);
        matchesByRound.set(match.roundNumber, roundMatches);
    }
    // Organize matches by round
    const rounds = [];
    // Sort round numbers and create round objects
    const sortedRoundNumbers = Array.from(matchesByRound.keys()).sort((a, b) => a - b);
    for (const roundNum of sortedRoundNumbers) {
        const roundMatches = matchesByRound.get(roundNum) || [];
        rounds.push({
            roundNumber: roundNum,
            roundName: getRoundName(roundNum, numRounds),
            matches: roundMatches,
        });
    }
    return {
        rounds,
        numRounds,
        numParticipants,
    };
}
/**
 * Advances the bracket by creating next round matches when current round is complete
 * Returns the newly created matches, or empty array if round not complete
 */
async function advanceBracket(tournamentId) {
    // Get all matches for the tournament
    const matches = await prisma_1.prisma.match.findMany({
        where: { tournamentId },
        include: {
            playerA: true,
            playerB: true,
            winner: true,
        },
        orderBy: [
            { roundNumber: "asc" },
            { createdAt: "asc" },
        ],
    });
    if (matches.length === 0) {
        return [];
    }
    // Group matches by round
    const matchesByRound = new Map();
    for (const match of matches) {
        const roundMatches = matchesByRound.get(match.roundNumber) || [];
        roundMatches.push(match);
        matchesByRound.set(match.roundNumber, roundMatches);
    }
    // Find the highest round with matches
    const highestRound = Math.max(...matchesByRound.keys());
    const currentRoundMatches = matchesByRound.get(highestRound) || [];
    // Check if all matches in the current round have winners
    const allMatchesComplete = currentRoundMatches.every(match => match.winnerId !== null);
    if (!allMatchesComplete) {
        return [];
    }
    // If only 1 match in current round and it's complete, tournament is finished
    if (currentRoundMatches.length === 1) {
        return [];
    }
    // Create next round matches by pairing winners
    const nextRound = highestRound + 1;
    const createdMatches = [];
    // Pair winners: match 0 winner vs match 1 winner, match 2 winner vs match 3 winner, etc.
    for (let i = 0; i < currentRoundMatches.length; i += 2) {
        const match1 = currentRoundMatches[i];
        const match2 = currentRoundMatches[i + 1];
        if (match1?.winnerId && match2?.winnerId) {
            const newMatch = await (0, matchService_1.createMatch)({
                tournamentId,
                playerAId: match1.winnerId,
                playerBId: match2.winnerId,
                roundNumber: nextRound,
            });
            createdMatches.push(newMatch);
        }
    }
    return createdMatches;
}
function getRoundName(round, totalRounds) {
    if (round === totalRounds)
        return "Final";
    if (round === totalRounds - 1)
        return "Semi-Finals";
    if (round === totalRounds - 2)
        return "Quarter-Finals";
    return `Round ${round}`;
}
//# sourceMappingURL=bracketService.js.map