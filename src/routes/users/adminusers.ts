// src/routes/adminUsers.ts
import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "../../../prisma/db";

export const adminUsersRouter = Router();

const SALT_ROUNDS = 12;

const createAdminUserSchema = z
  .object({
    emailAddress: z.email().optional(),
    phoneNumber: z.string().optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(8),
    userRole: z.enum(["ADMIN", "MANAGER"]).optional(),
  })
  .refine((data) => data.emailAddress || data.phoneNumber, {
    message: "Either emailAddress or phoneNumber is required",
  });

const updateAdminUserSchema = z.object({
  emailAddress: z.email().optional(),
  phoneNumber: z.string().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
  userRole: z.enum(["ADMIN", "MANAGER"]).optional(),
});

// strip password before ever sending a record back
function toPublic<T extends { password: string }>(user: T) {
  const { password: _password, ...rest } = user;
  return rest;
}

// GET /admin-users — list
adminUsersRouter.get("/", async (req, res) => {
  const limit = Number(req.query["limit"] ?? 20);
  const offset = Number(req.query["offset"] ?? 0);

  const users = await db.orm.public.AdminUser.limit(limit).offset(offset).all();
  res.json(users.map(toPublic));
});

// GET /admin-users/:id — single record
adminUsersRouter.get("/:id", async (req, res) => {
  const id = req.params["id"] as string;
  const user = await db.orm.public.AdminUser.where({ id }).first();

  if (!user) {
    res.status(404).json({ error: "Admin user not found" });
    return;
  }
  res.json(toPublic(user));
});

// POST /admin-users — create
adminUsersRouter.post("/", async (req, res) => {
  const parsed = createAdminUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: z.treeifyError(parsed.error) });
    return;
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);

  const user = await db.orm.public.AdminUser.create({
    ...parsed.data,
    password: hashedPassword,
  });

  res.status(201).json(toPublic(user));
});

// PATCH /admin-users/:id — update
adminUsersRouter.patch("/:id", async (req, res) => {
  const id = req.params["id"] as string;
  const parsed = updateAdminUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: z.treeifyError(parsed.error) });
    return;
  }

  const data = { ...parsed.data };
  if (data.password) {
    data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  const updated = await db.orm.public.AdminUser.where({ id }).update(data);

  if (!updated) {
    res.status(404).json({ error: "Admin user not found" });
    return;
  }

  res.json(toPublic(updated));
});

// DELETE /admin-users/:id — delete
adminUsersRouter.delete("/:id", async (req, res) => {
  const id = req.params["id"] as string;
  await db.orm.public.AdminUser.where({ id }).delete();
  res.status(204).send();
});
