"use client";

import { FinanciadoresTab } from "@/components/financiamiento/financiadores-tab";
import { FinanciamientosTab } from "@/components/financiamiento/financiamientos-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinanciamientoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-950">Financiamiento</h1>
        <p className="mt-1 text-sm text-neutral-700">Financiadores institucionales y financiamientos de ventas.</p>
      </div>

      <Tabs defaultValue="financiamientos">
        <TabsList>
          <TabsTrigger value="financiamientos">Financiamientos</TabsTrigger>
          <TabsTrigger value="financiadores">Financiadores</TabsTrigger>
        </TabsList>
        <TabsContent value="financiamientos" className="mt-6">
          <FinanciamientosTab />
        </TabsContent>
        <TabsContent value="financiadores" className="mt-6">
          <FinanciadoresTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
