import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// Расчёт КБЖУ по формуле Миффлина-Сент-Жора
function calculateNutrition(age: number | null, height: number | null, weight: number | null) {
  if (!age || !height || !weight) return null;
  const bmr = 10 * weight + 6.25 * height - 5 * age - 78;
  const tdee = Math.round(bmr * 1.55);
  const protein = Math.round(weight * 2);
  const fat = Math.round((tdee * 0.25) / 9);
  const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4);
  return { tdee, protein, fat, carbs };
}

// POST /nutrition/chat — отправить сообщение Берегине
router.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ message: "messages обязательны" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true, age: true, height: true, bodyWeight: true },
    });
    if (!user) { res.status(404).json({ message: "Пользователь не найден" }); return; }

    const nutrition = calculateNutrition(user.age ?? null, user.height ?? null, user.bodyWeight ?? null);

    const systemPrompt = `Ты — Берегиня, мудрый ИИ-нутрициолог приложения «Силушка Богатырская».
Говоришь по-русски, дружелюбно и тепло, иногда с лёгким богатырским колоритом.
Помогаешь богатырям составлять меню питания и считать калории.

Данные пользователя:
- Имя: ${user.name || "богатырша"}
- Возраст: ${user.age ? user.age + " лет" : "не указан"}
- Рост: ${user.height ? user.height + " см" : "не указан"}
- Вес: ${user.bodyWeight ? user.bodyWeight + " кг" : "не указан"}
${nutrition
  ? `\nРассчитанная суточная норма (умеренная активность):\n- Калории: ${nutrition.tdee} ккал\n- Белки: ${nutrition.protein} г\n- Жиры: ${nutrition.fat} г\n- Углеводы: ${nutrition.carbs} г`
  : "\n⚠️ Параметры пользователя не заполнены. В начале разговора спроси об уровне активности (сидячий/умеренный/активный) и рассчитай норму сама."
}

Правила составления меню:
1. Всегда указывай точные граммовки для каждого продукта
2. Для каждого приёма пищи указывай калории
3. Учитывай только продукты которые пользователь сказал что есть дома
4. Когда пользователь говорит что съел что-то лишнее — пересчитывай оставшийся план
5. В конце КАЖДОГО плана питания обязательно добавляй итоговую строку в ТОЧНОМ формате:
📊 ИТОГО: {число} ккал | Б:{число}г | У:{число}г | Ж:{число}г
6. Отвечай структурировано, с разбивкой по приёмам пищи`;

    // Системный промпт добавляем первым сообщением (совместимо со всеми моделями)
    const geminiMessages = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Понял! Буду следовать всем правилам и помогать с питанием." }] },
      ...messages.map((m: { role: string; text: string }) => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
    ];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { res.status(500).json({ message: "Gemini API не настроен на сервере" }); return; }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      console.error("Gemini error:", JSON.stringify(err));
      const geminiMsg = err?.error?.message || err?.message || `HTTP ${geminiRes.status}`;
      res.status(500).json({ message: `Gemini: ${geminiMsg}` });
      return;
    }

    const data = await geminiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) { res.status(500).json({ message: "Пустой ответ от ИИ" }); return; }

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /nutrition/plans — список сохранённых планов
router.get("/plans", async (req, res) => {
  try {
    const plans = await prisma.mealPlan.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(plans);
  } catch {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// POST /nutrition/plans — сохранить план
const savePlanSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  content: z.object({ text: z.string() }),
  totalKcal: z.number().default(0),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
});

router.post("/plans", async (req, res) => {
  try {
    const data = savePlanSchema.parse(req.body);
    const plan = await prisma.mealPlan.create({
      data: { userId: req.userId!, ...data },
    });
    res.json(plan);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ message: err.errors[0].message }); return; }
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// DELETE /nutrition/plans/:id — удалить план
router.delete("/plans/:id", async (req, res) => {
  try {
    const plan = await prisma.mealPlan.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!plan) { res.status(404).json({ message: "План не найден" }); return; }
    await prisma.mealPlan.delete({ where: { id: req.params.id } });
    res.json({ message: "Удалён" });
  } catch {
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

export default router;
