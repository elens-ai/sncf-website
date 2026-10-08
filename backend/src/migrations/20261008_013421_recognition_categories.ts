import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_awards_category" AS ENUM('tweets', 'awards', 'press');
  CREATE TYPE "public"."enum__awards_v_version_category" AS ENUM('tweets', 'awards', 'press');
  ALTER TABLE "awards" ADD COLUMN "category" "enum_awards_category";
  ALTER TABLE "_awards_v" ADD COLUMN "version_category" "enum__awards_v_version_category";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "awards" DROP COLUMN "category";
  ALTER TABLE "_awards_v" DROP COLUMN "version_category";
  DROP TYPE "public"."enum_awards_category";
  DROP TYPE "public"."enum__awards_v_version_category";`)
}
