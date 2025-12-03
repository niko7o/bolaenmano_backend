import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { getUserProfile } from "../services/userService";
import { isAdminEmail } from "../lib/admin";

const router = Router();

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await getUserProfile(req.userId!);

  if (!profile) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ ...profile, isAdmin: isAdminEmail(profile.email) });
});

export const userRoutes = router;

