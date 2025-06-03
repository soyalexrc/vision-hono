import { relations } from "drizzle-orm/relations";
import { property, documentsInformation, generalInformation, locationInformation, negotiationInfomation, user, passkey, propertyStatusEntry, service, subService, adjacency, adjacencyToProperty, attribute, attributeToProperty, cashFlowProperty, cashFlow, client, owner, externalPerson, equipment, equipmentToProperty, distribution, propertyToDistribution, propertyToUtility, utility, clientHistory, adjacenciesOnProperties, distributionsOnProperties, utilitiesOnProperties, attributesOnProperties, equipmentsOnProperties } from "./schema";

export const documentsInformationRelations = relations(documentsInformation, ({one}) => ({
	property: one(property, {
		fields: [documentsInformation.propertyId],
		references: [property.id]
	}),
}));

export const propertyRelations = relations(property, ({many}) => ({
	documentsInformations: many(documentsInformation),
	generalInformations: many(generalInformation),
	locationInformations: many(locationInformation),
	negotiationInfomations: many(negotiationInfomation),
	propertyStatusEntries: many(propertyStatusEntry),
	adjacencyToProperties: many(adjacencyToProperty),
	attributeToProperties: many(attributeToProperty),
	equipmentToProperties: many(equipmentToProperty),
	propertyToDistributions: many(propertyToDistribution),
	propertyToUtilities: many(propertyToUtility),
	adjacenciesOnProperties: many(adjacenciesOnProperties),
	distributionsOnProperties: many(distributionsOnProperties),
	utilitiesOnProperties: many(utilitiesOnProperties),
	attributesOnProperties: many(attributesOnProperties),
	equipmentsOnProperties: many(equipmentsOnProperties),
}));

export const generalInformationRelations = relations(generalInformation, ({one}) => ({
	property: one(property, {
		fields: [generalInformation.propertyId],
		references: [property.id]
	}),
}));

export const locationInformationRelations = relations(locationInformation, ({one}) => ({
	property: one(property, {
		fields: [locationInformation.propertyId],
		references: [property.id]
	}),
}));

export const negotiationInfomationRelations = relations(negotiationInfomation, ({one}) => ({
	property: one(property, {
		fields: [negotiationInfomation.propertyId],
		references: [property.id]
	}),
}));

