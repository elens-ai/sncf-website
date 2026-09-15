import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_finale_model_light_intensity" SET DEFAULT 8;
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_finale_model_light_intensity" SET DEFAULT 8;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavilion_settings" ALTER COLUMN "settings_finale_model_light_intensity" SET DEFAULT 16;
  ALTER TABLE "_pavilion_settings_v" ALTER COLUMN "version_settings_finale_model_light_intensity" SET DEFAULT 16;`)
}
