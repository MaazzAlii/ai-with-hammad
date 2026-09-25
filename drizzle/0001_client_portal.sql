CREATE TYPE "public"."account_kind" AS ENUM('staff', 'client');--> statement-breakpoint
CREATE TYPE "public"."testimonial_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."thread_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"whatsapp" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "message_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"status" "thread_status" DEFAULT 'open' NOT NULL,
	"project_id" uuid,
	"created_by" uuid,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"staff_last_read_at" timestamp with time zone,
	"client_last_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_id" uuid,
	"author_kind" "account_kind" NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"project_id" uuid,
	"submitted_by" uuid,
	"source" text DEFAULT 'portal' NOT NULL,
	"author_name" text NOT NULL,
	"author_title" text DEFAULT '' NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"quote" text NOT NULL,
	"rating" smallint NOT NULL,
	"photo_media_id" uuid,
	"consent_to_publish" boolean DEFAULT false NOT NULL,
	"status" "testimonial_status" DEFAULT 'pending' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "kind" "account_kind" DEFAULT 'staff' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "is_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."message_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_submitted_by_profiles_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_photo_media_id_media_assets_id_fk" FOREIGN KEY ("photo_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;