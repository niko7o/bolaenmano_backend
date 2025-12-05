import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Accept tokens from both Web and iOS clients
const VALID_AUDIENCES = [
  env.GOOGLE_CLIENT_ID, // Web Client ID
  env.GOOGLE_IOS_CLIENT_ID, // iOS Client ID
].filter(Boolean);

export const verifyGoogleToken = async (idToken: string) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: VALID_AUDIENCES,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload.sub) {
    throw new Error("Google token missing required profile fields");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    displayName: payload.name ?? payload.email,
    avatarUrl: payload.picture ?? null,
  };
};

