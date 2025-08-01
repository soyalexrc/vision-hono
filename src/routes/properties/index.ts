import {Hono} from 'hono';
import {neon} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';
import {eq, inArray, sql, sql as rawSql, or, like, ilike, and, not} from 'drizzle-orm';
import Slugify from 'slugify'
import {
    adjacenciesOnProperties, adjacency, ally,
    attribute, attributesOnProperties, client, distribution, distributionsOnProperties,
    documentsInformation, equipment, equipmentsOnProperties,
    generalInformation,
    locationInformation,
    negotiationInfomation,
    property, utilitiesOnProperties, utility
} from '../../db/schema';
import {PropertyDto, PropertyPatchDto} from "../../dto/property";
import {v4 as uuid} from 'uuid';
import jsonError from "../../utils/jsonError";

export type Env = {
    NEON_DB: string;
};

const properties = new Hono<{ Bindings: Env }>();

// GET all properties
properties.get('/', async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const data = await db.select({
        // Property fields
        id: property.id,
        coverUrl: property.images,
        slug: property.slug,
        userId: property.userId,
        codeId: property.codeId,
        realStateAdviser: negotiationInfomation.realStateAdviser,
        status: property.status,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
        isFeatured: property.isFeatured,
        // General information fields
        publicationTitle: generalInformation.publicationTitle,
        code: generalInformation.code,
        propertyType: generalInformation.propertyType,
        // Negotiation fields
        price: negotiationInfomation.price,
        realstateadvisername: negotiationInfomation.realstateadvisername,
        operationType: negotiationInfomation.operationType,
    })
        .from(property)
        .leftJoin(generalInformation, eq(property.id, generalInformation.propertyId)) // Add proper join condition
        .leftJoin(negotiationInfomation, eq(property.id, negotiationInfomation.propertyId)) // Add proper join condition
        .where(not(eq(property.status, 'deleted')))
    return c.json({
        data: data.map(item => ({...item, coverUrl: item.coverUrl!.length > 0 ? item.coverUrl![0] : '', images: item.coverUrl ? item.coverUrl : []})),
    });
});

// GET all properties for commission
properties.get('/commission', async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const data = await db.select({
        // Property fields
        id: property.id,
        coverUrl: property.images,
        slug: property.slug,
        userId: property.userId,
        codeId: property.codeId,
        realStateAdviser: negotiationInfomation.realStateAdviser,
        status: property.status,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
        isFeatured: property.isFeatured,
        // General information fields
        publicationTitle: generalInformation.publicationTitle,
        code: generalInformation.code,
        propertyType: generalInformation.propertyType,
        // Negotiation fields
        price: negotiationInfomation.price,
        realstateadvisername: negotiationInfomation.realstateadvisername,
        operationType: negotiationInfomation.operationType,
    })
        .from(property)
        .leftJoin(generalInformation, eq(property.id, generalInformation.propertyId)) // Add proper join condition
        .leftJoin(negotiationInfomation, eq(property.id, negotiationInfomation.propertyId)) // Add proper join condition
        .where(or(
            eq(property.status, 'concretized'),
            eq(property.status, 'concretized_fulfill')
        ))
    return c.json({
        data: data.map(item => ({...item, coverUrl: item.coverUrl!.length > 0 ? item.coverUrl![0] : '', images: item.coverUrl ? item.coverUrl : []})),
    });
});

// GET all properties featured
properties.get('/featured', async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const data = await db.select({
        // Property fields
        id: property.id,
        coverUrl: property.images,
        slug: property.slug,
        userId: property.userId,
        codeId: property.codeId,
        realStateAdviser: negotiationInfomation.realStateAdviser,
        status: property.status,
        footageGround: generalInformation.footageGround,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
        isFeatured: property.isFeatured,
        // General information fields
        publicationTitle: generalInformation.publicationTitle,
        code: generalInformation.code,
        propertyType: generalInformation.propertyType,
        // Negotiation fields
        price: negotiationInfomation.price,
        realstateadvisername: negotiationInfomation.realstateadvisername,
        operationType: negotiationInfomation.operationType,
    })
        .from(property)
        .leftJoin(generalInformation, eq(property.id, generalInformation.propertyId)) // Add proper join condition
        .leftJoin(negotiationInfomation, eq(property.id, negotiationInfomation.propertyId)) // Add proper join condition
        .where(eq(property.isFeatured, true));


    return c.json({
        data: data.map(item => ({...item, coverUrl: item.coverUrl!.length > 0 ? item.coverUrl![0] : ''})),
    });
});

// GET all properties slug
properties.get('/slugs', async (c) => {
    const sql = neon(c.env.NEON_DB);
    const db = drizzle(sql);

    const data = await db.select({
        slug: property.slug,
    }).from(property)

    return c.json(data);
});

