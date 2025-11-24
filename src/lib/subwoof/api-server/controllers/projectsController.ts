import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getProjects(req: Request, res: Response): Promise<void> {
	try {
		const projects = await prisma.projectTable.findMany({
			where: {
				deleted: false
			},
			orderBy: {
				projectName: 'asc'
			}
		});

		res.json({
			data: projects,
			count: projects.length
		});
	} catch (error) {
		console.error('Error fetching projects:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
}
