"use client";
import { useState } from "react";
import { Button } from "@ui/components/button";
import { PlusIcon } from "lucide-react";
import { AddWelderModal } from "@pipetrak/qc/components/AddWelderModal";
import { WelderTable } from "@pipetrak/qc/components/WelderTable";
import { useParams } from "next/navigation";
export default function WeldersPage() {
    const [showAddModal, setShowAddModal] = useState(false);
    const params = useParams();
    const projectId = params.projectId;
    return (<div className="space-y-8 p-4 sm:p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Welders
					</h1>
					<p className="text-muted-foreground">
						Manage welder information, stencils, and project
						assignments
					</p>
				</div>
				<Button onClick={() => setShowAddModal(true)} size="lg" className="min-h-[44px]">
					<PlusIcon className="mr-2 h-5 w-5"/>
					Add Welder
				</Button>
			</div>

			{/* Welder Management Interface */}
			<WelderTable projectId={projectId}/>

			{/* Add Welder Modal */}
			<AddWelderModal open={showAddModal} onOpenChange={setShowAddModal} projectId={projectId}/>
		</div>);
}
