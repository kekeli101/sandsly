import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminRouter } from "./routers/admin";
import { catalogRouter } from "./routers/catalog";
import { standaloneAuthRouter } from "./routers/auth";
import { kitchenRouter } from "./routers/kitchen";
import { storefrontRouter } from "./routers/storefront";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: standaloneAuthRouter.logout,
    register: standaloneAuthRouter.register,
    login: standaloneAuthRouter.login,
    requestPasswordReset: standaloneAuthRouter.requestPasswordReset,
    resetPassword: standaloneAuthRouter.resetPassword,
  }),
  catalog: catalogRouter,
  kitchen: kitchenRouter,
  storefront: storefrontRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
