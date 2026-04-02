import * as migration_20260317_192332_initial_schema from './20260317_192332_initial_schema';
import * as migration_20260320_051848_001_badgelink_usecaseimage from './20260320_051848_001_badgelink_usecaseimage';
import * as migration_20260320_182515_002_usecases_link from './20260320_182515_002_usecases_link';
import * as migration_20260325_072831_002_cookiebanner_and_teammembers from './20260325_072831_002_cookiebanner_and_teammembers';
import * as migration_20260402_104807_003_seo_and_ogimage from './20260402_104807_003_seo_and_ogimage';

export const migrations = [
  {
    up: migration_20260317_192332_initial_schema.up,
    down: migration_20260317_192332_initial_schema.down,
    name: '20260317_192332_initial_schema',
  },
  {
    up: migration_20260320_051848_001_badgelink_usecaseimage.up,
    down: migration_20260320_051848_001_badgelink_usecaseimage.down,
    name: '20260320_051848_001_badgelink_usecaseimage',
  },
  {
    up: migration_20260320_182515_002_usecases_link.up,
    down: migration_20260320_182515_002_usecases_link.down,
    name: '20260320_182515_002_usecases_link',
  },
  {
    up: migration_20260325_072831_002_cookiebanner_and_teammembers.up,
    down: migration_20260325_072831_002_cookiebanner_and_teammembers.down,
    name: '20260325_072831_002_cookiebanner_and_teammembers',
  },
  {
    up: migration_20260402_104807_003_seo_and_ogimage.up,
    down: migration_20260402_104807_003_seo_and_ogimage.down,
    name: '20260402_104807_003_seo_and_ogimage'
  },
];
