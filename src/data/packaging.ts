import type { Category, CategoryPackagingLine, PackagingSupply } from "../domain/types";
import { CATEGORIES } from "../domain/types";

export const seedPackagingSupplies: PackagingSupply[] = [
  {
    id: "pkg-ingredient-label",
    name: "2×3 Ingredient Label",
    packPrice: 7.99,
    packQty: 500,
    notes: "Roll of 500",
  },
  {
    id: "pkg-brand-label-rounded",
    name: "Thermal Brand Label (Rounded)",
    packPrice: 12.99,
    packQty: 150,
    notes: "Roll of 150",
  },
  {
    id: "pkg-brand-label-square",
    name: "Thermal Brand Label (Square)",
    packPrice: 12.99,
    packQty: 150,
    notes: "Roll of 150",
  },
  {
    id: "pkg-cookie-bag",
    name: "Cookie Bag",
    packPrice: 9.99,
    packQty: 200,
    notes: "200 ct",
  },
  {
    id: "pkg-cake-box",
    name: "Cake Box",
    packPrice: 32.39,
    packQty: 100,
    notes: "100 ct",
  },
];

const COOKIE_KIT: Array<{ supplyId: string; sort: number }> = [
  { supplyId: "pkg-cookie-bag", sort: 0 },
  { supplyId: "pkg-brand-label-rounded", sort: 1 },
  { supplyId: "pkg-ingredient-label", sort: 2 },
];

const BOX_KIT: Array<{ supplyId: string; sort: number }> = [
  { supplyId: "pkg-cake-box", sort: 0 },
  { supplyId: "pkg-brand-label-square", sort: 1 },
  { supplyId: "pkg-ingredient-label", sort: 2 },
];

function kitFor(category: Category): Array<{ supplyId: string; sort: number }> {
  return category === "dough" ? COOKIE_KIT : BOX_KIT;
}

export const seedCategoryPackaging: CategoryPackagingLine[] = CATEGORIES.flatMap((category) =>
  kitFor(category).map((line) => ({
    category,
    supplyId: line.supplyId,
    qtyPerUnit: 1,
    sort: line.sort,
  }))
);
