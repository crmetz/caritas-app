import { useState } from "react";
import { Boxes } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../components/ui/tabs";
import { ControleTab } from "./ControleTab";
import { ConfiguracoesTab } from "./ConfiguracoesTab";
import { MontagemWizard } from "./MontagemWizard";

function CestaBasicaPage() {
	const [wizardOpen, setWizardOpen] = useState(false);
	const [controleRefresh, setControleRefresh] = useState(0);
	const [tab, setTab] = useState("controle");

	return (
		<div className="space-y-6">
			<div className="flex items-end justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Cesta Básica
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Configure, monte e controle as cestas básicas.
					</p>
				</div>
				<Button onClick={() => setWizardOpen(true)}>
					<Boxes className="mr-1.5 h-4 w-4" />
					Montar cestas
				</Button>
			</div>

			<Tabs value={tab} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="controle">Controle</TabsTrigger>
					<TabsTrigger value="configuracoes">Configurações</TabsTrigger>
				</TabsList>
				<TabsContent value="controle">
					<ControleTab refreshSignal={controleRefresh} />
				</TabsContent>
				<TabsContent value="configuracoes">
					<ConfiguracoesTab />
				</TabsContent>
			</Tabs>

			<MontagemWizard
				open={wizardOpen}
				onOpenChange={setWizardOpen}
				onSuccess={() => {
					setControleRefresh((n) => n + 1);
					setTab("controle");
				}}
			/>
		</div>
	);
}

export default CestaBasicaPage;
