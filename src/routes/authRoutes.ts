import { Router } from "express";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { verifyGoogleToken } from "../lib/google";
import { createToken } from "../lib/token";
import { upsertGoogleUser } from "../services/userService";
import { isAdminEmail } from "../lib/admin";
import { env } from "../config/env";

const router = Router();

const authSchema = z.object({
  idToken: z.string().min(10),
});

const codeExchangeSchema = z.object({
  code: z.string().min(10),
  codeVerifier: z.string().min(10),
  redirectUri: z.url(),
  clientId: z.string().optional(), // Client ID used in authorization request
});

const desktopExchangeSchema = z.object({
  code: z.string().min(10),
  codeVerifier: z.string().min(10),
  redirectUri: z.url(),
});

const iosExchangeSchema = z.object({
  code: z.string().min(10),
  codeVerifier: z.string().min(10),
  redirectUri: z.url(),
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

// Desktop OAuth exchange endpoint
// Desktop apps use "Web application" type OAuth clients in Google Cloud Console
// Web application type clients are CONFIDENTIAL CLIENTS and require client_secret
// The client_secret is stored securely on the backend server
router.post("/google/exchange/desktop", async (req, res) => {
  const parseResult = desktopExchangeSchema.safeParse(req.body);

  if (!parseResult.success) {
    console.error("Desktop code exchange validation failed:", parseResult.error.flatten().fieldErrors);
    return res.status(400).json({ message: "Invalid payload", issues: parseResult.error.flatten().fieldErrors });
  }

  try {
    const { code, codeVerifier, redirectUri } = parseResult.data;
    
    // Desktop apps use GOOGLE_DESKTOP_CLIENT_ID (configured as "Web application" type)
    // Web application type OAuth clients are CONFIDENTIAL CLIENTS and require client_secret
    // Use GOOGLE_DESKTOP_CLIENT_SECRET if set, otherwise fall back to GOOGLE_CLIENT_SECRET
    const desktopClientId = env.GOOGLE_DESKTOP_CLIENT_ID || env.GOOGLE_CLIENT_ID;
    const desktopClientSecret = env.GOOGLE_DESKTOP_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET;

    if (!desktopClientId) {
      console.error("Desktop client ID is missing.");
      return res.status(500).json({ 
        message: "Desktop OAuth configuration error",
        error: "Desktop client ID is not configured",
      });
    }

    if (!desktopClientSecret) {
      console.error("Desktop client secret is missing. Web application type OAuth clients require client_secret.");
      return res.status(500).json({ 
        message: "Desktop OAuth configuration error",
        error: "Desktop client secret is not configured. Web application type OAuth clients require client_secret.",
      });
    }

    console.log("Attempting desktop code exchange (Web application type, with client_secret):", {
      clientId: desktopClientId,
      hasClientSecret: !!desktopClientSecret,
      redirectUri,
      codeLength: code.length,
      codeVerifierLength: codeVerifier.length,
      usingPKCE: true,
      clientType: "Web application (confidential client, requires client_secret)",
    });

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      code,
      client_id: desktopClientId,
      client_secret: desktopClientSecret,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });
    
    // Web application type OAuth clients are CONFIDENTIAL CLIENTS and require client_secret
    // The client_secret is stored securely on the backend, not in the Electron app

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error("Desktop token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
      });
      return res.status(401).json({ 
        message: "Unable to exchange authorization code",
        error: errorData.error || tokenResponse.statusText,
        details: errorData,
      });
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.id_token) {
      console.error("No id_token in response:", { tokens: Object.keys(tokenData) });
      return res.status(400).json({ message: "No id_token in token response" });
    }

    const googleProfile = await verifyGoogleToken(tokenData.id_token);
    const user = await upsertGoogleUser(googleProfile);
    const token = createToken({ userId: user.id });

    return res.json({
      token,
      user: { ...user, isAdmin: isAdminEmail(user.email) },
    });
  } catch (error: any) {
    console.error("Desktop Google code exchange failed:", {
      message: error?.message,
      stack: error?.stack,
    });
    return res.status(401).json({ 
      message: "Unable to exchange authorization code",
      error: error?.message || "Unknown error",
    });
  }
});

