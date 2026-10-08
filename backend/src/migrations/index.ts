import * as migration_20260907_185841_initial from './20260907_185841_initial';
import * as migration_20260909_225136_cms_content_studio from './20260909_225136_cms_content_studio';
import * as migration_20260909_225736_finale_model_controls from './20260909_225736_finale_model_controls';
import * as migration_20260909_230221_finale_soft_light from './20260909_230221_finale_soft_light';
import * as migration_20260909_231858_finale_balanced_light from './20260909_231858_finale_balanced_light';
import * as migration_20261001_125822_sncf_studio_cleanup from './20261001_125822_sncf_studio_cleanup';
import * as migration_20261007_005825_chiropractic_symbol from './20261007_005825_chiropractic_symbol';
import * as migration_20261008_013421_recognition_categories from './20261008_013421_recognition_categories';

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
    name: '20260909_231858_finale_balanced_light',
  },
  {
    up: migration_20261001_125822_sncf_studio_cleanup.up,
    down: migration_20261001_125822_sncf_studio_cleanup.down,
    name: '20261001_125822_sncf_studio_cleanup',
  },
  {
    up: migration_20261007_005825_chiropractic_symbol.up,
    down: migration_20261007_005825_chiropractic_symbol.down,
    name: '20261007_005825_chiropractic_symbol',
  },
  {
    up: migration_20261008_013421_recognition_categories.up,
    down: migration_20261008_013421_recognition_categories.down,
    name: '20261008_013421_recognition_categories'
  },
];
