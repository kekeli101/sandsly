CREATE TYPE "public"."expense_category" AS ENUM('rent', 'utilities', 'payroll', 'marketing', 'delivery', 'maintenance', 'other');--> statement-breakpoint
CREATE TYPE "public"."inventory_adjustment_reason" AS ENUM('opening_count', 'purchase', 'waste', 'correction', 'order_usage');--> statement-breakpoint
CREATE TYPE "public"."inventory_unit" AS ENUM('g', 'ml', 'each', 'pack');--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "expense_category" NOT NULL,
	"description" varchar(240) NOT NULL,
	"amountPesewas" integer NOT NULL,
	"occurredAt" timestamp with time zone NOT NULL,
	"createdByUserId" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventoryAdjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"inventoryItemId" integer NOT NULL,
	"orderItemId" integer,
	"reason" "inventory_adjustment_reason" NOT NULL,
	"quantityDeltaMilliunits" integer NOT NULL,
	"unitCostPesewas" integer,
	"note" varchar(280),
	"createdByUserId" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventoryItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"unit" "inventory_unit" DEFAULT 'g' NOT NULL,
	"currentQuantityMilliunits" integer DEFAULT 0 NOT NULL,
	"reorderPointMilliunits" integer DEFAULT 0 NOT NULL,
	"unitCostPesewas" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orderIngredientUsage" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderItemId" integer NOT NULL,
	"inventoryItemId" integer NOT NULL,
	"quantityMilliunits" integer NOT NULL,
	"unitCostPesewas" integer NOT NULL,
	"totalCostPesewas" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productRecipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" varchar(64) NOT NULL,
	"inventoryItemId" integer NOT NULL,
	"quantityMilliunits" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orderItems" ADD COLUMN "isCosted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventoryAdjustments" ADD CONSTRAINT "inventoryAdjustments_inventoryItemId_inventoryItems_id_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."inventoryItems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventoryAdjustments" ADD CONSTRAINT "inventoryAdjustments_orderItemId_orderItems_id_fk" FOREIGN KEY ("orderItemId") REFERENCES "public"."orderItems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventoryAdjustments" ADD CONSTRAINT "inventoryAdjustments_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderIngredientUsage" ADD CONSTRAINT "orderIngredientUsage_orderItemId_orderItems_id_fk" FOREIGN KEY ("orderItemId") REFERENCES "public"."orderItems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderIngredientUsage" ADD CONSTRAINT "orderIngredientUsage_inventoryItemId_inventoryItems_id_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."inventoryItems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productRecipes" ADD CONSTRAINT "productRecipes_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productRecipes" ADD CONSTRAINT "productRecipes_inventoryItemId_inventoryItems_id_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."inventoryItems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_occurred_at_idx" ON "expenses" USING btree ("occurredAt");--> statement-breakpoint
CREATE INDEX "expenses_category_occurred_idx" ON "expenses" USING btree ("category","occurredAt");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_adjustments_order_line_unique" ON "inventoryAdjustments" USING btree ("orderItemId","inventoryItemId");--> statement-breakpoint
CREATE INDEX "inventory_adjustments_inventory_created_idx" ON "inventoryAdjustments" USING btree ("inventoryItemId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_items_name_lower_unique" ON "inventoryItems" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "inventory_items_active_idx" ON "inventoryItems" USING btree ("isActive");--> statement-breakpoint
CREATE UNIQUE INDEX "order_ingredient_usage_line_inventory_unique" ON "orderIngredientUsage" USING btree ("orderItemId","inventoryItemId");--> statement-breakpoint
CREATE INDEX "order_ingredient_usage_inventory_idx" ON "orderIngredientUsage" USING btree ("inventoryItemId");--> statement-breakpoint
CREATE UNIQUE INDEX "product_recipes_product_inventory_unique" ON "productRecipes" USING btree ("productId","inventoryItemId");--> statement-breakpoint
CREATE INDEX "product_recipes_product_idx" ON "productRecipes" USING btree ("productId");