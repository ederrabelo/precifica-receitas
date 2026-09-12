import type {
  Ingredient,
  PackagingCost,
  Unit,
} from '../types'

type UnitGroup = 'weight' | 'volume' | 'unit'

const getUnitGroup = (unit: Unit): UnitGroup => {
  if (unit === 'g' || unit === 'kg') {
    return 'weight'
  }

  if (unit === 'ml' || unit === 'l') {
    return 'volume'
  }

  return 'unit'
}

const toBaseUnit = (
  quantity: number,
  unit: Unit,
): number => {
  switch (unit) {
    case 'kg':
      return quantity * 1000

    case 'l':
      return quantity * 1000

    default:
      return quantity
  }
}

export const calculateIngredientCost = (
  ingredient: Ingredient,
): number => {
  if (
    ingredient.purchaseQuantity <= 0 ||
    ingredient.purchasePrice <= 0 ||
    ingredient.usedQuantity <= 0
  ) {
    return 0
  }

  if (
    getUnitGroup(ingredient.purchaseUnit) !==
    getUnitGroup(ingredient.usedUnit)
  ) {
    return 0
  }

  const purchasedAmount = toBaseUnit(
    ingredient.purchaseQuantity,
    ingredient.purchaseUnit,
  )

  const usedAmount = toBaseUnit(
    ingredient.usedQuantity,
    ingredient.usedUnit,
  )

  const costPerUnit =
    ingredient.purchasePrice / purchasedAmount

  return costPerUnit * usedAmount
}

export const calculateIngredientsCost = (
  ingredients: Ingredient[],
): number => {
  return ingredients.reduce(
    (total, ingredient) =>
      total + calculateIngredientCost(ingredient),
    0,
  )
}

export const calculatePackagingCost = (
  packaging: PackagingCost,
): number => {
  if (
    packaging.purchaseQuantity <= 0 ||
    packaging.purchasePrice <= 0 ||
    packaging.usedQuantity <= 0
  ) {
    return 0
  }

  const costPerPackage =
    packaging.purchasePrice /
    packaging.purchaseQuantity

  return costPerPackage * packaging.usedQuantity
}

export const calculateTotalCost = (
  ingredients: Ingredient[],
  packaging?: PackagingCost,
): number => {
  const ingredientsCost =
    calculateIngredientsCost(ingredients)

  const packagingCost = packaging
    ? calculatePackagingCost(packaging)
    : 0

  return ingredientsCost + packagingCost
}

export const calculateSuggestedPrice = (
  cost: number,
  marginPercentage: number,
): number => {
  if (
    cost <= 0 ||
    marginPercentage < 0 ||
    marginPercentage >= 100
  ) {
    return 0
  }

  return cost / (1 - marginPercentage / 100)
}

export const calculateProfit = (
  cost: number,
  price: number,
): number => {
  return price - cost
}

export const calculateUnitValue = (
  total: number,
  quantity: number,
): number => {
  if (quantity <= 0) {
    return 0
  }

  return total / quantity
}

export const calculateMargin = (
  cost: number,
  revenue: number,
): number => {
  if (revenue <= 0) {
    return 0
  }

  return ((revenue - cost) / revenue) * 100
}

export const formatCurrency = (
  value: number,
): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const formatPercentage = (
  value: number,
): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}