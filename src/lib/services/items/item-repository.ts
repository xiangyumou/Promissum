import { prisma } from '@/lib/db/client';
import { Prisma } from '@prisma/client';

export interface CreateItemData {
    id: string;
    type: string;
    encryptedData: string;
    originalName: string | null;
    decryptAt: Date;
    roundNumber: bigint;
    layerCount: number;
    metadata: Prisma.InputJsonValue;
}

export async function createItemInDb(data: CreateItemData) {
    return prisma.item.create({
        data: {
            id: data.id,
            type: data.type,
            encryptedData: data.encryptedData,
            originalName: data.originalName,
            decryptAt: data.decryptAt,
            roundNumber: data.roundNumber,
            createdAt: new Date(),
            layerCount: data.layerCount,
            metadata: data.metadata,
        },
    });
}

export async function findItemsInDb(params: {
    where: Prisma.ItemWhereInput;
    orderBy: Prisma.ItemOrderByWithRelationInput;
    take: number;
    skip: number;
}) {
    return Promise.all([
        prisma.item.findMany({
            where: params.where,
            orderBy: params.orderBy,
            take: params.take,
            skip: params.skip,
            select: {
                id: true,
                type: true,
                originalName: true,
                decryptAt: true,
                createdAt: true,
                layerCount: true,
                metadata: true,
            }
        }),
        prisma.item.count({ where: params.where }),
    ]);
}

export async function findItemHeaderById(id: string) {
    return prisma.item.findUnique({
        where: { id },
        select: {
            id: true,
            type: true,
            originalName: true,
            decryptAt: true,
            createdAt: true,
            layerCount: true,
            metadata: true,
        }
    });
}

export async function findItemEncryptedData(id: string) {
    return prisma.item.findUnique({
        where: { id },
        select: { encryptedData: true }
    });
}

export async function findItemForExtension(id: string) {
    return prisma.item.findUnique({ where: { id } });
}

export async function updateItemExtension(params: {
    id: string;
    currentLayerCount: number;
    encryptedData: string;
    decryptAt: Date;
    roundNumber: bigint;
}) {
    const updated = await prisma.item.updateMany({
        where: {
            id: params.id,
            layerCount: params.currentLayerCount,
        },
        data: {
            encryptedData: params.encryptedData,
            decryptAt: params.decryptAt,
            roundNumber: params.roundNumber,
            layerCount: params.currentLayerCount + 1,
        },
    });

    if (updated.count === 0) {
        throw new Error('Item was modified during operation, please retry');
    }

    return updated;
}

export async function deleteItemFromDb(id: string) {
    try {
        await prisma.item.delete({ where: { id } });
        return true;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new Error('Item not found');
        }
        throw error;
    }
}
