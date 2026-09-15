import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pillars_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pillars_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_activities_pillar_id" AS ENUM('heal', 'enrich', 'empower', 'projects');
  CREATE TYPE "public"."enum_activities_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__activities_v_version_pillar_id" AS ENUM('heal', 'enrich', 'empower', 'projects');
  CREATE TYPE "public"."enum__activities_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_events_kind" AS ENUM('annual', 'ongoing');
  CREATE TYPE "public"."enum_events_pillar_id" AS ENUM('heal', 'enrich', 'empower', 'projects');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_version_kind" AS ENUM('annual', 'ongoing');
  CREATE TYPE "public"."enum__events_v_version_pillar_id" AS ENUM('heal', 'enrich', 'empower', 'projects');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_partners_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__partners_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_awards_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__awards_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_gallery_items_kind" AS ENUM('photo', 'film', 'model');
  CREATE TYPE "public"."enum_gallery_items_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__gallery_items_v_version_kind" AS ENUM('photo', 'film', 'model');
  CREATE TYPE "public"."enum__gallery_items_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_content_slots_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__content_slots_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_asset_slots_kind" AS ENUM('image', 'video', 'audio', 'model', 'other');
  CREATE TYPE "public"."enum_asset_slots_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__asset_slots_v_version_kind" AS ENUM('image', 'video', 'audio', 'model', 'other');
  CREATE TYPE "public"."enum__asset_slots_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_component_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__component_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_live_stats_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__live_stats_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_site_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__site_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_pavilion_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pavilion_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "media_tags" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "tag" varchar NOT NULL
  );

  CREATE TABLE "pillars_stats" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar
  );

  CREATE TABLE "pillars_key_highlights" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar
  );

  CREATE TABLE "pillars" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "order" numeric DEFAULT 0,
    "label" varchar,
    "accent_a" varchar,
    "accent_b" varchar,
    "headline" varchar,
    "body" varchar,
    "card_image_alt" varchar,
    "short_tagline" varchar,
    "sub_text" varchar,
    "record" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_pillars_status" DEFAULT 'draft'
  );

  CREATE TABLE "_pillars_v_version_stats" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_pillars_v_version_key_highlights" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "text" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_pillars_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_key" varchar,
    "version_order" numeric DEFAULT 0,
    "version_label" varchar,
    "version_accent_a" varchar,
    "version_accent_b" varchar,
    "version_headline" varchar,
    "version_body" varchar,
    "version_card_image_alt" varchar,
    "version_short_tagline" varchar,
    "version_sub_text" varchar,
    "version_record" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__pillars_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "activities_data_points" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar
  );

  CREATE TABLE "activities_images" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "src" varchar,
    "media_id" integer,
    "alt" varchar,
    "caption" varchar,
    "width" numeric,
    "height" numeric,
    "focal" varchar
  );

  CREATE TABLE "activities" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "order" numeric DEFAULT 0,
    "pillar_id" "enum_activities_pillar_id",
    "title" varchar,
    "period" varchar,
    "blurb" varchar,
    "headline_label" varchar,
    "headline_value" varchar,
    "source_note" varchar,
    "source_u_r_l" varchar,
    "record" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_activities_status" DEFAULT 'draft'
  );

  CREATE TABLE "_activities_v_version_data_points" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_activities_v_version_images" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "src" varchar,
    "media_id" integer,
    "alt" varchar,
    "caption" varchar,
    "width" numeric,
    "height" numeric,
    "focal" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_activities_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_key" varchar,
    "version_order" numeric DEFAULT 0,
    "version_pillar_id" "enum__activities_v_version_pillar_id",
    "version_title" varchar,
    "version_period" varchar,
    "version_blurb" varchar,
    "version_headline_label" varchar,
    "version_headline_value" varchar,
    "version_source_note" varchar,
    "version_source_u_r_l" varchar,
    "version_record" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__activities_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "events" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "order" numeric DEFAULT 0,
    "title" varchar,
    "kind" "enum_events_kind",
    "month" numeric,
    "day" numeric,
    "tag" varchar,
    "blurb" varchar,
    "pillar_id" "enum_events_pillar_id",
    "location" varchar,
    "time" varchar,
    "href" varchar,
    "record" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_events_status" DEFAULT 'draft'
  );

  CREATE TABLE "_events_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_key" varchar,
    "version_order" numeric DEFAULT 0,
    "version_title" varchar,
    "version_kind" "enum__events_v_version_kind",
    "version_month" numeric,
    "version_day" numeric,
    "version_tag" varchar,
    "version_blurb" varchar,
    "version_pillar_id" "enum__events_v_version_pillar_id",
    "version_location" varchar,
    "version_time" varchar,
    "version_href" varchar,
    "version_record" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__events_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "partners" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "order" numeric DEFAULT 0,
    "name" varchar,
    "contribution" varchar,
    "note" varchar,
    "logo" varchar,
    "logo_media_id" integer,
    "href" varchar,
    "record" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_partners_status" DEFAULT 'draft'
  );

  CREATE TABLE "_partners_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_key" varchar,
    "version_order" numeric DEFAULT 0,
    "version_name" varchar,
    "version_contribution" varchar,
    "version_note" varchar,
    "version_logo" varchar,
    "version_logo_media_id" integer,
    "version_href" varchar,
    "version_record" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__partners_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "awards_photos" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "src" varchar,
    "media_id" integer,
    "alt" varchar,
    "caption" varchar,
    "width" numeric,
    "height" numeric,
    "focal" varchar
  );

  CREATE TABLE "awards" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "order" numeric DEFAULT 0,
    "title" varchar,
    "awarded_by" varchar,
    "year" varchar,
    "note" varchar,
    "featured" boolean,
    "record" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_awards_status" DEFAULT 'draft'
  );

  CREATE TABLE "_awards_v_version_photos" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "src" varchar,
    "media_id" integer,
    "alt" varchar,
    "caption" varchar,
    "width" numeric,
    "height" numeric,
    "focal" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_awards_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_key" varchar,
    "version_order" numeric DEFAULT 0,
    "version_title" varchar,
    "version_awarded_by" varchar,
    "version_year" varchar,
    "version_note" varchar,
    "version_featured" boolean,
    "version_record" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__awards_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "gallery_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "order" numeric DEFAULT 0,
    "group" varchar,
    "kind" "enum_gallery_items_kind" DEFAULT 'photo',
    "src" varchar,
    "media_id" integer,
    "alt" varchar,
    "caption" varchar,
    "width" numeric,
    "height" numeric,
    "focal" varchar,
    "poster" varchar,
    "poster_media_id" integer,
    "wide" boolean,
    "source" varchar,
    "illustrative" boolean DEFAULT false,
    "record" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_gallery_items_status" DEFAULT 'draft'
  );

  CREATE TABLE "_gallery_items_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_key" varchar,
    "version_order" numeric DEFAULT 0,
    "version_group" varchar,
    "version_kind" "enum__gallery_items_v_version_kind" DEFAULT 'photo',
    "version_src" varchar,
    "version_media_id" integer,
    "version_alt" varchar,
    "version_caption" varchar,
    "version_width" numeric,
    "version_height" numeric,
    "version_focal" varchar,
    "version_poster" varchar,
    "version_poster_media_id" integer,
    "version_wide" boolean,
    "version_source" varchar,
    "version_illustrative" boolean DEFAULT false,
    "version_record" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__gallery_items_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "pages_blocks_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "heading" varchar,
    "body" varchar,
    "enabled" boolean DEFAULT true,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_media" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "src" varchar,
    "media_id" integer,
    "alt" varchar,
    "caption" varchar,
    "width" numeric,
    "height" numeric,
    "focal" varchar,
    "video" varchar,
    "heading" varchar,
    "body" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_cards_cards" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "body" varchar,
    "href" varchar,
    "src" varchar,
    "media_id" integer,
    "alt" varchar,
    "caption" varchar,
    "width" numeric,
    "height" numeric,
    "focal" varchar
  );

  CREATE TABLE "pages_blocks_cards" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "heading" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_custom" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "key" varchar,
    "component" varchar,
    "enabled" boolean DEFAULT true,
    "options" jsonb,
    "block_name" varchar
  );

  CREATE TABLE "pages" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "order" numeric DEFAULT 0,
    "slug" varchar,
    "title" varchar,
    "description" varchar,
    "record" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_pages_status" DEFAULT 'draft'
  );

  CREATE TABLE "_pages_v_blocks_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "heading" varchar,
    "body" varchar,
    "enabled" boolean DEFAULT true,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_media" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "src" varchar,
    "media_id" integer,
    "alt" varchar,
    "caption" varchar,
    "width" numeric,
    "height" numeric,
    "focal" varchar,
    "video" varchar,
    "heading" varchar,
    "body" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_cards_cards" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "body" varchar,
    "href" varchar,
    "src" varchar,
    "media_id" integer,
    "alt" varchar,
    "caption" varchar,
    "width" numeric,
    "height" numeric,
    "focal" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_cards" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "heading" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_custom" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "component" varchar,
    "enabled" boolean DEFAULT true,
    "options" jsonb,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_key" varchar,
    "version_order" numeric DEFAULT 0,
    "version_slug" varchar,
    "version_title" varchar,
    "version_description" varchar,
    "version_record" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__pages_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "content_slots" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "order" numeric DEFAULT 0,
    "label" varchar,
    "value" varchar,
    "context" varchar,
    "record" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_content_slots_status" DEFAULT 'draft'
  );

  CREATE TABLE "_content_slots_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_key" varchar,
    "version_order" numeric DEFAULT 0,
    "version_label" varchar,
    "version_value" varchar,
    "version_context" varchar,
    "version_record" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__content_slots_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "asset_slots" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "order" numeric DEFAULT 0,
    "label" varchar,
    "source" varchar,
    "media_id" integer,
    "kind" "enum_asset_slots_kind",
    "record" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_asset_slots_status" DEFAULT 'draft'
  );

  CREATE TABLE "_asset_slots_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_key" varchar,
    "version_order" numeric DEFAULT 0,
    "version_label" varchar,
    "version_source" varchar,
    "version_media_id" integer,
    "version_kind" "enum__asset_slots_v_version_kind",
    "version_record" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__asset_slots_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "component_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "order" numeric DEFAULT 0,
    "label" varchar,
    "enabled" boolean DEFAULT true,
    "options" jsonb,
    "record" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_component_settings_status" DEFAULT 'draft'
  );

  CREATE TABLE "_component_settings_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_key" varchar,
    "version_order" numeric DEFAULT 0,
    "version_label" varchar,
    "version_enabled" boolean DEFAULT true,
    "version_options" jsonb,
    "version_record" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__component_settings_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "live_stats" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar,
    "order" numeric DEFAULT 0,
    "label" varchar,
    "value" varchar,
    "period" varchar,
    "as_of" varchar,
    "source" varchar,
    "source_u_r_l" varchar,
    "verified_at" timestamp(3) with time zone,
    "notes" varchar,
    "record" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_live_stats_status" DEFAULT 'draft'
  );

  CREATE TABLE "_live_stats_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_key" varchar,
    "version_order" numeric DEFAULT 0,
    "version_label" varchar,
    "version_value" varchar,
    "version_period" varchar,
    "version_as_of" varchar,
    "version_source" varchar,
    "version_source_u_r_l" varchar,
    "version_verified_at" timestamp(3) with time zone,
    "version_notes" varchar,
    "version_record" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__live_stats_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "stat_audit" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "label" varchar,
    "value" varchar,
    "previous_value" varchar,
    "period" varchar,
    "source" varchar,
    "operation" varchar,
    "actor_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "site_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "branding_name" varchar,
    "branding_logo" varchar,
    "branding_tagline" varchar,
    "contact_email" varchar,
    "contact_telephone" varchar,
    "contact_address" varchar,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_image" varchar,
    "navigation" jsonb,
    "core_value_groups" jsonb,
    "partner_brands" jsonb,
    "options" jsonb,
    "_status" "enum_site_settings_status" DEFAULT 'draft',
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  CREATE TABLE "_site_settings_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "version_branding_name" varchar,
    "version_branding_logo" varchar,
    "version_branding_tagline" varchar,
    "version_contact_email" varchar,
    "version_contact_telephone" varchar,
    "version_contact_address" varchar,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_image" varchar,
    "version_navigation" jsonb,
    "version_core_value_groups" jsonb,
    "version_partner_brands" jsonb,
    "version_options" jsonb,
    "version__status" "enum__site_settings_v_version_status" DEFAULT 'draft',
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "pavilion_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "settings_materials_stone_color" varchar DEFAULT '#d8cdb8',
    "settings_materials_stone_roughness" numeric DEFAULT 0.85,
    "settings_materials_stone_texture" varchar DEFAULT '',
    "settings_materials_trim_color" varchar DEFAULT '#80745e',
    "settings_materials_trim_roughness" numeric DEFAULT 0.7,
    "settings_materials_trim_texture" varchar DEFAULT '',
    "settings_materials_plaster_color" varchar DEFAULT '#f2eadb',
    "settings_materials_plaster_roughness" numeric DEFAULT 0.85,
    "settings_materials_plaster_texture" varchar DEFAULT '',
    "settings_materials_brass_color" varchar DEFAULT '#88724b',
    "settings_materials_brass_roughness" numeric DEFAULT 0.32,
    "settings_materials_brass_metalness" numeric DEFAULT 0.78,
    "settings_materials_brass_texture" varchar DEFAULT '',
    "settings_materials_wall_color" varchar DEFAULT '#bcbcaf',
    "settings_materials_wall_roughness" numeric DEFAULT 0.9,
    "settings_materials_wall_texture" varchar DEFAULT '',
    "settings_materials_wood_color" varchar DEFAULT '#544738',
    "settings_materials_wood_roughness" numeric DEFAULT 0.65,
    "settings_materials_wood_texture" varchar DEFAULT '',
    "settings_materials_display_base_color" varchar DEFAULT '#243e38',
    "settings_materials_display_base_roughness" numeric DEFAULT 0.8,
    "settings_materials_display_base_texture" varchar DEFAULT '',
    "settings_materials_floor_color" varchar DEFAULT '#f4ead9',
    "settings_materials_floor_roughness" numeric DEFAULT 0.68,
    "settings_materials_floor_texture" varchar DEFAULT '',
    "settings_materials_carpet_color" varchar DEFAULT '#cf203b',
    "settings_materials_carpet_roughness" numeric DEFAULT 0.95,
    "settings_materials_carpet_texture" varchar DEFAULT '',
    "settings_materials_queue_metal_color" varchar DEFAULT '#b5a17b',
    "settings_materials_queue_metal_roughness" numeric DEFAULT 0.3,
    "settings_materials_queue_metal_metalness" numeric DEFAULT 0.72,
    "settings_materials_queue_metal_texture" varchar DEFAULT '',
    "settings_materials_queue_belt_color" varchar DEFAULT '#244b42',
    "settings_materials_queue_belt_roughness" numeric DEFAULT 0.94,
    "settings_materials_queue_belt_texture" varchar DEFAULT '',
    "settings_materials_planter_colors" jsonb DEFAULT '["#e3d2b8","#454d49","#ad6f4c"]'::jsonb,
    "settings_chapters" jsonb DEFAULT '[{"id":"heal","wall":"#709d83","panel":"#a8cbb5","led":"#53d695","ink":"#91d6ae"},{"id":"enrich","wall":"#779bbd","panel":"#adc8e2","led":"#60b6ff","ink":"#92c8ed"},{"id":"empower","wall":"#bc839f","panel":"#dfb3c9","led":"#ed79b3","ink":"#e6a4be"},{"id":"projects","wall":"#6da7a9","panel":"#a4d1d0","led":"#55d5dc","ink":"#9cd5da"}]'::jsonb,
    "settings_lighting_exposure" numeric DEFAULT 1.02,
    "settings_lighting_background" varchar DEFAULT '#111714',
    "settings_lighting_fog_near" numeric DEFAULT 25,
    "settings_lighting_fog_far" numeric DEFAULT 90,
    "settings_lighting_pendant_color" varchar DEFAULT '#fff1db',
    "settings_lighting_pendant_intensity" numeric DEFAULT 60,
    "settings_lighting_edge_intensity" numeric DEFAULT 14,
    "settings_lighting_picture_color" varchar DEFAULT '#fff2de',
    "settings_lighting_picture_intensity" numeric DEFAULT 14,
    "settings_lighting_exhibit_color" varchar DEFAULT '#fff5e3',
    "settings_lighting_exhibit_intensity" numeric DEFAULT 32,
    "settings_lighting_frame_glow" numeric DEFAULT 1,
    "settings_lighting_beam_opacity" numeric DEFAULT 0.055,
    "settings_camera_field_of_view" numeric DEFAULT 48,
    "settings_camera_position_smoothing" numeric DEFAULT 16,
    "settings_camera_turn_smoothing" numeric DEFAULT 12,
    "settings_camera_scroll_smoothing" numeric DEFAULT 8,
    "settings_camera_photo_pause" numeric DEFAULT 0.25,
    "settings_camera_model_float" numeric DEFAULT 0.09,
    "settings_camera_model_sway" numeric DEFAULT 0.35,
    "settings_performance_max_width" numeric DEFAULT 1280,
    "settings_performance_max_height" numeric DEFAULT 1000,
    "settings_performance_fps" numeric DEFAULT 60,
    "settings_performance_adaptive_quality" boolean DEFAULT true,
    "settings_performance_min_scale" numeric DEFAULT 0.65,
    "settings_performance_max_scale" numeric DEFAULT 1,
    "settings_performance_photo_load_distance" numeric DEFAULT 70,
    "settings_components_planters" boolean DEFAULT true,
    "settings_components_barriers" boolean DEFAULT true,
    "settings_components_benches" boolean DEFAULT true,
    "settings_components_pendants" boolean DEFAULT true,
    "settings_components_photo_lights" boolean DEFAULT true,
    "settings_components_frame_backlights" boolean DEFAULT true,
    "settings_components_edge_strips" boolean DEFAULT true,
    "settings_components_models" boolean DEFAULT true,
    "settings_components_windows" boolean DEFAULT true,
    "settings_components_carpet" boolean DEFAULT true,
    "settings_finale_logo" varchar DEFAULT '/images/sncf-logo.webp',
    "settings_finale_title" varchar DEFAULT 'Thank you for visiting',
    "settings_finale_subtitle" varchar DEFAULT 'SERVICE WITH HUMILITY. ALWAYS.',
    "settings_finale_background" varchar DEFAULT '#183d36',
    "settings_finale_text_color" varchar DEFAULT '#d6eee4',
    "settings_finale_mosaic" boolean DEFAULT true,
    "settings_finale_mosaic_hue" numeric DEFAULT 157,
    "settings_finale_mosaic_saturation" numeric DEFAULT 28,
    "settings_finale_tile_size" numeric DEFAULT 24,
    "settings_windows_amrit_video" varchar DEFAULT '/video/amrit-lake.mp4',
    "settings_windows_amrit_poster" varchar DEFAULT '/images/pavilion/projects-1.jpg',
    "settings_windows_amrit_wood_color" varchar DEFAULT '#ffffff',
    "settings_windows_amrit_grain_color" varchar DEFAULT '#f5f4ef',
    "settings_windows_amrit_wood_roughness" numeric DEFAULT 0.48,
    "settings_windows_amrit_glass_color" varchar DEFAULT '#e8f5f3',
    "settings_windows_amrit_glass_opacity" numeric DEFAULT 0.07,
    "settings_windows_amrit_frost" boolean DEFAULT true,
    "settings_windows_amrit_frost_opacity" numeric DEFAULT 0.94,
    "settings_windows_amrit_frost_blur" numeric DEFAULT 0.024,
    "settings_windows_amrit_autoplay" boolean DEFAULT true,
    "settings_windows_oneness_video" varchar DEFAULT '/video/oneness-forest.mp4',
    "settings_windows_oneness_poster" varchar DEFAULT '/images/pavilion/projects-2.jpg',
    "settings_windows_oneness_wood_color" varchar DEFAULT '#ffffff',
    "settings_windows_oneness_grain_color" varchar DEFAULT '#f5f4ef',
    "settings_windows_oneness_wood_roughness" numeric DEFAULT 0.48,
    "settings_windows_oneness_glass_color" varchar DEFAULT '#e8f5f3',
    "settings_windows_oneness_glass_opacity" numeric DEFAULT 0.07,
    "settings_windows_oneness_frost" boolean DEFAULT false,
    "settings_windows_oneness_frost_opacity" numeric DEFAULT 0.94,
    "settings_windows_oneness_frost_blur" numeric DEFAULT 0.024,
    "settings_windows_oneness_autoplay" boolean DEFAULT true,
    "settings_models_heal" varchar DEFAULT '/models/heal.glb',
    "settings_models_enrich" varchar DEFAULT '/models/enrich.glb?v=d4b28fa0be42',
    "settings_models_empower" varchar DEFAULT '/models/empower.glb',
    "settings_models_projects" varchar DEFAULT '/models/projects.glb',
    "settings_models_amrit" varchar DEFAULT '/models/amrit.glb',
    "settings_models_oneness" varchar DEFAULT '/models/oneness.glb',
    "_status" "enum_pavilion_settings_status" DEFAULT 'draft',
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  CREATE TABLE "_pavilion_settings_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "version_settings_materials_stone_color" varchar DEFAULT '#d8cdb8',
    "version_settings_materials_stone_roughness" numeric DEFAULT 0.85,
    "version_settings_materials_stone_texture" varchar DEFAULT '',
    "version_settings_materials_trim_color" varchar DEFAULT '#80745e',
    "version_settings_materials_trim_roughness" numeric DEFAULT 0.7,
    "version_settings_materials_trim_texture" varchar DEFAULT '',
    "version_settings_materials_plaster_color" varchar DEFAULT '#f2eadb',
    "version_settings_materials_plaster_roughness" numeric DEFAULT 0.85,
    "version_settings_materials_plaster_texture" varchar DEFAULT '',
    "version_settings_materials_brass_color" varchar DEFAULT '#88724b',
    "version_settings_materials_brass_roughness" numeric DEFAULT 0.32,
    "version_settings_materials_brass_metalness" numeric DEFAULT 0.78,
    "version_settings_materials_brass_texture" varchar DEFAULT '',
    "version_settings_materials_wall_color" varchar DEFAULT '#bcbcaf',
    "version_settings_materials_wall_roughness" numeric DEFAULT 0.9,
    "version_settings_materials_wall_texture" varchar DEFAULT '',
    "version_settings_materials_wood_color" varchar DEFAULT '#544738',
    "version_settings_materials_wood_roughness" numeric DEFAULT 0.65,
    "version_settings_materials_wood_texture" varchar DEFAULT '',
    "version_settings_materials_display_base_color" varchar DEFAULT '#243e38',
    "version_settings_materials_display_base_roughness" numeric DEFAULT 0.8,
    "version_settings_materials_display_base_texture" varchar DEFAULT '',
    "version_settings_materials_floor_color" varchar DEFAULT '#f4ead9',
    "version_settings_materials_floor_roughness" numeric DEFAULT 0.68,
    "version_settings_materials_floor_texture" varchar DEFAULT '',
    "version_settings_materials_carpet_color" varchar DEFAULT '#cf203b',
    "version_settings_materials_carpet_roughness" numeric DEFAULT 0.95,
    "version_settings_materials_carpet_texture" varchar DEFAULT '',
    "version_settings_materials_queue_metal_color" varchar DEFAULT '#b5a17b',
    "version_settings_materials_queue_metal_roughness" numeric DEFAULT 0.3,
    "version_settings_materials_queue_metal_metalness" numeric DEFAULT 0.72,
    "version_settings_materials_queue_metal_texture" varchar DEFAULT '',
    "version_settings_materials_queue_belt_color" varchar DEFAULT '#244b42',
    "version_settings_materials_queue_belt_roughness" numeric DEFAULT 0.94,
    "version_settings_materials_queue_belt_texture" varchar DEFAULT '',
    "version_settings_materials_planter_colors" jsonb DEFAULT '["#e3d2b8","#454d49","#ad6f4c"]'::jsonb,
    "version_settings_chapters" jsonb DEFAULT '[{"id":"heal","wall":"#709d83","panel":"#a8cbb5","led":"#53d695","ink":"#91d6ae"},{"id":"enrich","wall":"#779bbd","panel":"#adc8e2","led":"#60b6ff","ink":"#92c8ed"},{"id":"empower","wall":"#bc839f","panel":"#dfb3c9","led":"#ed79b3","ink":"#e6a4be"},{"id":"projects","wall":"#6da7a9","panel":"#a4d1d0","led":"#55d5dc","ink":"#9cd5da"}]'::jsonb,
    "version_settings_lighting_exposure" numeric DEFAULT 1.02,
    "version_settings_lighting_background" varchar DEFAULT '#111714',
    "version_settings_lighting_fog_near" numeric DEFAULT 25,
    "version_settings_lighting_fog_far" numeric DEFAULT 90,
    "version_settings_lighting_pendant_color" varchar DEFAULT '#fff1db',
    "version_settings_lighting_pendant_intensity" numeric DEFAULT 60,
    "version_settings_lighting_edge_intensity" numeric DEFAULT 14,
    "version_settings_lighting_picture_color" varchar DEFAULT '#fff2de',
    "version_settings_lighting_picture_intensity" numeric DEFAULT 14,
    "version_settings_lighting_exhibit_color" varchar DEFAULT '#fff5e3',
    "version_settings_lighting_exhibit_intensity" numeric DEFAULT 32,
    "version_settings_lighting_frame_glow" numeric DEFAULT 1,
    "version_settings_lighting_beam_opacity" numeric DEFAULT 0.055,
    "version_settings_camera_field_of_view" numeric DEFAULT 48,
    "version_settings_camera_position_smoothing" numeric DEFAULT 16,
    "version_settings_camera_turn_smoothing" numeric DEFAULT 12,
    "version_settings_camera_scroll_smoothing" numeric DEFAULT 8,
    "version_settings_camera_photo_pause" numeric DEFAULT 0.25,
    "version_settings_camera_model_float" numeric DEFAULT 0.09,
    "version_settings_camera_model_sway" numeric DEFAULT 0.35,
    "version_settings_performance_max_width" numeric DEFAULT 1280,
    "version_settings_performance_max_height" numeric DEFAULT 1000,
    "version_settings_performance_fps" numeric DEFAULT 60,
    "version_settings_performance_adaptive_quality" boolean DEFAULT true,
    "version_settings_performance_min_scale" numeric DEFAULT 0.65,
    "version_settings_performance_max_scale" numeric DEFAULT 1,
    "version_settings_performance_photo_load_distance" numeric DEFAULT 70,
    "version_settings_components_planters" boolean DEFAULT true,
    "version_settings_components_barriers" boolean DEFAULT true,
    "version_settings_components_benches" boolean DEFAULT true,
    "version_settings_components_pendants" boolean DEFAULT true,
    "version_settings_components_photo_lights" boolean DEFAULT true,
    "version_settings_components_frame_backlights" boolean DEFAULT true,
    "version_settings_components_edge_strips" boolean DEFAULT true,
    "version_settings_components_models" boolean DEFAULT true,
    "version_settings_components_windows" boolean DEFAULT true,
    "version_settings_components_carpet" boolean DEFAULT true,
    "version_settings_finale_logo" varchar DEFAULT '/images/sncf-logo.webp',
    "version_settings_finale_title" varchar DEFAULT 'Thank you for visiting',
    "version_settings_finale_subtitle" varchar DEFAULT 'SERVICE WITH HUMILITY. ALWAYS.',
    "version_settings_finale_background" varchar DEFAULT '#183d36',
    "version_settings_finale_text_color" varchar DEFAULT '#d6eee4',
    "version_settings_finale_mosaic" boolean DEFAULT true,
    "version_settings_finale_mosaic_hue" numeric DEFAULT 157,
    "version_settings_finale_mosaic_saturation" numeric DEFAULT 28,
    "version_settings_finale_tile_size" numeric DEFAULT 24,
    "version_settings_windows_amrit_video" varchar DEFAULT '/video/amrit-lake.mp4',
    "version_settings_windows_amrit_poster" varchar DEFAULT '/images/pavilion/projects-1.jpg',
    "version_settings_windows_amrit_wood_color" varchar DEFAULT '#ffffff',
    "version_settings_windows_amrit_grain_color" varchar DEFAULT '#f5f4ef',
    "version_settings_windows_amrit_wood_roughness" numeric DEFAULT 0.48,
    "version_settings_windows_amrit_glass_color" varchar DEFAULT '#e8f5f3',
    "version_settings_windows_amrit_glass_opacity" numeric DEFAULT 0.07,
    "version_settings_windows_amrit_frost" boolean DEFAULT true,
    "version_settings_windows_amrit_frost_opacity" numeric DEFAULT 0.94,
    "version_settings_windows_amrit_frost_blur" numeric DEFAULT 0.024,
    "version_settings_windows_amrit_autoplay" boolean DEFAULT true,
    "version_settings_windows_oneness_video" varchar DEFAULT '/video/oneness-forest.mp4',
    "version_settings_windows_oneness_poster" varchar DEFAULT '/images/pavilion/projects-2.jpg',
    "version_settings_windows_oneness_wood_color" varchar DEFAULT '#ffffff',
    "version_settings_windows_oneness_grain_color" varchar DEFAULT '#f5f4ef',
    "version_settings_windows_oneness_wood_roughness" numeric DEFAULT 0.48,
    "version_settings_windows_oneness_glass_color" varchar DEFAULT '#e8f5f3',
    "version_settings_windows_oneness_glass_opacity" numeric DEFAULT 0.07,
    "version_settings_windows_oneness_frost" boolean DEFAULT false,
    "version_settings_windows_oneness_frost_opacity" numeric DEFAULT 0.94,
    "version_settings_windows_oneness_frost_blur" numeric DEFAULT 0.024,
    "version_settings_windows_oneness_autoplay" boolean DEFAULT true,
    "version_settings_models_heal" varchar DEFAULT '/models/heal.glb',
    "version_settings_models_enrich" varchar DEFAULT '/models/enrich.glb?v=d4b28fa0be42',
    "version_settings_models_empower" varchar DEFAULT '/models/empower.glb',
    "version_settings_models_projects" varchar DEFAULT '/models/projects.glb',
    "version_settings_models_amrit" varchar DEFAULT '/models/amrit.glb',
    "version_settings_models_oneness" varchar DEFAULT '/models/oneness.glb',
    "version__status" "enum__pavilion_settings_v_version_status" DEFAULT 'draft',
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  ALTER TABLE "users" ADD COLUMN "enable_a_p_i_key" boolean;
  ALTER TABLE "users" ADD COLUMN "api_key" varchar;
  ALTER TABLE "users" ADD COLUMN "api_key_index" varchar;
  ALTER TABLE "media" ADD COLUMN "folder" varchar;
  ALTER TABLE "media" ADD COLUMN "illustrative" boolean DEFAULT false;
  ALTER TABLE "media" ADD COLUMN "license" varchar;
  ALTER TABLE "media" ADD COLUMN "source_u_r_l" varchar;
  ALTER TABLE "media" ADD COLUMN "duration" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pillars_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "activities_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "partners_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "awards_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "gallery_items_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "content_slots_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "asset_slots_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "component_settings_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "live_stats_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "stat_audit_id" integer;
  ALTER TABLE "media_tags" ADD CONSTRAINT "media_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pillars_stats" ADD CONSTRAINT "pillars_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pillars_key_highlights" ADD CONSTRAINT "pillars_key_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pillars_v_version_stats" ADD CONSTRAINT "_pillars_v_version_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pillars_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pillars_v_version_key_highlights" ADD CONSTRAINT "_pillars_v_version_key_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pillars_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pillars_v" ADD CONSTRAINT "_pillars_v_parent_id_pillars_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activities_data_points" ADD CONSTRAINT "activities_data_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "activities_images" ADD CONSTRAINT "activities_images_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activities_images" ADD CONSTRAINT "activities_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activities_v_version_data_points" ADD CONSTRAINT "_activities_v_version_data_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_activities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activities_v_version_images" ADD CONSTRAINT "_activities_v_version_images_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_activities_v_version_images" ADD CONSTRAINT "_activities_v_version_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_activities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activities_v" ADD CONSTRAINT "_activities_v_parent_id_activities_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_media_id_media_id_fk" FOREIGN KEY ("logo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v" ADD CONSTRAINT "_partners_v_parent_id_partners_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v" ADD CONSTRAINT "_partners_v_version_logo_media_id_media_id_fk" FOREIGN KEY ("version_logo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "awards_photos" ADD CONSTRAINT "awards_photos_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "awards_photos" ADD CONSTRAINT "awards_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_awards_v_version_photos" ADD CONSTRAINT "_awards_v_version_photos_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_awards_v_version_photos" ADD CONSTRAINT "_awards_v_version_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_awards_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_awards_v" ADD CONSTRAINT "_awards_v_parent_id_awards_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."awards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_poster_media_id_media_id_fk" FOREIGN KEY ("poster_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_gallery_items_v" ADD CONSTRAINT "_gallery_items_v_parent_id_gallery_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."gallery_items"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_gallery_items_v" ADD CONSTRAINT "_gallery_items_v_version_media_id_media_id_fk" FOREIGN KEY ("version_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_gallery_items_v" ADD CONSTRAINT "_gallery_items_v_version_poster_media_id_media_id_fk" FOREIGN KEY ("version_poster_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_text" ADD CONSTRAINT "pages_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media" ADD CONSTRAINT "pages_blocks_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_media" ADD CONSTRAINT "pages_blocks_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards_cards" ADD CONSTRAINT "pages_blocks_cards_cards_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards_cards" ADD CONSTRAINT "pages_blocks_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards" ADD CONSTRAINT "pages_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_custom" ADD CONSTRAINT "pages_blocks_custom_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text" ADD CONSTRAINT "_pages_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media" ADD CONSTRAINT "_pages_v_blocks_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media" ADD CONSTRAINT "_pages_v_blocks_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards_cards" ADD CONSTRAINT "_pages_v_blocks_cards_cards_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards_cards" ADD CONSTRAINT "_pages_v_blocks_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards" ADD CONSTRAINT "_pages_v_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_custom" ADD CONSTRAINT "_pages_v_blocks_custom_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_content_slots_v" ADD CONSTRAINT "_content_slots_v_parent_id_content_slots_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."content_slots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "asset_slots" ADD CONSTRAINT "asset_slots_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_asset_slots_v" ADD CONSTRAINT "_asset_slots_v_parent_id_asset_slots_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."asset_slots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_asset_slots_v" ADD CONSTRAINT "_asset_slots_v_version_media_id_media_id_fk" FOREIGN KEY ("version_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_component_settings_v" ADD CONSTRAINT "_component_settings_v_parent_id_component_settings_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."component_settings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_live_stats_v" ADD CONSTRAINT "_live_stats_v_parent_id_live_stats_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."live_stats"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stat_audit" ADD CONSTRAINT "stat_audit_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "media_tags_order_idx" ON "media_tags" USING btree ("_order");
  CREATE INDEX "media_tags_parent_id_idx" ON "media_tags" USING btree ("_parent_id");
  CREATE INDEX "pillars_stats_order_idx" ON "pillars_stats" USING btree ("_order");
  CREATE INDEX "pillars_stats_parent_id_idx" ON "pillars_stats" USING btree ("_parent_id");
  CREATE INDEX "pillars_key_highlights_order_idx" ON "pillars_key_highlights" USING btree ("_order");
  CREATE INDEX "pillars_key_highlights_parent_id_idx" ON "pillars_key_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pillars_key_idx" ON "pillars" USING btree ("key");
  CREATE INDEX "pillars_order_idx" ON "pillars" USING btree ("order");
  CREATE INDEX "pillars_updated_at_idx" ON "pillars" USING btree ("updated_at");
  CREATE INDEX "pillars_created_at_idx" ON "pillars" USING btree ("created_at");
  CREATE INDEX "pillars__status_idx" ON "pillars" USING btree ("_status");
  CREATE INDEX "_pillars_v_version_stats_order_idx" ON "_pillars_v_version_stats" USING btree ("_order");
  CREATE INDEX "_pillars_v_version_stats_parent_id_idx" ON "_pillars_v_version_stats" USING btree ("_parent_id");
  CREATE INDEX "_pillars_v_version_key_highlights_order_idx" ON "_pillars_v_version_key_highlights" USING btree ("_order");
  CREATE INDEX "_pillars_v_version_key_highlights_parent_id_idx" ON "_pillars_v_version_key_highlights" USING btree ("_parent_id");
  CREATE INDEX "_pillars_v_parent_idx" ON "_pillars_v" USING btree ("parent_id");
  CREATE INDEX "_pillars_v_version_version_key_idx" ON "_pillars_v" USING btree ("version_key");
  CREATE INDEX "_pillars_v_version_version_order_idx" ON "_pillars_v" USING btree ("version_order");
  CREATE INDEX "_pillars_v_version_version_updated_at_idx" ON "_pillars_v" USING btree ("version_updated_at");
  CREATE INDEX "_pillars_v_version_version_created_at_idx" ON "_pillars_v" USING btree ("version_created_at");
  CREATE INDEX "_pillars_v_version_version__status_idx" ON "_pillars_v" USING btree ("version__status");
  CREATE INDEX "_pillars_v_created_at_idx" ON "_pillars_v" USING btree ("created_at");
  CREATE INDEX "_pillars_v_updated_at_idx" ON "_pillars_v" USING btree ("updated_at");
  CREATE INDEX "_pillars_v_latest_idx" ON "_pillars_v" USING btree ("latest");
  CREATE INDEX "_pillars_v_autosave_idx" ON "_pillars_v" USING btree ("autosave");
  CREATE INDEX "activities_data_points_order_idx" ON "activities_data_points" USING btree ("_order");
  CREATE INDEX "activities_data_points_parent_id_idx" ON "activities_data_points" USING btree ("_parent_id");
  CREATE INDEX "activities_images_order_idx" ON "activities_images" USING btree ("_order");
  CREATE INDEX "activities_images_parent_id_idx" ON "activities_images" USING btree ("_parent_id");
  CREATE INDEX "activities_images_media_idx" ON "activities_images" USING btree ("media_id");
  CREATE UNIQUE INDEX "activities_key_idx" ON "activities" USING btree ("key");
  CREATE INDEX "activities_order_idx" ON "activities" USING btree ("order");
  CREATE INDEX "activities_pillar_id_idx" ON "activities" USING btree ("pillar_id");
  CREATE INDEX "activities_updated_at_idx" ON "activities" USING btree ("updated_at");
  CREATE INDEX "activities_created_at_idx" ON "activities" USING btree ("created_at");
  CREATE INDEX "activities__status_idx" ON "activities" USING btree ("_status");
  CREATE INDEX "_activities_v_version_data_points_order_idx" ON "_activities_v_version_data_points" USING btree ("_order");
  CREATE INDEX "_activities_v_version_data_points_parent_id_idx" ON "_activities_v_version_data_points" USING btree ("_parent_id");
  CREATE INDEX "_activities_v_version_images_order_idx" ON "_activities_v_version_images" USING btree ("_order");
  CREATE INDEX "_activities_v_version_images_parent_id_idx" ON "_activities_v_version_images" USING btree ("_parent_id");
  CREATE INDEX "_activities_v_version_images_media_idx" ON "_activities_v_version_images" USING btree ("media_id");
  CREATE INDEX "_activities_v_parent_idx" ON "_activities_v" USING btree ("parent_id");
  CREATE INDEX "_activities_v_version_version_key_idx" ON "_activities_v" USING btree ("version_key");
  CREATE INDEX "_activities_v_version_version_order_idx" ON "_activities_v" USING btree ("version_order");
  CREATE INDEX "_activities_v_version_version_pillar_id_idx" ON "_activities_v" USING btree ("version_pillar_id");
  CREATE INDEX "_activities_v_version_version_updated_at_idx" ON "_activities_v" USING btree ("version_updated_at");
  CREATE INDEX "_activities_v_version_version_created_at_idx" ON "_activities_v" USING btree ("version_created_at");
  CREATE INDEX "_activities_v_version_version__status_idx" ON "_activities_v" USING btree ("version__status");
  CREATE INDEX "_activities_v_created_at_idx" ON "_activities_v" USING btree ("created_at");
  CREATE INDEX "_activities_v_updated_at_idx" ON "_activities_v" USING btree ("updated_at");
  CREATE INDEX "_activities_v_latest_idx" ON "_activities_v" USING btree ("latest");
  CREATE INDEX "_activities_v_autosave_idx" ON "_activities_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "events_key_idx" ON "events" USING btree ("key");
  CREATE INDEX "events_order_idx" ON "events" USING btree ("order");
  CREATE INDEX "events_pillar_id_idx" ON "events" USING btree ("pillar_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_key_idx" ON "_events_v" USING btree ("version_key");
  CREATE INDEX "_events_v_version_version_order_idx" ON "_events_v" USING btree ("version_order");
  CREATE INDEX "_events_v_version_version_pillar_id_idx" ON "_events_v" USING btree ("version_pillar_id");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
  CREATE INDEX "_events_v_autosave_idx" ON "_events_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "partners_key_idx" ON "partners" USING btree ("key");
  CREATE INDEX "partners_order_idx" ON "partners" USING btree ("order");
  CREATE INDEX "partners_logo_media_idx" ON "partners" USING btree ("logo_media_id");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE INDEX "partners__status_idx" ON "partners" USING btree ("_status");
  CREATE INDEX "_partners_v_parent_idx" ON "_partners_v" USING btree ("parent_id");
  CREATE INDEX "_partners_v_version_version_key_idx" ON "_partners_v" USING btree ("version_key");
  CREATE INDEX "_partners_v_version_version_order_idx" ON "_partners_v" USING btree ("version_order");
  CREATE INDEX "_partners_v_version_version_logo_media_idx" ON "_partners_v" USING btree ("version_logo_media_id");
  CREATE INDEX "_partners_v_version_version_updated_at_idx" ON "_partners_v" USING btree ("version_updated_at");
  CREATE INDEX "_partners_v_version_version_created_at_idx" ON "_partners_v" USING btree ("version_created_at");
  CREATE INDEX "_partners_v_version_version__status_idx" ON "_partners_v" USING btree ("version__status");
  CREATE INDEX "_partners_v_created_at_idx" ON "_partners_v" USING btree ("created_at");
  CREATE INDEX "_partners_v_updated_at_idx" ON "_partners_v" USING btree ("updated_at");
  CREATE INDEX "_partners_v_latest_idx" ON "_partners_v" USING btree ("latest");
  CREATE INDEX "_partners_v_autosave_idx" ON "_partners_v" USING btree ("autosave");
  CREATE INDEX "awards_photos_order_idx" ON "awards_photos" USING btree ("_order");
  CREATE INDEX "awards_photos_parent_id_idx" ON "awards_photos" USING btree ("_parent_id");
  CREATE INDEX "awards_photos_media_idx" ON "awards_photos" USING btree ("media_id");
  CREATE UNIQUE INDEX "awards_key_idx" ON "awards" USING btree ("key");
  CREATE INDEX "awards_order_idx" ON "awards" USING btree ("order");
  CREATE INDEX "awards_updated_at_idx" ON "awards" USING btree ("updated_at");
  CREATE INDEX "awards_created_at_idx" ON "awards" USING btree ("created_at");
  CREATE INDEX "awards__status_idx" ON "awards" USING btree ("_status");
  CREATE INDEX "_awards_v_version_photos_order_idx" ON "_awards_v_version_photos" USING btree ("_order");
  CREATE INDEX "_awards_v_version_photos_parent_id_idx" ON "_awards_v_version_photos" USING btree ("_parent_id");
  CREATE INDEX "_awards_v_version_photos_media_idx" ON "_awards_v_version_photos" USING btree ("media_id");
  CREATE INDEX "_awards_v_parent_idx" ON "_awards_v" USING btree ("parent_id");
  CREATE INDEX "_awards_v_version_version_key_idx" ON "_awards_v" USING btree ("version_key");
  CREATE INDEX "_awards_v_version_version_order_idx" ON "_awards_v" USING btree ("version_order");
  CREATE INDEX "_awards_v_version_version_updated_at_idx" ON "_awards_v" USING btree ("version_updated_at");
  CREATE INDEX "_awards_v_version_version_created_at_idx" ON "_awards_v" USING btree ("version_created_at");
  CREATE INDEX "_awards_v_version_version__status_idx" ON "_awards_v" USING btree ("version__status");
  CREATE INDEX "_awards_v_created_at_idx" ON "_awards_v" USING btree ("created_at");
  CREATE INDEX "_awards_v_updated_at_idx" ON "_awards_v" USING btree ("updated_at");
  CREATE INDEX "_awards_v_latest_idx" ON "_awards_v" USING btree ("latest");
  CREATE INDEX "_awards_v_autosave_idx" ON "_awards_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "gallery_items_key_idx" ON "gallery_items" USING btree ("key");
  CREATE INDEX "gallery_items_order_idx" ON "gallery_items" USING btree ("order");
  CREATE INDEX "gallery_items_group_idx" ON "gallery_items" USING btree ("group");
  CREATE INDEX "gallery_items_media_idx" ON "gallery_items" USING btree ("media_id");
  CREATE INDEX "gallery_items_poster_media_idx" ON "gallery_items" USING btree ("poster_media_id");
  CREATE INDEX "gallery_items_updated_at_idx" ON "gallery_items" USING btree ("updated_at");
  CREATE INDEX "gallery_items_created_at_idx" ON "gallery_items" USING btree ("created_at");
  CREATE INDEX "gallery_items__status_idx" ON "gallery_items" USING btree ("_status");
  CREATE INDEX "_gallery_items_v_parent_idx" ON "_gallery_items_v" USING btree ("parent_id");
  CREATE INDEX "_gallery_items_v_version_version_key_idx" ON "_gallery_items_v" USING btree ("version_key");
  CREATE INDEX "_gallery_items_v_version_version_order_idx" ON "_gallery_items_v" USING btree ("version_order");
  CREATE INDEX "_gallery_items_v_version_version_group_idx" ON "_gallery_items_v" USING btree ("version_group");
  CREATE INDEX "_gallery_items_v_version_version_media_idx" ON "_gallery_items_v" USING btree ("version_media_id");
  CREATE INDEX "_gallery_items_v_version_version_poster_media_idx" ON "_gallery_items_v" USING btree ("version_poster_media_id");
  CREATE INDEX "_gallery_items_v_version_version_updated_at_idx" ON "_gallery_items_v" USING btree ("version_updated_at");
  CREATE INDEX "_gallery_items_v_version_version_created_at_idx" ON "_gallery_items_v" USING btree ("version_created_at");
  CREATE INDEX "_gallery_items_v_version_version__status_idx" ON "_gallery_items_v" USING btree ("version__status");
  CREATE INDEX "_gallery_items_v_created_at_idx" ON "_gallery_items_v" USING btree ("created_at");
  CREATE INDEX "_gallery_items_v_updated_at_idx" ON "_gallery_items_v" USING btree ("updated_at");
  CREATE INDEX "_gallery_items_v_latest_idx" ON "_gallery_items_v" USING btree ("latest");
  CREATE INDEX "_gallery_items_v_autosave_idx" ON "_gallery_items_v" USING btree ("autosave");
  CREATE INDEX "pages_blocks_text_order_idx" ON "pages_blocks_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_parent_id_idx" ON "pages_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_path_idx" ON "pages_blocks_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_order_idx" ON "pages_blocks_media" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_parent_id_idx" ON "pages_blocks_media" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_path_idx" ON "pages_blocks_media" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_media_idx" ON "pages_blocks_media" USING btree ("media_id");
  CREATE INDEX "pages_blocks_cards_cards_order_idx" ON "pages_blocks_cards_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_cards_cards_parent_id_idx" ON "pages_blocks_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cards_cards_media_idx" ON "pages_blocks_cards_cards" USING btree ("media_id");
  CREATE INDEX "pages_blocks_cards_order_idx" ON "pages_blocks_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_cards_parent_id_idx" ON "pages_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cards_path_idx" ON "pages_blocks_cards" USING btree ("_path");
  CREATE INDEX "pages_blocks_custom_order_idx" ON "pages_blocks_custom" USING btree ("_order");
  CREATE INDEX "pages_blocks_custom_parent_id_idx" ON "pages_blocks_custom" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_custom_path_idx" ON "pages_blocks_custom" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_key_idx" ON "pages" USING btree ("key");
  CREATE INDEX "pages_order_idx" ON "pages" USING btree ("order");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "_pages_v_blocks_text_order_idx" ON "_pages_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_text_parent_id_idx" ON "_pages_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_text_path_idx" ON "_pages_v_blocks_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_order_idx" ON "_pages_v_blocks_media" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_parent_id_idx" ON "_pages_v_blocks_media" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_path_idx" ON "_pages_v_blocks_media" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_media_idx" ON "_pages_v_blocks_media" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_cards_cards_order_idx" ON "_pages_v_blocks_cards_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cards_cards_parent_id_idx" ON "_pages_v_blocks_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cards_cards_media_idx" ON "_pages_v_blocks_cards_cards" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_cards_order_idx" ON "_pages_v_blocks_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cards_parent_id_idx" ON "_pages_v_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cards_path_idx" ON "_pages_v_blocks_cards" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_custom_order_idx" ON "_pages_v_blocks_custom" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_custom_parent_id_idx" ON "_pages_v_blocks_custom" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_custom_path_idx" ON "_pages_v_blocks_custom" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_key_idx" ON "_pages_v" USING btree ("version_key");
  CREATE INDEX "_pages_v_version_version_order_idx" ON "_pages_v" USING btree ("version_order");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "content_slots_key_idx" ON "content_slots" USING btree ("key");
  CREATE INDEX "content_slots_order_idx" ON "content_slots" USING btree ("order");
  CREATE INDEX "content_slots_updated_at_idx" ON "content_slots" USING btree ("updated_at");
  CREATE INDEX "content_slots_created_at_idx" ON "content_slots" USING btree ("created_at");
  CREATE INDEX "content_slots__status_idx" ON "content_slots" USING btree ("_status");
  CREATE INDEX "_content_slots_v_parent_idx" ON "_content_slots_v" USING btree ("parent_id");
  CREATE INDEX "_content_slots_v_version_version_key_idx" ON "_content_slots_v" USING btree ("version_key");
  CREATE INDEX "_content_slots_v_version_version_order_idx" ON "_content_slots_v" USING btree ("version_order");
  CREATE INDEX "_content_slots_v_version_version_updated_at_idx" ON "_content_slots_v" USING btree ("version_updated_at");
  CREATE INDEX "_content_slots_v_version_version_created_at_idx" ON "_content_slots_v" USING btree ("version_created_at");
  CREATE INDEX "_content_slots_v_version_version__status_idx" ON "_content_slots_v" USING btree ("version__status");
  CREATE INDEX "_content_slots_v_created_at_idx" ON "_content_slots_v" USING btree ("created_at");
  CREATE INDEX "_content_slots_v_updated_at_idx" ON "_content_slots_v" USING btree ("updated_at");
  CREATE INDEX "_content_slots_v_latest_idx" ON "_content_slots_v" USING btree ("latest");
  CREATE INDEX "_content_slots_v_autosave_idx" ON "_content_slots_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "asset_slots_key_idx" ON "asset_slots" USING btree ("key");
  CREATE INDEX "asset_slots_order_idx" ON "asset_slots" USING btree ("order");
  CREATE INDEX "asset_slots_media_idx" ON "asset_slots" USING btree ("media_id");
  CREATE INDEX "asset_slots_updated_at_idx" ON "asset_slots" USING btree ("updated_at");
  CREATE INDEX "asset_slots_created_at_idx" ON "asset_slots" USING btree ("created_at");
  CREATE INDEX "asset_slots__status_idx" ON "asset_slots" USING btree ("_status");
  CREATE INDEX "_asset_slots_v_parent_idx" ON "_asset_slots_v" USING btree ("parent_id");
  CREATE INDEX "_asset_slots_v_version_version_key_idx" ON "_asset_slots_v" USING btree ("version_key");
  CREATE INDEX "_asset_slots_v_version_version_order_idx" ON "_asset_slots_v" USING btree ("version_order");
  CREATE INDEX "_asset_slots_v_version_version_media_idx" ON "_asset_slots_v" USING btree ("version_media_id");
  CREATE INDEX "_asset_slots_v_version_version_updated_at_idx" ON "_asset_slots_v" USING btree ("version_updated_at");
  CREATE INDEX "_asset_slots_v_version_version_created_at_idx" ON "_asset_slots_v" USING btree ("version_created_at");
  CREATE INDEX "_asset_slots_v_version_version__status_idx" ON "_asset_slots_v" USING btree ("version__status");
  CREATE INDEX "_asset_slots_v_created_at_idx" ON "_asset_slots_v" USING btree ("created_at");
  CREATE INDEX "_asset_slots_v_updated_at_idx" ON "_asset_slots_v" USING btree ("updated_at");
  CREATE INDEX "_asset_slots_v_latest_idx" ON "_asset_slots_v" USING btree ("latest");
  CREATE INDEX "_asset_slots_v_autosave_idx" ON "_asset_slots_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "component_settings_key_idx" ON "component_settings" USING btree ("key");
  CREATE INDEX "component_settings_order_idx" ON "component_settings" USING btree ("order");
  CREATE INDEX "component_settings_updated_at_idx" ON "component_settings" USING btree ("updated_at");
  CREATE INDEX "component_settings_created_at_idx" ON "component_settings" USING btree ("created_at");
  CREATE INDEX "component_settings__status_idx" ON "component_settings" USING btree ("_status");
  CREATE INDEX "_component_settings_v_parent_idx" ON "_component_settings_v" USING btree ("parent_id");
  CREATE INDEX "_component_settings_v_version_version_key_idx" ON "_component_settings_v" USING btree ("version_key");
  CREATE INDEX "_component_settings_v_version_version_order_idx" ON "_component_settings_v" USING btree ("version_order");
  CREATE INDEX "_component_settings_v_version_version_updated_at_idx" ON "_component_settings_v" USING btree ("version_updated_at");
  CREATE INDEX "_component_settings_v_version_version_created_at_idx" ON "_component_settings_v" USING btree ("version_created_at");
  CREATE INDEX "_component_settings_v_version_version__status_idx" ON "_component_settings_v" USING btree ("version__status");
  CREATE INDEX "_component_settings_v_created_at_idx" ON "_component_settings_v" USING btree ("created_at");
  CREATE INDEX "_component_settings_v_updated_at_idx" ON "_component_settings_v" USING btree ("updated_at");
  CREATE INDEX "_component_settings_v_latest_idx" ON "_component_settings_v" USING btree ("latest");
  CREATE INDEX "_component_settings_v_autosave_idx" ON "_component_settings_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "live_stats_key_idx" ON "live_stats" USING btree ("key");
  CREATE INDEX "live_stats_order_idx" ON "live_stats" USING btree ("order");
  CREATE INDEX "live_stats_updated_at_idx" ON "live_stats" USING btree ("updated_at");
  CREATE INDEX "live_stats_created_at_idx" ON "live_stats" USING btree ("created_at");
  CREATE INDEX "live_stats__status_idx" ON "live_stats" USING btree ("_status");
  CREATE INDEX "_live_stats_v_parent_idx" ON "_live_stats_v" USING btree ("parent_id");
  CREATE INDEX "_live_stats_v_version_version_key_idx" ON "_live_stats_v" USING btree ("version_key");
  CREATE INDEX "_live_stats_v_version_version_order_idx" ON "_live_stats_v" USING btree ("version_order");
  CREATE INDEX "_live_stats_v_version_version_updated_at_idx" ON "_live_stats_v" USING btree ("version_updated_at");
  CREATE INDEX "_live_stats_v_version_version_created_at_idx" ON "_live_stats_v" USING btree ("version_created_at");
  CREATE INDEX "_live_stats_v_version_version__status_idx" ON "_live_stats_v" USING btree ("version__status");
  CREATE INDEX "_live_stats_v_created_at_idx" ON "_live_stats_v" USING btree ("created_at");
  CREATE INDEX "_live_stats_v_updated_at_idx" ON "_live_stats_v" USING btree ("updated_at");
  CREATE INDEX "_live_stats_v_latest_idx" ON "_live_stats_v" USING btree ("latest");
  CREATE INDEX "_live_stats_v_autosave_idx" ON "_live_stats_v" USING btree ("autosave");
  CREATE INDEX "stat_audit_actor_idx" ON "stat_audit" USING btree ("actor_id");
  CREATE INDEX "stat_audit_updated_at_idx" ON "stat_audit" USING btree ("updated_at");
  CREATE INDEX "stat_audit_created_at_idx" ON "stat_audit" USING btree ("created_at");
  CREATE INDEX "site_settings__status_idx" ON "site_settings" USING btree ("_status");
  CREATE INDEX "_site_settings_v_version_version__status_idx" ON "_site_settings_v" USING btree ("version__status");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  CREATE INDEX "_site_settings_v_latest_idx" ON "_site_settings_v" USING btree ("latest");
  CREATE INDEX "pavilion_settings__status_idx" ON "pavilion_settings" USING btree ("_status");
  CREATE INDEX "_pavilion_settings_v_version_version__status_idx" ON "_pavilion_settings_v" USING btree ("version__status");
  CREATE INDEX "_pavilion_settings_v_created_at_idx" ON "_pavilion_settings_v" USING btree ("created_at");
  CREATE INDEX "_pavilion_settings_v_updated_at_idx" ON "_pavilion_settings_v" USING btree ("updated_at");
  CREATE INDEX "_pavilion_settings_v_latest_idx" ON "_pavilion_settings_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pillars_fk" FOREIGN KEY ("pillars_id") REFERENCES "public"."pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_activities_fk" FOREIGN KEY ("activities_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_awards_fk" FOREIGN KEY ("awards_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_items_fk" FOREIGN KEY ("gallery_items_id") REFERENCES "public"."gallery_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_content_slots_fk" FOREIGN KEY ("content_slots_id") REFERENCES "public"."content_slots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_asset_slots_fk" FOREIGN KEY ("asset_slots_id") REFERENCES "public"."asset_slots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_component_settings_fk" FOREIGN KEY ("component_settings_id") REFERENCES "public"."component_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_live_stats_fk" FOREIGN KEY ("live_stats_id") REFERENCES "public"."live_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stat_audit_fk" FOREIGN KEY ("stat_audit_id") REFERENCES "public"."stat_audit"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder");
  CREATE INDEX "payload_locked_documents_rels_pillars_id_idx" ON "payload_locked_documents_rels" USING btree ("pillars_id");
  CREATE INDEX "payload_locked_documents_rels_activities_id_idx" ON "payload_locked_documents_rels" USING btree ("activities_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");
  CREATE INDEX "payload_locked_documents_rels_awards_id_idx" ON "payload_locked_documents_rels" USING btree ("awards_id");
  CREATE INDEX "payload_locked_documents_rels_gallery_items_id_idx" ON "payload_locked_documents_rels" USING btree ("gallery_items_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_content_slots_id_idx" ON "payload_locked_documents_rels" USING btree ("content_slots_id");
  CREATE INDEX "payload_locked_documents_rels_asset_slots_id_idx" ON "payload_locked_documents_rels" USING btree ("asset_slots_id");
  CREATE INDEX "payload_locked_documents_rels_component_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("component_settings_id");
  CREATE INDEX "payload_locked_documents_rels_live_stats_id_idx" ON "payload_locked_documents_rels" USING btree ("live_stats_id");
  CREATE INDEX "payload_locked_documents_rels_stat_audit_id_idx" ON "payload_locked_documents_rels" USING btree ("stat_audit_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pillars_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pillars_key_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pillars" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pillars_v_version_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pillars_v_version_key_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pillars_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "activities_data_points" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "activities_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "activities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_activities_v_version_data_points" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_activities_v_version_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_activities_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "awards_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "awards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_awards_v_version_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_awards_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_gallery_items_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cards_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_custom" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cards_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_custom" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "content_slots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_content_slots_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "asset_slots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_asset_slots_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "component_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_component_settings_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "live_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_live_stats_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "stat_audit" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pavilion_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pavilion_settings_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "media_tags" CASCADE;
  DROP TABLE "pillars_stats" CASCADE;
  DROP TABLE "pillars_key_highlights" CASCADE;
  DROP TABLE "pillars" CASCADE;
  DROP TABLE "_pillars_v_version_stats" CASCADE;
  DROP TABLE "_pillars_v_version_key_highlights" CASCADE;
  DROP TABLE "_pillars_v" CASCADE;
  DROP TABLE "activities_data_points" CASCADE;
  DROP TABLE "activities_images" CASCADE;
  DROP TABLE "activities" CASCADE;
  DROP TABLE "_activities_v_version_data_points" CASCADE;
  DROP TABLE "_activities_v_version_images" CASCADE;
  DROP TABLE "_activities_v" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "_partners_v" CASCADE;
  DROP TABLE "awards_photos" CASCADE;
  DROP TABLE "awards" CASCADE;
  DROP TABLE "_awards_v_version_photos" CASCADE;
  DROP TABLE "_awards_v" CASCADE;
  DROP TABLE "gallery_items" CASCADE;
  DROP TABLE "_gallery_items_v" CASCADE;
  DROP TABLE "pages_blocks_text" CASCADE;
  DROP TABLE "pages_blocks_media" CASCADE;
  DROP TABLE "pages_blocks_cards_cards" CASCADE;
  DROP TABLE "pages_blocks_cards" CASCADE;
  DROP TABLE "pages_blocks_custom" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v_blocks_text" CASCADE;
  DROP TABLE "_pages_v_blocks_media" CASCADE;
  DROP TABLE "_pages_v_blocks_cards_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_custom" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "content_slots" CASCADE;
  DROP TABLE "_content_slots_v" CASCADE;
  DROP TABLE "asset_slots" CASCADE;
  DROP TABLE "_asset_slots_v" CASCADE;
  DROP TABLE "component_settings" CASCADE;
  DROP TABLE "_component_settings_v" CASCADE;
  DROP TABLE "live_stats" CASCADE;
  DROP TABLE "_live_stats_v" CASCADE;
  DROP TABLE "stat_audit" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TABLE "pavilion_settings" CASCADE;
  DROP TABLE "_pavilion_settings_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pillars_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_activities_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_partners_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_awards_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_gallery_items_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_content_slots_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_asset_slots_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_component_settings_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_live_stats_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stat_audit_fk";

  DROP INDEX "media_folder_idx";
  DROP INDEX "payload_locked_documents_rels_pillars_id_idx";
  DROP INDEX "payload_locked_documents_rels_activities_id_idx";
  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_partners_id_idx";
  DROP INDEX "payload_locked_documents_rels_awards_id_idx";
  DROP INDEX "payload_locked_documents_rels_gallery_items_id_idx";
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  DROP INDEX "payload_locked_documents_rels_content_slots_id_idx";
  DROP INDEX "payload_locked_documents_rels_asset_slots_id_idx";
  DROP INDEX "payload_locked_documents_rels_component_settings_id_idx";
  DROP INDEX "payload_locked_documents_rels_live_stats_id_idx";
  DROP INDEX "payload_locked_documents_rels_stat_audit_id_idx";
  ALTER TABLE "users" DROP COLUMN "enable_a_p_i_key";
  ALTER TABLE "users" DROP COLUMN "api_key";
  ALTER TABLE "users" DROP COLUMN "api_key_index";
  ALTER TABLE "media" DROP COLUMN "folder";
  ALTER TABLE "media" DROP COLUMN "illustrative";
  ALTER TABLE "media" DROP COLUMN "license";
  ALTER TABLE "media" DROP COLUMN "source_u_r_l";
  ALTER TABLE "media" DROP COLUMN "duration";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pillars_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "activities_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "partners_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "awards_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "gallery_items_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "content_slots_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "asset_slots_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "component_settings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "live_stats_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "stat_audit_id";
  DROP TYPE "public"."enum_pillars_status";
  DROP TYPE "public"."enum__pillars_v_version_status";
  DROP TYPE "public"."enum_activities_pillar_id";
  DROP TYPE "public"."enum_activities_status";
  DROP TYPE "public"."enum__activities_v_version_pillar_id";
  DROP TYPE "public"."enum__activities_v_version_status";
  DROP TYPE "public"."enum_events_kind";
  DROP TYPE "public"."enum_events_pillar_id";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum__events_v_version_kind";
  DROP TYPE "public"."enum__events_v_version_pillar_id";
  DROP TYPE "public"."enum__events_v_version_status";
  DROP TYPE "public"."enum_partners_status";
  DROP TYPE "public"."enum__partners_v_version_status";
  DROP TYPE "public"."enum_awards_status";
  DROP TYPE "public"."enum__awards_v_version_status";
  DROP TYPE "public"."enum_gallery_items_kind";
  DROP TYPE "public"."enum_gallery_items_status";
  DROP TYPE "public"."enum__gallery_items_v_version_kind";
  DROP TYPE "public"."enum__gallery_items_v_version_status";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_content_slots_status";
  DROP TYPE "public"."enum__content_slots_v_version_status";
  DROP TYPE "public"."enum_asset_slots_kind";
  DROP TYPE "public"."enum_asset_slots_status";
  DROP TYPE "public"."enum__asset_slots_v_version_kind";
  DROP TYPE "public"."enum__asset_slots_v_version_status";
  DROP TYPE "public"."enum_component_settings_status";
  DROP TYPE "public"."enum__component_settings_v_version_status";
  DROP TYPE "public"."enum_live_stats_status";
  DROP TYPE "public"."enum__live_stats_v_version_status";
  DROP TYPE "public"."enum_site_settings_status";
  DROP TYPE "public"."enum__site_settings_v_version_status";
  DROP TYPE "public"."enum_pavilion_settings_status";
  DROP TYPE "public"."enum__pavilion_settings_v_version_status";`)
}
