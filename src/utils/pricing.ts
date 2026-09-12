import type {
  Ingredient,
  PackagingCost,
  Unit,
} from '../types'

type UnitGroup = 'weight' | 'volume' | 'unit'

const MONEY_SCALE = 100
const FLOAT_TOLERANCE_FACTOR = 8

const getScaledTolerance = (
  scaledValue: number,
): number => {
  return (
    Number.EPSILON *
    Math.max(1, Math.abs(scaledValue)) *
    FLOAT_TOLERANCE_FACTOR
  )
}

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

export const roundCurrency = (
  value: number,
): number => {
  if (!Number.isFinite(value)) {
    return 0
  }

  const sign = value < 0 ? -1 : 1
  const scaledValue =
    Math.abs(value) * MONEY_SCALE

  const tolerance =
    getScaledTolerance(scaledValue)

  return (
    sign *
    Math.round(
      scaledValue + tolerance,
    ) /
    MONEY_SCALE
  )
}

const roundCurrencyUp = (
  value: number,
): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }

  const scaledValue =
    value * MONEY_SCALE

  const tolerance =
    getScaledTolerance(scaledValue)

  return (
    Math.ceil(
      scaledValue - tolerance,
    ) / MONEY_SCALE
  )
}

export const calculateIngredientCost = (
  ingredient: Ingredient,
): number => {
  if (
    !Number.isFinite(
      ingredient.purchaseQuantity,
    ) ||
    !Number.isFinite(
      ingredient.purchasePrice,
    ) ||
    !Number.isFinite(
      ingredient.usedQuantity,
    ) ||
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

  if (
    !Number.isFinite(purchasedAmount) ||
    !Number.isFinite(usedAmount) ||
    purchasedAmount <= 0 ||
    usedAmount <= 0
  ) {
    return 0
  }

  const costPerBaseUnit =
    ingredient.purchasePrice /
    purchasedAmount

  return roundCurrency(
    costPerBaseUnit * usedAmount,
  )
}

export const calculateIngredientsCost = (
  ingredients: Ingredient[],
): number => {
  return roundCurrency(
    ingredients.reduce(
      (total, ingredient) =>
        total +
        calculateIngredientCost(ingredient),
      0,
    ),
  )
}

export const calculatePackagingCost = (
  packaging: PackagingCost,
): number => {
  if (
    !Number.isFinite(
      packaging.purchaseQuantity,
    ) ||
    !Number.isFinite(
      packaging.purchasePrice,
    ) ||
    !Number.isFinite(
      packaging.usedQuantity,
    ) ||
    !Number.isInteger(
      packaging.purchaseQuantity,
    ) ||
    !Number.isInteger(
      packaging.usedQuantity,
    ) ||
    packaging.purchaseQuantity <= 0 ||
    packaging.purchasePrice <= 0 ||
    packaging.usedQuantity <= 0
  ) {
    return 0
  }

  const costPerPackage =
    packaging.purchasePrice /
    packaging.purchaseQuantity

  return roundCurrency(
    costPerPackage *
      packaging.usedQuantity,
  )
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

  return roundCurrency(
    ingredientsCost + packagingCost,
  )
}

export const calculateSuggestedPrice = (
  cost: number,
  marginPercentage: number,
): number => {
  if (
    !Number.isFinite(cost) ||
    !Number.isFinite(
      marginPercentage,
    ) ||
    cost <= 0 ||
    marginPercentage < 0 ||
    marginPercentage >= 100
  ) {
    return 0
  }

  const exactPrice =
    cost /
    (1 - marginPercentage / 100)

  return roundCurrencyUp(exactPrice)
}

export const calculateSuggestedUnitPrice = (
  cost: number,
  marginPercentage: number,
  quantity: number,
): number => {
  if (
    !Number.isFinite(cost) ||
    !Number.isFinite(
      marginPercentage,
    ) ||
    !Number.isInteger(quantity) ||
    cost <= 0 ||
    quantity <= 0 ||
    marginPercentage < 0 ||
    marginPercentage >= 100
  ) {
    return 0
  }

  const exactTotalPrice =
    cost /
    (1 - marginPercentage / 100)

  const exactUnitPrice =
    exactTotalPrice / quantity

  return roundCurrencyUp(
    exactUnitPrice,
  )
}

export const calculateRevenue = (
  unitPrice: number,
  quantity: number,
): number => {
  if (
    !Number.isFinite(unitPrice) ||
    !Number.isInteger(quantity) ||
    unitPrice <= 0 ||
    quantity <= 0
  ) {
    return 0
  }

  return roundCurrency(
    unitPrice * quantity,
  )
}

export const calculateProfit = (
  cost: number,
  price: number,
): number => {
  if (
    !Number.isFinite(cost) ||
    !Number.isFinite(price)
  ) {
    return 0
  }

  return roundCurrency(
    price - cost,
  )
}

export const calculateUnitValue = (
  total: number,
  quantity: number,
): number => {
  if (
    !Number.isFinite(total) ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return 0
  }

  return roundCurrency(
    total / quantity,
  )
}

export const calculateMargin = (
  cost: number,
  revenue: number,
): number => {
  if (
    !Number.isFinite(cost) ||
    !Number.isFinite(revenue) ||
    revenue <= 0
  ) {
    return 0
  }

  return (
    ((revenue - cost) / revenue) *
    100
  )
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
