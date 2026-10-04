CREATE TABLE `puzzles` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL,
  `title` text NOT NULL,
  `manage_token_hash` text NOT NULL,
  `status` text DEFAULT 'published' NOT NULL,
  `play_count` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_puzzles_slug` ON `puzzles` (`slug`);
--> statement-breakpoint
CREATE INDEX `idx_puzzles_status_created` ON `puzzles` (`status`,`created_at`);
--> statement-breakpoint
CREATE TABLE `puzzle_groups` (
  `id` text PRIMARY KEY NOT NULL,
  `puzzle_id` text NOT NULL,
  `label` text NOT NULL,
  `position` integer NOT NULL,
  FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_puzzle_groups_puzzle` ON `puzzle_groups` (`puzzle_id`,`position`);
--> statement-breakpoint
CREATE TABLE `group_members` (
  `id` text PRIMARY KEY NOT NULL,
  `group_id` text NOT NULL,
  `character_id` integer NOT NULL,
  `position` integer NOT NULL,
  FOREIGN KEY (`group_id`) REFERENCES `puzzle_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_group_members_group` ON `group_members` (`group_id`,`position`);
--> statement-breakpoint
CREATE TABLE `plays` (
  `id` text PRIMARY KEY NOT NULL,
  `puzzle_id` text NOT NULL,
  `mistakes` integer NOT NULL,
  `completed` integer NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_plays_puzzle` ON `plays` (`puzzle_id`,`created_at`);
