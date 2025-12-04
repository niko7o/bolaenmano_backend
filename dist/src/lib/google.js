"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleToken = void 0;
const google_auth_library_1 = require("google-auth-library");
const env_1 = require("../config/env");
const client = new google_auth_library_1.OAuth2Client(env_1.env.GOOGLE_CLIENT_ID);
const verifyGoogleToken = async (idToken) => {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: env_1.env.GOOGLE_CLIENT_ID,
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
exports.verifyGoogleToken = verifyGoogleToken;
//# sourceMappingURL=google.js.map