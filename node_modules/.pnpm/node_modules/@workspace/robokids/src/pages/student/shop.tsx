import React from "react";
import { Store, Coins, Loader2, Check } from "lucide-react";
import {
  useListShopItems,
  useGetInventory,
  usePurchaseItem,
  getGetInventoryQueryKey,
  useGetMe,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sounds } from "@/lib/sounds";

const CATEGORIES = [
  { id: "all",    label: "Tout" },
  { id: "weapon", label: "⚔️ Armes" },
  { id: "boost",  label: "⚡ Boosts" },
  { id: "skin",   label: "🎨 Skins" },
  { id: "mascot", label: "🐾 Mascottes" },
];

export default function Shop() {
  const [activeCategory, setActiveCategory] = React.useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items, isLoading: isItemsLoading } = useListShopItems();
  const { data: inventory, isLoading: isInvLoading } = useGetInventory();
  const { data: user } = useGetMe();
  const purchase = usePurchaseItem();

  const isLoading = isItemsLoading || isInvLoading;

  const handlePurchase = (itemId: number, name: string) => {
    purchase.mutate(
      { data: { shopItemId: itemId } },
      {
        onSuccess: () => {
          sounds.purchase();
          toast({ title: "Achat réussi !", description: `Tu as obtenu : ${name}` });
          queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        },
        onError: (error: any) => {
          sounds.fail();
          toast({
            variant: "destructive",
            title: "Achat impossible",
            description: error.message || "Tu n'as pas assez de pièces.",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!items || !inventory) return null;

  const filteredItems =
    activeCategory === "all" ? items : items.filter((item) => item.category === activeCategory);

  const myCoins = user?.coins || 0;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-3 rounded-2xl">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Boutique</h1>
            <p className="text-muted-foreground">Dépense tes pièces pour t'améliorer</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-muted p-4 rounded-xl border border-border/50">
          <span className="font-medium text-muted-foreground">Ton solde :</span>
          <div className="flex items-center gap-2 text-2xl font-black text-yellow-500">
            {myCoins} <Coins className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredItems.map((item) => {
            const isOwned = inventory.some((inv) => inv.shopItemId === item.id);
            const canAfford = myCoins >= item.price;
            const isLegendary = item.rarity === "legendary";

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`flex flex-col h-full overflow-hidden border transition-all hover:shadow-lg ${
                    isLegendary
                      ? "border-yellow-400/50 shadow-yellow-500/10"
                      : "border-border"
                  } ${isOwned ? "opacity-80" : ""}`}
                >
                  {/* Item visual */}
                  <div
                    className={`h-32 flex items-center justify-center text-6xl relative overflow-hidden ${
                      isLegendary
                        ? "bg-gradient-to-br from-yellow-500/20 to-amber-500/20"
                        : "bg-muted/50"
                    }`}
                  >
                    <span>{item.icon || "🎁"}</span>
                    {isLegendary && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 text-xs">
                          Légendaire
                        </Badge>
                      </div>
                    )}
                    {isOwned && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <Check className="w-10 h-10 text-green-500" />
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-1 pt-3 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{item.name}</CardTitle>
                      <div className="flex items-center gap-1 text-yellow-500 font-bold shrink-0">
                        {item.price} 🪙
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {item.description}
                    </p>
                    {item.statBonus && (
                      <Badge
                        variant="secondary"
                        className="bg-green-500/10 text-green-700 border-green-500/20 text-xs"
                      >
                        Bonus : +{item.statBonus}
                      </Badge>
                    )}
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    {isOwned ? (
                      <Button
                        variant="secondary"
                        className="w-full bg-green-500/10 text-green-700 hover:bg-green-500/20"
                        disabled
                      >
                        <Check className="mr-2 h-4 w-4" /> Possédé
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${
                          isLegendary
                            ? "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0"
                            : ""
                        }`}
                        disabled={!canAfford || purchase.isPending}
                        onClick={() => handlePurchase(item.id, item.name)}
                        data-testid={`btn-buy-${item.id}`}
                      >
                        {purchase.isPending &&
                        (purchase.variables as any)?.data?.shopItemId === item.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : !canAfford ? (
                          "Fonds insuffisants"
                        ) : (
                          "Acheter"
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-dashed border-border/50">
            <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Aucun objet disponible dans cette catégorie.</p>
          </div>
        )}
      </div>
    </div>
  );
}
