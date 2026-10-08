import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_events_kind" ADD VALUE 'past';
  ALTER TYPE "public"."enum__events_v_version_kind" ADD VALUE 'past';
  CREATE TABLE "events_photos" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "media_id" integer,
    "src" varchar,
    "alt" varchar
  );

  CREATE TABLE "events_facts" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar
  );

  CREATE TABLE "_events_v_version_photos" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "media_id" integer,
    "src" varchar,
    "alt" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_events_v_version_facts" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "_uuid" varchar
  );

  ALTER TABLE "events" ADD COLUMN "occurred_on" varchar;
  ALTER TABLE "events" ADD COLUMN "source" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_occurred_on" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_source" varchar;
  ALTER TABLE "events_photos" ADD CONSTRAINT "events_photos_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_photos" ADD CONSTRAINT "events_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_facts" ADD CONSTRAINT "events_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_photos" ADD CONSTRAINT "_events_v_version_photos_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_version_photos" ADD CONSTRAINT "_events_v_version_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_facts" ADD CONSTRAINT "_events_v_version_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_photos_order_idx" ON "events_photos" USING btree ("_order");
  CREATE INDEX "events_photos_parent_id_idx" ON "events_photos" USING btree ("_parent_id");
  CREATE INDEX "events_photos_media_idx" ON "events_photos" USING btree ("media_id");
  CREATE INDEX "events_facts_order_idx" ON "events_facts" USING btree ("_order");
  CREATE INDEX "events_facts_parent_id_idx" ON "events_facts" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_photos_order_idx" ON "_events_v_version_photos" USING btree ("_order");
  CREATE INDEX "_events_v_version_photos_parent_id_idx" ON "_events_v_version_photos" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_photos_media_idx" ON "_events_v_version_photos" USING btree ("media_id");
  CREATE INDEX "_events_v_version_facts_order_idx" ON "_events_v_version_facts" USING btree ("_order");
  CREATE INDEX "_events_v_version_facts_parent_id_idx" ON "_events_v_version_facts" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "events_photos" CASCADE;
  DROP TABLE "events_facts" CASCADE;
  DROP TABLE "_events_v_version_photos" CASCADE;
  DROP TABLE "_events_v_version_facts" CASCADE;
  ALTER TABLE "events" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_events_kind";
  CREATE TYPE "public"."enum_events_kind" AS ENUM('annual', 'ongoing');
  ALTER TABLE "events" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_events_kind" USING "kind"::"public"."enum_events_kind";
  ALTER TABLE "_events_v" ALTER COLUMN "version_kind" SET DATA TYPE text;
  DROP TYPE "public"."enum__events_v_version_kind";
  CREATE TYPE "public"."enum__events_v_version_kind" AS ENUM('annual', 'ongoing');
  ALTER TABLE "_events_v" ALTER COLUMN "version_kind" SET DATA TYPE "public"."enum__events_v_version_kind" USING "version_kind"::"public"."enum__events_v_version_kind";
  ALTER TABLE "events" DROP COLUMN "occurred_on";
  ALTER TABLE "events" DROP COLUMN "source";
  ALTER TABLE "_events_v" DROP COLUMN "version_occurred_on";
  ALTER TABLE "_events_v" DROP COLUMN "version_source";`)
}
