import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { getUserProfile, getUserProfileWithMatches, saveExpoPushToken } from "../services/userService";
import { isAdminEmail } from "../lib/admin";

const router = Router();

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await getUserProfile(req.userId!);

  if (!profile) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ ...profile, isAdmin: isAdminEmail(profile.email) });
});

const pushTokenSchema = z.object({
  expoPushToken: z
    .string()
    .regex(/^Expo(nent)?PushToken\[[A-Za-z0-9+=/-]+\]$/, "Invalid Expo push token format"),
});

router.post("/me/push-token", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = pushTokenSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid push token", issues: parsed.error.errors });
  }

  try {
    await saveExpoPushToken(req.userId!, parsed.data.expoPushToken);
    return res.json({ ok: true });
  } catch (error) {
    console.error("Unable to save Expo push token", error);
    return res.status(500).json({ message: "Unable to save push token" });
  }
});

const userParamsSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F-]{36}$/, { message: "Invalid user id" }),
});

router.get("/:userId", async (req, res) => {
  const parsed = userParamsSchema.safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const profile = await getUserProfileWithMatches(parsed.data.userId);

  if (!profile) {
    return res.status(404).json({ message: "User not found" });
  }

  const { matches, ...user } = profile;

  return res.json({
    ...user,
    isAdmin: isAdminEmail(user.email),
    matches,
  });
});

export const userRoutes = router;

