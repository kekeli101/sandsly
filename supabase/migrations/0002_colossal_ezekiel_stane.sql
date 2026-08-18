CREATE TYPE "public"."order_type" AS ENUM('pickup', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash_on_pickup', 'cash_on_delivery', 'mobile_money', 'card');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'successful', 'failed', 'refunded');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'out_for_delivery' BEFORE 'completed';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'delivered' BEFORE 'completed';--> statement-breakpoint
CREATE TABLE "orderStatusHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"previousStatus" "order_status",
	"nextStatus" "order_status" NOT NULL,
	"changedByUserId" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"amountPesewas" integer NOT NULL,
	"providerReference" varchar(160),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_orderId_unique" UNIQUE("orderId")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "orderType" "order_type" DEFAULT 'pickup' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deliveryPhone" varchar(32);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deliveryAddress" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deliveryInstructions" varchar(280);--> statement-breakpoint
ALTER TABLE "orderStatusHistory" ADD CONSTRAINT "orderStatusHistory_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderStatusHistory" ADD CONSTRAINT "orderStatusHistory_changedByUserId_users_id_fk" FOREIGN KEY ("changedByUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_status_history_order_created_idx" ON "orderStatusHistory" USING btree ("orderId","createdAt");