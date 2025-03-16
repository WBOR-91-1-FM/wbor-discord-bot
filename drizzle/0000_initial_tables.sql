CREATE TABLE "guilds" (
	"guildId" text PRIMARY KEY NOT NULL,
	"voiceChannelId" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"userId" text PRIMARY KEY NOT NULL,
	"lastFmSessionKey" text,
	"scrobbleAutomatically" boolean DEFAULT true
);
