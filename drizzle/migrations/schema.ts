import { pgTable, text, serial, boolean, integer, timestamp, varchar, uniqueIndex, foreignKey, index, date, jsonb, numeric, doublePrecision, primaryKey, pgSequence, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const formTypes = pgEnum("FormTypes", ['check', 'text', 'select'])
export const formValueTypes = pgEnum("FormValueTypes", ['string', 'boolean', 'number'])

export const temporalidIdSeq = pgSequence("temporalid_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })
export const propertyCodeidSeq = pgSequence("property_codeid_seq", {  startWith: "87", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })

export const appConfig = pgTable("AppConfig", {
	id: text().primaryKey().notNull(),
	code: text().notNull(),
	description: text().notNull(),
	value: text().notNull(),
});

export const ally = pgTable("Ally", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	lastname: text().notNull(),
	email: text().notNull(),
	phoneNumber: text().notNull(),
	status: text().default('active').notNull(),
});

export const cashFlowCurrency = pgTable("CashFlowCurrency", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	symbol: text().notNull(),
	code: text().notNull(),
});

export const cashFlowWayToPay = pgTable("CashFlowWayToPay", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
});

export const cashFlowSourceEntity = pgTable("CashFlowSourceEntity", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
});

export const cashFlowTransactionType = pgTable("CashFlowTransactionType", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
});

export const categories = pgTable("Categories", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	titlePlural: text().notNull(),
	isFeatured: boolean().notNull(),
	image: text(),
	order: integer(),
	enabled: boolean().default(true),
});

export const contactForm = pgTable("ContactForm", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	message: text().notNull(),
	from: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deleteFileRequest = pgTable("DeleteFileRequest", {
	id: text().primaryKey().notNull(),
	path: text().notNull(),
	username: text().notNull(),
	userId: text().notNull(),
	type: text().notNull(),
});

export const externalAdviser = pgTable("ExternalAdviser", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	lastname: text().notNull(),
	email: text().notNull(),
	phoneNumber: text().notNull(),
	realStateCompanyName: text().notNull(),
	status: varchar({ length: 255 }).default('active'),
});

export const owner = pgTable("Owner", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	lastname: text().notNull(),
	isInvestor: boolean().notNull(),
	email: text().notNull(),
	phoneNumber: text().notNull(),
	birthdate: timestamp({ precision: 3, mode: 'string' }),
	status: varchar({ length: 255 }).default('active'),
});

export const externalPerson = pgTable("ExternalPerson", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	source: text().notNull(),
});

export const socialMediaLink = pgTable("SocialMediaLink", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	href: text().notNull(),
	iconName: text().notNull(),
});

export const temporalId = pgTable("TemporalId", {
	id: integer().default(sql`nextval('temporalid_id_seq'::regclass)`).primaryKey().notNull(),
	value: varchar({ length: 255 }),
	type: varchar({ length: 255 }).notNull(),
});

export const workWithUsForm = pgTable("WorkWithUsForm", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	message: text().notNull(),
	role: text().notNull(),
	office: text().notNull(),
	cvUrl: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	name: text().notNull(),
});

export const prismaMigrations = pgTable("_prisma_migrations", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: timestamp("rolled_back_at", { withTimezone: true, mode: 'string' }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const adjacency = pgTable("Adjacency", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
});

export const attribute = pgTable("Attribute", {
	label: text().notNull(),
	placeholder: text(),
	options: text(),
	id: serial().primaryKey().notNull(),
	formType: formTypes().notNull(),
});

export const cashFlowProperty = pgTable("CashFlowProperty", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	location: text().notNull(),
});

export const distribution = pgTable("Distribution", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
});

