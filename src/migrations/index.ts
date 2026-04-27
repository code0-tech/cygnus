import * as migration_20260317_192332_initial_schema from './20260317_192332_initial_schema';
import * as migration_20260320_051848_001_badgelink_usecaseimage from './20260320_051848_001_badgelink_usecaseimage';
import * as migration_20260320_182515_002_usecases_link from './20260320_182515_002_usecases_link';
import * as migration_20260325_072831_002_cookiebanner_and_teammembers from './20260325_072831_002_cookiebanner_and_teammembers';
import * as migration_20260402_104807_003_seo_and_ogimage from './20260402_104807_003_seo_and_ogimage';
import * as migration_20260402_135659_004_navbar_submenu_icons_and_color from './20260402_135659_004_navbar_submenu_icons_and_color';
import * as migration_20260405_141941_005_product_pages from './20260405_141941_005_product_pages';
import * as migration_20260412_174023_006_contact_page_description from './20260412_174023_006_contact_page_description';
import * as migration_20260415_025537_007_subscription_workflow_executions from './20260415_025537_007_subscription_workflow_executions';
import * as migration_20260425_134031_009_actions from './20260425_134031_009_actions';
import * as migration_20260424_151900_008_footer_contact_legal_fields from './20260424_151900_008_footer_contact_legal_fields';
import * as migration_20260427_010_remove_edition_hero_block from './20260427_010_remove_edition_hero_block';

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
    name: '20260402_104807_003_seo_and_ogimage',
  },
  {
    up: migration_20260402_135659_004_navbar_submenu_icons_and_color.up,
    down: migration_20260402_135659_004_navbar_submenu_icons_and_color.down,
    name: '20260402_135659_004_navbar_submenu_icons_and_color',
  },
  {
    up: migration_20260405_141941_005_product_pages.up,
    down: migration_20260405_141941_005_product_pages.down,
    name: '20260405_141941_005_product_pages',
  },
  {
    up: migration_20260412_174023_006_contact_page_description.up,
    down: migration_20260412_174023_006_contact_page_description.down,
    name: '20260412_174023_006_contact_page_description',
  },
  {
    up: migration_20260415_025537_007_subscription_workflow_executions.up,
    down: migration_20260415_025537_007_subscription_workflow_executions.down,
    name: '20260415_025537_007_subscription_workflow_executions',
  },
  {
    up: migration_20260425_134031_009_actions.up,
    down: migration_20260425_134031_009_actions.down,
    name: '20260425_134031_009_actions'
  },
  {
    up: migration_20260424_151900_008_footer_contact_legal_fields.up,
    down: migration_20260424_151900_008_footer_contact_legal_fields.down,
    name: '20260424_151900_008_footer_contact_legal_fields'
  },
  {
    up: migration_20260427_010_remove_edition_hero_block.up,
    down: migration_20260427_010_remove_edition_hero_block.down,
    name: '20260427_010_remove_edition_hero_block'
  },
];
