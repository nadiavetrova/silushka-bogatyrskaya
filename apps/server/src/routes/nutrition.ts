import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const ACTIVITY_COEFFICIENTS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "сидячий образ жизни",
  light: "слабая активность (1-2 тренировки)",
  moderate: "умеренная активность (3-5 тренировок)",
  active: "высокая активность (6-7 тренировок)",
  veryActive: "очень высокая активность (физический труд + спорт)",
};

// Расчёт КБЖУ по формуле Миффлина-Сан Жеора
// Мужчины: 10*вес + 6.25*рост - 5*возраст + 5
// Женщины: 10*вес + 6.25*рост - 5*возраст - 161
function calculateNutrition(age: number | null, height: number | null, weight: number | null, activityLevel: string | null, gender: string | null) {
  if (!age || !height || !weight) return null;
  const genderOffset = (gender === "male") ? 5 : -161;
  const bmr = 10 * weight + 6.25 * height - 5 * age + genderOffset;
  const coef = ACTIVITY_COEFFICIENTS[activityLevel || "moderate"] ?? 1.55;
  const tdee = Math.round(bmr * coef);
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
      select: { name: true, age: true, height: true, bodyWeight: true, activityLevel: true, gender: true, chest: true, waist: true, hips: true, biceps: true, thigh: true },
    });
    if (!user) { res.status(404).json({ message: "Пользователь не найден" }); return; }

    const nutrition = calculateNutrition(user.age ?? null, user.height ?? null, user.bodyWeight ?? null, user.activityLevel ?? null, user.gender ?? null);

    const systemPrompt = `Ты — Берегиня, мудрый ИИ-нутрициолог приложения «Силушка Богатырская».
Говоришь по-русски, дружелюбно и тепло, иногда с лёгким богатырским колоритом.
Помогаешь богатырям составлять меню питания и считать калории.

Данные пользователя:
- Имя: ${user.name || "богатырша"}
- Возраст: ${user.age ? user.age + " лет" : "не указан"}
- Рост: ${user.height ? user.height + " см" : "не указан"}
- Вес: ${user.bodyWeight ? user.bodyWeight + " кг" : "не указан"}
- Пол: ${user.gender === "male" ? "мужчина" : "женщина"}
- Уровень активности: ${ACTIVITY_LABELS[user.activityLevel ?? "moderate"] ?? "умеренная активность"}
- Обхват груди: ${user.chest ? user.chest + " см" : "не указан"}
- Обхват талии: ${user.waist ? user.waist + " см" : "не указан"}
- Обхват бёдер: ${user.hips ? user.hips + " см" : "не указан"}
- Обхват бицепса: ${user.biceps ? user.biceps + " см" : "не указан"}
- Обхват бедра: ${user.thigh ? user.thigh + " см" : "не указан"}
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

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; text: string }) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      })),
    ];

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) { res.status(500).json({ message: "GROQ API не настроен на сервере" }); return; }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      console.error("Groq error:", JSON.stringify(err));
      if (groqRes.status === 429) {
        res.status(500).json({ message: "Слишком много запросов, подожди минуту и попробуй снова" });
        return;
      }
      const errMsg = err?.error?.message || `HTTP ${groqRes.status}`;
      res.status(500).json({ message: `Groq: ${errMsg}` });
      return;
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content;
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
