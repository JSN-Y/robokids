import React, { useState } from "react";
import { Shield, CheckCircle2 } from "lucide-react";
import {
  useGetInventory,
  useListShopItems,
  useGetMe,
} from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEquipment } from "@/lib/equipment";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_TABS = [
  { id: "all",    label: "Tout" },
  { id: "skin",   label: "🎨 Skins & Mascottes" },
  { id: "weapon", label: "⚔️ Armes" },
  { id: "boost",  label: "⚡ Boosts" },
];

// Default items always shown as the first options
const DEFAULT_ITEMS = [
  { id: -1,  name: "Robot (défaut)", icon: "🤖", description: "Le robot de base", category: "skin",   slot: "skinId"   as const },
  { id: -2,  name: "Épée (défaut)",  icon: "⚔️", description: "L'attaque de base", category: "weapon", slot: "weaponId" as const },
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const { data: inventory, isLoading: invLoading } = useGetInventory();
  const { data: shopItems, isLoading: shopLoading } = useListShopItems();
  const { equipped, equip, isEquipped, getSkinSlot } = useEquipment();

  const isLoading = invLoading || shopLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const ownedIds = new Set((inventory || []).map((inv) => inv.shopItemId));

  // Build display items: defaults + owned shop items
  // Show mascots and skins both in the "skin" tab
  const getDisplayCategory = (cat: string) => (cat === "mascot" ? "skin" : cat);

  const ownedItems = (shopItems || [])
    .filter((item) => ownedIds.has(item.id))
    .map((item) => ({ ...item, displayCategory: getDisplayCategory(item.category) }));

  // Filter logic
  const filteredDefaults = DEFAULT_ITEMS.filter(
    (d) => activeTab === "all" || getDisplayCategory(d.category) === activeTab
  );
  const filteredOwned = ownedItems.filter(
    (i) => activeTab === "all" || i.displayCategory === activeTab
  );

  // Slot labels
  const slotLabel: Record<string, string> = {
    skinId: "Personnage actif",
    weaponId: "Arme active",
    boostId: "Boost actif",
  };

  const getSlotIcon = (slot: string): string => {
    if (slot === "skinId") {
      const id = equipped.skinId;
      if (id === null) return "🤖";
      const item = shopItems?.find((s) => s.id === id);
      return item?.icon ?? "🤖";
    }
    if (slot === "weaponId") {
      const id = equipped.weaponId;
      if (id === null) return "⚔️";
      const item = shopItems?.find((s) => s.id === id);
      return item?.icon ?? "⚔️";
    }
    return "⚡";
  };

  const handleEquip = (itemId: number, slot: keyof typeof equipped) => {
    const isCurrentlyEquipped = equipped[slot] === itemId || (itemId === -1 && slot === "skinId" && equipped.skinId === null) || (itemId === -2 && slot === "weaponId" && equipped.weaponId === null);
    if (isCurrentlyEquipped) {
      // Unequip → go to default (null)
      equip(slot, null);
      toast({ title: "Équipement retiré", description: "Retour à l'équipement par défaut." });
    } else {
      equip(slot, itemId < 0 ? null : itemId);
      const name = DEFAULT_ITEMS.find((d) => d.id === itemId)?.name ||
        shopItems?.find((s) => s.id === itemId)?.name || "Objet";
      toast({ title: "Équipé ! ✅", description: `${name} activé.` });
    }
  };

  const isDefaultEquipped = (defaultItem: typeof DEFAULT_ITEMS[0]) => {
    if (defaultItem.id === -1) return equipped.skinId === null;
    if (defaultItem.id === -2) return equipped.weaponId === null;
    return false;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/20 p-3 rounded-2xl">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon Équipement</h1>
          <p className="text-muted-foreground">Choisis ton personnage, ton arme et tes boosts</p>
        </div>
      </div>

      {/* Currently equipped summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {(["skinId", "weaponId", "boostId"] as const).map((slot) => (
          <div key={slot} className="bg-muted/50 rounded-xl p-3 border border-border text-center">
            <p className="text-xs text-muted-foreground mb-2">{slotLabel[slot]}</p>
            <div className="text-4xl mb-1">{getSlotIcon(slot)}</div>
            {slot === "skinId" && (
              <p className="text-xs font-semibold truncate">
                {equipped.skinId === null ? "Robot (défaut)" : shopItems?.find(s => s.id === equipped.skinId)?.name ?? "—"}
              </p>
            )}
            {slot === "weaponId" && (
              <p className="text-xs font-semibold truncate">
                {equipped.weaponId === null ? "Épée (défaut)" : shopItems?.find(s => s.id === equipped.weaponId)?.name ?? "—"}
              </p>
            )}
            {slot === "boostId" && (
              <p className="text-xs font-semibold truncate">
                {equipped.boostId === null ? "Aucun" : shopItems?.find(s => s.id === equipped.boostId)?.name ?? "—"}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {CATEGORY_TABS.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>{cat.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Default items */}
        {filteredDefaults.map((def) => {
          const isActive = isDefaultEquipped(def);
          return (
            <motion.div key={def.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className={`flex flex-col h-full overflow-hidden border-2 transition-all ${isActive ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-primary/50"}`}>
                <div className="h-28 flex items-center justify-center text-5xl bg-muted/30 relative">
                  {def.icon}
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-[10px] px-1.5">Défaut</Badge>
                  </div>
                </div>
                <CardContent className="p-3 flex flex-col gap-2 flex-1">
                  <p className="text-sm font-bold leading-tight">{def.name}</p>
                  <p className="text-xs text-muted-foreground flex-1">{def.description}</p>
                  <Button
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    className="w-full text-xs h-8 mt-1"
                    onClick={() => handleEquip(def.id, def.slot)}
                  >
                    {isActive ? "✓ Équipé" : "Équiper"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Owned shop items */}
        {filteredOwned.map((item) => {
          const slot = getSkinSlot(item.category);
          if (!slot) return null;
          const isActive = equipped[slot] === item.id;
          const isSlotTaken = equipped[slot] !== null && equipped[slot] !== item.id;

          return (
            <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
              <Card className={`flex flex-col h-full overflow-hidden border-2 transition-all ${isActive ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-primary/50"}`}>
                <div className="h-28 flex items-center justify-center text-5xl bg-muted/50 relative">
                  {item.icon || "🎁"}
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                    </div>
                  )}
                  {item.rarity === "legendary" && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 text-[10px] px-1.5">★ Légendaire</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3 flex flex-col gap-2 flex-1">
                  <p className="text-sm font-bold leading-tight truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{item.description}</p>
                  <Button
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    className="w-full text-xs h-8 mt-1"
                    onClick={() => handleEquip(item.id, slot)}
                  >
                    {isActive ? "✓ Équipé — Retirer" : isSlotTaken ? "Remplacer" : "Équiper"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {filteredDefaults.length === 0 && filteredOwned.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground bg-card rounded-xl border border-dashed border-border">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Aucun objet dans cette catégorie</p>
            <p className="text-sm mt-1">Achète des objets dans la Boutique pour les équiper ici !</p>
          </div>
        )}
      </div>
    </div>
  );
}
