import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const createExerciseSchema = z.object({
  workoutId: z.string(),
  name: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  sets: z
    .array(
      z.object({
        reps: z.number().int().positive(),
        weight: z.number().nonnegative(),
        order: z.number().int().nonnegative(),
      })
    )
    .min(1),
});

router.post("/", async (req, res) => {
  try {
    const data = createExerciseSchema.parse(req.body);

    // Verify workout belongs to user
    const workout = await prisma.workout.findFirst({
      where: { id: data.workoutId, userId: req.userId },
    });
    if (!workout) {
      res.status(404).json({ message: "Workout not found" });
      return;
    }

    const exercise = await prisma.exercise.create({
      data: {
        workoutId: data.workoutId,
        name: data.name,
        difficulty: data.difficulty,
        sets: {
          create: data.sets.map((s) => ({
            reps: s.reps,
            weight: s.weight,
            order: s.order,
          })),
        },
      },
      include: { sets: { orderBy: { order: "asc" } } },
    });

    res.json({
      id: exercise.id,
      name: exercise.name,
      difficulty: exercise.difficulty,
      sets: exercise.sets.map((s) => ({
        id: s.id,
        reps: s.reps,
        weight: s.weight,
        order: s.order,
      })),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
