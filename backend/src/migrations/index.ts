/**
 * THE POSTGRES MIGRATIONS, IN ORDER, FOR RUNNING AT START-UP.
 *
 * On the serverless CMS (sst.config.ts) nothing can run `payload migrate`
 * before the server starts: the database lives in a private network that only
 * the CMS itself reaches. So the production configuration hands this list to
 * the database adapter as `prodMigrations` (payload.config.ts), and Payload
 * applies whatever is still pending as it initialises. A local server and CI
 * keep running `payload migrate` from the files themselves.
 *
 * Add every new migration here, in date order, as `payload migrate:create`
 * would have: the name must be the file's name exactly, since that is what is
 * recorded in the payload_migrations table.
 */
import * as m20260907_185841_initial from './20260907_185841_initial'
import * as m20260909_225136_cms_content_studio from './20260909_225136_cms_content_studio'
import * as m20260909_225736_finale_model_controls from './20260909_225736_finale_model_controls'
import * as m20260909_230221_finale_soft_light from './20260909_230221_finale_soft_light'
import * as m20260909_231858_finale_balanced_light from './20260909_231858_finale_balanced_light'

export const migrations = [
  { up: m20260907_185841_initial.up, down: m20260907_185841_initial.down, name: '20260907_185841_initial' },
  { up: m20260909_225136_cms_content_studio.up, down: m20260909_225136_cms_content_studio.down, name: '20260909_225136_cms_content_studio' },
  { up: m20260909_225736_finale_model_controls.up, down: m20260909_225736_finale_model_controls.down, name: '20260909_225736_finale_model_controls' },
  { up: m20260909_230221_finale_soft_light.up, down: m20260909_230221_finale_soft_light.down, name: '20260909_230221_finale_soft_light' },
  { up: m20260909_231858_finale_balanced_light.up, down: m20260909_231858_finale_balanced_light.down, name: '20260909_231858_finale_balanced_light' },
]