export const passkeyRelations = relations(passkey, ({one}) => ({
	user: one(user, {
		fields: [passkey.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	passkeys: many(passkey),
	cashFlows: many(cashFlow),
}));

export const propertyStatusEntryRelations = relations(propertyStatusEntry, ({one}) => ({
	property: one(property, {
		fields: [propertyStatusEntry.propertyId],
		references: [property.id]
	}),
}));

export const subServiceRelations = relations(subService, ({one}) => ({
	service: one(service, {
		fields: [subService.serviceId],
		references: [service.id]
	}),
}));

export const serviceRelations = relations(service, ({many}) => ({
	subServices: many(subService),
}));

export const adjacencyToPropertyRelations = relations(adjacencyToProperty, ({one}) => ({
	adjacency: one(adjacency, {
		fields: [adjacencyToProperty.a],
		references: [adjacency.id]
	}),
	property: one(property, {
		fields: [adjacencyToProperty.b],
		references: [property.id]
	}),
}));

export const adjacencyRelations = relations(adjacency, ({many}) => ({
	adjacencyToProperties: many(adjacencyToProperty),
	adjacenciesOnProperties: many(adjacenciesOnProperties),
}));

export const attributeToPropertyRelations = relations(attributeToProperty, ({one}) => ({
	attribute: one(attribute, {
		fields: [attributeToProperty.a],
		references: [attribute.id]
	}),
	property: one(property, {
		fields: [attributeToProperty.b],
		references: [property.id]
	}),
}));

export const attributeRelations = relations(attribute, ({many}) => ({
	attributeToProperties: many(attributeToProperty),
	attributesOnProperties: many(attributesOnProperties),
}));

export const cashFlowRelations = relations(cashFlow, ({one}) => ({
	cashFlowProperty: one(cashFlowProperty, {
		fields: [cashFlow.propertyid],
		references: [cashFlowProperty.id]
	}),
	client: one(client, {
		fields: [cashFlow.clientid],
		references: [client.id]
	}),
	owner: one(owner, {
		fields: [cashFlow.ownerid],
		references: [owner.id]
	}),
	user: one(user, {
		fields: [cashFlow.userId],
		references: [user.id]
	}),
	externalPerson: one(externalPerson, {
		fields: [cashFlow.personid],
		references: [externalPerson.id]
	}),
}));

export const cashFlowPropertyRelations = relations(cashFlowProperty, ({many}) => ({
	cashFlows: many(cashFlow),
}));

export const clientRelations = relations(client, ({many}) => ({
	cashFlows: many(cashFlow),
	clientHistories: many(clientHistory),
}));

export const ownerRelations = relations(owner, ({many}) => ({
	cashFlows: many(cashFlow),
}));

export const externalPersonRelations = relations(externalPerson, ({many}) => ({
	cashFlows: many(cashFlow),
}));

export const equipmentToPropertyRelations = relations(equipmentToProperty, ({one}) => ({
	equipment: one(equipment, {
		fields: [equipmentToProperty.a],
		references: [equipment.id]
	}),
	property: one(property, {
		fields: [equipmentToProperty.b],
		references: [property.id]
	}),
}));

export const equipmentRelations = relations(equipment, ({many}) => ({
	equipmentToProperties: many(equipmentToProperty),
	equipmentsOnProperties: many(equipmentsOnProperties),
}));

export const propertyToDistributionRelations = relations(propertyToDistribution, ({one}) => ({
	distribution: one(distribution, {
		fields: [propertyToDistribution.a],
		references: [distribution.id]
	}),
	property: one(property, {
		fields: [propertyToDistribution.b],
		references: [property.id]
	}),
}));

export const distributionRelations = relations(distribution, ({many}) => ({
	propertyToDistributions: many(propertyToDistribution),
	distributionsOnProperties: many(distributionsOnProperties),
}));

export const propertyToUtilityRelations = relations(propertyToUtility, ({one}) => ({
	property: one(property, {
		fields: [propertyToUtility.a],
		references: [property.id]
	}),
	utility: one(utility, {
		fields: [propertyToUtility.b],
		references: [utility.id]
	}),
}));

export const utilityRelations = relations(utility, ({many}) => ({
	propertyToUtilities: many(propertyToUtility),
	utilitiesOnProperties: many(utilitiesOnProperties),
}));

export const clientHistoryRelations = relations(clientHistory, ({one}) => ({
	client: one(client, {
		fields: [clientHistory.clientId],
		references: [client.id]
	}),
}));

export const adjacenciesOnPropertiesRelations = relations(adjacenciesOnProperties, ({one}) => ({
	adjacency: one(adjacency, {
		fields: [adjacenciesOnProperties.adjacencyId],
		references: [adjacency.id]
	}),
	property: one(property, {
		fields: [adjacenciesOnProperties.propertyId],
		references: [property.id]
	}),
}));

export const distributionsOnPropertiesRelations = relations(distributionsOnProperties, ({one}) => ({
	distribution: one(distribution, {
		fields: [distributionsOnProperties.distributionId],
		references: [distribution.id]
	}),
	property: one(property, {
		fields: [distributionsOnProperties.propertyId],
		references: [property.id]
	}),
}));

export const utilitiesOnPropertiesRelations = relations(utilitiesOnProperties, ({one}) => ({
	property: one(property, {
		fields: [utilitiesOnProperties.propertyId],
		references: [property.id]
	}),
	utility: one(utility, {
		fields: [utilitiesOnProperties.utilityId],
		references: [utility.id]
	}),
}));

export const attributesOnPropertiesRelations = relations(attributesOnProperties, ({one}) => ({
	attribute: one(attribute, {
		fields: [attributesOnProperties.attribyteId],
		references: [attribute.id]
	}),
	property: one(property, {
		fields: [attributesOnProperties.propertyId],
		references: [property.id]
	}),
}));

export const equipmentsOnPropertiesRelations = relations(equipmentsOnProperties, ({one}) => ({
	equipment: one(equipment, {
		fields: [equipmentsOnProperties.equipmentId],
		references: [equipment.id]
	}),
	property: one(property, {
		fields: [equipmentsOnProperties.propertyId],
		references: [property.id]
	}),
}));