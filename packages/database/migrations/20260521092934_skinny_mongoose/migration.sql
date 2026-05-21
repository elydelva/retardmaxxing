CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL UNIQUE,
	`email_verified_at` integer,
	`name` text,
	`avatar_url` text,
	`password_hash` text,
	`signing_key` text NOT NULL,
	`stripe_customer_id` text UNIQUE,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `identities` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_identities_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `notification_log` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`channel` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`sent_at` integer NOT NULL,
	CONSTRAINT `fk_notification_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`user_id` text PRIMARY KEY,
	`push` integer DEFAULT true NOT NULL,
	`email` integer DEFAULT true NOT NULL,
	`sms` integer DEFAULT false NOT NULL,
	`per_kind` text,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_notification_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`product_id` text,
	`stripe_payment_intent_id` text UNIQUE,
	`stripe_checkout_session_id` text,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`status` text NOT NULL,
	`paid_at` integer,
	`failed_at` integer,
	`refunded_at` integer,
	`metadata` text,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_payments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_payments_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY,
	`tier` text NOT NULL,
	`name` text NOT NULL,
	`price_monthly_cents` integer DEFAULT 0 NOT NULL,
	`stripe_product_id` text,
	`stripe_price_id` text,
	`features` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY,
	`stripe_product_id` text NOT NULL UNIQUE,
	`stripe_price_id` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`description` text,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `push_tokens` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`expo_push_token` text NOT NULL,
	`platform` text NOT NULL,
	`device_id` text,
	`last_seen_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_push_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `stripe_webhook_events` (
	`stripe_event_id` text PRIMARY KEY,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`processed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`stripe_subscription_id` text NOT NULL UNIQUE,
	`stripe_price_id` text NOT NULL,
	`status` text NOT NULL,
	`current_period_start` integer,
	`current_period_end` integer,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`canceled_at` integer,
	`trial_start` integer,
	`trial_end` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_subscriptions_plan_id_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`)
);
--> statement-breakpoint
CREATE INDEX `notification_log_user_kind_idx` ON `notification_log` (`user_id`,`kind`,`sent_at`);--> statement-breakpoint
CREATE INDEX `payments_user_paid_at_idx` ON `payments` (`user_id`,`paid_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `push_tokens_token_unique` ON `push_tokens` (`expo_push_token`);--> statement-breakpoint
CREATE INDEX `push_tokens_user_idx` ON `push_tokens` (`user_id`,`revoked_at`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_status_idx` ON `subscriptions` (`user_id`,`status`);