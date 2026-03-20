import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const profileSchema = z.object({
  name: z.string().optional(),
  age: z.number().int().min(10).max(120).nullable().optional(),
  height: z.number().min(50).max(300).nullable().optional(),
  bodyWeight: z.number().min(20).max(500).nullable().optional(),
  chest: z.number().min(0).max(300).nullable().optional(),
  waist: z.number().min(0).max(300).nullable().optional(),
  hips: z.number().min(0).max(300).nullable().optional(),
  biceps: z.number().min(0).max(100).nullable().optional(),
  thigh: z.number().min(0).max(200).nullable().optional(),
});

// GET /profile
router.get("/", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, email: true, name: true,
        age: true, height: true, bodyWeight: true,
        chest: true, waist: true, hips: true,
        biceps: true, thigh: true,
        createdAt: true,
      },
    });
    if (!user) { res.status(404).json({ message: "Not found" }); return; }
    res.json(user);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /profile
router.put("/", async (req, res) => {
  try {
    const data = profileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true, email: true, name: true,
        age: true, height: true, bodyWeight: true,
        chest: true, waist: true, hips: true,
        biceps: true, thigh: true,
      },
    });
    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    res.status(500).json({ message: "Server error" });
  }
});

// GET /profile/measurements — история замеров
router.get("/measurements", async (req, res) => {
  try {
    const measurements = await prisma.measurement.findMany({
      where: { userId: req.userId },
      orderBy: { date: "desc" },
      take: 50,
    });
    res.json(measurements);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /profile/measurements — записать новый замер
router.post("/measurements", async (req, res) => {
  try {
    const { bodyWeight, chest, waist, hips, biceps, thigh } = req.body;
    const measurement = await prisma.measurement.create({
      data: {
        userId: req.userId!,
        bodyWeight: bodyWeight ?? null,
        chest: chest ?? null,
        waist: waist ?? null,
        hips: hips ?? null,
        biceps: biceps ?? null,
        thigh: thigh ?? null,
      },
    });
    res.json(measurement);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /profile/measurements/:id — удалить замер
router.delete("/measurements/:id", async (req, res) => {
  try {
    const measurement = await prisma.measurement.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!measurement) { res.status(404).json({ message: "Not found" }); return; }
    await prisma.measurement.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /profile — удалить аккаунт и все данные
router.delete("/", async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ message: "Account deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
