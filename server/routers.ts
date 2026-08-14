import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminRouter } from "./routers/admin";
import { catalogRouter } from "./routers/catalog";
import { demoAuthRouter } from "./routers/demo-auth";
import { storefrontRouter } from "./routers/storefront";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: catalogRouter,
  demoAuth: demoAuthRouter,
  storefront: storefrontRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
