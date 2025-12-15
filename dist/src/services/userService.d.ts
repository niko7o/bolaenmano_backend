type UpsertPayload = {
    googleId: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
};
export declare const upsertGoogleUser: (payload: UpsertPayload) => Promise<{
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
}>;
export declare const getUserProfile: (userId: string) => Promise<({
    participations: ({
        tournament: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            location: string | null;
            description: string | null;
            startDate: Date;
            endDate: Date | null;
            status: string;
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
    email: string;
    googleId: string;
    displayName: string;
    avatarUrl: string | null;
    expoPushToken: string | null;
    currentWinStreak: number;
    currentLossStreak: number;
    createdAt: Date;
    updatedAt: Date;
}) | null>;
export declare const getUserById: (userId: string) => import(".prisma/client").Prisma.Prisma__UserClient<{
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
} | null, null, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
export declare const getUserProfileWithMatches: (userId: string) => Promise<{
    matches: ({
        tournament: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            location: string | null;
            description: string | null;
            startDate: Date;
            endDate: Date | null;
            status: string;
        };
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
        tableNumber: number | null;
        scheduledAt: Date | null;
        completedAt: Date | null;
        reminderSentAt: Date | null;
    })[];
    participations: ({
        tournament: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            location: string | null;
            description: string | null;
            startDate: Date;
            endDate: Date | null;
            status: string;
        };
    } & {
        id: string;
        userId: string;
        tournamentId: string;
        seed: number | null;
        wins: number;
        losses: number;
    })[];
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
} | null>;
export declare const saveExpoPushToken: (userId: string, expoPushToken: string) => Promise<{
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
}>;
export {};
//# sourceMappingURL=userService.d.ts.map