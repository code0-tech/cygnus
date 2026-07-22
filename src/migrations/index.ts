import * as migration_20260317_192332_initial_schema from './20260317_192332_initial_schema';
import * as migration_20260320_051848_001_badgelink_usecaseimage from './20260320_051848_001_badgelink_usecaseimage';
import * as migration_20260320_182515_002_usecases_link from './20260320_182515_002_usecases_link';
import * as migration_20260325_072831_002_cookiebanner_and_teammembers from './20260325_072831_002_cookiebanner_and_teammembers';
import * as migration_20260402_104807_003_seo_and_ogimage from './20260402_104807_003_seo_and_ogimage';
import * as migration_20260402_135659_004_navbar_submenu_icons_and_color from './20260402_135659_004_navbar_submenu_icons_and_color';
import * as migration_20260405_141941_005_product_pages from './20260405_141941_005_product_pages';
import * as migration_20260412_174023_006_contact_page_description from './20260412_174023_006_contact_page_description';
import * as migration_20260415_025537_007_subscription_workflow_executions from './20260415_025537_007_subscription_workflow_executions';
import * as migration_20260424_151900_008_footer_contact_legal_fields from './20260424_151900_008_footer_contact_legal_fields';
import * as migration_20260425_134031_009_actions from './20260425_134031_009_actions';
import * as migration_20260427_010_remove_edition_hero_block from './20260427_010_remove_edition_hero_block';
import * as migration_20260526_011_section_layout from './20260526_011_section_layout';
import * as migration_20260531_084500_navigation_globals from './20260531_084500_navigation_globals';
import * as migration_20260622_201228_scrollcard_and_standalonecard from './20260622_201228_scrollcard_and_standalonecard';
import * as migration_20260624_092957_cards_displayoptions from './20260624_092957_cards_displayoptions';
import * as migration_20260701_070938_20260701_hero_image from './20260701_070938_20260701_hero_image';
import * as migration_20260701_170429_install_language from './20260701_170429_install_language';
import * as migration_20260703_053522_offset_cards_placement from './20260703_053522_offset_cards_placement';
import * as migration_20260703_054551_offset_cards_image_options from './20260703_054551_offset_cards_image_options';
import * as migration_20260703_105958_blog_preview from './20260703_105958_blog_preview';
import * as migration_20260703_112923_video_block from './20260703_112923_video_block';
import * as migration_20260704_045353_workflow_execution_price_factor from './20260704_045353_workflow_execution_price_factor';
import * as migration_20260704_050046_ai_tokens from './20260704_050046_ai_tokens';
import * as migration_20260705_054134_20260705_workflow_calculator from './20260705_054134_20260705_workflow_calculator';
import * as migration_20260705_180056_workflow_business_type_metadata from './20260705_180056_workflow_business_type_metadata';
import * as migration_20260705_180710_remove_workflow_calculator_range_note from './20260705_180710_remove_workflow_calculator_range_note';
import * as migration_20260706_062643_20260706_subscription_config_optional_defaults from './20260706_062643_20260706_subscription_config_optional_defaults';
import * as migration_20260706_063003_20260706_subscription_tier_defaults from './20260706_063003_20260706_subscription_tier_defaults';
import * as migration_20260706_095051_wide_hero from './20260706_095051_wide_hero';
import * as migration_20260706_104232_wide_hero_image_options from './20260706_104232_wide_hero_image_options';
import * as migration_20260707_043613_list_feature_section from './20260707_043613_list_feature_section';
import * as migration_20260708_070818_20260708_cta_image_block from './20260708_070818_20260708_cta_image_block';
import * as migration_20260708_071528_20260708_border_block from './20260708_071528_20260708_border_block';
import * as migration_20260708_072801_20260708_footer_image from './20260708_072801_20260708_footer_image';
import * as migration_20260708_105500_subscription_payment_period_usage_ranges from './20260708_105500_subscription_payment_period_usage_ranges';
import * as migration_20260709_183358_subscription_configurator_defaults from './20260709_183358_subscription_configurator_defaults';
import * as migration_20260710_052024_subscription_payment_period_suffixes from './20260710_052024_subscription_payment_period_suffixes';
import * as migration_20260720_105407_20260720_stats_block from './20260720_105407_20260720_stats_block';
import * as migration_20260720_111300_20260720_stats_show_plus from './20260720_111300_20260720_stats_show_plus';
import * as migration_20260720_212600_actions_module_only from './20260720_212600_actions_module_only';
import * as migration_20260720_224003_action_block_empty_labels from './20260720_224003_action_block_empty_labels';
import * as migration_20260722_114458_action_block_definition_labels from './20260722_114458_action_block_definition_labels';
import * as migration_20260722_123249_remove_action_definition_empty_labels from './20260722_123249_remove_action_definition_empty_labels';
import * as migration_20260722_144106_actions_identifier_and_import_route from './20260722_144106_actions_identifier_and_import_route';

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
    up: migration_20260424_151900_008_footer_contact_legal_fields.up,
    down: migration_20260424_151900_008_footer_contact_legal_fields.down,
    name: '20260424_151900_008_footer_contact_legal_fields',
  },
  {
    up: migration_20260425_134031_009_actions.up,
    down: migration_20260425_134031_009_actions.down,
    name: '20260425_134031_009_actions',
  },
  {
    up: migration_20260427_010_remove_edition_hero_block.up,
    down: migration_20260427_010_remove_edition_hero_block.down,
    name: '20260427_010_remove_edition_hero_block',
  },
  {
    up: migration_20260526_011_section_layout.up,
    down: migration_20260526_011_section_layout.down,
    name: '20260526_011_section_layout',
  },
  {
    up: migration_20260531_084500_navigation_globals.up,
    down: migration_20260531_084500_navigation_globals.down,
    name: '20260531_084500_navigation_globals',
  },
  {
    up: migration_20260622_201228_scrollcard_and_standalonecard.up,
    down: migration_20260622_201228_scrollcard_and_standalonecard.down,
    name: '20260622_201228_scrollcard_and_standalonecard',
  },
  {
    up: migration_20260624_092957_cards_displayoptions.up,
    down: migration_20260624_092957_cards_displayoptions.down,
    name: '20260624_092957_cards_displayoptions',
  },
  {
    up: migration_20260701_070938_20260701_hero_image.up,
    down: migration_20260701_070938_20260701_hero_image.down,
    name: '20260701_070938_20260701_hero_image',
  },
  {
    up: migration_20260701_170429_install_language.up,
    down: migration_20260701_170429_install_language.down,
    name: '20260701_170429_install_language',
  },
  {
    up: migration_20260703_053522_offset_cards_placement.up,
    down: migration_20260703_053522_offset_cards_placement.down,
    name: '20260703_053522_offset_cards_placement',
  },
  {
    up: migration_20260703_054551_offset_cards_image_options.up,
    down: migration_20260703_054551_offset_cards_image_options.down,
    name: '20260703_054551_offset_cards_image_options',
  },
  {
    up: migration_20260703_105958_blog_preview.up,
    down: migration_20260703_105958_blog_preview.down,
    name: '20260703_105958_blog_preview',
  },
  {
    up: migration_20260703_112923_video_block.up,
    down: migration_20260703_112923_video_block.down,
    name: '20260703_112923_video_block',
  },
  {
    up: migration_20260704_045353_workflow_execution_price_factor.up,
    down: migration_20260704_045353_workflow_execution_price_factor.down,
    name: '20260704_045353_workflow_execution_price_factor',
  },
  {
    up: migration_20260704_050046_ai_tokens.up,
    down: migration_20260704_050046_ai_tokens.down,
    name: '20260704_050046_ai_tokens',
  },
  {
    up: migration_20260705_054134_20260705_workflow_calculator.up,
    down: migration_20260705_054134_20260705_workflow_calculator.down,
    name: '20260705_054134_20260705_workflow_calculator',
  },
  {
    up: migration_20260705_180056_workflow_business_type_metadata.up,
    down: migration_20260705_180056_workflow_business_type_metadata.down,
    name: '20260705_180056_workflow_business_type_metadata',
  },
  {
    up: migration_20260705_180710_remove_workflow_calculator_range_note.up,
    down: migration_20260705_180710_remove_workflow_calculator_range_note.down,
    name: '20260705_180710_remove_workflow_calculator_range_note',
  },
  {
    up: migration_20260706_062643_20260706_subscription_config_optional_defaults.up,
    down: migration_20260706_062643_20260706_subscription_config_optional_defaults.down,
    name: '20260706_062643_20260706_subscription_config_optional_defaults',
  },
  {
    up: migration_20260706_063003_20260706_subscription_tier_defaults.up,
    down: migration_20260706_063003_20260706_subscription_tier_defaults.down,
    name: '20260706_063003_20260706_subscription_tier_defaults',
  },
  {
    up: migration_20260706_095051_wide_hero.up,
    down: migration_20260706_095051_wide_hero.down,
    name: '20260706_095051_wide_hero',
  },
  {
    up: migration_20260706_104232_wide_hero_image_options.up,
    down: migration_20260706_104232_wide_hero_image_options.down,
    name: '20260706_104232_wide_hero_image_options',
  },
  {
    up: migration_20260707_043613_list_feature_section.up,
    down: migration_20260707_043613_list_feature_section.down,
    name: '20260707_043613_list_feature_section',
  },
  {
    up: migration_20260708_070818_20260708_cta_image_block.up,
    down: migration_20260708_070818_20260708_cta_image_block.down,
    name: '20260708_070818_20260708_cta_image_block',
  },
  {
    up: migration_20260708_071528_20260708_border_block.up,
    down: migration_20260708_071528_20260708_border_block.down,
    name: '20260708_071528_20260708_border_block',
  },
  {
    up: migration_20260708_072801_20260708_footer_image.up,
    down: migration_20260708_072801_20260708_footer_image.down,
    name: '20260708_072801_20260708_footer_image',
  },
  {
    up: migration_20260708_105500_subscription_payment_period_usage_ranges.up,
    down: migration_20260708_105500_subscription_payment_period_usage_ranges.down,
    name: '20260708_105500_subscription_payment_period_usage_ranges',
  },
  {
    up: migration_20260709_183358_subscription_configurator_defaults.up,
    down: migration_20260709_183358_subscription_configurator_defaults.down,
    name: '20260709_183358_subscription_configurator_defaults',
  },
  {
    up: migration_20260710_052024_subscription_payment_period_suffixes.up,
    down: migration_20260710_052024_subscription_payment_period_suffixes.down,
    name: '20260710_052024_subscription_payment_period_suffixes',
  },
  {
    up: migration_20260720_105407_20260720_stats_block.up,
    down: migration_20260720_105407_20260720_stats_block.down,
    name: '20260720_105407_20260720_stats_block',
  },
  {
    up: migration_20260720_111300_20260720_stats_show_plus.up,
    down: migration_20260720_111300_20260720_stats_show_plus.down,
    name: '20260720_111300_20260720_stats_show_plus',
  },
  {
    up: migration_20260720_212600_actions_module_only.up,
    down: migration_20260720_212600_actions_module_only.down,
    name: '20260720_212600_actions_module_only',
  },
  {
    up: migration_20260720_224003_action_block_empty_labels.up,
    down: migration_20260720_224003_action_block_empty_labels.down,
    name: '20260720_224003_action_block_empty_labels',
  },
  {
    up: migration_20260722_114458_action_block_definition_labels.up,
    down: migration_20260722_114458_action_block_definition_labels.down,
    name: '20260722_114458_action_block_definition_labels',
  },
  {
    up: migration_20260722_123249_remove_action_definition_empty_labels.up,
    down: migration_20260722_123249_remove_action_definition_empty_labels.down,
    name: '20260722_123249_remove_action_definition_empty_labels',
  },
  {
    up: migration_20260722_144106_actions_identifier_and_import_route.up,
    down: migration_20260722_144106_actions_identifier_and_import_route.down,
    name: '20260722_144106_actions_identifier_and_import_route'
  },
];
