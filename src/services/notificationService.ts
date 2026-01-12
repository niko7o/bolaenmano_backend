import { prisma } from "../lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const REMINDER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound?: "default" | null;
  data?: Record<string, unknown>;
};

const isExpoPushToken = (token: string | null | undefined) =>
  !!token && (token.startsWith("ExponentPushToken") || token.startsWith("ExpoPushToken"));

const postExpoMessages = async (messages: ExpoPushMessage[]) => {
  if (!messages.length) {
    return;
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[notifications] Failed to send Expo push", response.status, errorText);
    }
  } catch (error) {
    console.error("[notifications] Error sending Expo push", error);
  }
};

export const sendUpcomingMatchReminders = async () => {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + REMINDER_WINDOW_MS);

  const matches = await prisma.match.findMany({
    where: {
      completedAt: null,
      reminderSentAt: null,
      scheduledAt: {
        gte: now,
        lte: oneHourFromNow,
      },
    },
    include: {
      playerA: true,
      playerB: true,
      tournament: true,
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  const notifications: ExpoPushMessage[] = [];

  matches.forEach((match) => {
    const playerPairs = [
      { target: match.playerA, opponent: match.playerB },
      { target: match.playerB, opponent: match.playerA },
    ];

    playerPairs.forEach(({ target, opponent }) => {
      if (!isExpoPushToken(target.expoPushToken)) {
        return;
      }

      notifications.push({
        to: target.expoPushToken!,
        title: "Match coming up",
        body: `Match coming up in 1 hour against ${opponent.displayName}`,
        sound: "default",
        data: {
          matchId: match.id,
          tournamentId: match.tournamentId,
        },
      });
    });
  });

  if (notifications.length) {
    await postExpoMessages(notifications);

    await prisma.match.updateMany({
      where: { id: { in: matches.map((match) => match.id) } },
      data: { reminderSentAt: new Date() },
    });
  }

  return { inspectedMatches: matches.length, sentNotifications: notifications.length };
};

export const startReminderScheduler = (intervalMs = 60_000) => {
  const tick = async () => {
    try {
      await sendUpcomingMatchReminders();
    } catch (error) {
      console.error("[notifications] Failed reminder tick", error);
    }
  };

  // run immediately on boot, then interval
  void tick();
  return setInterval(tick, intervalMs);
};

