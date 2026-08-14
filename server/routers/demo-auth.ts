import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { validateDemoLogin } from "../demo-auth";

export const demoAuthRouter = router({
  login: publicProcedure.input(z.object({ username: z.string().email(), password: z.string().min(1) }))
    .mutation(({ input }) => validateDemoLogin(input.username, input.password)),
});
