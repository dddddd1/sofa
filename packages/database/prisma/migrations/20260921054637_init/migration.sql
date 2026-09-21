-- CreateEnum
CREATE TYPE "SeriesStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('laf_seat', 'raf_seat', 'armless_seat', 'corner', 'chaise', 'console', 'ottoman');

-- CreateEnum
CREATE TYPE "CoverGradeKey" AS ENUM ('fabric', 'performance', 'leather_match', 'top_grain', 'full_grain');

-- CreateEnum
CREATE TYPE "LegKey" AS ENUM ('natural', 'walnut', 'metal');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('valid', 'expired', 'consumed');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('open', 'merged', 'converted', 'abandoned');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending_payment', 'paid_pending_erp', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'cancelling', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('stripe', 'paypal');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('created', 'processing', 'succeeded', 'failed', 'canceled', 'refunded');

-- CreateEnum
CREATE TYPE "FulfillmentState" AS ENUM ('confirmed', 'in_production', 'ready', 'shipped', 'delivered');

-- CreateEnum
CREATE TYPE "ArAssetStatus" AS ENUM ('queued', 'processing', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('owner', 'merchant_editor', 'ops', 'viewer');

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SeriesStatus" NOT NULL DEFAULT 'draft',
    "asset_manifest_url" TEXT NOT NULL,
    "asset_version" TEXT NOT NULL DEFAULT '1.0.0',
    "base_price_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lead_time_weeks_min" INTEGER NOT NULL,
    "lead_time_weeks_max" INTEGER NOT NULL,
    "dimensions_catalog" JSONB,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_def" (
    "id" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ModuleType" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SeriesStatus" NOT NULL DEFAULT 'draft',
    "asset_url" TEXT NOT NULL,
    "asset_version" TEXT NOT NULL DEFAULT '1.0.0',
    "dimensions_m" JSONB NOT NULL,
    "sockets" TEXT[],
    "power_compatible" BOOLEAN NOT NULL DEFAULT false,
    "cover_mask" TEXT NOT NULL DEFAULT 'body_all',
    "base_price_minor" INTEGER NOT NULL,
    "power_addon_minor" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_def_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cover_grade" (
    "id" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "grade_key" "CoverGradeKey" NOT NULL,
    "name" TEXT NOT NULL,
    "price_factor" DECIMAL(5,3) NOT NULL,
    "asset_pack_url" TEXT,
    "tint" BOOLEAN NOT NULL DEFAULT true,
    "swatch_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cover_grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colorway" (
    "id" TEXT NOT NULL,
    "grade_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "srgb" TEXT NOT NULL,
    "tint_strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "leather_tex_url" TEXT,
    "mill_sku" TEXT NOT NULL,
    "delta_e" DOUBLE PRECISION,
    "swatch_image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colorway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_leg_option" (
    "id" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "leg_key" "LegKey" NOT NULL,
    "name" TEXT NOT NULL,
    "asset_url" TEXT,
    "price_addon_minor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "series_leg_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuration_template" (
    "id" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "design_json" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuration_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "accepts_marketing" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "series_id" TEXT NOT NULL,
    "template_id" TEXT,
    "snapshot" JSONB NOT NULL,
    "client_fingerprint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_quote" (
    "id" TEXT NOT NULL,
    "design_id" TEXT NOT NULL,
    "snapshot_hash" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'valid',
    "price_table_version" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'US',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "valid" BOOLEAN NOT NULL,
    "violations" JSONB NOT NULL,
    "layout" JSONB,
    "dimensions_m" JSONB,
    "bom" JSONB,
    "price_snapshot" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_bom_line" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "module_def_id" TEXT NOT NULL,
    "module_code" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "power" BOOLEAN NOT NULL DEFAULT false,
    "cover_grade" "CoverGradeKey" NOT NULL,
    "colorway_slug" TEXT NOT NULL,
    "leg_key" "LegKey" NOT NULL,
    "unit_price_minor" INTEGER NOT NULL,

    CONSTRAINT "quote_bom_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_link" (
    "id" TEXT NOT NULL,
    "design_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "anon_token" TEXT,
    "status" "CartStatus" NOT NULL DEFAULT 'open',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "version" INTEGER NOT NULL DEFAULT 1,
    "merged_into_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_item" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "design_id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "design_snapshot" JSONB NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_minor" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "human_no" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "cart_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending_payment',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totals" JSONB NOT NULL,
    "shipping_address" JSONB NOT NULL,
    "billing_address" JSONB NOT NULL,
    "shipping_service" TEXT,
    "final_sale_acknowledged_at" TIMESTAMP(3) NOT NULL,
    "customer_email" TEXT NOT NULL,
    "cancel_window_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "design_snapshot" JSONB NOT NULL,
    "bom_snapshot" JSONB NOT NULL,
    "series_slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "unit_price_minor" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_module" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "module_def_id" TEXT,
    "module_code" TEXT NOT NULL,
    "power" BOOLEAN NOT NULL DEFAULT false,
    "cover_grade" "CoverGradeKey" NOT NULL,
    "colorway_slug" TEXT NOT NULL,
    "mill_sku" TEXT,
    "leg_key" "LegKey" NOT NULL,

    CONSTRAINT "order_item_module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_ref" TEXT NOT NULL,
    "provider_event_id" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'created',
    "amount_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "raw_webhook" JSONB,
    "failure_reason" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "state" "FulfillmentState" NOT NULL DEFAULT 'confirmed',
    "carrier" TEXT,
    "tracking_no" TEXT,
    "tracking_url" TEXT,
    "erp_order_ref" TEXT,
    "estimated_delivery_from" TIMESTAMP(3),
    "estimated_delivery_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment_event" (
    "id" TEXT NOT NULL,
    "fulfillment_id" TEXT NOT NULL,
    "state" "FulfillmentState" NOT NULL,
    "note" TEXT,
    "source" TEXT NOT NULL DEFAULT 'erp',
    "occurred_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillment_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_rate" (
    "id" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "threshold_minor" INTEGER NOT NULL,
    "fee_minor" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_table" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_provider_log" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT,
    "order_id" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'avalara',
    "request_body" JSONB NOT NULL,
    "response_body" JSONB NOT NULL,
    "amount_minor" INTEGER,
    "doc_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_provider_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_asset_cache" (
    "id" TEXT NOT NULL,
    "snapshot_hash" TEXT NOT NULL,
    "status" "ArAssetStatus" NOT NULL DEFAULT 'queued',
    "usdz_url" TEXT,
    "gltf_url" TEXT,
    "usdz_bytes" INTEGER,
    "lod_used" TEXT,
    "error_message" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "worker_lease" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ar_asset_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'viewer',
    "mfa_secret" TEXT,
    "mfa_enrolled_at" TIMESTAMP(3),
    "ip_allowlist" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");

-- CreateIndex
CREATE INDEX "module_def_series_id_status_idx" ON "module_def"("series_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "module_def_series_id_code_key" ON "module_def"("series_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "cover_grade_series_id_grade_key_key" ON "cover_grade"("series_id", "grade_key");

-- CreateIndex
CREATE UNIQUE INDEX "colorway_grade_id_slug_key" ON "colorway"("grade_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "series_leg_option_series_id_leg_key_key" ON "series_leg_option"("series_id", "leg_key");

-- CreateIndex
CREATE UNIQUE INDEX "configuration_template_series_id_slug_key" ON "configuration_template"("series_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "customer_email_key" ON "customer"("email");

-- CreateIndex
CREATE INDEX "customer_email_idx" ON "customer"("email");

-- CreateIndex
CREATE INDEX "design_customer_id_updated_at_idx" ON "design"("customer_id", "updated_at");

-- CreateIndex
CREATE INDEX "design_client_fingerprint_idx" ON "design"("client_fingerprint");

-- CreateIndex
CREATE INDEX "design_quote_design_id_created_at_idx" ON "design_quote"("design_id", "created_at");

-- CreateIndex
CREATE INDEX "design_quote_snapshot_hash_region_status_idx" ON "design_quote"("snapshot_hash", "region", "status");

-- CreateIndex
CREATE UNIQUE INDEX "quote_bom_line_quote_id_module_def_id_power_key" ON "quote_bom_line"("quote_id", "module_def_id", "power");

-- CreateIndex
CREATE UNIQUE INDEX "share_link_token_key" ON "share_link"("token");

-- CreateIndex
CREATE INDEX "share_link_design_id_idx" ON "share_link"("design_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_anon_token_key" ON "cart"("anon_token");

-- CreateIndex
CREATE INDEX "cart_customer_id_status_idx" ON "cart"("customer_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cart_item_cart_id_design_id_key" ON "cart_item"("cart_id", "design_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_human_no_key" ON "order"("human_no");

-- CreateIndex
CREATE UNIQUE INDEX "order_idempotency_key_key" ON "order"("idempotency_key");

-- CreateIndex
CREATE INDEX "order_customer_id_created_at_idx" ON "order"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "order_status_idx" ON "order"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_event_id_key" ON "payment"("provider_event_id");

-- CreateIndex
CREATE INDEX "payment_order_id_status_idx" ON "payment"("order_id", "status");

-- CreateIndex
CREATE INDEX "payment_provider_provider_ref_idx" ON "payment"("provider", "provider_ref");

-- CreateIndex
CREATE UNIQUE INDEX "fulfillment_order_id_key" ON "fulfillment"("order_id");

-- CreateIndex
CREATE INDEX "fulfillment_event_fulfillment_id_occurred_at_idx" ON "fulfillment_event"("fulfillment_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_rate_zone_service_threshold_minor_key" ON "shipping_rate"("zone", "service", "threshold_minor");

-- CreateIndex
CREATE UNIQUE INDEX "price_table_version_key" ON "price_table"("version");

-- CreateIndex
CREATE INDEX "tax_provider_log_order_id_idx" ON "tax_provider_log"("order_id");

-- CreateIndex
CREATE INDEX "tax_provider_log_quote_id_idx" ON "tax_provider_log"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "ar_asset_cache_snapshot_hash_key" ON "ar_asset_cache"("snapshot_hash");

-- CreateIndex
CREATE INDEX "ar_asset_cache_status_worker_lease_idx" ON "ar_asset_cache"("status", "worker_lease");

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_email_key" ON "admin_user"("email");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_admin_user_id_created_at_idx" ON "audit_log"("admin_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "module_def" ADD CONSTRAINT "module_def_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cover_grade" ADD CONSTRAINT "cover_grade_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colorway" ADD CONSTRAINT "colorway_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "cover_grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_leg_option" ADD CONSTRAINT "series_leg_option_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration_template" ADD CONSTRAINT "configuration_template_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design" ADD CONSTRAINT "design_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_quote" ADD CONSTRAINT "design_quote_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "design"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_bom_line" ADD CONSTRAINT "quote_bom_line_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "design_quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_bom_line" ADD CONSTRAINT "quote_bom_line_module_def_id_fkey" FOREIGN KEY ("module_def_id") REFERENCES "module_def"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_link" ADD CONSTRAINT "share_link_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "design"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_merged_into_id_fkey" FOREIGN KEY ("merged_into_id") REFERENCES "cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "design"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "design_quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "design_quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_module" ADD CONSTRAINT "order_item_module_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_module" ADD CONSTRAINT "order_item_module_module_def_id_fkey" FOREIGN KEY ("module_def_id") REFERENCES "module_def"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment" ADD CONSTRAINT "fulfillment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_event" ADD CONSTRAINT "fulfillment_event_fulfillment_id_fkey" FOREIGN KEY ("fulfillment_id") REFERENCES "fulfillment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