// GET all properties queried (web)
properties.get('/queried', async (c) => {
    try {
        const params = c.req.query();
        const busqueda = params.busqueda;
        const page = Number(params.pagina) || 1;
        const size = Number(params.cantidad) || 10;
        const operationType = params['tipo-de-operacion'] || 'todos';
        const status = params.status || 'active';
        const propertyType = params['tipo-de-inmueble'] || 'todos';
        const code = params.codigo;
        const state = params.estado;
        const municipality = params.municipio;
        const adviserId = params.asesor;
        const isFeatured = params.destacado;

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        // Build where conditions - these will be combined with AND logic
        let whereConditions = [];

        // General search - combine with OR logic for these fields
        if (busqueda) {
            whereConditions.push(
                or(
                    ilike(generalInformation.publicationTitle, `%${busqueda}%`),
                    ilike(generalInformation.propertyType, `%${busqueda}%`),
                    ilike(generalInformation.code, `%${busqueda}%`),
                    ilike(negotiationInfomation.operationType, `%${busqueda}%`)
                )
            );
        }

        if (isFeatured === 'true') {
            whereConditions.push(eq(property.isFeatured, true));
        }

        if (code) {
            whereConditions.push(eq(generalInformation.code, code));
        }

        if (state) {
            whereConditions.push(ilike(locationInformation.state, `%${state}%`));
        }

        if (municipality) {
            whereConditions.push(ilike(locationInformation.municipality, `%${municipality}%`));
        }

        if (operationType && operationType !== 'todos') {
            console.log('Filtering by operationType:', operationType);
            // Try exact match first
            whereConditions.push(ilike(negotiationInfomation.operationType, `%${operationType}%`));
        }

        if (status && status !== 'todos') {
            whereConditions.push(eq(property.status, status));
        }

        if (propertyType && propertyType !== 'todos') {
            whereConditions.push(ilike(generalInformation.propertyType, `%${propertyType}%`));
        }

        if (adviserId && adviserId !== '') {
            whereConditions.push(eq(negotiationInfomation.realStateAdviser, adviserId));
        }

        // Combine all conditions with AND logic
        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;


        // Count total properties
        const totalProperties = await db
            .select({ count: rawSql<number>`count(*)` })
            .from(property)
            .leftJoin(generalInformation, eq(property.id, generalInformation.propertyId))
            .leftJoin(locationInformation, eq(property.id, locationInformation.propertyId))
            .leftJoin(negotiationInfomation, eq(property.id, negotiationInfomation.propertyId))
            .where(whereClause);

        const totalPages = Math.ceil(totalProperties[0].count / size);

        // Get paginated data
        const data = await db.select({
            id: property.id,
            slug: property.slug,
            active: property.active,
            isFeatured: property.isFeatured,
            images: property.images,
            // General Information
            code: generalInformation.code,
            publicationTitle: generalInformation.publicationTitle,
            propertyType: generalInformation.propertyType,
            footageBuilding: generalInformation.footageBuilding,
            footageGround: generalInformation.footageGround,
            description: generalInformation.description,
            // Location Information
            municipality: locationInformation.municipality,
            state: locationInformation.state,
            avenue: locationInformation.avenue,
            urbanization: locationInformation.urbanization,
            street: locationInformation.street,
            // Negotiation Information
            price: negotiationInfomation.price,
            operationType: negotiationInfomation.operationType,
            realStateAdviser: negotiationInfomation.realStateAdviser,
            externalAdviser: negotiationInfomation.externalAdviser,
            ally: negotiationInfomation.ally,
            realstateadvisername: negotiationInfomation.realstateadvisername,
        })
            .from(property)
            .leftJoin(generalInformation, eq(property.id, generalInformation.propertyId))
            .leftJoin(locationInformation, eq(property.id, locationInformation.propertyId))
            .leftJoin(negotiationInfomation, eq(property.id, negotiationInfomation.propertyId))
            .where(whereClause)
            .limit(size)
            .offset((page - 1) * size);

        const formattedData = data.map(row => ({
            id: row.id,
            slug: row.slug,
            active: row.active,
            price: row.price,
            code: row.code,
            operationType: row.operationType,
            isFeatured: row.isFeatured,
            realstateadvisername: row.realstateadvisername,
            publicationTitle: row.publicationTitle,
            propertyType: row.propertyType,
            footageBuilding: row.footageBuilding,
            footageGround: row.footageGround,
            municipality: row.municipality,
            state: row.state,
            avenue: row.avenue,
            urbanization: row.urbanization,
            street: row.street,
            description: row.description,
            images: row.images ?? ['/vision-icon.png'],
            adviserId: row.realStateAdviser,
            allyId: row.ally,
            externalAdviserId: row.externalAdviser,
        }));

        return c.json({ properties  : formattedData, totalPages });
    } catch (error) {
        console.error('Error fetching properties:', error);
        return jsonError(c, {
            status: 500,
            message: 'Error al obtener los inmuebles',
            code: 'DATABASE_ERROR',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});


properties.get('/edit/:id', async (c) => {
    try {
        const params = c.req.param();

        if (!params.id) {
            return jsonError(c, {
                status: 400,
                message: 'ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        // First query: Get the basic property data
        const propertyResults = await db
            .select()
            .from(property)
            .where(eq(property.id, params.id))
            .leftJoin(generalInformation, eq(property.id, generalInformation.propertyId))
            .leftJoin(documentsInformation, eq(property.id, documentsInformation.propertyId))
            .leftJoin(negotiationInfomation, eq(property.id, negotiationInfomation.propertyId))
            .leftJoin(locationInformation, eq(property.id, locationInformation.propertyId))

        if (propertyResults.length === 0) {
            return jsonError(c, {
                status: 404,
                message: 'Property not found',
                code: 'NOT_FOUND',
            });
        }

        // Separate query for attributes
        const attributesResults = await db
            .select({
                attributeId: attribute.id,
                attributeLabel: attribute.label,
                attributePlaceholder: attribute.placeholder,
                attributeOptions: attribute.options,
                attributeFormType: attribute.formType,
                attributeValue: attributesOnProperties.value,
                attributeValueType: attributesOnProperties.valueType,
                attributeCreatedAt: attributesOnProperties.createdAt,
            })
            .from(attributesOnProperties)
            .leftJoin(attribute, eq(attributesOnProperties.attribyteId, attribute.id)) // Keep the typo
            .where(eq(attributesOnProperties.propertyId, params.id));

        // Separate query for distributions
        const distributionsResults = await db
            .select({
                distributionId: distribution.id,
                distributionTitle: distribution.title,
                distributionDescription: distribution.description,
                distributionAdditionalInformation: distributionsOnProperties.additionalInformation,
                distributionCreatedAt: distributionsOnProperties.createdAt,
            })
            .from(distributionsOnProperties)
            .leftJoin(distribution, eq(distributionsOnProperties.distributionId, distribution.id))
            .where(eq(distributionsOnProperties.propertyId, params.id));

        // Separate query for equipments
        const equipmentsResults = await db
            .select({
                equipmentId: equipment.id,
                equipmentTitle: equipment.title,
                equipmentDescription: equipment.description,
                equipmentAdditionalInformation: equipmentsOnProperties.additionalInformation,
                equipmentBrand: equipmentsOnProperties.brand,
                equipmentCreatedAt: equipmentsOnProperties.createdAt,
            })
            .from(equipmentsOnProperties)
            .leftJoin(equipment, eq(equipmentsOnProperties.equipmentId, equipment.id))
            .where(eq(equipmentsOnProperties.propertyId, params.id));

        // Separate query for utilities
        const utilitiesResults = await db
            .select({
                utilityId: utility.id,
                utilityTitle: utility.title,
                utilityDescription: utility.description,
                utilityAdditionalInformation: utilitiesOnProperties.additionalInformation,
                utilityCreatedAt: utilitiesOnProperties.createdAt,
            })
            .from(utilitiesOnProperties)
            .leftJoin(utility, eq(utilitiesOnProperties.utilityId, utility.id))
            .where(eq(utilitiesOnProperties.propertyId, params.id));

        // Separate query for adjacencies
        const adjacenciesResults = await db
            .select({
                adjacencyId: adjacency.id,
                adjacencyTitle: adjacency.title,
                adjacencyDescription: adjacency.description,
                adjacencyCreatedAt: adjacenciesOnProperties.createdAt,
            })
            .from(adjacenciesOnProperties)
            .leftJoin(adjacency, eq(adjacenciesOnProperties.adjacencyId, adjacency.id))
            .where(eq(adjacenciesOnProperties.propertyId, params.id));

        // Transform the results into the expected format
        const attributes = attributesResults.map(row => ({
            attributeId: row.attributeId,
            value: row.attributeValue,
            valueType: row.attributeValueType,
            createdAt: row.attributeCreatedAt,
            attribute: {
                id: row.attributeId,
                label: row.attributeLabel,
                placeholder: row.attributePlaceholder,
                options: row.attributeOptions,
                formType: row.attributeFormType,
            }
        }));

        const distributions = distributionsResults.map(row => ({
            distributionId: row.distributionId,
            additionalInformation: row.distributionAdditionalInformation,
            createdAt: row.distributionCreatedAt,
            distribution: {
                id: row.distributionId,
                title: row.distributionTitle,
                description: row.distributionDescription,
            }
        }));

        const equipments = equipmentsResults.map(row => ({
            equipmentId: row.equipmentId,
            additionalInformation: row.equipmentAdditionalInformation,
            brand: row.equipmentBrand,
            createdAt: row.equipmentCreatedAt,
            equipment: {
                id: row.equipmentId,
                title: row.equipmentTitle,
                description: row.equipmentDescription,
            }
        }));

        const utilities = utilitiesResults.map(row => ({
            utilityId: row.utilityId,
            additionalInformation: row.utilityAdditionalInformation,
            createdAt: row.utilityCreatedAt,
            utility: {
                id: row.utilityId,
                title: row.utilityTitle,
                description: row.utilityDescription,
            }
        }));

        const adjacencies = adjacenciesResults.map(row => ({
            adjacencyId: row.adjacencyId,
            createdAt: row.adjacencyCreatedAt,
            adjacency: {
                id: row.adjacencyId,
                title: row.adjacencyTitle,
                description: row.adjacencyDescription,
            }
        }));

        const {
            GeneralInformation,
            LocationInformation,
            DocumentsInformation,
            NegotiationInfomation,
            ...rest
        } = propertyResults[0]

        const propertyData = {
            ...rest.Property,
            generalInformation: GeneralInformation,
            locationInformation: LocationInformation,
            negotiationInformation: NegotiationInfomation,
            documentsInformation: {
                ...DocumentsInformation,
                CIorRIF: DocumentsInformation?.ciorRif,
                ownerCIorRIF: DocumentsInformation?.ownerCiorRif,
                spouseCIorRIF: DocumentsInformation?.spouseCiorRif,
            },
            attributes,
            equipments,
            distributions,
            utilities,
            adjacencies,
        };

        return c.json({data: propertyData});
    } catch (error) {
        console.error('Error fetching properties:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch property',
            code: 'DATABASE_ERROR',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

properties.get('/detail/:id', async (c) => {
    try {
        const params = c.req.param();

        if (!params.id) {
            return jsonError(c, {
                status: 400,
                message: 'ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        // First query: Get the basic property data
        const propertyResults = await db
            .select({
                // Property fields
                id: property.id,
                images: property.images,
                slug: property.slug,
                userId: property.userId,
                codeId: property.codeId,
                realStateAdviser: negotiationInfomation.realStateAdviser,
                status: property.status,
                createdAt: property.createdAt,
                updatedAt: property.updatedAt,
                isFeatured: property.isFeatured,
                // General information fields
                publicationTitle: generalInformation.publicationTitle,
                code: generalInformation.code,
                propertyType: generalInformation.propertyType,
                footageBuilding: generalInformation.footageBuilding,
                footageGround: generalInformation.footageGround,
                description: generalInformation.description,
                // Negotiation fields
                price: negotiationInfomation.price,

                state: locationInformation.state,
                avenue: locationInformation.avenue,
                city: locationInformation.city,
                country: locationInformation.country,
                howToGet: locationInformation.howToGet,
                municipality: locationInformation.municipality,
                referencePoint: locationInformation.referencePoint,
                urbanization: locationInformation.urbanization,
                street: locationInformation.street,
                isClosedStreet: locationInformation.isClosedStreet,

                NegotiationInfomation: negotiationInfomation, // Full object
            })
            .from(property)
            .where(eq(property.id, params.id))
            .leftJoin(generalInformation, eq(property.id, generalInformation.propertyId))
            // .leftJoin(documentsInformation, eq(property.id, documentsInformation.propertyId))
            .leftJoin(negotiationInfomation, eq(property.id, negotiationInfomation.propertyId))
            .leftJoin(locationInformation, eq(property.id, locationInformation.propertyId))

        if (propertyResults.length === 0) {
            return jsonError(c, {
                status: 404,
                message: 'Property not found',
                code: 'NOT_FOUND',
            });
        }

        // Separate query for attributes
        const attributesResults = await db
            .select({
                attributeId: attribute.id,
                attributeLabel: attribute.label,
                attributePlaceholder: attribute.placeholder,
                attributeOptions: attribute.options,
                attributeFormType: attribute.formType,
                attributeValue: attributesOnProperties.value,
                attributeValueType: attributesOnProperties.valueType,
                attributeCreatedAt: attributesOnProperties.createdAt,
            })
            .from(attributesOnProperties)
            .leftJoin(attribute, eq(attributesOnProperties.attribyteId, attribute.id)) // Keep the typo
            .where(eq(attributesOnProperties.propertyId, params.id));

        // Separate query for distributions
        const distributionsResults = await db
            .select({
                distributionId: distribution.id,
                distributionTitle: distribution.title,
                distributionDescription: distribution.description,
                distributionAdditionalInformation: distributionsOnProperties.additionalInformation,
                distributionCreatedAt: distributionsOnProperties.createdAt,
            })
            .from(distributionsOnProperties)
            .leftJoin(distribution, eq(distributionsOnProperties.distributionId, distribution.id))
            .where(eq(distributionsOnProperties.propertyId, params.id));

        // Separate query for equipments
        const equipmentsResults = await db
            .select({
                equipmentId: equipment.id,
                equipmentTitle: equipment.title,
                equipmentDescription: equipment.description,
                equipmentAdditionalInformation: equipmentsOnProperties.additionalInformation,
                equipmentBrand: equipmentsOnProperties.brand,
                equipmentCreatedAt: equipmentsOnProperties.createdAt,
            })
            .from(equipmentsOnProperties)
            .leftJoin(equipment, eq(equipmentsOnProperties.equipmentId, equipment.id))
            .where(eq(equipmentsOnProperties.propertyId, params.id));

        // Separate query for utilities
        const utilitiesResults = await db
            .select({
                utilityId: utility.id,
                utilityTitle: utility.title,
                utilityDescription: utility.description,
                utilityAdditionalInformation: utilitiesOnProperties.additionalInformation,
                utilityCreatedAt: utilitiesOnProperties.createdAt,
            })
            .from(utilitiesOnProperties)
            .leftJoin(utility, eq(utilitiesOnProperties.utilityId, utility.id))
            .where(eq(utilitiesOnProperties.propertyId, params.id));

        // Separate query for adjacencies
        const adjacenciesResults = await db
            .select({
                adjacencyId: adjacency.id,
                adjacencyTitle: adjacency.title,
                adjacencyDescription: adjacency.description,
                adjacencyCreatedAt: adjacenciesOnProperties.createdAt,
            })
            .from(adjacenciesOnProperties)
            .leftJoin(adjacency, eq(adjacenciesOnProperties.adjacencyId, adjacency.id))
            .where(eq(adjacenciesOnProperties.propertyId, params.id));

        // Transform the results into the expected format
        const attributes = attributesResults.map(row => ({
            attributeId: row.attributeId,
            value: row.attributeValue,
            valueType: row.attributeValueType,
            createdAt: row.attributeCreatedAt,
            attribute: {
                id: row.attributeId,
                label: row.attributeLabel,
                placeholder: row.attributePlaceholder,
                options: row.attributeOptions,
                formType: row.attributeFormType,
            }
        }));

        const distributions = distributionsResults.map(row => ({
            distributionId: row.distributionId,
            additionalInformation: row.distributionAdditionalInformation,
            createdAt: row.distributionCreatedAt,
            distribution: {
                id: row.distributionId,
                title: row.distributionTitle,
                description: row.distributionDescription,
            }
        }));

        const equipments = equipmentsResults.map(row => ({
            equipmentId: row.equipmentId,
            additionalInformation: row.equipmentAdditionalInformation,
            brand: row.equipmentBrand,
            createdAt: row.equipmentCreatedAt,
            equipment: {
                id: row.equipmentId,
                title: row.equipmentTitle,
                description: row.equipmentDescription,
            }
        }));

        const utilities = utilitiesResults.map(row => ({
            utilityId: row.utilityId,
            additionalInformation: row.utilityAdditionalInformation,
            createdAt: row.utilityCreatedAt,
            utility: {
                id: row.utilityId,
                title: row.utilityTitle,
                description: row.utilityDescription,
            }
        }));

        const adjacencies = adjacenciesResults.map(row => ({
            adjacencyId: row.adjacencyId,
            createdAt: row.adjacencyCreatedAt,
            adjacency: {
                id: row.adjacencyId,
                title: row.adjacencyTitle,
                description: row.adjacencyDescription,
            }
        }));

        const {
            NegotiationInfomation,
            ...rest
        } = propertyResults[0]

        const propertyData = {
            ...rest,
            negotiationInformation: NegotiationInfomation,
            attributes,
            equipments,
            distributions,
            utilities,
            adjacencies,
        };

        return c.json({data: propertyData});
    } catch (error) {
        console.error('Error fetching properties:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch property',
            code: 'DATABASE_ERROR',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

properties.get('/detail/slug/:slug', async (c) => {
    try {
        const params = c.req.param();

        if (!params.slug) {
            return jsonError(c, {
                status: 400,
                message: 'SLUG is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        // First query: Get the basic property data
        const propertyResults = await db
            .select({
                // Property fields
                id: property.id,
                images: property.images,
                slug: property.slug,
                status: property.status,
                userId: property.userId,
                codeId: property.codeId,
                realStateAdviser: negotiationInfomation.realStateAdviser,
                createdAt: property.createdAt,
                updatedAt: property.updatedAt,
                isFeatured: property.isFeatured,
                // General information fields
                publicationTitle: generalInformation.publicationTitle,
                code: generalInformation.code,
                propertyType: generalInformation.propertyType,
                footageBuilding: generalInformation.footageBuilding,
                footageGround: generalInformation.footageGround,
                description: generalInformation.description,
                // Negotiation fields
                price: negotiationInfomation.price,

                state: locationInformation.state,
                avenue: locationInformation.avenue,
                city: locationInformation.city,
                country: locationInformation.country,
                howToGet: locationInformation.howToGet,
                municipality: locationInformation.municipality,
                referencePoint: locationInformation.referencePoint,
                urbanization: locationInformation.urbanization,
                street: locationInformation.street,
                isClosedStreet: locationInformation.isClosedStreet,

                NegotiationInfomation: negotiationInfomation, // Full object
            })
            .from(property)
            .where(eq(property.slug, params.slug))
            .leftJoin(generalInformation, eq(property.id, generalInformation.propertyId))
            // .leftJoin(documentsInformation, eq(property.id, documentsInformation.propertyId))
            .leftJoin(negotiationInfomation, eq(property.id, negotiationInfomation.propertyId))
            .leftJoin(locationInformation, eq(property.id, locationInformation.propertyId))

        if (propertyResults.length === 0) {
            return jsonError(c, {
                status: 404,
                message: 'Property not found',
                code: 'NOT_FOUND',
            });
        }

        const propertyId = propertyResults[0].id;

        // Separate query for attributes
        const attributesResults = await db
            .select({
                attributeId: attribute.id,
                attributeLabel: attribute.label,
                attributePlaceholder: attribute.placeholder,
                attributeOptions: attribute.options,
                attributeFormType: attribute.formType,
                attributeValue: attributesOnProperties.value,
                attributeValueType: attributesOnProperties.valueType,
                attributeCreatedAt: attributesOnProperties.createdAt,
            })
            .from(attributesOnProperties)
            .leftJoin(attribute, eq(attributesOnProperties.attribyteId, attribute.id)) // Keep the typo
            .where(eq(attributesOnProperties.propertyId, propertyId));

        // Separate query for distributions
        const distributionsResults = await db
            .select({
                distributionId: distribution.id,
                distributionTitle: distribution.title,
                distributionDescription: distribution.description,
                distributionAdditionalInformation: distributionsOnProperties.additionalInformation,
                distributionCreatedAt: distributionsOnProperties.createdAt,
            })
            .from(distributionsOnProperties)
            .leftJoin(distribution, eq(distributionsOnProperties.distributionId, distribution.id))
            .where(eq(distributionsOnProperties.propertyId, propertyId));

        // Separate query for equipments
        const equipmentsResults = await db
            .select({
                equipmentId: equipment.id,
                equipmentTitle: equipment.title,
                equipmentDescription: equipment.description,
                equipmentAdditionalInformation: equipmentsOnProperties.additionalInformation,
                equipmentBrand: equipmentsOnProperties.brand,
                equipmentCreatedAt: equipmentsOnProperties.createdAt,
            })
            .from(equipmentsOnProperties)
            .leftJoin(equipment, eq(equipmentsOnProperties.equipmentId, equipment.id))
            .where(eq(equipmentsOnProperties.propertyId, propertyId));

        // Separate query for utilities
        const utilitiesResults = await db
            .select({
                utilityId: utility.id,
                utilityTitle: utility.title,
                utilityDescription: utility.description,
                utilityAdditionalInformation: utilitiesOnProperties.additionalInformation,
                utilityCreatedAt: utilitiesOnProperties.createdAt,
            })
            .from(utilitiesOnProperties)
            .leftJoin(utility, eq(utilitiesOnProperties.utilityId, utility.id))
            .where(eq(utilitiesOnProperties.propertyId, propertyId));

        // Separate query for adjacencies
        const adjacenciesResults = await db
            .select({
                adjacencyId: adjacency.id,
                adjacencyTitle: adjacency.title,
                adjacencyDescription: adjacency.description,
                adjacencyCreatedAt: adjacenciesOnProperties.createdAt,
            })
            .from(adjacenciesOnProperties)
            .leftJoin(adjacency, eq(adjacenciesOnProperties.adjacencyId, adjacency.id))
            .where(eq(adjacenciesOnProperties.propertyId, propertyId));

        // Transform the results into the expected format
        const attributes = attributesResults.map(row => ({
            attributeId: row.attributeId,
            value: row.attributeValue,
            valueType: row.attributeValueType,
            createdAt: row.attributeCreatedAt,
            attribute: {
                id: row.attributeId,
                label: row.attributeLabel,
                placeholder: row.attributePlaceholder,
                options: row.attributeOptions,
                formType: row.attributeFormType,
            }
        }));

        const distributions = distributionsResults.map(row => ({
            distributionId: row.distributionId,
            additionalInformation: row.distributionAdditionalInformation,
            createdAt: row.distributionCreatedAt,
            distribution: {
                id: row.distributionId,
                title: row.distributionTitle,
                description: row.distributionDescription,
            }
        }));

        const equipments = equipmentsResults.map(row => ({
            equipmentId: row.equipmentId,
            additionalInformation: row.equipmentAdditionalInformation,
            brand: row.equipmentBrand,
            createdAt: row.equipmentCreatedAt,
            equipment: {
                id: row.equipmentId,
                title: row.equipmentTitle,
                description: row.equipmentDescription,
            }
        }));

        const utilities = utilitiesResults.map(row => ({
            utilityId: row.utilityId,
            additionalInformation: row.utilityAdditionalInformation,
            createdAt: row.utilityCreatedAt,
            utility: {
                id: row.utilityId,
                title: row.utilityTitle,
                description: row.utilityDescription,
            }
        }));

        const adjacencies = adjacenciesResults.map(row => ({
            adjacencyId: row.adjacencyId,
            createdAt: row.adjacencyCreatedAt,
            adjacency: {
                id: row.adjacencyId,
                title: row.adjacencyTitle,
                description: row.adjacencyDescription,
            }
        }));

        const {
            NegotiationInfomation,
            ...rest
        } = propertyResults[0]

        const propertyData = {
            ...rest,
            negotiationInformation: NegotiationInfomation,
            attributes,
            equipments,
            distributions,
            utilities,
            adjacencies,
        };

        return c.json(propertyData);
    } catch (error) {
        console.error('Error fetching properties:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch property',
            code: 'DATABASE_ERROR',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});


// POST a new property entry
properties.post('/', async (c) => {
    try {
        const payload = await c.req.json();
        const parsed = PropertyDto.safeParse(payload);

        if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
                details: parsed.error,
            });
        }

        const {
            generalInformation: gi,
            locationInformation: li,
            negotiationInformation: ni,
            documentsInformation: di,
            attributes: attrs,
            adjacencies: adjacs,
            equipments: equips,
            distributions: distrs,
            utilities: utilits,
        } = parsed.data;

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);


        const [newProperty] = await db.insert(property).values({
            id: uuid(),
            userId: parsed.data.userId,
            images: parsed.data.images,
            documents: parsed.data.documents,
            furnishedAreas: parsed.data.furnishedAreas,
            slug: Slugify(gi.publicationTitle, {
                lower: true,
                strict: true,
                trim: true,
            }),
            isFeatured: parsed.data.isFeatured,
            active: parsed.data.active,
            status: parsed.data.status || 'inactive',
            updatedAt: rawSql`now()`,
            createdby: parsed.data.createdby,
        }).returning();

        const [newGeneralInfo] = await db.insert(generalInformation).values({
            ...gi,
            id: uuid(),
            propertyId: newProperty?.id,
            code: '',
            status: parsed.data.status
        }).returning()

        const [newLocationInfo] = await db.insert(locationInformation).values({
            ...li,
            id: uuid(),
            propertyId: newProperty?.id,
        }).returning()

        const [newNegotiationInfo] = await db.insert(negotiationInfomation).values({
            ...ni,
            id: uuid(),
            propertyId: newProperty.id,
            price: ni.price,
            minimumNegotiation: ni.minimumNegotiation,
            client: ni.client,
            reasonToSellOrRent: ni.reasonToSellOrRent,
            partOfPayment: ni.partOfPayment,
            mouthToMouth: ni.mouthToMouth,
            realStateGroups: ni.realStateGroups,
            realStateWebPages: ni.realStateWebPages,
            socialMedia: ni.socialMedia,
            publicationOnBuilding: ni.publicationOnBuilding,
            operationType: ni.operationType,
            propertyExclusivity: ni.propertyExclusivity,
            ownerPaysCommission: ni.ownerPaysCommission,
            rentCommission: ni.rentCommission,
            sellCommission: ni.sellCommission,
            ally: ni.ally,
            externalAdviser: ni.externalAdviser,
            realStateAdviser: ni.realStateAdviser,
            additionalPrice: ni.additional_price,
            realstateadvisername: ni.realstateadvisername,
            externaladvisername: ni.externaladvisername,
            allyname: ni.allyname,
        }).returning()

        const [newDocumentsInfo] = await db.insert(documentsInformation).values({
            ...di,
            id: uuid(),
            ciorRif: di.CIorRIF,
            ownerCiorRif: di.ownerCIorRIF,
            spouseCiorRif: di.spouseCIorRIF,
            propertyId: newProperty.id,
        }).returning()

        // creationOfAttributes

        if (attrs.length > 0) {
            await db.insert(attributesOnProperties).values(
                attrs.map((attr: any) => ({
                    propertyId: newProperty.id,
                    attribyteId: attr.attributeId,
                    value: attr.value,
                    valueType: attr.valueType as any,
                }))
            );
        }

        if (distrs.length > 0) {
            await db.insert(distributionsOnProperties).values(
                distrs.map((dist: any) => ({
                    propertyId: newProperty.id,
                    distributionId: dist.distributionId,
                    additionalInformation: dist.additionalInformation,
                }))
            );
        }

        if (equips.length > 0) {
            await db.insert(equipmentsOnProperties).values(
                equips.map((equip: any) => ({
                    propertyId: newProperty.id,
                    equipmentId: equip.equipmentId,
                    additionalInformation: equip.additionalInformation,
                    brand: equip.brand,
                }))
            );
        }

        if (utilits.length > 0) {
            await db.insert(utilitiesOnProperties).values(
                utilits.map((util: any) => ({
                    propertyId: newProperty.id,
                    utilityId: util.utilityId,
                    additionalInformation: util.additionalInformation,
                }))
            );
        }

        if (adjacs.length > 0) {
            await db.insert(adjacenciesOnProperties).values(
                adjacs.map((adjacency: any) => ({
                    propertyId: newProperty.id,
                    adjacencyId: adjacency.adjacencyId,
                    additionalInformation: adjacency.additionalInformation,
                }))
            );
        }

        return c.json({newProperty, newDocumentsInfo, newGeneralInfo, newLocationInfo, newNegotiationInfo});
    } catch (error) {
        console.error('Error createing property:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to create property',
            code: 'DATABASE_ERROR',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// PATCH an existing property entry
properties.patch('/:id', async (c) => {
    try {
        const params = c.req.param();
        const payload = await c.req.json();

        if (!params.id) {
            return jsonError(c, {
                status: 400,
                message: 'ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const parsed = PropertyPatchDto.safeParse(payload);

        if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
                details: parsed.error,
            });
        }

        const {
            generalInformation: gi,
            locationInformation: li,
            negotiationInformation: ni,
            documentsInformation: di,
            attributes: attrs,
            adjacencies: adjacs,
            equipments: equips,
            distributions: distrs,
            utilities: utilits,
        } = parsed.data;

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const [{
            generalInformationId,
            documentsInformationId,
            locationInformationId,
            negotiationInformationId,
        }] = await db.select({
            generalInformationId: generalInformation.id,
            locationInformationId: locationInformation.id,
            negotiationInformationId: negotiationInfomation.id,
            documentsInformationId: documentsInformation.id,
        })
            .from(property)
            .where(eq(property.id, params.id))
            .leftJoin(generalInformation, eq(property.id, generalInformation.propertyId))
            .leftJoin(locationInformation, eq(property.id, locationInformation.propertyId))
            .leftJoin(negotiationInfomation, eq(property.id, negotiationInfomation.propertyId))
            .leftJoin(documentsInformation, eq(property.id, documentsInformation.propertyId));


        if (!generalInformationId || !documentsInformationId || !locationInformationId || !negotiationInformationId) {
            return jsonError(c, {
                status: 404,
                message: 'Property or related information not found',
                code: 'NOT_FOUND',
            });
        }

        await db.update(property)
            .set({
                images: parsed.data.images,
                documents: parsed.data.documents,
                updatedAt: rawSql`now()`,
                updatedby: parsed.data.updatedby,
            })
            .where(eq(property.id, params.id))

        await db.update(generalInformation).set({
            ...gi,
        })
            .where(eq(generalInformation.id, generalInformationId))

        await db.update(locationInformation).set({
            ...li,
        })
            .where(eq(locationInformation.id, locationInformationId))

        await db.update(negotiationInfomation).set({
            ...ni,
            price: ni?.price,
            minimumNegotiation: ni?.minimumNegotiation,
            client: ni?.client,
            reasonToSellOrRent: ni?.reasonToSellOrRent,
            partOfPayment: ni?.partOfPayment,
            mouthToMouth: ni?.mouthToMouth,
            realStateGroups: ni?.realStateGroups,
            realStateWebPages: ni?.realStateWebPages,
            socialMedia: ni?.socialMedia,
            publicationOnBuilding: ni?.publicationOnBuilding,
            operationType: ni?.operationType,
            propertyExclusivity: ni?.propertyExclusivity,
            ownerPaysCommission: ni?.ownerPaysCommission,
            rentCommission: ni?.rentCommission,
            sellCommission: ni?.sellCommission,
            ally: ni?.ally,
            externalAdviser: ni?.externalAdviser,
            realStateAdviser: ni?.realStateAdviser,
            additionalPrice: ni?.additional_price,
            realstateadvisername: ni?.realstateadvisername,
            externaladvisername: ni?.externaladvisername,
            allyname: ni?.allyname,
        })
            .where(eq(negotiationInfomation.id, negotiationInformationId))


        await db.update(documentsInformation).set({
            ...di,
            ownerCiorRif: di?.ownerCIorRIF,
            spouseCiorRif: di?.spouseCIorRIF,
        })
            .where(eq(documentsInformation.id, documentsInformationId))

        if (attrs.length > 0) {
            await db.delete(attributesOnProperties)
                .where(eq(attributesOnProperties.propertyId, params.id))

            await db.insert(attributesOnProperties).values(
                attrs.map((attr: any) => ({
                    propertyId: params.id,
                    attribyteId: attr.attributeId,
                    value: attr.value,
                    valueType: attr.valueType as any,
                }))
            );
        }

        if (distrs.length > 0) {
            await db.delete(distributionsOnProperties)
                .where(eq(distributionsOnProperties.propertyId, params.id))

            await db.insert(distributionsOnProperties).values(
                distrs.map((dist: any) => ({
                    propertyId: params.id,
                    distributionId: dist.distributionId,
                    additionalInformation: dist.additionalInformation,
                }))
            );
        }

        if (equips.length > 0) {
            await db.delete(equipmentsOnProperties)
                .where(eq(equipmentsOnProperties.propertyId, params.id))

            await db.insert(equipmentsOnProperties).values(
                equips.map((equip: any) => ({
                    propertyId: params.id,
                    equipmentId: equip.equipmentId,
                    additionalInformation: equip.additionalInformation,
                    brand: equip.brand,
                }))
            );
        }

        if (utilits.length > 0) {
            await db.delete(utilitiesOnProperties)
                .where(eq(utilitiesOnProperties.propertyId, params.id))

            await db.insert(utilitiesOnProperties).values(
                utilits.map((util: any) => ({
                    propertyId: params.id,
                    utilityId: util.utilityId,
                    additionalInformation: util.additionalInformation,
                }))
            );
        }

        if (adjacs.length > 0) {
            await db.delete(adjacenciesOnProperties)
                .where(eq(adjacenciesOnProperties.propertyId, params.id))

            await db.insert(adjacenciesOnProperties).values(
                adjacs.map((adjacency: any) => ({
                    propertyId: params.id,
                    adjacencyId: adjacency.adjacencyId,
                    additionalInformation: adjacency.additionalInformation,
                }))
            );
        }

        return c.json({ message: 'Se actualizo la propiedad con exito!'});
    } catch (error) {
        console.error('Error updating property:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to update property',
            code: 'DATABASE_ERROR',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

properties.patch('/status/:id', async (c) => {
    try {
        const id = c.req.param('id');

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const { status } = await c.req.json();

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const updatedAlly = await db.update(property).set({
            status
        }).where(eq(property.id, id)).returning();
        return c.json({ data: updatedAlly[0] });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to update property',
            code: 'DATABASE_ERROR',
        });
    }
});

properties.patch('/featured/:id', async (c) => {
    try {
        const id = c.req.param('id');

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const { isFeatured } = await c.req.json();

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const updatedAlly = await db.update(property).set({
            isFeatured
        }).where(eq(property.id, id)).returning();
        return c.json({ data: updatedAlly[0] });
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to update property',
            code: 'DATABASE_ERROR',
        });
    }
});


// DELETE a property entry
properties.delete('/:id', async (c) => {
    try {
        const id = c.req.param('id');

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'Ally ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundedProperty = await db.select().from(property).where(eq(property.id, id));

        if (foundedProperty.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Ally not found',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(property)
            .set({ status: 'deleted' })
            .where(eq(property.id, id))
            .returning();

        return c.json({
            data: result[0],
            message: 'Property marked as deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting property:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete property',
            code: 'DATABASE_ERROR',
        });
    }
});

// POST /allies/remove-many
properties.post('/remove-many', async (c) => {
    try {
        const body = await c.req.json();
        const ids = body.ids;

        if (!Array.isArray(ids) || ids.length === 0) {
            return jsonError(c, {
                status: 400,
                message: 'At least one ID must be provided',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundProperties = await db
            .select({ id: property.id })
            .from(property)
            .where(inArray(property.id, ids));

        const foundIds = foundProperties.map((a) => a.id);

        if (foundIds.length === 0) {
            return jsonError(c, {
                status: 404,
                message: 'No properties found to delete',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(property)
            .set({ status: 'deleted' })
            .where(inArray(property.id, foundIds))
            .returning();

        return c.json({
            data: result,
            updatedCount: result.length,
            notFoundIds: ids.filter((id) => !foundIds.includes(id)),
            message: 'Properties marked as deleted successfully',
        });
    } catch (error: any) {
        console.error('Error removing properties:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete properties',
            code: 'DATABASE_ERROR',
        });
    }
});

properties.post('/restore', async (c) => {
    try {
        const body = await c.req.json();
        const id = body.id;

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'Ally ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundedProperties = await db.select().from(property).where(eq(property.id, id));

        if (foundedProperties.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Property not found',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(property)
            .set({ status: 'active' })
            .where(eq(property.id, id))
            .returning();

        if (result.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Failed to restore property',
                code: 'NOT_FOUND',
            });
        }

        return c.json({
            data: result[0],
            message: 'Ally restored successfully',
        });
    } catch (error: any) {
        console.error('Error restoring property:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to restore property',
            code: 'DATABASE_ERROR',
        });
    }
});


export default properties;
