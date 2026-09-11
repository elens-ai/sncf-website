import * as migration_20260907_185841_initial from './20260907_185841_initial';
import * as migration_20260909_225136_cms_content_studio from './20260909_225136_cms_content_studio';
import * as migration_20260909_225736_finale_model_controls from './20260909_225736_finale_model_controls';
import * as migration_20260909_230221_finale_soft_light from './20260909_230221_finale_soft_light';
import * as migration_20260909_231858_finale_balanced_light from './20260909_231858_finale_balanced_light';

export const migrations = [
  {
    up: migration_20260907_185841_initial.up,
    down: migration_20260907_185841_initial.down,
    name: '20260907_185841_initial',
  },
  {
    up: migration_20260909_225136_cms_content_studio.up,
    down: migration_20260909_225136_cms_content_studio.down,
    name: '20260909_225136_cms_content_studio',
  },
  {
    up: migration_20260909_225736_finale_model_controls.up,
    down: migration_20260909_225736_finale_model_controls.down,
    name: '20260909_225736_finale_model_controls',
  },
  {
    up: migration_20260909_230221_finale_soft_light.up,
    down: migration_20260909_230221_finale_soft_light.down,
    name: '20260909_230221_finale_soft_light',
  },
  {
    up: migration_20260909_231858_finale_balanced_light.up,
    down: migration_20260909_231858_finale_balanced_light.down,
    name: '20260909_231858_finale_balanced_light'
  },
];
