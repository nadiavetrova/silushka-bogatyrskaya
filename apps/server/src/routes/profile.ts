import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const profileSchema = z.object({
  name: z.string().optional(),
  age: z.number().int().min(0).nullable().optional(),
  height: z.number().min(0).nullable().optional(),
  bodyWeight: z.number().min(0).nullable().optional(),
  chest: z.number().min(0).nullable().optional(),
  waist: z.number().min(0).nullable().optional(),
  hips: z.number().min(0).nullable().optional(),
  biceps: z.number().min(0).nullable().optional(),
  thigh: z.number().min(0).nullable().optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "veryActive"]).optional(),
  gender: z.enum(["male", "female"]).optional(),
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
        biceps: true, thigh: true, activityLevel: true, gender: true,
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
        biceps: true, thigh: true, activityLevel: true, gender: true,
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

// POST /profile/feedback — отправить отзыв в Telegram
router.post("/feedback", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({ message: "Пустой отзыв" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { email: true, name: true } });
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const text = `📝 Отзыв от пользователя!\n\nИмя: ${user?.name || "—"}\nПочта: ${user?.email || "—"}\n\n💬 ${message.trim()}`;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    }
    res.json({ message: "Отзыв отправлен" });
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
