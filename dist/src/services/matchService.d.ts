import { Prisma } from "@prisma/client";
type MatchScope = "upcoming" | "completed" | "all";
type ListMatchesFilters = {
    tournamentId?: string;
    scope?: MatchScope;
};
export type CreateMatchPayload = {
    tournamentId: string;
    playerAId: string;
    playerBId: string;
    tableNumber?: number | null | undefined;
    scheduledAt?: string | null | undefined;
    roundNumber?: number;
};
export type UpdateMatchPayload = {
    playerAId?: string;
    playerBId?: string;
    tableNumber?: number | null | undefined;
    scheduledAt?: string | null | undefined;
    completedAt?: string | null | undefined;
    winnerId?: string | null | undefined;
};
export declare const listMatches: ({ tournamentId, scope }: ListMatchesFilters) => Prisma.PrismaPromise<({
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
export declare const getMatchById: (matchId: string) => Prisma.Prisma__MatchClient<({
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
}) | null, null, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
export declare const createMatch: (payload: CreateMatchPayload) => Prisma.Prisma__MatchClient<{
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
}, never, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
export declare const updateMatch: (matchId: string, payload: UpdateMatchPayload) => Promise<{
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
}>;
export {};
//# sourceMappingURL=matchService.d.ts.map