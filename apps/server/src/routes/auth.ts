import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword, generateToken } from "../lib/auth";
import { authMiddleware } from "../middleware/auth";
import { generateVerificationCode, sendVerificationEmail } from "../lib/email";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const verifySchema = z.object({
  code: z.string().length(6),
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: "Такой богатырь уже в семье!" });
      return;
    }

    const hashed = await hashPassword(password);
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name || "",
        verificationCode: code,
        verificationCodeExpiresAt: expiresAt,
      },
    });

    // Отправляем код на почту
    try {
      await sendVerificationEmail(email, code, name || "");
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, emailVerified: false },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Подтверждение кода
router.post("/verify", authMiddleware, async (req, res) => {
  try {
    const { code } = verifySchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ message: "Пользователь не найден" });
      return;
    }

    if (user.emailVerified) {
      res.json({ success: true, emailVerified: true });
      return;
    }

    if (
      !user.verificationCode ||
      !user.verificationCodeExpiresAt ||
      user.verificationCode !== code ||
      user.verificationCodeExpiresAt < new Date()
    ) {
      res.status(400).json({ message: "Неверный или просроченный код" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });

    res.json({ success: true, emailVerified: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Повторная отправка кода
router.post("/resend-code", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ message: "Пользователь не найден" });
      return;
    }

    if (user.emailVerified) {
      res.json({ success: true, message: "Email уже подтверждён" });
      return;
    }

    // Rate limit: не чаще чем раз в 2 минуты
    if (
      user.verificationCodeExpiresAt &&
      user.verificationCodeExpiresAt > new Date(Date.now() + 8 * 60 * 1000)
    ) {
      res.status(429).json({ message: "Подожди немного перед повторной отправкой" });
      return;
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: code, verificationCodeExpiresAt: expiresAt },
    });

    try {
      await sendVerificationEmail(user.email, code, user.name);
    } catch (emailErr) {
      console.error("Failed to resend verification email:", emailErr);
      res.status(500).json({ message: "Ошибка отправки письма" });
      return;
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
