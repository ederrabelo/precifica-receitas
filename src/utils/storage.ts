import type {
  PackagingCost,
  Recipe,
} from '../types'

const STORAGE_KEY = 'precifica:recipes'

const emptyPackaging: PackagingCost = {
  purchaseQuantity: 0,
  purchasePrice: 0,
  usedQuantity: 0,
}

const normalizeRecipe = (
  recipe: Partial<Recipe>,
): Recipe => {
  const now = new Date().toISOString()

  return {
    id: recipe.id ?? crypto.randomUUID(),

    name: recipe.name ?? 'Receita sem nome',

    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : [],

    packaging: {
      ...emptyPackaging,
      ...(recipe.packaging ?? {}),
    },

    yieldQuantity:
      typeof recipe.yieldQuantity === 'number' &&
      recipe.yieldQuantity > 0
        ? recipe.yieldQuantity
        : 1,

    salePricePerUnit:
      typeof recipe.salePricePerUnit === 'number'
        ? recipe.salePricePerUnit
        : 0,

    margin:
      typeof recipe.margin === 'number'
        ? recipe.margin
        : 50,

    createdAt:
      recipe.createdAt ?? now,

    updatedAt:
      recipe.updatedAt ?? now,
  }
}

export const getSavedRecipes = (): Recipe[] => {
  try {
    const storedRecipes =
      localStorage.getItem(STORAGE_KEY)

    if (!storedRecipes) {
      return []
    }

    const parsedRecipes =
      JSON.parse(storedRecipes)

    if (!Array.isArray(parsedRecipes)) {
      return []
    }

    return parsedRecipes
      .map((recipe) =>
        normalizeRecipe(recipe),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime(),
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