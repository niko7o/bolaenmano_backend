import { Router } from "express";
import { z } from "zod";
import { verifyGoogleToken } from "../lib/google";
import { createToken } from "../lib/token";
import { upsertGoogleUser } from "../services/userService";
import { isAdminEmail } from "../lib/admin";

const router = Router();

const authSchema = z.object({
  idToken: z.string().min(10),
});

router.post("/google", async (req, res) => {
  const parseResult = authSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parseResult.error.flatten().fieldErrors });
  }

  try {
    const googleProfile = await verifyGoogleToken(parseResult.data.idToken);
    const user = await upsertGoogleUser(googleProfile);
    const token = createToken({ userId: user.id });

    return res.json({
      token,
      user: { ...user, isAdmin: isAdminEmail(user.email) },
    });
  } catch (error) {
    console.error("Google auth failed", error);
    return res.status(401).json({ message: "Unable to verify Google token" });
  }
});

export const authRoutes = router;

