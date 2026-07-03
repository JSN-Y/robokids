import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import userRouter from "./user";
import chaptersRouter from "./chapters";
import shopRouter from "./shop";
import leaderboardRouter from "./leaderboard";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(userRouter);
router.use(chaptersRouter);
router.use(shopRouter);
router.use(leaderboardRouter);
router.use(adminRouter);

export default router;
