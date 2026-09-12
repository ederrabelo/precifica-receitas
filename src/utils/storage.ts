import type {
  Ingredient,
  PackagingCost,
  Recipe,
  Unit,
} from '../types'

const STORAGE_KEY = 'precifica:recipes'

const validUnits: Unit[] = [
  'g',
  'kg',
  'ml',
  'l',
  'un',
]

const emptyPackaging: PackagingCost = {
  purchaseQuantity: 0,
  purchasePrice: 0,
  usedQuantity: 0,
}

const isRecord = (
  value: unknown,
): value is Record<string, unknown> => {
  return (
    typeof value === 'object' &&
    value !== null
  )
}

const isUnit = (
  value: unknown,
): value is Unit => {
  return (
    typeof value === 'string' &&
    validUnits.includes(value as Unit)
  )
}

const toNonNegativeNumber = (
  value: unknown,
): number => {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0
  )
    ? value
    : 0
}

const toPositiveInteger = (
  value: unknown,
  fallback: number,
): number => {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0
  )
    ? value
    : fallback
}

const toMargin = (
  value: unknown,
): number => {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value < 100
  )
    ? value
    : 50
}

const toDateString = (
  value: unknown,
  fallback: string,
): string => {
  if (typeof value !== 'string') {
    return fallback
  }

  return Number.isNaN(
    new Date(value).getTime(),
  )
    ? fallback
    : value
}

const normalizeIngredient = (
  value: unknown,
): Ingredient | null => {
  if (!isRecord(value)) {
    return null
  }

  const purchaseUnit = isUnit(
    value.purchaseUnit,
  )
    ? value.purchaseUnit
    : null

  const usedUnit = isUnit(
    value.usedUnit,
  )
    ? value.usedUnit
    : null

  if (!purchaseUnit || !usedUnit) {
    return null
  }

  return {
    id:
      typeof value.id === 'string' &&
      value.id.trim()
        ? value.id
        : crypto.randomUUID(),

    name:
      typeof value.name === 'string'
        ? value.name
        : '',

    purchaseQuantity:
      toNonNegativeNumber(
        value.purchaseQuantity,
      ),

    purchaseUnit,

    purchasePrice:
      toNonNegativeNumber(
        value.purchasePrice,
      ),

    usedQuantity:
      toNonNegativeNumber(
        value.usedQuantity,
      ),

    usedUnit,
  }
}

const normalizePackaging = (
  value: unknown,
): PackagingCost => {
  if (!isRecord(value)) {
    return {
      ...emptyPackaging,
    }
  }

  return {
    purchaseQuantity:
      toNonNegativeNumber(
        value.purchaseQuantity,
      ),

    purchasePrice:
      toNonNegativeNumber(
        value.purchasePrice,
      ),

    usedQuantity:
      toNonNegativeNumber(
        value.usedQuantity,
      ),
  }
}

const normalizeRecipe = (
  value: unknown,
): Recipe | null => {
  if (!isRecord(value)) {
    return null
  }

  const now = new Date().toISOString()

  const ingredients =
    Array.isArray(value.ingredients)
      ? value.ingredients
          .map(normalizeIngredient)
          .filter(
            (
              ingredient,
            ): ingredient is Ingredient =>
              ingredient !== null,
          )
      : []

  return {
    id:
      typeof value.id === 'string' &&
      value.id.trim()
        ? value.id
        : crypto.randomUUID(),

    name:
      typeof value.name === 'string'
        ? value.name
        : 'Receita sem nome',

    ingredients,

    packaging:
      normalizePackaging(
        value.packaging,
      ),

    yieldQuantity:
      toPositiveInteger(
        value.yieldQuantity,
        1,
      ),

    salePricePerUnit:
      toNonNegativeNumber(
        value.salePricePerUnit,
      ),

    margin:
      toMargin(value.margin),

    createdAt:
      toDateString(
        value.createdAt,
        now,
      ),

    updatedAt:
      toDateString(
        value.updatedAt,
        now,
      ),
  }
}

export const getSavedRecipes = (): Recipe[] => {
  try {
    const storedRecipes =
      localStorage.getItem(STORAGE_KEY)

    if (!storedRecipes) {
      return []
    }

    const parsedRecipes: unknown =
      JSON.parse(storedRecipes)

    if (!Array.isArray(parsedRecipes)) {
      return []
    }

    return parsedRecipes
      .map(normalizeRecipe)
      .filter(
        (
          recipe,
        ): recipe is Recipe =>
          recipe !== null,
      )
      .sort(
        (a, b) =>
          new Date(
            b.updatedAt,
          ).getTime() -
          new Date(
            a.updatedAt,
          ).getTime(),
      )
  } catch {
    return []
  }
}

export const saveRecipeToStorage = (
  recipe: Recipe,
): Recipe[] => {
  const recipes = getSavedRecipes()

  const recipesWithoutCurrent =
    recipes.filter(
      (savedRecipe) =>
        savedRecipe.id !== recipe.id,
    )

  const updatedRecipes = [
    recipe,
    ...recipesWithoutCurrent,
  ]

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedRecipes),
  )

  return updatedRecipes
}

export const deleteRecipeFromStorage = (
  recipeId: string,
): Recipe[] => {
  const recipes = getSavedRecipes()

  const updatedRecipes =
    recipes.filter(
      (recipe) =>
        recipe.id !== recipeId,
    )

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedRecipes),
  )

  return updatedRecipes
}
