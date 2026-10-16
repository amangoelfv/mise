"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CatalogDish } from "@/lib/catalog";
import { DishInput } from "../dish-input";

export function ClosingAsk({ catalog }: { catalog: CatalogDish[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  return (
    <DishInput
      value={value}
      onChange={setValue}
      onSubmit={(dish) => router.push(`/app?q=${encodeURIComponent(dish)}`)}
      catalog={catalog}
    />
  );
}
