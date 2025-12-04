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
    currentWinStreak: number;
    currentLossStreak: number;
    createdAt: Date;
    updatedAt: Date;
} | null, null, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
export {};
//# sourceMappingURL=userService.d.ts.map