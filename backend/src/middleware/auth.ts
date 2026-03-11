/**
 * JWT authentication middleware for Fastify.
 *
 * Validates Supabase-issued JWTs and attaches the user ID to the request.
 * If SUPABASE_JWT_SECRET is not configured, falls back to a demo user
 * (development mode).
 */

import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface AuthUser {
  id: string;
  email?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

/**
 * Extracts and verifies the Bearer token from the Authorization header.
 * Attaches `request.user` with at minimum `{ id }`.
 *
 * Behaviour:
 * - If JWT secret is configured: verifies token signature and extracts `sub` as user ID.
 * - If JWT secret is NOT configured (dev mode): decodes without verification.
 * - If no token present: sets user to null (routes can decide whether to reject).
 */
export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    request.user = undefined;
    return;
  }

  const token = authHeader.slice(7);

  try {
    if (config.supabaseJwtSecret) {
      // Production: verify with Supabase JWT secret
      const decoded = jwt.verify(token, config.supabaseJwtSecret) as jwt.JwtPayload;
      request.user = {
        id: decoded.sub || "",
        email: decoded.email as string | undefined,
      };
    } else {
      // Development: decode without verification
      const decoded = jwt.decode(token) as jwt.JwtPayload | null;
      if (decoded?.sub) {
        request.user = {
          id: decoded.sub,
          email: decoded.email as string | undefined,
        };
      } else {
        // Fallback demo user when token is invalid/absent in dev
        request.user = { id: "demo-user" };
      }
    }
  } catch {
    // Token invalid — in dev mode, fall back to demo user
    if (!config.supabaseJwtSecret) {
      request.user = { id: "demo-user" };
    } else {
      request.user = undefined;
    }
  }
}

/**
 * Route-level guard that rejects unauthenticated requests.
 * Use as a preHandler on routes that require authentication.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({ error: "Authentication required" });
  }
}
