import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { getNextWorkout } from "../services/adaptation";

const router = Router();
router.use(authMiddleware);

const setSchema = z.object({
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
  order: z.number().int().nonnegative(),
});

const exerciseSchema = z.object({
  name: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  sets: z.array(setSchema).min(1),
});

const createWorkoutSchema = z.object({
  date: z.string(),
  exercises: z.array(exerciseSchema).min(1),
});

// GET /workouts/next — must be before /:id
router.get("/next", async (req, res) => {
  try {
    const suggestions = await getNextWorkout(req.userId!);
    res.json({ suggestions });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /workouts
router.get("/", async (req, res) => {
  try {
    const workouts = await prisma.workout.findMany({
      where: { userId: req.userId },
      include: {
        exercises: {
          include: { sets: { orderBy: { order: "asc" } } },
        },
      },
      orderBy: { date: "desc" },
    });

    res.json(
      workouts.map((w) => ({
        id: w.id,
        date: w.date.toISOString(),
        createdAt: w.createdAt.toISOString(),
        exercises: w.exercises.map((e) => ({
          id: e.id,
          name: e.name,
          difficulty: e.difficulty,
          sets: e.sets.map((s) => ({
            id: s.id,
            reps: s.reps,
            weight: s.weight,
            order: s.order,
          })),
        })),
      }))
    );
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /workouts
router.post("/", async (req, res) => {
  try {
    const data = createWorkoutSchema.parse(req.body);

    const workout = await prisma.workout.create({
      data: {
        userId: req.userId!,
        date: new Date(data.date),
        exercises: {
          create: data.exercises.map((e) => ({
            name: e.name,
            difficulty: e.difficulty,
            sets: {
              create: e.sets.map((s) => ({
                reps: s.reps,
                weight: s.weight,
                order: s.order,
              })),
            },
          })),
        },
      },
      include: {
        exercises: {
          include: { sets: { orderBy: { order: "asc" } } },
        },
      },
    });

    res.json({
      id: workout.id,
      date: workout.date.toISOString(),
      createdAt: workout.createdAt.toISOString(),
      exercises: workout.exercises.map((e) => ({
        id: e.id,
        name: e.name,
        difficulty: e.difficulty,
        sets: e.sets.map((s) => ({
          id: s.id,
          reps: s.reps,
          weight: s.weight,
          order: s.order,
        })),
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

// GET /workouts/:id
router.get("/:id", async (req, res) => {
  try {
    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        exercises: {
          include: { sets: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!workout) {
      res.status(404).json({ message: "Workout not found" });
      return;
    }

    res.json({
      id: workout.id,
      date: workout.date.toISOString(),
      createdAt: workout.createdAt.toISOString(),
      exercises: workout.exercises.map((e) => ({
        id: e.id,
        name: e.name,
        difficulty: e.difficulty,
        sets: e.sets.map((s) => ({
          id: s.id,
          reps: s.reps,
          weight: s.weight,
          order: s.order,
        })),
      })),
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /workouts/:id
router.delete("/:id", async (req, res) => {
  try {
    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!workout) {
      res.status(404).json({ message: "Workout not found" });
      return;
    }
    await prisma.workout.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
