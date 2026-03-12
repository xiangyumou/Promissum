CREATE TABLE `active_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`item_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`last_active` integer NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `api_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text,
	`endpoint` text NOT NULL,
	`method` text NOT NULL,
	`status_code` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`duration` integer
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`fingerprint` text NOT NULL,
	`name` text,
	`last_seen_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `devices_fingerprint_unique` ON `devices` (`fingerprint`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`encrypted_data` text NOT NULL,
	`original_name` text,
	`decrypt_at` integer NOT NULL,
	`round_number` integer NOT NULL,
	`created_at` integer NOT NULL,
	`layer_count` integer DEFAULT 1 NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `system_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`default_duration_minutes` integer DEFAULT 60 NOT NULL,
	`privacy_mode` integer DEFAULT false NOT NULL,
	`panic_url` text DEFAULT 'https://google.com' NOT NULL,
	`theme_config` text DEFAULT '{}' NOT NULL,
	`date_time_format` text DEFAULT 'yyyy-MM-dd HH:mm' NOT NULL,
	`compact_mode` integer DEFAULT false NOT NULL,
	`sidebar_open` integer DEFAULT true NOT NULL,
	`confirm_delete` integer DEFAULT true NOT NULL,
	`confirm_extend` integer DEFAULT true NOT NULL,
	`auto_refresh_interval` integer DEFAULT 60 NOT NULL,
	`cache_ttl_minutes` integer DEFAULT 5 NOT NULL,
	`auto_privacy_delay_minutes` integer DEFAULT 5 NOT NULL,
	`panic_shortcut` text DEFAULT 'alt+p' NOT NULL,
	`api_token` text DEFAULT '' NOT NULL,
	`api_url` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_preferences_device_id_unique` ON `user_preferences` (`device_id`);