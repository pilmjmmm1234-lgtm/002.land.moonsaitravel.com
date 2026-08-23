/**
 * Owner = the maker's live site (existing localStorage settings stay).
 * Member = gift copy template (blank Drive / email / password defaults).
 */
export const SITE_ROLE = "owner" as "owner" | "member";
export const IS_MEMBER_TEMPLATE = SITE_ROLE === "member";

export const SETTINGS_STORAGE_KEY = IS_MEMBER_TEMPLATE
  ? "travel-member-settings-v1"
  : "mwr-menu-links-v1";

export const SAMPLE_BRAND = "MOON'S AI TRAVEL";
export const SAMPLE_SITE_TITLE = "Moon's AI Travel";
export const SAMPLE_MAIN_TITLE = "Welcome to My Travel World";
export const SAMPLE_SUBTITLE =
  "Go to Another World.\nDiscover Your Next World.";
export const SAMPLE_CTA =
  "Email me for the private story password and smart travel guide link.";
export const SAMPLE_EMAIL_BUTTON = "Contact Me by Email";
export const SAMPLE_PRIVATE_MESSAGE =
  "This story is private. Please contact me by email for access.";
export const SAMPLE_INQUIRY_SUBJECT =
  "Moon's AI Travel — Private access details";
export const SAMPLE_INQUIRY_BODY = `Thank you for writing.

Your PRIVATE card access number:
{{pin}}

Introduction page:
{{url}}

Moon's AI Travel`;
export const SAMPLE_INTRO_URL = "";

export const MEMBER_BRAND = "YOUR TRAVEL BRAND";
export const MEMBER_SITE_TITLE = "My Travel World";
export const MEMBER_EMAIL_PLACEHOLDER = "your-email@example.com";
export const MEMBER_PRIVATE_PASSWORD = "changeme";