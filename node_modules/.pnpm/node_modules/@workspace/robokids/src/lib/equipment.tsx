import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface EquippedItems {
  skinId: number | null;   // covers both mascots + skins — changes the player character
  weaponId: number | null; // changes attack animation
  boostId: number | null;  // active boost
}

export interface EquipmentContextValue {
  equipped: EquippedItems;
  equip: (slot: keyof EquippedItems, itemId: number | null) => void;
  isEquipped: (itemId: number) => boolean;
  getWeaponType: () => "sword" | "gun" | "wand" | null;
  getSkinSlot: (category: string) => keyof EquippedItems | null;
}

const DEFAULT: EquippedItems = {
  skinId: null,
  weaponId: null,
  boostId: null,
};

const STORAGE_KEY = "mosaicinic_equipped";

const EquipmentContext = createContext<EquipmentContextValue>({
  equipped: DEFAULT,
  equip: () => {},
  isEquipped: () => false,
  getWeaponType: () => null,
  getSkinSlot: () => null,
});

export function EquipmentProvider({ children, userId }: { children: React.ReactNode; userId?: number }) {
  const storageKey = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;

  const [equipped, setEquipped] = useState<EquippedItems>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? { ...DEFAULT, ...JSON.parse(stored) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  useEffect(() => {
    if (!userId) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      setEquipped(stored ? { ...DEFAULT, ...JSON.parse(stored) } : DEFAULT);
    } catch {
      setEquipped(DEFAULT);
    }
  }, [userId]);

  const equip = useCallback((slot: keyof EquippedItems, itemId: number | null) => {
    setEquipped((prev) => {
      const next = { ...prev, [slot]: itemId };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const isEquipped = useCallback((itemId: number) => {
    return Object.values(equipped).includes(itemId);
  }, [equipped]);

  const getWeaponType = useCallback((): "sword" | "gun" | "wand" | null => {
    if (!equipped.weaponId) return null;
    const id = equipped.weaponId;
    // IDs 19-22 are weapons: 19=sword, 20=plasma shield, 21=bomb, 22=bow
    if (id === 21 || id === 22) return "gun";
    if (id === 20) return "wand";
    return "sword";
  }, [equipped]);

  // Map shop item category → equipment slot
  const getSkinSlot = useCallback((category: string): keyof EquippedItems | null => {
    if (category === "skin" || category === "mascot") return "skinId";
    if (category === "weapon") return "weaponId";
    if (category === "boost") return "boostId";
    return null;
  }, []);

  return (
    <EquipmentContext.Provider value={{ equipped, equip, isEquipped, getWeaponType, getSkinSlot }}>
      {children}
    </EquipmentContext.Provider>
  );
}

export function useEquipment() {
  return useContext(EquipmentContext);
}
