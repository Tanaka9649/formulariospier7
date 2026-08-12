-- CreateEnum
CREATE TYPE "event_status" AS ENUM ('DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'FULL', 'FINISHED');

-- CreateEnum
CREATE TYPE "field_status" AS ENUM ('INACTIVE', 'OPTIONAL', 'REQUIRED');

-- CreateEnum
CREATE TYPE "registration_status" AS ENUM ('REGISTERED', 'CONFIRMED', 'CANCELLED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "attendance_status" AS ENUM ('PENDING', 'PRESENT', 'ABSENT');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "internal_name" TEXT NOT NULL,
    "public_name" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "time" TEXT,
    "location" TEXT,
    "description" TEXT,
    "summary" TEXT,
    "max_participants" INTEGER,
    "brand_name" TEXT,
    "status" "event_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_types" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quota" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "summary" TEXT,
    "additional_info" TEXT,
    "confirmation_title" TEXT,
    "confirmation_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_template_fields" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "internal_name" TEXT NOT NULL,
    "public_label" TEXT NOT NULL,
    "placeholder" TEXT,
    "field_type" TEXT NOT NULL DEFAULT 'text',
    "status" "field_status" NOT NULL DEFAULT 'OPTIONAL',
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "form_template_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_template_consents" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "consent_key" TEXT NOT NULL,
    "text_version" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "form_template_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_configs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "summary" TEXT,
    "additional_info" TEXT,
    "confirmation_title" TEXT,
    "confirmation_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "internal_name" TEXT NOT NULL,
    "public_label" TEXT NOT NULL,
    "placeholder" TEXT,
    "field_type" TEXT NOT NULL DEFAULT 'text',
    "status" "field_status" NOT NULL DEFAULT 'OPTIONAL',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "consent_key" TEXT NOT NULL,
    "text_version" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branding" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "background_url" TEXT,
    "background_enabled" BOOLEAN NOT NULL DEFAULT true,
    "background_blur" INTEGER DEFAULT 0,
    "background_overlay" DOUBLE PRECISION DEFAULT 0,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "button_color" TEXT,
    "text_color" TEXT,
    "background_color" TEXT,
    "field_color" TEXT,
    "audio_url" TEXT,
    "audio_enabled" BOOLEAN NOT NULL DEFAULT false,
    "audio_volume" DOUBLE PRECISION DEFAULT 0.5,
    "audio_loop" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "event_id" TEXT,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_configs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL DEFAULT 'Certificado de Participação',
    "body_template" TEXT NOT NULL DEFAULT 'Certificamos que {{nome}} participou do evento {{evento}}, realizado em {{data}}.',
    "signature_name" TEXT,
    "signature_role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_links" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "ref_code" TEXT NOT NULL,
    "internal_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_visits" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "referral_link_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "referral_link_id" TEXT,
    "ticket_type_id" TEXT,
    "registration_status" "registration_status" NOT NULL DEFAULT 'REGISTERED',
    "attendance_status" "attendance_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_answers" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "form_field_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "participant_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_consents" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "consent_id" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "ticket_types_event_id_idx" ON "ticket_types"("event_id");

-- CreateIndex
CREATE INDEX "form_template_fields_template_id_idx" ON "form_template_fields"("template_id");

-- CreateIndex
CREATE INDEX "form_template_consents_template_id_idx" ON "form_template_consents"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_configs_event_id_key" ON "form_configs"("event_id");

-- CreateIndex
CREATE INDEX "form_fields_event_id_idx" ON "form_fields"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_fields_event_id_field_key_key" ON "form_fields"("event_id", "field_key");

-- CreateIndex
CREATE UNIQUE INDEX "consents_event_id_consent_key_key" ON "consents"("event_id", "consent_key");

-- CreateIndex
CREATE UNIQUE INDEX "branding_event_id_key" ON "branding"("event_id");

-- CreateIndex
CREATE INDEX "assets_event_id_idx" ON "assets"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_configs_event_id_key" ON "certificate_configs"("event_id");

-- CreateIndex
CREATE INDEX "referral_links_event_id_idx" ON "referral_links"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_links_event_id_ref_code_key" ON "referral_links"("event_id", "ref_code");

-- CreateIndex
CREATE INDEX "event_visits_event_id_idx" ON "event_visits"("event_id");

-- CreateIndex
CREATE INDEX "event_visits_referral_link_id_idx" ON "event_visits"("referral_link_id");

-- CreateIndex
CREATE INDEX "participants_event_id_idx" ON "participants"("event_id");

-- CreateIndex
CREATE INDEX "participants_referral_link_id_idx" ON "participants"("referral_link_id");

-- CreateIndex
CREATE INDEX "participants_ticket_type_id_idx" ON "participants"("ticket_type_id");

-- CreateIndex
CREATE INDEX "participant_answers_participant_id_idx" ON "participant_answers"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_answers_participant_id_form_field_id_key" ON "participant_answers"("participant_id", "form_field_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_consents_participant_id_consent_id_key" ON "participant_consents"("participant_id", "consent_id");

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_template_fields" ADD CONSTRAINT "form_template_fields_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_template_consents" ADD CONSTRAINT "form_template_consents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_configs" ADD CONSTRAINT "form_configs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branding" ADD CONSTRAINT "branding_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_configs" ADD CONSTRAINT "certificate_configs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_visits" ADD CONSTRAINT "event_visits_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_visits" ADD CONSTRAINT "event_visits_referral_link_id_fkey" FOREIGN KEY ("referral_link_id") REFERENCES "referral_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_referral_link_id_fkey" FOREIGN KEY ("referral_link_id") REFERENCES "referral_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_answers" ADD CONSTRAINT "participant_answers_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_answers" ADD CONSTRAINT "participant_answers_form_field_id_fkey" FOREIGN KEY ("form_field_id") REFERENCES "form_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_consents" ADD CONSTRAINT "participant_consents_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_consents" ADD CONSTRAINT "participant_consents_consent_id_fkey" FOREIGN KEY ("consent_id") REFERENCES "consents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
