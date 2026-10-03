import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_activities_icon" AS ENUM('droplets', 'droplet', 'stethoscope', 'eye', 'hospital', 'graduation-cap', 'award', 'book-open', 'laptop', 'scissors', 'trees', 'sparkles', 'package-check', 'heart', 'hand-coins', 'waves', 'sprout', 'mountain', 'house', 'heart-handshake');
  CREATE TYPE "public"."enum__activities_v_version_icon" AS ENUM('droplets', 'droplet', 'stethoscope', 'eye', 'hospital', 'graduation-cap', 'award', 'book-open', 'laptop', 'scissors', 'trees', 'sparkles', 'package-check', 'heart', 'hand-coins', 'waves', 'sprout', 'mountain', 'house', 'heart-handshake');
  CREATE TYPE "public"."enum_content_slots_page" AS ENUM('home', 'core-values', 'projects', 'who-we-are', 'guiding-force', 'contribute', 'everywhere', 'other');
  CREATE TYPE "public"."enum__content_slots_v_version_page" AS ENUM('home', 'core-values', 'projects', 'who-we-are', 'guiding-force', 'contribute', 'everywhere', 'other');
  CREATE TYPE "public"."enum_asset_slots_page" AS ENUM('home', 'core-values', 'projects', 'who-we-are', 'guiding-force', 'contribute', 'everywhere', 'other');
  CREATE TYPE "public"."enum__asset_slots_v_version_page" AS ENUM('home', 'core-values', 'projects', 'who-we-are', 'guiding-force', 'contribute', 'everywhere', 'other');
  CREATE TYPE "public"."enum_gallery_items_group" AS ENUM('pavilion:heal', 'pavilion:enrich', 'pavilion:empower', 'pavilion:projects', 'media:project-amrit', 'media:oneness-vann', 'media:watershed', 'media:adopted-villages', 'media:who-we-are', 'media:guiding-force');
  CREATE TYPE "public"."enum__gallery_items_v_version_group" AS ENUM('pavilion:heal', 'pavilion:enrich', 'pavilion:empower', 'pavilion:projects', 'media:project-amrit', 'media:oneness-vann', 'media:watershed', 'media:adopted-villages', 'media:who-we-are', 'media:guiding-force');
  CREATE TYPE "public"."enum_pages_blocks_custom_component" AS ENUM('events', 'awards');
  CREATE TYPE "public"."enum__pages_v_blocks_custom_component" AS ENUM('events', 'awards');
  CREATE TYPE "public"."enum_site_settings_navigation_menu" AS ENUM('none', 'links', 'programmes');
  CREATE TYPE "public"."enum_site_settings_social_platform" AS ENUM('instagram', 'youtube', 'spotify', 'facebook', 'x', 'linkedin', 'whatsapp');
  CREATE TYPE "public"."enum__site_settings_v_version_navigation_menu" AS ENUM('none', 'links', 'programmes');
  CREATE TYPE "public"."enum__site_settings_v_version_social_platform" AS ENUM('instagram', 'youtube', 'spotify', 'facebook', 'x', 'linkedin', 'whatsapp');
  CREATE TABLE "activities_hover_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"src" varchar,
  	"alt" varchar
  );
  
  CREATE TABLE "_activities_v_version_hover_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"src" varchar,
  	"alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "site_settings_navigation_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"external" boolean
  );
  
  CREATE TABLE "site_settings_navigation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"menu" "enum_site_settings_navigation_menu" DEFAULT 'none',
  	"external" boolean
  );
  
  CREATE TABLE "site_settings_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "site_settings_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "site_settings_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_settings_social_platform",
  	"url" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_navigation_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"external" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_navigation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"menu" "enum__site_settings_v_version_navigation_menu" DEFAULT 'none',
  	"external" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" "enum__site_settings_v_version_social_platform",
  	"url" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "gallery_items" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "gallery_items" ALTER COLUMN "kind" SET DEFAULT 'photo'::text;
  DROP TYPE "public"."enum_gallery_items_kind";
  CREATE TYPE "public"."enum_gallery_items_kind" AS ENUM('photo', 'film');
  ALTER TABLE "gallery_items" ALTER COLUMN "kind" SET DEFAULT 'photo'::"public"."enum_gallery_items_kind";
  ALTER TABLE "gallery_items" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_gallery_items_kind" USING "kind"::"public"."enum_gallery_items_kind";
  ALTER TABLE "_gallery_items_v" ALTER COLUMN "version_kind" SET DATA TYPE text;
  ALTER TABLE "_gallery_items_v" ALTER COLUMN "version_kind" SET DEFAULT 'photo'::text;
  DROP TYPE "public"."enum__gallery_items_v_version_kind";
  CREATE TYPE "public"."enum__gallery_items_v_version_kind" AS ENUM('photo', 'film');
  ALTER TABLE "_gallery_items_v" ALTER COLUMN "version_kind" SET DEFAULT 'photo'::"public"."enum__gallery_items_v_version_kind";
  ALTER TABLE "_gallery_items_v" ALTER COLUMN "version_kind" SET DATA TYPE "public"."enum__gallery_items_v_version_kind" USING "version_kind"::"public"."enum__gallery_items_v_version_kind";
  ALTER TABLE "asset_slots" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_asset_slots_kind";
  CREATE TYPE "public"."enum_asset_slots_kind" AS ENUM('image', 'video', 'audio', 'other');
  ALTER TABLE "asset_slots" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_asset_slots_kind" USING "kind"::"public"."enum_asset_slots_kind";
  ALTER TABLE "_asset_slots_v" ALTER COLUMN "version_kind" SET DATA TYPE text;
  DROP TYPE "public"."enum__asset_slots_v_version_kind";
  CREATE TYPE "public"."enum__asset_slots_v_version_kind" AS ENUM('image', 'video', 'audio', 'other');
  ALTER TABLE "_asset_slots_v" ALTER COLUMN "version_kind" SET DATA TYPE "public"."enum__asset_slots_v_version_kind" USING "version_kind"::"public"."enum__asset_slots_v_version_kind";
  ALTER TABLE "gallery_items" ALTER COLUMN "group" SET DATA TYPE "public"."enum_gallery_items_group" USING "group"::"public"."enum_gallery_items_group";
  ALTER TABLE "_gallery_items_v" ALTER COLUMN "version_group" SET DATA TYPE "public"."enum__gallery_items_v_version_group" USING "version_group"::"public"."enum__gallery_items_v_version_group";
  ALTER TABLE "pages_blocks_custom" ALTER COLUMN "component" SET DATA TYPE "public"."enum_pages_blocks_custom_component" USING "component"::"public"."enum_pages_blocks_custom_component";
  ALTER TABLE "_pages_v_blocks_custom" ALTER COLUMN "component" SET DATA TYPE "public"."enum__pages_v_blocks_custom_component" USING "component"::"public"."enum__pages_v_blocks_custom_component";
  ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_models_heal" DROP DEFAULT;
  ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_models_enrich" DROP DEFAULT;
  ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_models_empower" DROP DEFAULT;
  ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_models_projects" DROP DEFAULT;
  ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_models_amrit" DROP DEFAULT;
  ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_models_oneness" DROP DEFAULT;
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_models_heal" DROP DEFAULT;
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_models_enrich" DROP DEFAULT;
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_models_empower" DROP DEFAULT;
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_models_projects" DROP DEFAULT;
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_models_amrit" DROP DEFAULT;
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_models_oneness" DROP DEFAULT;
  ALTER TABLE "pillars" ADD COLUMN "emblem_caption" varchar;
  ALTER TABLE "_pillars_v" ADD COLUMN "version_emblem_caption" varchar;
  ALTER TABLE "activities" ADD COLUMN "icon" "enum_activities_icon";
  ALTER TABLE "activities" ADD COLUMN "menu_label" varchar;
  ALTER TABLE "activities" ADD COLUMN "hover_focus_photo" numeric;
  ALTER TABLE "activities" ADD COLUMN "hover_focus_x" numeric;
  ALTER TABLE "activities" ADD COLUMN "hover_focus_y" numeric;
  ALTER TABLE "activities" ADD COLUMN "hover_focus_width" numeric;
  ALTER TABLE "activities" ADD COLUMN "hover_focus_height" numeric;
  ALTER TABLE "activities" ADD COLUMN "card_photo_media_id" integer;
  ALTER TABLE "activities" ADD COLUMN "card_photo_src" varchar;
  ALTER TABLE "activities" ADD COLUMN "card_photo_alt" varchar;
  ALTER TABLE "_activities_v" ADD COLUMN "version_icon" "enum__activities_v_version_icon";
  ALTER TABLE "_activities_v" ADD COLUMN "version_menu_label" varchar;
  ALTER TABLE "_activities_v" ADD COLUMN "version_hover_focus_photo" numeric;
  ALTER TABLE "_activities_v" ADD COLUMN "version_hover_focus_x" numeric;
  ALTER TABLE "_activities_v" ADD COLUMN "version_hover_focus_y" numeric;
  ALTER TABLE "_activities_v" ADD COLUMN "version_hover_focus_width" numeric;
  ALTER TABLE "_activities_v" ADD COLUMN "version_hover_focus_height" numeric;
  ALTER TABLE "_activities_v" ADD COLUMN "version_card_photo_media_id" integer;
  ALTER TABLE "_activities_v" ADD COLUMN "version_card_photo_src" varchar;
  ALTER TABLE "_activities_v" ADD COLUMN "version_card_photo_alt" varchar;
  ALTER TABLE "partners" ADD COLUMN "short" varchar;
  ALTER TABLE "partners" ADD COLUMN "initials" varchar;
  ALTER TABLE "partners" ADD COLUMN "color" varchar;
  ALTER TABLE "_partners_v" ADD COLUMN "version_short" varchar;
  ALTER TABLE "_partners_v" ADD COLUMN "version_initials" varchar;
  ALTER TABLE "_partners_v" ADD COLUMN "version_color" varchar;
  ALTER TABLE "content_slots" ADD COLUMN "page" "enum_content_slots_page";
  ALTER TABLE "content_slots" ADD COLUMN "section" varchar;
  ALTER TABLE "_content_slots_v" ADD COLUMN "version_page" "enum__content_slots_v_version_page";
  ALTER TABLE "_content_slots_v" ADD COLUMN "version_section" varchar;
  ALTER TABLE "asset_slots" ADD COLUMN "page" "enum_asset_slots_page";
  ALTER TABLE "asset_slots" ADD COLUMN "section" varchar;
  ALTER TABLE "_asset_slots_v" ADD COLUMN "version_page" "enum__asset_slots_v_version_page";
  ALTER TABLE "_asset_slots_v" ADD COLUMN "version_section" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "branding_logo_media_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "seo_image_media_id" integer;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_branding_logo_media_id" integer;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_seo_image_media_id" integer;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_models_heal_media_id" integer;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_models_enrich_media_id" integer;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_models_empower_media_id" integer;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_models_projects_media_id" integer;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_models_amrit_media_id" integer;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_models_oneness_media_id" integer;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_models_heal_media_id" integer;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_models_enrich_media_id" integer;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_models_empower_media_id" integer;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_models_projects_media_id" integer;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_models_amrit_media_id" integer;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_models_oneness_media_id" integer;
  ALTER TABLE "activities_hover_photos" ADD CONSTRAINT "activities_hover_photos_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activities_hover_photos" ADD CONSTRAINT "activities_hover_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activities_v_version_hover_photos" ADD CONSTRAINT "_activities_v_version_hover_photos_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_activities_v_version_hover_photos" ADD CONSTRAINT "_activities_v_version_hover_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_activities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_navigation_links" ADD CONSTRAINT "site_settings_navigation_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_navigation" ADD CONSTRAINT "site_settings_navigation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_columns_links" ADD CONSTRAINT "site_settings_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_columns" ADD CONSTRAINT "site_settings_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_social" ADD CONSTRAINT "site_settings_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_navigation_links" ADD CONSTRAINT "_site_settings_v_version_navigation_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_navigation" ADD CONSTRAINT "_site_settings_v_version_navigation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_footer_columns_links" ADD CONSTRAINT "_site_settings_v_version_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_footer_columns" ADD CONSTRAINT "_site_settings_v_version_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_social" ADD CONSTRAINT "_site_settings_v_version_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "activities_hover_photos_order_idx" ON "activities_hover_photos" USING btree ("_order");
  CREATE INDEX "activities_hover_photos_parent_id_idx" ON "activities_hover_photos" USING btree ("_parent_id");
  CREATE INDEX "activities_hover_photos_media_idx" ON "activities_hover_photos" USING btree ("media_id");
  CREATE INDEX "_activities_v_version_hover_photos_order_idx" ON "_activities_v_version_hover_photos" USING btree ("_order");
  CREATE INDEX "_activities_v_version_hover_photos_parent_id_idx" ON "_activities_v_version_hover_photos" USING btree ("_parent_id");
  CREATE INDEX "_activities_v_version_hover_photos_media_idx" ON "_activities_v_version_hover_photos" USING btree ("media_id");
  CREATE INDEX "site_settings_navigation_links_order_idx" ON "site_settings_navigation_links" USING btree ("_order");
  CREATE INDEX "site_settings_navigation_links_parent_id_idx" ON "site_settings_navigation_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_navigation_order_idx" ON "site_settings_navigation" USING btree ("_order");
  CREATE INDEX "site_settings_navigation_parent_id_idx" ON "site_settings_navigation" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_columns_links_order_idx" ON "site_settings_footer_columns_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_columns_links_parent_id_idx" ON "site_settings_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_columns_order_idx" ON "site_settings_footer_columns" USING btree ("_order");
  CREATE INDEX "site_settings_footer_columns_parent_id_idx" ON "site_settings_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "site_settings_social_order_idx" ON "site_settings_social" USING btree ("_order");
  CREATE INDEX "site_settings_social_parent_id_idx" ON "site_settings_social" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_navigation_links_order_idx" ON "_site_settings_v_version_navigation_links" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_navigation_links_parent_id_idx" ON "_site_settings_v_version_navigation_links" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_navigation_order_idx" ON "_site_settings_v_version_navigation" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_navigation_parent_id_idx" ON "_site_settings_v_version_navigation" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_footer_columns_links_order_idx" ON "_site_settings_v_version_footer_columns_links" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_footer_columns_links_parent_id_idx" ON "_site_settings_v_version_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_footer_columns_order_idx" ON "_site_settings_v_version_footer_columns" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_footer_columns_parent_id_idx" ON "_site_settings_v_version_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_social_order_idx" ON "_site_settings_v_version_social" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_social_parent_id_idx" ON "_site_settings_v_version_social" USING btree ("_parent_id");
  ALTER TABLE "activities" ADD CONSTRAINT "activities_card_photo_media_id_media_id_fk" FOREIGN KEY ("card_photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_activities_v" ADD CONSTRAINT "_activities_v_version_card_photo_media_id_media_id_fk" FOREIGN KEY ("version_card_photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_branding_logo_media_id_media_id_fk" FOREIGN KEY ("branding_logo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_seo_image_media_id_media_id_fk" FOREIGN KEY ("seo_image_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_branding_logo_media_id_media_id_fk" FOREIGN KEY ("version_branding_logo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_seo_image_media_id_media_id_fk" FOREIGN KEY ("version_seo_image_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavilion_settings" ADD CONSTRAINT "pavilion_settings_settings_models_heal_media_id_media_id_fk" FOREIGN KEY ("settings_models_heal_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavilion_settings" ADD CONSTRAINT "pavilion_settings_settings_models_enrich_media_id_media_id_fk" FOREIGN KEY ("settings_models_enrich_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavilion_settings" ADD CONSTRAINT "pavilion_settings_settings_models_empower_media_id_media_id_fk" FOREIGN KEY ("settings_models_empower_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavilion_settings" ADD CONSTRAINT "pavilion_settings_settings_models_projects_media_id_media_id_fk" FOREIGN KEY ("settings_models_projects_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavilion_settings" ADD CONSTRAINT "pavilion_settings_settings_models_amrit_media_id_media_id_fk" FOREIGN KEY ("settings_models_amrit_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pavilion_settings" ADD CONSTRAINT "pavilion_settings_settings_models_oneness_media_id_media_id_fk" FOREIGN KEY ("settings_models_oneness_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pavilion_settings_v" ADD CONSTRAINT "_pavilion_settings_v_version_settings_models_heal_media_id_media_id_fk" FOREIGN KEY ("version_settings_models_heal_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pavilion_settings_v" ADD CONSTRAINT "_pavilion_settings_v_version_settings_models_enrich_media_id_media_id_fk" FOREIGN KEY ("version_settings_models_enrich_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pavilion_settings_v" ADD CONSTRAINT "_pavilion_settings_v_version_settings_models_empower_media_id_media_id_fk" FOREIGN KEY ("version_settings_models_empower_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pavilion_settings_v" ADD CONSTRAINT "_pavilion_settings_v_version_settings_models_projects_media_id_media_id_fk" FOREIGN KEY ("version_settings_models_projects_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pavilion_settings_v" ADD CONSTRAINT "_pavilion_settings_v_version_settings_models_amrit_media_id_media_id_fk" FOREIGN KEY ("version_settings_models_amrit_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pavilion_settings_v" ADD CONSTRAINT "_pavilion_settings_v_version_settings_models_oneness_media_id_media_id_fk" FOREIGN KEY ("version_settings_models_oneness_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "activities_card_photo_card_photo_media_idx" ON "activities" USING btree ("card_photo_media_id");
  CREATE INDEX "_activities_v_version_card_photo_version_card_photo_medi_idx" ON "_activities_v" USING btree ("version_card_photo_media_id");
  CREATE INDEX "content_slots_page_idx" ON "content_slots" USING btree ("page");
  CREATE INDEX "_content_slots_v_version_version_page_idx" ON "_content_slots_v" USING btree ("version_page");
  CREATE INDEX "asset_slots_page_idx" ON "asset_slots" USING btree ("page");
  CREATE INDEX "_asset_slots_v_version_version_page_idx" ON "_asset_slots_v" USING btree ("version_page");
  CREATE INDEX "site_settings_branding_branding_logo_media_idx" ON "site_settings" USING btree ("branding_logo_media_id");
  CREATE INDEX "site_settings_seo_seo_image_media_idx" ON "site_settings" USING btree ("seo_image_media_id");
  CREATE INDEX "_site_settings_v_version_branding_version_branding_logo__idx" ON "_site_settings_v" USING btree ("version_branding_logo_media_id");
  CREATE INDEX "_site_settings_v_version_seo_version_seo_image_media_idx" ON "_site_settings_v" USING btree ("version_seo_image_media_id");
  CREATE INDEX "pavilion_settings_settings_models_settings_models_heal_m_idx" ON "pavilion_settings" USING btree ("settings_models_heal_media_id");
  CREATE INDEX "pavilion_settings_settings_models_settings_models_enrich_idx" ON "pavilion_settings" USING btree ("settings_models_enrich_media_id");
  CREATE INDEX "pavilion_settings_settings_models_settings_models_empowe_idx" ON "pavilion_settings" USING btree ("settings_models_empower_media_id");
  CREATE INDEX "pavilion_settings_settings_models_settings_models_projec_idx" ON "pavilion_settings" USING btree ("settings_models_projects_media_id");
  CREATE INDEX "pavilion_settings_settings_models_settings_models_amrit__idx" ON "pavilion_settings" USING btree ("settings_models_amrit_media_id");
  CREATE INDEX "pavilion_settings_settings_models_settings_models_onenes_idx" ON "pavilion_settings" USING btree ("settings_models_oneness_media_id");
  CREATE INDEX "_pavilion_settings_v_version_settings_models_version_set_idx" ON "_pavilion_settings_v" USING btree ("version_settings_models_heal_media_id");
  CREATE INDEX "_pavilion_settings_v_version_settings_models_version_s_1_idx" ON "_pavilion_settings_v" USING btree ("version_settings_models_enrich_media_id");
  CREATE INDEX "_pavilion_settings_v_version_settings_models_version_s_2_idx" ON "_pavilion_settings_v" USING btree ("version_settings_models_empower_media_id");
  CREATE INDEX "_pavilion_settings_v_version_settings_models_version_s_3_idx" ON "_pavilion_settings_v" USING btree ("version_settings_models_projects_media_id");
  CREATE INDEX "_pavilion_settings_v_version_settings_models_version_s_4_idx" ON "_pavilion_settings_v" USING btree ("version_settings_models_amrit_media_id");
  CREATE INDEX "_pavilion_settings_v_version_settings_models_version_s_5_idx" ON "_pavilion_settings_v" USING btree ("version_settings_models_oneness_media_id");
  ALTER TABLE "pillars" DROP COLUMN "record";
  ALTER TABLE "_pillars_v" DROP COLUMN "version_record";
  ALTER TABLE "activities" DROP COLUMN "source_note";
  ALTER TABLE "activities" DROP COLUMN "source_u_r_l";
  ALTER TABLE "activities" DROP COLUMN "record";
  ALTER TABLE "_activities_v" DROP COLUMN "version_source_note";
  ALTER TABLE "_activities_v" DROP COLUMN "version_source_u_r_l";
  ALTER TABLE "_activities_v" DROP COLUMN "version_record";
  ALTER TABLE "events" DROP COLUMN "record";
  ALTER TABLE "_events_v" DROP COLUMN "version_record";
  ALTER TABLE "partners" DROP COLUMN "record";
  ALTER TABLE "_partners_v" DROP COLUMN "version_record";
  ALTER TABLE "awards" DROP COLUMN "record";
  ALTER TABLE "_awards_v" DROP COLUMN "version_record";
  ALTER TABLE "gallery_items" DROP COLUMN "record";
  ALTER TABLE "_gallery_items_v" DROP COLUMN "version_record";
  ALTER TABLE "pages_blocks_custom" DROP COLUMN "options";
  ALTER TABLE "pages" DROP COLUMN "record";
  ALTER TABLE "_pages_v_blocks_custom" DROP COLUMN "options";
  ALTER TABLE "_pages_v" DROP COLUMN "version_record";
  ALTER TABLE "content_slots" DROP COLUMN "context";
  ALTER TABLE "content_slots" DROP COLUMN "record";
  ALTER TABLE "_content_slots_v" DROP COLUMN "version_context";
  ALTER TABLE "_content_slots_v" DROP COLUMN "version_record";
  ALTER TABLE "asset_slots" DROP COLUMN "record";
  ALTER TABLE "_asset_slots_v" DROP COLUMN "version_record";
  ALTER TABLE "component_settings" DROP COLUMN "options";
  ALTER TABLE "component_settings" DROP COLUMN "record";
  ALTER TABLE "_component_settings_v" DROP COLUMN "version_options";
  ALTER TABLE "_component_settings_v" DROP COLUMN "version_record";
  ALTER TABLE "live_stats" DROP COLUMN "record";
  ALTER TABLE "_live_stats_v" DROP COLUMN "version_record";
  ALTER TABLE "site_settings" DROP COLUMN "navigation";
  ALTER TABLE "site_settings" DROP COLUMN "core_value_groups";
  ALTER TABLE "site_settings" DROP COLUMN "partner_brands";
  ALTER TABLE "site_settings" DROP COLUMN "options";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_navigation";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_core_value_groups";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_partner_brands";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_options";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_stone_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_stone_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_stone_texture";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_trim_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_trim_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_trim_texture";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_plaster_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_plaster_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_plaster_texture";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_brass_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_brass_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_brass_metalness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_brass_texture";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_wall_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_wall_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_wall_texture";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_wood_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_wood_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_wood_texture";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_display_base_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_display_base_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_display_base_texture";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_floor_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_floor_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_floor_texture";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_carpet_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_carpet_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_carpet_texture";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_queue_metal_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_queue_metal_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_queue_metal_metalness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_queue_metal_texture";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_queue_belt_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_queue_belt_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_queue_belt_texture";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_materials_planter_colors";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_chapters";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_exposure";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_background";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_fog_near";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_fog_far";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_pendant_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_pendant_intensity";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_edge_intensity";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_picture_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_picture_intensity";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_exhibit_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_exhibit_intensity";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_frame_glow";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_lighting_beam_opacity";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_camera_field_of_view";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_camera_position_smoothing";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_camera_turn_smoothing";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_camera_scroll_smoothing";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_camera_photo_pause";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_camera_model_float";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_camera_model_sway";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_performance_max_width";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_performance_max_height";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_performance_fps";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_performance_adaptive_quality";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_performance_min_scale";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_performance_max_scale";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_performance_photo_load_distance";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_components_planters";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_components_barriers";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_components_benches";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_components_pendants";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_components_photo_lights";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_components_frame_backlights";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_components_edge_strips";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_components_models";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_components_windows";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_components_carpet";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_logo";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_model";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_model_size";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_model_height";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_model_light_intensity";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_title";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_subtitle";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_background";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_text_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_mosaic";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_mosaic_hue";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_mosaic_saturation";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_tile_size";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_amrit_video";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_amrit_poster";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_amrit_wood_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_amrit_grain_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_amrit_wood_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_amrit_glass_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_amrit_glass_opacity";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_amrit_frost";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_amrit_frost_opacity";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_amrit_frost_blur";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_amrit_autoplay";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_oneness_video";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_oneness_poster";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_oneness_wood_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_oneness_grain_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_oneness_wood_roughness";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_oneness_glass_color";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_oneness_glass_opacity";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_oneness_frost";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_oneness_frost_opacity";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_oneness_frost_blur";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_windows_oneness_autoplay";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_stone_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_stone_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_stone_texture";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_trim_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_trim_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_trim_texture";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_plaster_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_plaster_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_plaster_texture";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_brass_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_brass_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_brass_metalness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_brass_texture";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_wall_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_wall_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_wall_texture";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_wood_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_wood_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_wood_texture";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_display_base_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_display_base_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_display_base_texture";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_floor_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_floor_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_floor_texture";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_carpet_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_carpet_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_carpet_texture";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_queue_metal_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_queue_metal_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_queue_metal_metalness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_queue_metal_texture";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_queue_belt_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_queue_belt_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_queue_belt_texture";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_materials_planter_colors";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_chapters";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_exposure";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_background";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_fog_near";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_fog_far";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_pendant_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_pendant_intensity";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_edge_intensity";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_picture_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_picture_intensity";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_exhibit_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_exhibit_intensity";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_frame_glow";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_lighting_beam_opacity";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_camera_field_of_view";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_camera_position_smoothing";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_camera_turn_smoothing";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_camera_scroll_smoothing";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_camera_photo_pause";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_camera_model_float";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_camera_model_sway";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_performance_max_width";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_performance_max_height";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_performance_fps";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_performance_adaptive_quality";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_performance_min_scale";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_performance_max_scale";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_performance_photo_load_distance";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_components_planters";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_components_barriers";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_components_benches";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_components_pendants";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_components_photo_lights";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_components_frame_backlights";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_components_edge_strips";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_components_models";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_components_windows";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_components_carpet";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_logo";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_model";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_model_size";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_model_height";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_model_light_intensity";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_title";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_subtitle";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_background";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_text_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_mosaic";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_mosaic_hue";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_mosaic_saturation";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_tile_size";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_amrit_video";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_amrit_poster";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_amrit_wood_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_amrit_grain_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_amrit_wood_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_amrit_glass_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_amrit_glass_opacity";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_amrit_frost";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_amrit_frost_opacity";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_amrit_frost_blur";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_amrit_autoplay";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_oneness_video";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_oneness_poster";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_oneness_wood_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_oneness_grain_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_oneness_wood_roughness";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_oneness_glass_color";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_oneness_glass_opacity";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_oneness_frost";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_oneness_frost_opacity";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_oneness_frost_blur";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_windows_oneness_autoplay";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_asset_slots_kind" ADD VALUE 'model' BEFORE 'other';
  ALTER TYPE "public"."enum__asset_slots_v_version_kind" ADD VALUE 'model' BEFORE 'other';
  ALTER TYPE "public"."enum_gallery_items_kind" ADD VALUE 'model';
  ALTER TYPE "public"."enum__gallery_items_v_version_kind" ADD VALUE 'model';
  ALTER TABLE "activities_hover_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_activities_v_version_hover_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_navigation_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_navigation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_footer_columns_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_footer_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_social" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_navigation_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_navigation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_footer_columns_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_footer_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_social" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "activities_hover_photos" CASCADE;
  DROP TABLE "_activities_v_version_hover_photos" CASCADE;
  DROP TABLE "site_settings_navigation_links" CASCADE;
  DROP TABLE "site_settings_navigation" CASCADE;
  DROP TABLE "site_settings_footer_columns_links" CASCADE;
  DROP TABLE "site_settings_footer_columns" CASCADE;
  DROP TABLE "site_settings_social" CASCADE;
  DROP TABLE "_site_settings_v_version_navigation_links" CASCADE;
  DROP TABLE "_site_settings_v_version_navigation" CASCADE;
  DROP TABLE "_site_settings_v_version_footer_columns_links" CASCADE;
  DROP TABLE "_site_settings_v_version_footer_columns" CASCADE;
  DROP TABLE "_site_settings_v_version_social" CASCADE;
  ALTER TABLE "activities" DROP CONSTRAINT "activities_card_photo_media_id_media_id_fk";
  
  ALTER TABLE "_activities_v" DROP CONSTRAINT "_activities_v_version_card_photo_media_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_branding_logo_media_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_seo_image_media_id_media_id_fk";
  
  ALTER TABLE "_site_settings_v" DROP CONSTRAINT "_site_settings_v_version_branding_logo_media_id_media_id_fk";
  
  ALTER TABLE "_site_settings_v" DROP CONSTRAINT "_site_settings_v_version_seo_image_media_id_media_id_fk";
  
  ALTER TABLE "pavilion_settings" DROP CONSTRAINT "pavilion_settings_settings_models_heal_media_id_media_id_fk";
  
  ALTER TABLE "pavilion_settings" DROP CONSTRAINT "pavilion_settings_settings_models_enrich_media_id_media_id_fk";
  
  ALTER TABLE "pavilion_settings" DROP CONSTRAINT "pavilion_settings_settings_models_empower_media_id_media_id_fk";
  
  ALTER TABLE "pavilion_settings" DROP CONSTRAINT "pavilion_settings_settings_models_projects_media_id_media_id_fk";
  
  ALTER TABLE "pavilion_settings" DROP CONSTRAINT "pavilion_settings_settings_models_amrit_media_id_media_id_fk";
  
  ALTER TABLE "pavilion_settings" DROP CONSTRAINT "pavilion_settings_settings_models_oneness_media_id_media_id_fk";
  
  ALTER TABLE "_pavilion_settings_v" DROP CONSTRAINT "_pavilion_settings_v_version_settings_models_heal_media_id_media_id_fk";
  
  ALTER TABLE "_pavilion_settings_v" DROP CONSTRAINT "_pavilion_settings_v_version_settings_models_enrich_media_id_media_id_fk";
  
  ALTER TABLE "_pavilion_settings_v" DROP CONSTRAINT "_pavilion_settings_v_version_settings_models_empower_media_id_media_id_fk";
  
  ALTER TABLE "_pavilion_settings_v" DROP CONSTRAINT "_pavilion_settings_v_version_settings_models_projects_media_id_media_id_fk";
  
  ALTER TABLE "_pavilion_settings_v" DROP CONSTRAINT "_pavilion_settings_v_version_settings_models_amrit_media_id_media_id_fk";
  
  ALTER TABLE "_pavilion_settings_v" DROP CONSTRAINT "_pavilion_settings_v_version_settings_models_oneness_media_id_media_id_fk";
  
  DROP INDEX "activities_card_photo_card_photo_media_idx";
  DROP INDEX "_activities_v_version_card_photo_version_card_photo_medi_idx";
  DROP INDEX "content_slots_page_idx";
  DROP INDEX "_content_slots_v_version_version_page_idx";
  DROP INDEX "asset_slots_page_idx";
  DROP INDEX "_asset_slots_v_version_version_page_idx";
  DROP INDEX "site_settings_branding_branding_logo_media_idx";
  DROP INDEX "site_settings_seo_seo_image_media_idx";
  DROP INDEX "_site_settings_v_version_branding_version_branding_logo__idx";
  DROP INDEX "_site_settings_v_version_seo_version_seo_image_media_idx";
  DROP INDEX "pavilion_settings_settings_models_settings_models_heal_m_idx";
  DROP INDEX "pavilion_settings_settings_models_settings_models_enrich_idx";
  DROP INDEX "pavilion_settings_settings_models_settings_models_empowe_idx";
  DROP INDEX "pavilion_settings_settings_models_settings_models_projec_idx";
  DROP INDEX "pavilion_settings_settings_models_settings_models_amrit__idx";
  DROP INDEX "pavilion_settings_settings_models_settings_models_onenes_idx";
  DROP INDEX "_pavilion_settings_v_version_settings_models_version_set_idx";
  DROP INDEX "_pavilion_settings_v_version_settings_models_version_s_1_idx";
  DROP INDEX "_pavilion_settings_v_version_settings_models_version_s_2_idx";
  DROP INDEX "_pavilion_settings_v_version_settings_models_version_s_3_idx";
  DROP INDEX "_pavilion_settings_v_version_settings_models_version_s_4_idx";
  DROP INDEX "_pavilion_settings_v_version_settings_models_version_s_5_idx";
  ALTER TABLE "gallery_items" ALTER COLUMN "group" SET DATA TYPE varchar;
  ALTER TABLE "_gallery_items_v" ALTER COLUMN "version_group" SET DATA TYPE varchar;
  ALTER TABLE "pages_blocks_custom" ALTER COLUMN "component" SET DATA TYPE varchar;
  ALTER TABLE "_pages_v_blocks_custom" ALTER COLUMN "component" SET DATA TYPE varchar;
  ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_models_heal" SET DEFAULT '/models/heal.glb';
  ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_models_enrich" SET DEFAULT '/models/enrich.glb?v=d4b28fa0be42';
  ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_models_empower" SET DEFAULT '/models/empower.glb';
  ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_models_projects" SET DEFAULT '/models/projects.glb';
  ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_models_amrit" SET DEFAULT '/models/amrit.glb';
  ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_models_oneness" SET DEFAULT '/models/oneness.glb';
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_models_heal" SET DEFAULT '/models/heal.glb';
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_models_enrich" SET DEFAULT '/models/enrich.glb?v=d4b28fa0be42';
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_models_empower" SET DEFAULT '/models/empower.glb';
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_models_projects" SET DEFAULT '/models/projects.glb';
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_models_amrit" SET DEFAULT '/models/amrit.glb';
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_models_oneness" SET DEFAULT '/models/oneness.glb';
  ALTER TABLE "pillars" ADD COLUMN "record" jsonb;
  ALTER TABLE "_pillars_v" ADD COLUMN "version_record" jsonb;
  ALTER TABLE "activities" ADD COLUMN "source_note" varchar;
  ALTER TABLE "activities" ADD COLUMN "source_u_r_l" varchar;
  ALTER TABLE "activities" ADD COLUMN "record" jsonb;
  ALTER TABLE "_activities_v" ADD COLUMN "version_source_note" varchar;
  ALTER TABLE "_activities_v" ADD COLUMN "version_source_u_r_l" varchar;
  ALTER TABLE "_activities_v" ADD COLUMN "version_record" jsonb;
  ALTER TABLE "events" ADD COLUMN "record" jsonb;
  ALTER TABLE "_events_v" ADD COLUMN "version_record" jsonb;
  ALTER TABLE "partners" ADD COLUMN "record" jsonb;
  ALTER TABLE "_partners_v" ADD COLUMN "version_record" jsonb;
  ALTER TABLE "awards" ADD COLUMN "record" jsonb;
  ALTER TABLE "_awards_v" ADD COLUMN "version_record" jsonb;
  ALTER TABLE "content_slots" ADD COLUMN "context" varchar;
  ALTER TABLE "content_slots" ADD COLUMN "record" jsonb;
  ALTER TABLE "_content_slots_v" ADD COLUMN "version_context" varchar;
  ALTER TABLE "_content_slots_v" ADD COLUMN "version_record" jsonb;
  ALTER TABLE "asset_slots" ADD COLUMN "record" jsonb;
  ALTER TABLE "_asset_slots_v" ADD COLUMN "version_record" jsonb;
  ALTER TABLE "gallery_items" ADD COLUMN "record" jsonb;
  ALTER TABLE "_gallery_items_v" ADD COLUMN "version_record" jsonb;
  ALTER TABLE "pages_blocks_custom" ADD COLUMN "options" jsonb;
  ALTER TABLE "pages" ADD COLUMN "record" jsonb;
  ALTER TABLE "_pages_v_blocks_custom" ADD COLUMN "options" jsonb;
  ALTER TABLE "_pages_v" ADD COLUMN "version_record" jsonb;
  ALTER TABLE "component_settings" ADD COLUMN "options" jsonb;
  ALTER TABLE "component_settings" ADD COLUMN "record" jsonb;
  ALTER TABLE "_component_settings_v" ADD COLUMN "version_options" jsonb;
  ALTER TABLE "_component_settings_v" ADD COLUMN "version_record" jsonb;
  ALTER TABLE "live_stats" ADD COLUMN "record" jsonb;
  ALTER TABLE "_live_stats_v" ADD COLUMN "version_record" jsonb;
  ALTER TABLE "site_settings" ADD COLUMN "navigation" jsonb;
  ALTER TABLE "site_settings" ADD COLUMN "core_value_groups" jsonb;
  ALTER TABLE "site_settings" ADD COLUMN "partner_brands" jsonb;
  ALTER TABLE "site_settings" ADD COLUMN "options" jsonb;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_navigation" jsonb;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_core_value_groups" jsonb;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_partner_brands" jsonb;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_options" jsonb;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_stone_color" varchar DEFAULT '#d8cdb8';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_stone_roughness" numeric DEFAULT 0.85;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_stone_texture" varchar DEFAULT '';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_trim_color" varchar DEFAULT '#80745e';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_trim_roughness" numeric DEFAULT 0.7;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_trim_texture" varchar DEFAULT '';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_plaster_color" varchar DEFAULT '#f2eadb';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_plaster_roughness" numeric DEFAULT 0.85;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_plaster_texture" varchar DEFAULT '';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_brass_color" varchar DEFAULT '#88724b';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_brass_roughness" numeric DEFAULT 0.32;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_brass_metalness" numeric DEFAULT 0.78;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_brass_texture" varchar DEFAULT '';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_wall_color" varchar DEFAULT '#bcbcaf';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_wall_roughness" numeric DEFAULT 0.9;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_wall_texture" varchar DEFAULT '';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_wood_color" varchar DEFAULT '#544738';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_wood_roughness" numeric DEFAULT 0.65;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_wood_texture" varchar DEFAULT '';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_display_base_color" varchar DEFAULT '#243e38';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_display_base_roughness" numeric DEFAULT 0.8;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_display_base_texture" varchar DEFAULT '';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_floor_color" varchar DEFAULT '#f4ead9';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_floor_roughness" numeric DEFAULT 0.68;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_floor_texture" varchar DEFAULT '';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_carpet_color" varchar DEFAULT '#cf203b';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_carpet_roughness" numeric DEFAULT 0.95;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_carpet_texture" varchar DEFAULT '';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_queue_metal_color" varchar DEFAULT '#b5a17b';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_queue_metal_roughness" numeric DEFAULT 0.3;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_queue_metal_metalness" numeric DEFAULT 0.72;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_queue_metal_texture" varchar DEFAULT '';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_queue_belt_color" varchar DEFAULT '#244b42';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_queue_belt_roughness" numeric DEFAULT 0.94;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_queue_belt_texture" varchar DEFAULT '';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_materials_planter_colors" jsonb DEFAULT '["#e3d2b8","#454d49","#ad6f4c"]'::jsonb;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_chapters" jsonb DEFAULT '[{"id":"heal","wall":"#709d83","panel":"#a8cbb5","led":"#53d695","ink":"#91d6ae"},{"id":"enrich","wall":"#779bbd","panel":"#adc8e2","led":"#60b6ff","ink":"#92c8ed"},{"id":"empower","wall":"#bc839f","panel":"#dfb3c9","led":"#ed79b3","ink":"#e6a4be"},{"id":"projects","wall":"#6da7a9","panel":"#a4d1d0","led":"#55d5dc","ink":"#9cd5da"}]'::jsonb;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_exposure" numeric DEFAULT 1.02;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_background" varchar DEFAULT '#111714';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_fog_near" numeric DEFAULT 25;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_fog_far" numeric DEFAULT 90;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_pendant_color" varchar DEFAULT '#fff1db';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_pendant_intensity" numeric DEFAULT 60;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_edge_intensity" numeric DEFAULT 14;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_picture_color" varchar DEFAULT '#fff2de';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_picture_intensity" numeric DEFAULT 14;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_exhibit_color" varchar DEFAULT '#fff5e3';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_exhibit_intensity" numeric DEFAULT 32;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_frame_glow" numeric DEFAULT 1;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_lighting_beam_opacity" numeric DEFAULT 0.055;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_camera_field_of_view" numeric DEFAULT 48;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_camera_position_smoothing" numeric DEFAULT 16;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_camera_turn_smoothing" numeric DEFAULT 12;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_camera_scroll_smoothing" numeric DEFAULT 8;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_camera_photo_pause" numeric DEFAULT 0.25;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_camera_model_float" numeric DEFAULT 0.09;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_camera_model_sway" numeric DEFAULT 0.35;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_performance_max_width" numeric DEFAULT 1280;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_performance_max_height" numeric DEFAULT 1000;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_performance_fps" numeric DEFAULT 60;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_performance_adaptive_quality" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_performance_min_scale" numeric DEFAULT 0.65;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_performance_max_scale" numeric DEFAULT 1;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_performance_photo_load_distance" numeric DEFAULT 70;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_components_planters" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_components_barriers" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_components_benches" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_components_pendants" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_components_photo_lights" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_components_frame_backlights" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_components_edge_strips" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_components_models" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_components_windows" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_components_carpet" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_logo" varchar DEFAULT '/images/sncf-logo.webp';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_model" varchar DEFAULT '/models/sncf-emblem.glb';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_model_size" numeric DEFAULT 2.4;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_model_height" numeric DEFAULT 4.35;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_model_light_intensity" numeric DEFAULT 8;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_title" varchar DEFAULT 'Thank you for visiting';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_subtitle" varchar DEFAULT 'SERVICE WITH HUMILITY. ALWAYS.';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_background" varchar DEFAULT '#183d36';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_text_color" varchar DEFAULT '#d6eee4';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_mosaic" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_mosaic_hue" numeric DEFAULT 157;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_mosaic_saturation" numeric DEFAULT 28;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_tile_size" numeric DEFAULT 24;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_amrit_video" varchar DEFAULT '/video/amrit-lake.mp4';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_amrit_poster" varchar DEFAULT '/images/pavilion/projects-1.jpg';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_amrit_wood_color" varchar DEFAULT '#ffffff';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_amrit_grain_color" varchar DEFAULT '#f5f4ef';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_amrit_wood_roughness" numeric DEFAULT 0.48;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_amrit_glass_color" varchar DEFAULT '#e8f5f3';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_amrit_glass_opacity" numeric DEFAULT 0.07;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_amrit_frost" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_amrit_frost_opacity" numeric DEFAULT 0.94;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_amrit_frost_blur" numeric DEFAULT 0.024;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_amrit_autoplay" boolean DEFAULT true;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_oneness_video" varchar DEFAULT '/video/oneness-forest.mp4';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_oneness_poster" varchar DEFAULT '/images/pavilion/projects-2.jpg';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_oneness_wood_color" varchar DEFAULT '#ffffff';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_oneness_grain_color" varchar DEFAULT '#f5f4ef';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_oneness_wood_roughness" numeric DEFAULT 0.48;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_oneness_glass_color" varchar DEFAULT '#e8f5f3';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_oneness_glass_opacity" numeric DEFAULT 0.07;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_oneness_frost" boolean DEFAULT false;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_oneness_frost_opacity" numeric DEFAULT 0.94;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_oneness_frost_blur" numeric DEFAULT 0.024;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_windows_oneness_autoplay" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_stone_color" varchar DEFAULT '#d8cdb8';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_stone_roughness" numeric DEFAULT 0.85;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_stone_texture" varchar DEFAULT '';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_trim_color" varchar DEFAULT '#80745e';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_trim_roughness" numeric DEFAULT 0.7;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_trim_texture" varchar DEFAULT '';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_plaster_color" varchar DEFAULT '#f2eadb';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_plaster_roughness" numeric DEFAULT 0.85;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_plaster_texture" varchar DEFAULT '';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_brass_color" varchar DEFAULT '#88724b';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_brass_roughness" numeric DEFAULT 0.32;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_brass_metalness" numeric DEFAULT 0.78;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_brass_texture" varchar DEFAULT '';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_wall_color" varchar DEFAULT '#bcbcaf';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_wall_roughness" numeric DEFAULT 0.9;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_wall_texture" varchar DEFAULT '';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_wood_color" varchar DEFAULT '#544738';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_wood_roughness" numeric DEFAULT 0.65;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_wood_texture" varchar DEFAULT '';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_display_base_color" varchar DEFAULT '#243e38';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_display_base_roughness" numeric DEFAULT 0.8;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_display_base_texture" varchar DEFAULT '';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_floor_color" varchar DEFAULT '#f4ead9';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_floor_roughness" numeric DEFAULT 0.68;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_floor_texture" varchar DEFAULT '';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_carpet_color" varchar DEFAULT '#cf203b';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_carpet_roughness" numeric DEFAULT 0.95;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_carpet_texture" varchar DEFAULT '';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_queue_metal_color" varchar DEFAULT '#b5a17b';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_queue_metal_roughness" numeric DEFAULT 0.3;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_queue_metal_metalness" numeric DEFAULT 0.72;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_queue_metal_texture" varchar DEFAULT '';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_queue_belt_color" varchar DEFAULT '#244b42';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_queue_belt_roughness" numeric DEFAULT 0.94;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_queue_belt_texture" varchar DEFAULT '';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_materials_planter_colors" jsonb DEFAULT '["#e3d2b8","#454d49","#ad6f4c"]'::jsonb;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_chapters" jsonb DEFAULT '[{"id":"heal","wall":"#709d83","panel":"#a8cbb5","led":"#53d695","ink":"#91d6ae"},{"id":"enrich","wall":"#779bbd","panel":"#adc8e2","led":"#60b6ff","ink":"#92c8ed"},{"id":"empower","wall":"#bc839f","panel":"#dfb3c9","led":"#ed79b3","ink":"#e6a4be"},{"id":"projects","wall":"#6da7a9","panel":"#a4d1d0","led":"#55d5dc","ink":"#9cd5da"}]'::jsonb;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_exposure" numeric DEFAULT 1.02;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_background" varchar DEFAULT '#111714';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_fog_near" numeric DEFAULT 25;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_fog_far" numeric DEFAULT 90;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_pendant_color" varchar DEFAULT '#fff1db';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_pendant_intensity" numeric DEFAULT 60;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_edge_intensity" numeric DEFAULT 14;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_picture_color" varchar DEFAULT '#fff2de';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_picture_intensity" numeric DEFAULT 14;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_exhibit_color" varchar DEFAULT '#fff5e3';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_exhibit_intensity" numeric DEFAULT 32;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_frame_glow" numeric DEFAULT 1;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_lighting_beam_opacity" numeric DEFAULT 0.055;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_camera_field_of_view" numeric DEFAULT 48;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_camera_position_smoothing" numeric DEFAULT 16;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_camera_turn_smoothing" numeric DEFAULT 12;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_camera_scroll_smoothing" numeric DEFAULT 8;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_camera_photo_pause" numeric DEFAULT 0.25;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_camera_model_float" numeric DEFAULT 0.09;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_camera_model_sway" numeric DEFAULT 0.35;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_performance_max_width" numeric DEFAULT 1280;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_performance_max_height" numeric DEFAULT 1000;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_performance_fps" numeric DEFAULT 60;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_performance_adaptive_quality" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_performance_min_scale" numeric DEFAULT 0.65;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_performance_max_scale" numeric DEFAULT 1;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_performance_photo_load_distance" numeric DEFAULT 70;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_components_planters" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_components_barriers" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_components_benches" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_components_pendants" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_components_photo_lights" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_components_frame_backlights" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_components_edge_strips" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_components_models" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_components_windows" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_components_carpet" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_logo" varchar DEFAULT '/images/sncf-logo.webp';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_model" varchar DEFAULT '/models/sncf-emblem.glb';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_model_size" numeric DEFAULT 2.4;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_model_height" numeric DEFAULT 4.35;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_model_light_intensity" numeric DEFAULT 8;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_title" varchar DEFAULT 'Thank you for visiting';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_subtitle" varchar DEFAULT 'SERVICE WITH HUMILITY. ALWAYS.';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_background" varchar DEFAULT '#183d36';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_text_color" varchar DEFAULT '#d6eee4';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_mosaic" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_mosaic_hue" numeric DEFAULT 157;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_mosaic_saturation" numeric DEFAULT 28;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_tile_size" numeric DEFAULT 24;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_amrit_video" varchar DEFAULT '/video/amrit-lake.mp4';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_amrit_poster" varchar DEFAULT '/images/pavilion/projects-1.jpg';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_amrit_wood_color" varchar DEFAULT '#ffffff';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_amrit_grain_color" varchar DEFAULT '#f5f4ef';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_amrit_wood_roughness" numeric DEFAULT 0.48;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_amrit_glass_color" varchar DEFAULT '#e8f5f3';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_amrit_glass_opacity" numeric DEFAULT 0.07;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_amrit_frost" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_amrit_frost_opacity" numeric DEFAULT 0.94;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_amrit_frost_blur" numeric DEFAULT 0.024;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_amrit_autoplay" boolean DEFAULT true;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_oneness_video" varchar DEFAULT '/video/oneness-forest.mp4';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_oneness_poster" varchar DEFAULT '/images/pavilion/projects-2.jpg';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_oneness_wood_color" varchar DEFAULT '#ffffff';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_oneness_grain_color" varchar DEFAULT '#f5f4ef';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_oneness_wood_roughness" numeric DEFAULT 0.48;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_oneness_glass_color" varchar DEFAULT '#e8f5f3';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_oneness_glass_opacity" numeric DEFAULT 0.07;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_oneness_frost" boolean DEFAULT false;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_oneness_frost_opacity" numeric DEFAULT 0.94;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_oneness_frost_blur" numeric DEFAULT 0.024;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_windows_oneness_autoplay" boolean DEFAULT true;
  ALTER TABLE "pillars" DROP COLUMN "emblem_caption";
  ALTER TABLE "_pillars_v" DROP COLUMN "version_emblem_caption";
  ALTER TABLE "activities" DROP COLUMN "icon";
  ALTER TABLE "activities" DROP COLUMN "menu_label";
  ALTER TABLE "activities" DROP COLUMN "hover_focus_photo";
  ALTER TABLE "activities" DROP COLUMN "hover_focus_x";
  ALTER TABLE "activities" DROP COLUMN "hover_focus_y";
  ALTER TABLE "activities" DROP COLUMN "hover_focus_width";
  ALTER TABLE "activities" DROP COLUMN "hover_focus_height";
  ALTER TABLE "activities" DROP COLUMN "card_photo_media_id";
  ALTER TABLE "activities" DROP COLUMN "card_photo_src";
  ALTER TABLE "activities" DROP COLUMN "card_photo_alt";
  ALTER TABLE "_activities_v" DROP COLUMN "version_icon";
  ALTER TABLE "_activities_v" DROP COLUMN "version_menu_label";
  ALTER TABLE "_activities_v" DROP COLUMN "version_hover_focus_photo";
  ALTER TABLE "_activities_v" DROP COLUMN "version_hover_focus_x";
  ALTER TABLE "_activities_v" DROP COLUMN "version_hover_focus_y";
  ALTER TABLE "_activities_v" DROP COLUMN "version_hover_focus_width";
  ALTER TABLE "_activities_v" DROP COLUMN "version_hover_focus_height";
  ALTER TABLE "_activities_v" DROP COLUMN "version_card_photo_media_id";
  ALTER TABLE "_activities_v" DROP COLUMN "version_card_photo_src";
  ALTER TABLE "_activities_v" DROP COLUMN "version_card_photo_alt";
  ALTER TABLE "partners" DROP COLUMN "short";
  ALTER TABLE "partners" DROP COLUMN "initials";
  ALTER TABLE "partners" DROP COLUMN "color";
  ALTER TABLE "_partners_v" DROP COLUMN "version_short";
  ALTER TABLE "_partners_v" DROP COLUMN "version_initials";
  ALTER TABLE "_partners_v" DROP COLUMN "version_color";
  ALTER TABLE "content_slots" DROP COLUMN "page";
  ALTER TABLE "content_slots" DROP COLUMN "section";
  ALTER TABLE "_content_slots_v" DROP COLUMN "version_page";
  ALTER TABLE "_content_slots_v" DROP COLUMN "version_section";
  ALTER TABLE "asset_slots" DROP COLUMN "page";
  ALTER TABLE "asset_slots" DROP COLUMN "section";
  ALTER TABLE "_asset_slots_v" DROP COLUMN "version_page";
  ALTER TABLE "_asset_slots_v" DROP COLUMN "version_section";
  ALTER TABLE "site_settings" DROP COLUMN "branding_logo_media_id";
  ALTER TABLE "site_settings" DROP COLUMN "seo_image_media_id";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_branding_logo_media_id";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_seo_image_media_id";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_models_heal_media_id";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_models_enrich_media_id";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_models_empower_media_id";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_models_projects_media_id";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_models_amrit_media_id";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_models_oneness_media_id";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_models_heal_media_id";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_models_enrich_media_id";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_models_empower_media_id";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_models_projects_media_id";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_models_amrit_media_id";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_models_oneness_media_id";
  DROP TYPE "public"."enum_activities_icon";
  DROP TYPE "public"."enum__activities_v_version_icon";
  DROP TYPE "public"."enum_content_slots_page";
  DROP TYPE "public"."enum__content_slots_v_version_page";
  DROP TYPE "public"."enum_asset_slots_page";
  DROP TYPE "public"."enum__asset_slots_v_version_page";
  DROP TYPE "public"."enum_gallery_items_group";
  DROP TYPE "public"."enum__gallery_items_v_version_group";
  DROP TYPE "public"."enum_pages_blocks_custom_component";
  DROP TYPE "public"."enum__pages_v_blocks_custom_component";
  DROP TYPE "public"."enum_site_settings_navigation_menu";
  DROP TYPE "public"."enum_site_settings_social_platform";
  DROP TYPE "public"."enum__site_settings_v_version_navigation_menu";
  DROP TYPE "public"."enum__site_settings_v_version_social_platform";`)
}
