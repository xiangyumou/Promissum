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