// iOS OAuth exchange endpoint
router.post("/google/exchange/ios", async (req, res) => {
  const parseResult = iosExchangeSchema.safeParse(req.body);

  if (!parseResult.success) {
    console.error("iOS code exchange validation failed:", parseResult.error.flatten().fieldErrors);
    return res.status(400).json({ message: "Invalid payload", issues: parseResult.error.flatten().fieldErrors });
  }

  try {
    const { code, codeVerifier, redirectUri } = parseResult.data;
    
    // iOS apps use GOOGLE_IOS_CLIENT_ID
    const iosClientId = env.GOOGLE_IOS_CLIENT_ID || env.GOOGLE_CLIENT_ID;
    const iosClientSecret = env.GOOGLE_CLIENT_SECRET;

    console.log("Attempting iOS code exchange:", {
      clientId: iosClientId,
      hasClientSecret: !!iosClientSecret,
      redirectUri,
      codeLength: code.length,
      codeVerifierLength: codeVerifier.length,
      usingPKCE: true,
    });

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      code,
      client_id: iosClientId,
      client_secret: iosClientSecret,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error("iOS token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
      });
      return res.status(401).json({ 
        message: "Unable to exchange authorization code",
        error: errorData.error || tokenResponse.statusText,
        details: errorData,
      });
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.id_token) {
      console.error("No id_token in response:", { tokens: Object.keys(tokenData) });
      return res.status(400).json({ message: "No id_token in token response" });
    }

    const googleProfile = await verifyGoogleToken(tokenData.id_token);
    const user = await upsertGoogleUser(googleProfile);
    const token = createToken({ userId: user.id });

    return res.json({
      token,
      user: { ...user, isAdmin: isAdminEmail(user.email) },
    });
  } catch (error: any) {
    console.error("iOS Google code exchange failed:", {
      message: error?.message,
      stack: error?.stack,
    });
    return res.status(401).json({ 
      message: "Unable to exchange authorization code",
      error: error?.message || "Unknown error",
    });
  }
});

// Legacy endpoint for backward compatibility (deprecated - use platform-specific endpoints)
router.post("/google/exchange", async (req, res) => {
  const parseResult = codeExchangeSchema.safeParse(req.body);

  if (!parseResult.success) {
    console.error("Code exchange validation failed:", parseResult.error.flatten().fieldErrors);
    return res.status(400).json({ message: "Invalid payload", issues: parseResult.error.flatten().fieldErrors });
  }

  try {
    const { code, codeVerifier, redirectUri, clientId: requestedClientId } = parseResult.data;
    
    // Use the client_id from the request if provided, otherwise fall back to desktop or default
    const exchangeClientId = requestedClientId || env.GOOGLE_DESKTOP_CLIENT_ID || env.GOOGLE_CLIENT_ID;
    
    // Determine if this is a desktop client
    const isDesktopClient = requestedClientId === env.GOOGLE_DESKTOP_CLIENT_ID || 
                           (!requestedClientId && exchangeClientId === env.GOOGLE_DESKTOP_CLIENT_ID);
    
    // For desktop clients: Use desktop client secret if available, otherwise default
    // For web/iOS clients: Use default client secret
    let clientSecret: string | undefined;
    if (isDesktopClient) {
      clientSecret = env.GOOGLE_DESKTOP_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET;
    } else {
      clientSecret = env.GOOGLE_CLIENT_SECRET;
    }

    if (!clientSecret) {
      return res.status(500).json({ 
        message: "OAuth configuration error",
        error: "Client secret is not configured",
      });
    }

    console.log("Attempting code exchange (legacy endpoint):", {
      requestedClientId,
      exchangeClientId,
      isDesktopClient,
      hasClientSecret: !!clientSecret,
      redirectUri,
      codeLength: code.length,
      codeVerifierLength: codeVerifier.length,
      usingPKCE: true,
    });

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      code,
      client_id: exchangeClientId,
      client_secret: clientSecret,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error("Token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
      });
      return res.status(401).json({ 
        message: "Unable to exchange authorization code",
        error: errorData.error || tokenResponse.statusText,
        details: errorData,
      });
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.id_token) {
      console.error("No id_token in response:", { tokens: Object.keys(tokenData) });
      return res.status(400).json({ message: "No id_token in token response" });
    }

    const googleProfile = await verifyGoogleToken(tokenData.id_token);
    const user = await upsertGoogleUser(googleProfile);
    const token = createToken({ userId: user.id });

    return res.json({
      token,
      user: { ...user, isAdmin: isAdminEmail(user.email) },
    });
  } catch (error: any) {
    console.error("Google code exchange failed:", {
      message: error?.message,
      stack: error?.stack,
    });
    return res.status(401).json({ 
      message: "Unable to exchange authorization code",
      error: error?.message || "Unknown error",
    });
  }
});

export const authRoutes = router;

