import { useState } from "react";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../components/ui/tabs";
import { EstoqueAlimentosTab } from "../EstoqueAlimentos";
import { EstoqueRoupasTab } from "../EstoqueRoupas";
import { GenerosTab } from "../Alimentos";

function EstoquePage() {
	const [tab, setTab] = useState("alimentos");

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">
					Estoque
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Saldo de alimentos e roupas e gêneros cadastrados.
				</p>
			</div>

			<Tabs value={tab} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="alimentos">Alimentos</TabsTrigger>
					<TabsTrigger value="roupas">Roupas</TabsTrigger>
					<TabsTrigger value="generos">Gêneros</TabsTrigger>
				</TabsList>
				<TabsContent value="alimentos">
					<EstoqueAlimentosTab />
				</TabsContent>
				<TabsContent value="roupas">
					<EstoqueRoupasTab />
				</TabsContent>
				<TabsContent value="generos">
					<GenerosTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default EstoquePage;
