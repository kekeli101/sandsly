import { listCatalog } from "../db";
import { publicProcedure, router } from "../_core/trpc";

export const catalogRouter = router({
  list: publicProcedure.query(() => listCatalog()),
});