export const documentsInformation = pgTable("DocumentsInformation", {
	id: text().primaryKey().notNull(),
	propertyId: text().notNull(),
	propertyDoc: boolean().default(false).notNull(),
	ciorRif: boolean("CIorRIF").default(false).notNull(),
	ownerCiorRif: boolean().default(false).notNull(),
	spouseCiorRif: boolean().default(false).notNull(),
	isCatastralRecordSameOwner: boolean().default(false).notNull(),
	condominiumSolvency: boolean().default(false).notNull(),
	mainProperty: boolean().default(false).notNull(),
	mortgageRelease: text(),
	condominiumSolvencyDetails: text(),
	power: text(),
	successionDeclaration: text(),
	courtRulings: text(),
	catastralRecordYear: text(),
	attorneyEmail: text(),
	attorneyPhone: text(),
	attorneyFirstName: text(),
	attorneyLastName: text(),
	realStateTax: text(),
	owner: text(),
}, (table) => [
	uniqueIndex("DocumentsInformation_propertyId_key").using("btree", table.propertyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.propertyId],
			foreignColumns: [property.id],
			name: "DocumentsInformation_propertyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const equipment = pgTable("Equipment", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
});

export const generalInformation = pgTable("GeneralInformation", {
	id: text().primaryKey().notNull(),
	propertyId: text().notNull(),
	status: text(),
	code: text().notNull(),
	footageGround: text().notNull(),
	footageBuilding: text().notNull(),
	description: text().notNull(),
	propertyType: text().notNull(),
	propertyCondition: text(),
	handoverKeys: boolean().default(false).notNull(),
	termsAndConditionsAccepted: boolean().default(false).notNull(),
	antiquity: text(),
	zoning: text(),
	amountOfFloors: text(),
	propertiesPerFloor: text(),
	typeOfWork: text(),
	isFurnished: boolean().default(false).notNull(),
	isOccupiedByPeople: boolean().default(false).notNull(),
	publicationTitle: text().notNull(),
}, (table) => [
	uniqueIndex("GeneralInformation_propertyId_key").using("btree", table.propertyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.propertyId],
			foreignColumns: [property.id],
			name: "GeneralInformation_propertyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const locationInformation = pgTable("LocationInformation", {
	id: text().primaryKey().notNull(),
	propertyId: text().notNull(),
	location: text(),
	nomenclature: text(),
	tower: text(),
	amountOfFloors: text(),
	isClosedStreet: text(),
	country: text().notNull(),
	state: text().notNull(),
	municipality: text(),
	urbanization: text(),
	avenue: text(),
	street: text(),
	buildingShoppingCenter: text(),
	buildingNumber: text(),
	floor: text(),
	referencePoint: text(),
	howToGet: text(),
	trunkNumber: text(),
	trunkLevel: text(),
	parkingNumber: text(),
	parkingLevel: text(),
	city: text(),
}, (table) => [
	uniqueIndex("LocationInformation_propertyId_key").using("btree", table.propertyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.propertyId],
			foreignColumns: [property.id],
			name: "LocationInformation_propertyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const negotiationInfomation = pgTable("NegotiationInfomation", {
	id: text().primaryKey().notNull(),
	propertyId: text().notNull(),
	price: text().notNull(),
	minimumNegotiation: text(),
	client: text(),
	reasonToSellOrRent: text(),
	partOfPayment: text(),
	mouthToMouth: boolean().default(false).notNull(),
	realStateGroups: boolean().default(false).notNull(),
	realStateWebPages: boolean().default(false).notNull(),
	socialMedia: boolean().default(false).notNull(),
	publicationOnBuilding: boolean().default(false).notNull(),
	operationType: text().notNull(),
	propertyExclusivity: text().notNull(),
	ownerPaysCommission: text(),
	rentCommission: text(),
	sellCommission: text(),
	ally: text(),
	externalAdviser: text(),
	realStateAdviser: text(),
	additionalPrice: text("additional_price"),
	realstateadvisername: varchar({ length: 255 }),
	externaladvisername: varchar({ length: 255 }),
	allyname: varchar({ length: 255 }),
}, (table) => [
	uniqueIndex("NegotiationInfomation_propertyId_key").using("btree", table.propertyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.propertyId],
			foreignColumns: [property.id],
			name: "NegotiationInfomation_propertyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const passkey = pgTable("Passkey", {
	id: serial().primaryKey().notNull(),
	userId: integer().notNull(),
	backedup: boolean().default(false).notNull(),
	counter: integer().default(0).notNull(),
	credentialid: text().notNull(),
	devicetype: text().notNull(),
	platform: text().notNull(),
	publickey: text().notNull(),
	transports: text().array(),
	createdat: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedat: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("Passkey_userId_key").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Passkey_userId_fkey"
		}),
]);

