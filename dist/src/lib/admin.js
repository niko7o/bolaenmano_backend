"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminEmail = void 0;
const env_1 = require("../config/env");
const normalizeEmail = (email) => email.trim().toLowerCase();
const adminEmails = new Set(env_1.env.ADMIN_USERS.split(",")
    .map(normalizeEmail)
    .filter((email) => Boolean(email)));
const isAdminEmail = (email) => {
    if (!email) {
        return false;
    }
    return adminEmails.has(normalizeEmail(email));
};
exports.isAdminEmail = isAdminEmail;
//# sourceMappingURL=admin.js.map