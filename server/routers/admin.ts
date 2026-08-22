import { getAdminDashboardData, getManagerConsoleData, listRecentOrdersForAdmin } from "../db";
import { adminProcedure, router } from "../_core/trpc";

export const adminRouter = router({
  recentOrders: adminProcedure.query(() => listRecentOrdersForAdmin()),
  dashboard: adminProcedure.query(() => getAdminDashboardData()),
  console: adminProcedure.query(() => getManagerConsoleData()),
});
