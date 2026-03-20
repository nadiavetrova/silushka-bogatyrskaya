import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import workoutsRouter from "./routes/workouts";
import exercisesRouter from "./routes/exercises";
import profileRouter from "./routes/profile";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"], credentials: true }));
app.use(express.json());

app.use("/auth", authRouter);
app.use("/workouts", workoutsRouter);
app.use("/exercises", exercisesRouter);
app.use("/profile", profileRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
