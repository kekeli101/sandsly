import { listRecentOrdersForAdmin } from "../db";
import { adminProcedure, router } from "../_core/trpc";

export const adminRouter = router({
  recentOrders: adminProcedure.query(() => listRecentOrdersForAdmin()),
});
