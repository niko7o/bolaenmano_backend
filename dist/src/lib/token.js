"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.createToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const TOKEN_TTL = "7d";
const createToken = (payload) => jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
exports.createToken = createToken;
const verifyToken = (token) => jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
exports.verifyToken = verifyToken;
//# sourceMappingURL=token.js.map