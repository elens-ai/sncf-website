import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_activities_icon" ADD VALUE 'spine';
  ALTER TYPE "public"."enum__activities_v_version_icon" ADD VALUE 'spine';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "activities" SET "icon" = NULL WHERE "icon" = 'spine';
  UPDATE "_activities_v" SET "version_icon" = NULL WHERE "version_icon" = 'spine';
  ALTER TABLE "activities" ALTER COLUMN "icon" SET DATA TYPE text;
  DROP TYPE "public"."enum_activities_icon";
  CREATE TYPE "public"."enum_activities_icon" AS ENUM('droplets', 'droplet', 'stethoscope', 'eye', 'hospital', 'graduation-cap', 'award', 'book-open', 'laptop', 'scissors', 'trees', 'sparkles', 'package-check', 'heart', 'hand-coins', 'waves', 'sprout', 'mountain', 'house', 'heart-handshake');
  ALTER TABLE "activities" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_activities_icon" USING "icon"::"public"."enum_activities_icon";
  ALTER TABLE "_activities_v" ALTER COLUMN "version_icon" SET DATA TYPE text;
  DROP TYPE "public"."enum__activities_v_version_icon";
  CREATE TYPE "public"."enum__activities_v_version_icon" AS ENUM('droplets', 'droplet', 'stethoscope', 'eye', 'hospital', 'graduation-cap', 'award', 'book-open', 'laptop', 'scissors', 'trees', 'sparkles', 'package-check', 'heart', 'hand-coins', 'waves', 'sprout', 'mountain', 'house', 'heart-handshake');
  ALTER TABLE "_activities_v" ALTER COLUMN "version_icon" SET DATA TYPE "public"."enum__activities_v_version_icon" USING "version_icon"::"public"."enum__activities_v_version_icon";`)
}
