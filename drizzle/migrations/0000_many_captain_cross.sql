-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."FormTypes" AS ENUM('check', 'text', 'select');--> statement-breakpoint
CREATE TYPE "public"."FormValueTypes" AS ENUM('string', 'boolean', 'number');--> statement-breakpoint
CREATE SEQUENCE "public"."temporalid_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "Ally" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lastname" text NOT NULL,
	"email" text NOT NULL,
	"phoneNumber" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AppConfig" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CashFlowCurrency" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CashFlowSourceEntity" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "CashFlowTransactionType" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "CashFlowWayToPay" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"titlePlural" text NOT NULL,
	"isFeatured" boolean NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "Client" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"usageProperty" text,
	"referrer" text,
	"contactFrom" text NOT NULL,
	"requirementStatus" text,
	"phone" text NOT NULL,
	"propertyOfInterest" text,
	"propertyLocation" text,
	"typeOfCapture" text,
	"aspiredPrice" text,
	"typeOfBusiness" text,
	"note" text,
	"isPotentialInvestor" boolean,
	"amountOfPeople" integer,
	"amountOfPets" integer,
	"amountOfYounger" integer,
	"arrivingDate" timestamp(3),
	"checkoutDate" timestamp(3),
	"amountOfNights" integer,
	"reasonOfStay" text,
	"usageOfProperty" text,
	"typeOfPerson" text,
	"personEntry" text,
	"personHeadquarters" text,
	"personLocation" text,
	"specificRequirement" text,
	"location" text,
	"company" text,
	"remodeledAreas" text,
	"propertyDistribution" text,
	"m2" text,
	"occupation" text,
	"userFullName" text,
	"userId" text,
	"serviceName" text,
	"serviceId" text,
	"subServiceName" text,
	"subServiceId" text,
	"username" text,
	"interestDate" timestamp(3),
	"appointmentDate" timestamp(3),
	"inspectionDate" timestamp(3),
	"zonesOfInterest" text[],
	"essentialFeatures" text[],
	"propertytype" varchar(256),
	"allowpets" varchar(256),
	"allowyounger" varchar(256),
	"requestracking" text,
	"isinwaitinglist" boolean,
	"budgetfrom" integer,
	"budgetto" integer,
	"status" varchar(255),
	"adviser_id" varchar(255),
	"adviser_name" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "ContactForm" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"message" text NOT NULL,
	"from" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DeleteFileRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"username" text NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ExternalAdviser" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lastname" text NOT NULL,
	"email" text NOT NULL,
	"phoneNumber" text NOT NULL,
	"realStateCompanyName" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ExternalPerson" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"source" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Owner" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lastname" text NOT NULL,
	"isInvestor" boolean NOT NULL,
	"email" text NOT NULL,
	"phoneNumber" text NOT NULL,
	"birthdate" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "SocialMediaLink" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"href" text NOT NULL,
	"iconName" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TemporalId" (
	"id" integer PRIMARY KEY DEFAULT nextval('temporalid_id_seq'::regclass) NOT NULL,
	"value" varchar(255),
	"type" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "WorkWithUsForm" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"message" text NOT NULL,
	"role" text NOT NULL,
	"office" text NOT NULL,
	"cvUrl" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Adjacency" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "Property" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"images" text[],
	"distribution" jsonb[],
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"furnishedAreas" text[],
	"slug" text NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"isFeatured" boolean DEFAULT false,
	"active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Attribute" (
	"label" text NOT NULL,
	"placeholder" text,
	"options" text,
	"id" serial PRIMARY KEY NOT NULL,
	"formType" "FormTypes" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CashFlowProperty" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"locatiuon" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CashFlow" (
	"id" serial PRIMARY KEY NOT NULL,
	"client" text,
	"userName" text NOT NULL,
	"userId" text NOT NULL,
	"owner" text,
	"location" text,
	"person" text,
	"date" timestamp(3) NOT NULL,
	"month" text NOT NULL,
	"transactionType" text NOT NULL,
	"wayToPay" text NOT NULL,
	"service" text NOT NULL,
	"serviceType" text,
	"taxPayer" text,
	"canon" text,
	"guarantee" text,
	"contract" text,
	"reason" text,
	"createdBy" text NOT NULL,
	"isTemporalTransaction" boolean,
	"temporalTransactionId" integer,
	"amount" integer,
	"totalDue" integer,
	"incomeByThird" integer,
	"attachments" integer,
	"pendingToCollect" integer,
	"cashFlowPropertyId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Distribution" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "DocumentsInformation" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"propertyDoc" boolean DEFAULT false NOT NULL,
	"CIorRIF" boolean DEFAULT false NOT NULL,
	"ownerCIorRIF" boolean DEFAULT false NOT NULL,
	"spouseCIorRIF" boolean DEFAULT false NOT NULL,
	"isCatastralRecordSameOwner" boolean DEFAULT false NOT NULL,
	"condominiumSolvency" boolean DEFAULT false NOT NULL,
	"mainProperty" boolean DEFAULT false NOT NULL,
	"mortgageRelease" text,
	"condominiumSolvencyDetails" text,
	"power" text,
	"successionDeclaration" text,
	"courtRulings" text,
	"catastralRecordYear" text,
	"attorneyEmail" text,
	"attorneyPhone" text,
	"attorneyFirstName" text,
	"attorneyLastName" text,
	"realStateTax" text,
	"owner" text
);
--> statement-breakpoint
CREATE TABLE "Equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "GeneralInformation" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"status" text,
	"code" text NOT NULL,
	"footageGround" text NOT NULL,
	"footageBuilding" text NOT NULL,
	"description" text NOT NULL,
	"propertyType" text NOT NULL,
	"propertyCondition" text,
	"handoverKeys" boolean DEFAULT false NOT NULL,
	"termsAndConditionsAccepted" boolean DEFAULT false NOT NULL,
	"antiquity" text,
	"zoning" text,
	"amountOfFloors" text,
	"propertiesPerFloor" text,
	"typeOfWork" text,
	"isFurnished" boolean DEFAULT false NOT NULL,
	"isOccupiedByPeople" boolean DEFAULT false NOT NULL,
	"publicationTitle" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LocationInformation" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"location" text,
	"nomenclature" text,
	"tower" text,
	"amountOfFloors" text,
	"isClosedStreet" text,
	"country" text NOT NULL,
	"state" text NOT NULL,
	"municipality" text,
	"urbanization" text,
	"avenue" text,
	"street" text,
	"buildingShoppingCenter" text,
	"buildingNumber" text,
	"floor" text,
	"referencePoint" text,
	"howToGet" text,
	"trunkNumber" text,
	"trunkLevel" text,
	"parkingNumber" text,
	"parkingLevel" text,
	"city" text
);
--> statement-breakpoint
CREATE TABLE "NegotiationInfomation" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"price" text NOT NULL,
	"minimumNegotiation" text,
	"client" text,
	"reasonToSellOrRent" text,
	"partOfPayment" text,
	"mouthToMouth" boolean DEFAULT false NOT NULL,
	"realStateGroups" boolean DEFAULT false NOT NULL,
	"realStateWebPages" boolean DEFAULT false NOT NULL,
	"socialMedia" boolean DEFAULT false NOT NULL,
	"publicationOnBuilding" boolean DEFAULT false NOT NULL,
	"operationType" text NOT NULL,
	"propertyExclusivity" text NOT NULL,
	"ownerPaysCommission" text,
	"rentCommission" text,
	"sellCommission" text,
	"ally" text,
	"externalAdviser" text,
	"realStateAdviser" text,
	"additional_price" text,
	"realstateadvisername" varchar(255),
	"externaladvisername" varchar(255),
	"allyname" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"phonenumber" text,
	"firstname" text,
	"lastname" text,
	"imageurl" text,
	"createdat" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedat" timestamp(3) NOT NULL,
	"role" text NOT NULL,
	"isactive" boolean DEFAULT true NOT NULL,
	"permissions" jsonb,
	"issuperadmin" boolean DEFAULT false NOT NULL,
	"lastlogin" timestamp(3),
	"twofactorenabled" boolean DEFAULT false NOT NULL,
	"password" text NOT NULL,
	"pushtoken" text
);
--> statement-breakpoint
CREATE TABLE "Passkey" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"backedup" boolean DEFAULT false NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"credentialid" text NOT NULL,
	"devicetype" text NOT NULL,
	"platform" text NOT NULL,
	"publickey" text NOT NULL,
	"transports" text[],
	"createdat" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedat" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PropertyStatusEntry" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text NOT NULL,
	"username" text NOT NULL,
	"status" text NOT NULL,
	"comments" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Service" (
	"title" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SubService" (
	"service" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"serviceId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Utility" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "_AdjacencyToProperty" (
	"A" integer NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_AttributeToProperty" (
	"A" integer NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_EquipmentToProperty" (
	"A" integer NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_PropertyToDistribution" (
	"A" integer NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_PropertyToUtility" (
	"A" text NOT NULL,
	"B" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AdjacenciesOnProperties" (
	"propertyId" text NOT NULL,
	"adjacencyId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "AdjacenciesOnProperties_pkey" PRIMARY KEY("propertyId","adjacencyId")
);
--> statement-breakpoint
CREATE TABLE "DistributionsOnProperties" (
	"propertyId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"additionalInformation" text,
	"distributionId" integer NOT NULL,
	CONSTRAINT "DistributionsOnProperties_pkey" PRIMARY KEY("propertyId","distributionId")
);
--> statement-breakpoint
CREATE TABLE "UtilitiesOnProperties" (
	"propertyId" text NOT NULL,
	"utilityId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"additionalInformation" text,
	CONSTRAINT "UtilitiesOnProperties_pkey" PRIMARY KEY("propertyId","utilityId")
);
--> statement-breakpoint
CREATE TABLE "AttributesOnProperties" (
	"propertyId" text NOT NULL,
	"attribyteId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"value" text NOT NULL,
	"valueType" "FormValueTypes" DEFAULT 'string' NOT NULL,
	CONSTRAINT "AttributesOnProperties_pkey" PRIMARY KEY("propertyId","attribyteId")
);
--> statement-breakpoint
CREATE TABLE "EquipmentsOnProperties" (
	"propertyId" text NOT NULL,
	"equipmentId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"brand" text,
	"additionalInformation" text,
	CONSTRAINT "EquipmentsOnProperties_pkey" PRIMARY KEY("propertyId","equipmentId")
);
--> statement-breakpoint
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_cashFlowPropertyId_fkey" FOREIGN KEY ("cashFlowPropertyId") REFERENCES "public"."CashFlowProperty"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DocumentsInformation" ADD CONSTRAINT "DocumentsInformation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "GeneralInformation" ADD CONSTRAINT "GeneralInformation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LocationInformation" ADD CONSTRAINT "LocationInformation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "NegotiationInfomation" ADD CONSTRAINT "NegotiationInfomation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Passkey" ADD CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PropertyStatusEntry" ADD CONSTRAINT "PropertyStatusEntry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "SubService" ADD CONSTRAINT "SubService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_AdjacencyToProperty" ADD CONSTRAINT "_AdjacencyToProperty_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Adjacency"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_AdjacencyToProperty" ADD CONSTRAINT "_AdjacencyToProperty_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Property"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_AttributeToProperty" ADD CONSTRAINT "_AttributeToProperty_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Attribute"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_AttributeToProperty" ADD CONSTRAINT "_AttributeToProperty_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Property"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_EquipmentToProperty" ADD CONSTRAINT "_EquipmentToProperty_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Equipment"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_EquipmentToProperty" ADD CONSTRAINT "_EquipmentToProperty_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Property"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PropertyToDistribution" ADD CONSTRAINT "_PropertyToDistribution_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Distribution"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PropertyToDistribution" ADD CONSTRAINT "_PropertyToDistribution_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Property"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PropertyToUtility" ADD CONSTRAINT "_PropertyToUtility_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Property"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PropertyToUtility" ADD CONSTRAINT "_PropertyToUtility_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Utility"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AdjacenciesOnProperties" ADD CONSTRAINT "AdjacenciesOnProperties_adjacencyId_fkey" FOREIGN KEY ("adjacencyId") REFERENCES "public"."Adjacency"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AdjacenciesOnProperties" ADD CONSTRAINT "AdjacenciesOnProperties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DistributionsOnProperties" ADD CONSTRAINT "DistributionsOnProperties_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "public"."Distribution"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DistributionsOnProperties" ADD CONSTRAINT "DistributionsOnProperties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UtilitiesOnProperties" ADD CONSTRAINT "UtilitiesOnProperties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UtilitiesOnProperties" ADD CONSTRAINT "UtilitiesOnProperties_utilityId_fkey" FOREIGN KEY ("utilityId") REFERENCES "public"."Utility"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AttributesOnProperties" ADD CONSTRAINT "AttributesOnProperties_attribyteId_fkey" FOREIGN KEY ("attribyteId") REFERENCES "public"."Attribute"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AttributesOnProperties" ADD CONSTRAINT "AttributesOnProperties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "EquipmentsOnProperties" ADD CONSTRAINT "EquipmentsOnProperties_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."Equipment"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "EquipmentsOnProperties" ADD CONSTRAINT "EquipmentsOnProperties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Property_slug_key" ON "Property" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "DocumentsInformation_propertyId_key" ON "DocumentsInformation" USING btree ("propertyId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "GeneralInformation_propertyId_key" ON "GeneralInformation" USING btree ("propertyId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "LocationInformation_propertyId_key" ON "LocationInformation" USING btree ("propertyId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "NegotiationInfomation_propertyId_key" ON "NegotiationInfomation" USING btree ("propertyId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Passkey_userId_key" ON "Passkey" USING btree ("userId" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "PropertyStatusEntry_propertyId_key" ON "PropertyStatusEntry" USING btree ("propertyId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Service_title_key" ON "Service" USING btree ("title" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "SubService_service_key" ON "SubService" USING btree ("service" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "_AdjacencyToProperty_AB_unique" ON "_AdjacencyToProperty" USING btree ("A" int4_ops,"B" int4_ops);--> statement-breakpoint
CREATE INDEX "_AdjacencyToProperty_B_index" ON "_AdjacencyToProperty" USING btree ("B" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "_AttributeToProperty_AB_unique" ON "_AttributeToProperty" USING btree ("A" int4_ops,"B" int4_ops);--> statement-breakpoint
CREATE INDEX "_AttributeToProperty_B_index" ON "_AttributeToProperty" USING btree ("B" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "_EquipmentToProperty_AB_unique" ON "_EquipmentToProperty" USING btree ("A" int4_ops,"B" int4_ops);--> statement-breakpoint
CREATE INDEX "_EquipmentToProperty_B_index" ON "_EquipmentToProperty" USING btree ("B" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "_PropertyToDistribution_AB_unique" ON "_PropertyToDistribution" USING btree ("A" int4_ops,"B" int4_ops);--> statement-breakpoint
CREATE INDEX "_PropertyToDistribution_B_index" ON "_PropertyToDistribution" USING btree ("B" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "_PropertyToUtility_AB_unique" ON "_PropertyToUtility" USING btree ("A" int4_ops,"B" int4_ops);--> statement-breakpoint
CREATE INDEX "_PropertyToUtility_B_index" ON "_PropertyToUtility" USING btree ("B" int4_ops);
*/