export const propertyStatusEntry = pgTable("PropertyStatusEntry", {
	id: text().primaryKey().notNull(),
	propertyId: text().notNull(),
	username: text().notNull(),
	status: text().notNull(),
	comments: text().notNull(),
}, (table) => [
	uniqueIndex("PropertyStatusEntry_propertyId_key").using("btree", table.propertyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.propertyId],
			foreignColumns: [property.id],
			name: "PropertyStatusEntry_propertyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const subService = pgTable("SubService", {
	service: text().notNull(),
	id: serial().primaryKey().notNull(),
	serviceId: integer().notNull(),
}, (table) => [
	uniqueIndex("SubService_service_key").using("btree", table.service.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [service.id],
			name: "SubService_serviceId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const utility = pgTable("Utility", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
});

export const adjacencyToProperty = pgTable("_AdjacencyToProperty", {
	a: integer("A").notNull(),
	b: text("B").notNull(),
}, (table) => [
	uniqueIndex("_AdjacencyToProperty_AB_unique").using("btree", table.a.asc().nullsLast().op("int4_ops"), table.b.asc().nullsLast().op("int4_ops")),
	index().using("btree", table.b.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.a],
			foreignColumns: [adjacency.id],
			name: "_AdjacencyToProperty_A_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.b],
			foreignColumns: [property.id],
			name: "_AdjacencyToProperty_B_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const attributeToProperty = pgTable("_AttributeToProperty", {
	a: integer("A").notNull(),
	b: text("B").notNull(),
}, (table) => [
	uniqueIndex("_AttributeToProperty_AB_unique").using("btree", table.a.asc().nullsLast().op("int4_ops"), table.b.asc().nullsLast().op("int4_ops")),
	index().using("btree", table.b.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.a],
			foreignColumns: [attribute.id],
			name: "_AttributeToProperty_A_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.b],
			foreignColumns: [property.id],
			name: "_AttributeToProperty_B_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const cashFlow = pgTable("CashFlow", {
	id: serial().primaryKey().notNull(),
	client: integer(),
	user: integer().notNull(),
	owner: integer(),
	location: text(),
	person: integer(),
	date: date().notNull(),
	month: text(),
	createdBy: jsonb().notNull(),
	isTemporalTransaction: boolean(),
	temporalTransactionId: integer(),
	attachments: text().array(),
	property: integer(),
	updatedby: jsonb(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	type: text().default('')
}, (table) => [
	foreignKey({
			columns: [table.property],
			foreignColumns: [cashFlowProperty.id],
			name: "cashflow_cashflowproperty_fkey"
		}),
	foreignKey({
			columns: [table.user],
			foreignColumns: [user.id],
			name: "cashflow_user_fk"
		}),
	foreignKey({
			columns: [table.client],
			foreignColumns: [client.id],
			name: "cashflow_client_fkey"
		}),
	foreignKey({
			columns: [table.person],
			foreignColumns: [externalPerson.id],
			name: "cashflow_person_fk"
		}),
]);

export const service = pgTable("Service", {
	title: text().notNull(),
	id: serial().primaryKey().notNull(),
	order: integer(),
	enabled: boolean().default(true),
}, (table) => [
	uniqueIndex("Service_title_key").using("btree", table.title.asc().nullsLast().op("text_ops")),
]);

export const equipmentToProperty = pgTable("_EquipmentToProperty", {
	a: integer("A").notNull(),
	b: text("B").notNull(),
}, (table) => [
	uniqueIndex("_EquipmentToProperty_AB_unique").using("btree", table.a.asc().nullsLast().op("int4_ops"), table.b.asc().nullsLast().op("int4_ops")),
	index().using("btree", table.b.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.a],
			foreignColumns: [equipment.id],
			name: "_EquipmentToProperty_A_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.b],
			foreignColumns: [property.id],
			name: "_EquipmentToProperty_B_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const propertyToDistribution = pgTable("_PropertyToDistribution", {
	a: integer("A").notNull(),
	b: text("B").notNull(),
}, (table) => [
	uniqueIndex("_PropertyToDistribution_AB_unique").using("btree", table.a.asc().nullsLast().op("int4_ops"), table.b.asc().nullsLast().op("int4_ops")),
	index().using("btree", table.b.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.a],
			foreignColumns: [distribution.id],
			name: "_PropertyToDistribution_A_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.b],
			foreignColumns: [property.id],
			name: "_PropertyToDistribution_B_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const propertyToUtility = pgTable("_PropertyToUtility", {
	a: text("A").notNull(),
	b: integer("B").notNull(),
}, (table) => [
	uniqueIndex("_PropertyToUtility_AB_unique").using("btree", table.a.asc().nullsLast().op("int4_ops"), table.b.asc().nullsLast().op("int4_ops")),
	index().using("btree", table.b.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.a],
			foreignColumns: [property.id],
			name: "_PropertyToUtility_A_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.b],
			foreignColumns: [utility.id],
			name: "_PropertyToUtility_B_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const user = pgTable("User", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	username: text().notNull(),
	phonenumber: text(),
	firstname: text(),
	lastname: text(),
	imageurl: text(),
	createdat: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedat: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	role: text().notNull(),
	isactive: boolean().default(true).notNull(),
	permissions: jsonb(),
	issuperadmin: boolean().default(false).notNull(),
	lastlogin: timestamp({ precision: 3, mode: 'string' }),
	twofactorenabled: boolean().default(false).notNull(),
	password: text().notNull(),
	pushtoken: text(),
	status: varchar({ length: 255 }).default('active'),
});

export const clientHistory = pgTable("ClientHistory", {
	id: serial().primaryKey().notNull(),
	clientId: integer("client_id").notNull(),
	updatedBy: jsonb("updated_by").notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	previousData: jsonb("previous_data"),
	changes: jsonb(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [client.id],
			name: "ClientHistory_client_id_fkey"
		}),
]);

export const property = pgTable("Property", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	images: text().array(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	furnishedAreas: text().array(),
	slug: text().notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	isFeatured: boolean().default(false),
	active: boolean().default(false).notNull(),
	status: varchar({ length: 20 }),
	documents: text().array(),
	updatedby: jsonb(),
	createdby: jsonb(),
	codeId: integer().default(sql`nextval('property_codeid_seq'::regclass)`).notNull(),
}, (table) => [
	uniqueIndex("Property_slug_key").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const client = pgTable("Client", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	usageProperty: text(),
	referrer: text(),
	contactFrom: text().notNull(),
	requirementStatus: text(),
	phone: text().notNull(),
	propertyOfInterest: text(),
	propertyLocation: text(),
	typeOfCapture: text(),
	aspiredPrice: text(),
	typeOfBusiness: text(),
	note: text(),
	isPotentialInvestor: boolean(),
	amountOfPeople: integer(),
	amountOfPets: integer(),
	amountOfYounger: integer(),
	arrivingDate: timestamp({ precision: 3, mode: 'string' }),
	checkoutDate: timestamp({ precision: 3, mode: 'string' }),
	amountOfNights: integer(),
	reasonOfStay: text(),
	usageOfProperty: text(),
	typeOfPerson: text(),
	personEntry: text(),
	personHeadquarters: text(),
	personLocation: text(),
	specificRequirement: text(),
	location: text(),
	company: text(),
	remodeledAreas: text(),
	propertyDistribution: text(),
	m2: text(),
	occupation: text(),
	userFullName: text(),
	userId: text(),
	serviceName: text(),
	serviceId: text(),
	subServiceName: text(),
	subServiceId: text(),
	username: text(),
	interestDate: timestamp({ precision: 3, mode: 'string' }),
	appointmentDate: timestamp({ precision: 3, mode: 'string' }),
	inspectionDate: timestamp({ precision: 3, mode: 'string' }),
	zonesOfInterest: text().array(),
	essentialFeatures: text().array(),
	propertytype: varchar({ length: 256 }),
	allowpets: varchar({ length: 256 }),
	allowyounger: varchar({ length: 256 }),
	requestracking: text(),
	isinwaitinglist: boolean(),
	budgetfrom: numeric({ precision: 12, scale:  2 }),
	budgetto: numeric({ precision: 12, scale:  2 }),
	status: varchar({ length: 255 }).default('active'),
	adviserId: varchar("adviser_id", { length: 255 }),
	adviserName: varchar("adviser_name", { length: 255 }),
	createdat: timestamp({ mode: 'string' }).defaultNow(),
	updatedat: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdby: jsonb(),
	updatedby: jsonb(),
	assignedto: jsonb(),
});

export const cashFlowPayment = pgTable("CashFlowPayment", {
	id: serial().primaryKey().notNull(),
	cashflow: integer().notNull(),
	contract: boolean(),
	guarantee: boolean(),
	serviceType: text(),
	reason: text(),
	service: text(),
	taxPayer: text(),
	amount: doublePrecision().notNull(),
	currency: integer().notNull(),
	wayToPay: integer().notNull(),
	transactionType: integer().notNull(),
	totalDue: doublePrecision(),
	incomeByThird: doublePrecision(),
	entity: integer(),
	pendingToCollect: doublePrecision(),
	observation: text(),
	canon: boolean(),
}, (table) => [
	foreignKey({
			columns: [table.cashflow],
			foreignColumns: [cashFlow.id],
			name: "cashflowpayment_cashflow_fk"
		}),
	foreignKey({
			columns: [table.currency],
			foreignColumns: [cashFlowCurrency.id],
			name: "cashflowpayment_currency_fk"
		}),
	foreignKey({
			columns: [table.entity],
			foreignColumns: [cashFlowSourceEntity.id],
			name: "cashflowpayment_entity_fk"
		}),
	foreignKey({
			columns: [table.transactionType],
			foreignColumns: [cashFlowTransactionType.id],
			name: "cashflowpayment_transactiontype_fk"
		}),
]);

export const closeCashFlow = pgTable("CloseCashFlow", {
	id: serial().primaryKey().notNull(),
	data: jsonb(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_closecashflow_createdat").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const adjacenciesOnProperties = pgTable("AdjacenciesOnProperties", {
	propertyId: text().notNull(),
	adjacencyId: integer().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.adjacencyId],
			foreignColumns: [adjacency.id],
			name: "AdjacenciesOnProperties_adjacencyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.propertyId],
			foreignColumns: [property.id],
			name: "AdjacenciesOnProperties_propertyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	primaryKey({ columns: [table.propertyId, table.adjacencyId], name: "AdjacenciesOnProperties_pkey"}),
]);

export const distributionsOnProperties = pgTable("DistributionsOnProperties", {
	propertyId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	additionalInformation: text(),
	distributionId: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.distributionId],
			foreignColumns: [distribution.id],
			name: "DistributionsOnProperties_distributionId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.propertyId],
			foreignColumns: [property.id],
			name: "DistributionsOnProperties_propertyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	primaryKey({ columns: [table.propertyId, table.distributionId], name: "DistributionsOnProperties_pkey"}),
]);

export const utilitiesOnProperties = pgTable("UtilitiesOnProperties", {
	propertyId: text().notNull(),
	utilityId: integer().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	additionalInformation: text(),
}, (table) => [
	foreignKey({
			columns: [table.propertyId],
			foreignColumns: [property.id],
			name: "UtilitiesOnProperties_propertyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.utilityId],
			foreignColumns: [utility.id],
			name: "UtilitiesOnProperties_utilityId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	primaryKey({ columns: [table.propertyId, table.utilityId], name: "UtilitiesOnProperties_pkey"}),
]);

export const attributesOnProperties = pgTable("AttributesOnProperties", {
	propertyId: text().notNull(),
	attribyteId: integer().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	value: text().notNull(),
	valueType: formValueTypes().default('string').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.attribyteId],
			foreignColumns: [attribute.id],
			name: "AttributesOnProperties_attribyteId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.propertyId],
			foreignColumns: [property.id],
			name: "AttributesOnProperties_propertyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	primaryKey({ columns: [table.propertyId, table.attribyteId], name: "AttributesOnProperties_pkey"}),
]);

export const equipmentsOnProperties = pgTable("EquipmentsOnProperties", {
	propertyId: text().notNull(),
	equipmentId: integer().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	brand: text(),
	additionalInformation: text(),
}, (table) => [
	foreignKey({
			columns: [table.equipmentId],
			foreignColumns: [equipment.id],
			name: "EquipmentsOnProperties_equipmentId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.propertyId],
			foreignColumns: [property.id],
			name: "EquipmentsOnProperties_propertyId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	primaryKey({ columns: [table.propertyId, table.equipmentId], name: "EquipmentsOnProperties_pkey"}),
]);
