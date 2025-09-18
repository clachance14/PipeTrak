export interface FieldWeldRecord {
	id: string;
	projectId?: string;
	weldIdNumber: string;
	packageNumber: string;
	tieInNumber?: string | null;
	xrayPercent?: number | null;
	weldSize: string;
	schedule: string;
	weldTypeCode?: string;
	specCode?: string | null;
	baseMetal?: string | null;
	ndeTypes?: string[];
	ndeType?: string | null;
	ndeResult?: string | null;
	ndeDate?: string | null;
	ndeInspector?: string | null;
	pwhtRequired: boolean;
	dateWelded?: string | null;
	datePwht?: string | null;
	turnoverDate?: string | null;
	comments?: string | null;
	createdAt?: string | null;
	updatedAt?: string | null;
	welder?: {
		id: string;
		stencil: string;
		name: string;
	} | null;
	drawing: {
		id: string;
		number: string;
		title: string;
		parent?: {
			id: string;
			number: string;
			title: string;
			parent?: {
				id: string;
				number: string;
				title: string;
			} | null;
		} | null;
	};
	weldType?: {
		code: string;
		description: string;
	} | null;
	component?: {
		id: string;
		componentId: string;
		displayId: string;
		area?: string | null;
		system?: string | null;
		testPackage?: string | null;
		status?: string | null;
		completionPercent?: number | null;
		milestones: Array<{
			id: string;
			milestoneName: string;
			isCompleted: boolean;
			completedAt?: string | null;
			completedBy?: string | null;
			milestoneOrder?: number | null;
			weight?: number | null;
		}>;
	} | null;
	drawingArea?: string | null;
	drawingSystem?: string | null;
}
