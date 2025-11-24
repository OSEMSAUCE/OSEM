import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getLands(req: Request, res: Response): Promise<void> {
	try {
		const {
			projectId,
			page = '1',
			pageSize = '50',
			sortBy = 'landName',
			sortOrder = 'asc'
		} = req.query;

		const pageNum = Math.max(1, parseInt(page as string, 10));
		const pageSizeNum = Math.min(1000, Math.max(1, parseInt(pageSize as string, 10)));
		const skip = (pageNum - 1) * pageSizeNum;

		// Build where clause
		const where: any = {
			deleted: false
		};

		if (projectId) {
			where.projectId = projectId as string;
		}

		// Build orderBy
		const orderBy: any = {};
		orderBy[sortBy as string] = sortOrder as 'asc' | 'desc';

		// Get total count
		const totalItems = await prisma.landTable.count({ where });

		// Get paginated lands - all columns from DB, then strip internal fields in JS
		const rawLands = await prisma.landTable.findMany({
			where,
			orderBy,
			skip,
			take: pageSizeNum
		});

		// Remove internal fields like `deleted` from the API response without listing every attribute
		const lands = rawLands.map(({ deleted, ...rest }) => {
			void deleted; // mark as intentionally unused to satisfy ESLint
			return rest;
		});

		const totalPages = Math.ceil(totalItems / pageSizeNum);

		res.json({
			data: lands,
			pagination: {
				page: pageNum,
				pageSize: pageSizeNum,
				totalItems,
				totalPages
			}
		});
	} catch (error) {
		console.error('Error fetching lands:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
}
