export type Unit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'un'

export interface Ingredient {
  id: string
  name: string
  purchaseQuantity: number
  purchaseUnit: Unit
  purchasePrice: number
  usedQuantity: number
  usedUnit: Unit
}

export interface PackagingCost {
  purchaseQuantity: number
  purchasePrice: number
  usedQuantity: number
}

export interface Recipe {
  id: string
  name: string
  ingredients: Ingredient[]
  packaging: PackagingCost
  yieldQuantity: number
  salePricePerUnit: number
  margin: number
  createdAt: string
  updatedAt: string
}
