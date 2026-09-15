import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_model" varchar DEFAULT '/models/sncf-emblem.glb';
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_model_size" numeric DEFAULT 2.4;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_model_height" numeric DEFAULT 4.35;
  ALTER TABLE "pavilion_settings" ADD COLUMN "settings_finale_model_light_intensity" numeric DEFAULT 32;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_model" varchar DEFAULT '/models/sncf-emblem.glb';
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_model_size" numeric DEFAULT 2.4;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_model_height" numeric DEFAULT 4.35;
  ALTER TABLE "_pavilion_settings_v" ADD COLUMN "version_settings_finale_model_light_intensity" numeric DEFAULT 32;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_model";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_model_size";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_model_height";
  ALTER TABLE "pavilion_settings" DROP COLUMN "settings_finale_model_light_intensity";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_model";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_model_size";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_model_height";
  ALTER TABLE "_pavilion_settings_v" DROP COLUMN "version_settings_finale_model_light_intensity";`)
}
