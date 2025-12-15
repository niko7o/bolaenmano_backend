import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { getUserProfile, getUserProfileWithMatches } from "../services/userService";
import { isAdminEmail } from "../lib/admin";

const router = Router();

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await getUserProfile(req.userId!);

  if (!profile) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ ...profile, isAdmin: isAdminEmail(profile.email) });
});

const userParamsSchema = z.object({
  userId: z.string().uuid(),
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

