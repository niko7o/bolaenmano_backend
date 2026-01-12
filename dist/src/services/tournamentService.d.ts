export declare const getCurrentTournament: () => import(".prisma/client").Prisma.Prisma__TournamentClient<({
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
    participations: ({
        user: {
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
    } & {
        id: string;
        userId: string;
        tournamentId: string;
        seed: number | null;
        wins: number;
        losses: number;
    })[];
} & {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    location: string | null;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    status: string;
}) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
export declare const getTournamentHistory: () => import(".prisma/client").Prisma.PrismaPromise<({
    participations: ({
        user: {
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
    } & {
        id: string;
        userId: string;
        tournamentId: string;
        seed: number | null;
        wins: number;
        losses: number;
    })[];
} & {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    location: string | null;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    status: string;
})[]>;
export declare const getTournamentById: (tournamentId: string) => import(".prisma/client").Prisma.Prisma__TournamentClient<({
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
    participations: ({
        user: {
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
    } & {
        id: string;
        userId: string;
        tournamentId: string;
        seed: number | null;
        wins: number;
        losses: number;
    })[];
} & {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    location: string | null;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    status: string;
}) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
//# sourceMappingURL=tournamentService.d.ts.map