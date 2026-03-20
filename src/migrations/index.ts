import * as migration_20260317_192332_initial_schema from './20260317_192332_initial_schema';
import * as migration_20260320_051848_001_badgelink_usecaseimage from './20260320_051848_001_badgelink_usecaseimage';
import * as migration_20260320_182515_002_usecases_link from './20260320_182515_002_usecases_link';

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
    name: '20260320_182515_002_usecases_link'
  },
];
