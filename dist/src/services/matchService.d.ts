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
    tableNumber?: number | null;
    scheduledAt?: string | null;
};
export type UpdateMatchPayload = {
    playerAId?: string;
    playerBId?: string;
    tableNumber?: number | null;
    scheduledAt?: string | null;
    completedAt?: string | null;
    winnerId?: string | null;
};
export declare const listMatches: ({ tournamentId, scope }: ListMatchesFilters) => Prisma.PrismaPromise<({
    playerA: {
        id: string;
        email: string;
        googleId: string;
        displayName: string;
        avatarUrl: string | null;
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
})[]>;
export declare const getMatchById: (matchId: string) => Prisma.Prisma__MatchClient<({
    playerA: {
        id: string;
        email: string;
        googleId: string;
        displayName: string;
        avatarUrl: string | null;
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
}) | null, null, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
export declare const createMatch: (payload: CreateMatchPayload) => Prisma.Prisma__MatchClient<{
    playerA: {
        id: string;
        email: string;
        googleId: string;
        displayName: string;
        avatarUrl: string | null;
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
}, never, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
export declare const updateMatch: (matchId: string, payload: UpdateMatchPayload) => Prisma.Prisma__MatchClient<{
    playerA: {
        id: string;
        email: string;
        googleId: string;
        displayName: string;
        avatarUrl: string | null;
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
}, never, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
export {};
//# sourceMappingURL=matchService.d.ts.map