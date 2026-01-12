/**
 * Generates a single-elimination bracket for a tournament
 * Randomly assigns participants to matches
 */
export declare function generateBracket(tournamentId: string): Promise<{
    tournamentId: string;
    numRounds: number;
    numParticipants: number;
    numByes: number;
    matches: ({
        playerA: {
            id: string;
            email: string;
            googleId: string;
            displayName: string;
            avatarUrl: string | null;
            expoPushToken: string | null;
            currentWinStreak: number;
            currentLossStreak: number;
            createdAt: Date;
            updatedAt: Date;
        };
        playerB: {
            id: string;
            email: string;
            googleId: string;
            displayName: string;
            avatarUrl: string | null;
            expoPushToken: string | null;
            currentWinStreak: number;
            currentLossStreak: number;
            createdAt: Date;
            updatedAt: Date;
        };
        winner: {
            id: string;
            email: string;
            googleId: string;
            displayName: string;
            avatarUrl: string | null;
            expoPushToken: string | null;
            currentWinStreak: number;
            currentLossStreak: number;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tournamentId: string;
        playerAId: string;
        playerBId: string;
        winnerId: string | null;
        roundNumber: number;
        tableNumber: number | null;
        scheduledAt: Date | null;
        completedAt: Date | null;
        reminderSentAt: Date | null;
    })[];
}>;
/**
 * Gets bracket data organized by rounds
 */
export declare function getBracketData(tournamentId: string): Promise<{
    rounds: {
        roundNumber: number;
        roundName: string;
        matches: ({
            playerA: {
                id: string;
                email: string;
                googleId: string;
                displayName: string;
                avatarUrl: string | null;
                expoPushToken: string | null;
                currentWinStreak: number;
                currentLossStreak: number;
                createdAt: Date;
                updatedAt: Date;
            };
            playerB: {
                id: string;
                email: string;
                googleId: string;
                displayName: string;
                avatarUrl: string | null;
                expoPushToken: string | null;
                currentWinStreak: number;
                currentLossStreak: number;
                createdAt: Date;
                updatedAt: Date;
            };
            winner: {
                id: string;
                email: string;
                googleId: string;
                displayName: string;
                avatarUrl: string | null;
                expoPushToken: string | null;
                currentWinStreak: number;
                currentLossStreak: number;
                createdAt: Date;
                updatedAt: Date;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tournamentId: string;
            playerAId: string;
            playerBId: string;
            winnerId: string | null;
            roundNumber: number;
            tableNumber: number | null;
            scheduledAt: Date | null;
            completedAt: Date | null;
            reminderSentAt: Date | null;
        })[];
    }[];
    numRounds: number;
    numParticipants: number;
}>;
/**
 * Advances the bracket by creating next round matches when current round is complete
 * Returns the newly created matches, or empty array if round not complete
 */
export declare function advanceBracket(tournamentId: string): Promise<({
    playerA: {
        id: string;
        email: string;
        googleId: string;
        displayName: string;
        avatarUrl: string | null;
        expoPushToken: string | null;
        currentWinStreak: number;
        currentLossStreak: number;
        createdAt: Date;
        updatedAt: Date;
    };
    playerB: {
        id: string;
        email: string;
        googleId: string;
        displayName: string;
        avatarUrl: string | null;
        expoPushToken: string | null;
        currentWinStreak: number;
        currentLossStreak: number;
        createdAt: Date;
        updatedAt: Date;
    };
    winner: {
        id: string;
        email: string;
        googleId: string;
        displayName: string;
        avatarUrl: string | null;
        expoPushToken: string | null;
        currentWinStreak: number;
        currentLossStreak: number;
        createdAt: Date;
        updatedAt: Date;
    } | null;
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tournamentId: string;
    playerAId: string;
    playerBId: string;
    winnerId: string | null;
    roundNumber: number;
    tableNumber: number | null;
    scheduledAt: Date | null;
    completedAt: Date | null;
    reminderSentAt: Date | null;
})[]>;
//# sourceMappingURL=bracketService.d.ts.map