import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "test@test.com" },
    update: {},
    create: {
      email: "test@test.com",
      password,
    },
  });

  // Create a sample workout with Russian exercise names
  await prisma.workout.create({
    data: {
      userId: user.id,
      date: new Date(),
      exercises: {
        create: [
          {
            name: "Жим лёжа",
            difficulty: "medium",
            sets: {
              create: [
                { reps: 8, weight: 60, order: 0 },
                { reps: 8, weight: 60, order: 1 },
                { reps: 6, weight: 60, order: 2 },
              ],
            },
          },
          {
            name: "Приседания",
            difficulty: "easy",
            sets: {
              create: [
                { reps: 10, weight: 80, order: 0 },
                { reps: 10, weight: 80, order: 1 },
                { reps: 10, weight: 80, order: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Seed complete: user test@test.com / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
