import { useMemo, useState } from 'react'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import NoteAddRoundedIcon from '@mui/icons-material/NoteAddRounded'
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import type {
  Ingredient,
  PackagingCost,
  Recipe,
  Unit,
} from './types'

import {
  calculateIngredientCost,
  calculateIngredientsCost,
  calculateMargin,
  calculatePackagingCost,
  calculateProfit,
  calculateSuggestedPrice,
  calculateTotalCost,
  calculateUnitValue,
  formatCurrency,
  formatPercentage,
} from './utils/pricing'

import {
  deleteRecipeFromStorage,
  getSavedRecipes,
  saveRecipeToStorage,
} from './utils/storage'

const units: Array<{
  value: Unit
  label: string
}> = [
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'L' },
  { value: 'un', label: 'un' },
]

const marginOptions = [20, 30, 40, 50]

const createIngredient = (): Ingredient => ({
  id: crypto.randomUUID(),
  name: '',
  purchaseQuantity: 0,
  purchaseUnit: 'g',
  purchasePrice: 0,
  usedQuantity: 0,
  usedUnit: 'g',
})

const createPackaging = (): PackagingCost => ({
  purchaseQuantity: 0,
  purchasePrice: 0,
  usedQuantity: 0,
})

const getDefaultUsedUnit = (unit: Unit): Unit => {
  switch (unit) {
    case 'kg':
      return 'g'
    case 'l':
      return 'ml'
    case 'un':
      return 'un'
    default:
      return unit
  }
}

const formatCurrencyInput = (value: number): string => {
  if (!value) {
    return ''
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const parseCurrencyInput = (value: string): number => {
  const digits = value.replace(/\D/g, '')

  if (!digits) {
    return 0
  }

  return Number(digits) / 100
}

const formatSavedDate = (value: string): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

const scrollToSection = (id: string) => {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}

const cloneRecipe = (recipe: Recipe): Recipe => ({
  ...recipe,

  ingredients: recipe.ingredients.map((ingredient) => ({
    ...ingredient,
  })),

  packaging: {
    ...recipe.packaging,
  },
})

function App() {
  const [recipeName, setRecipeName] = useState('')

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    createIngredient(),
  ])

  const [packaging, setPackaging] = useState<PackagingCost>(
    createPackaging(),
  )

  const [yieldQuantity, setYieldQuantity] = useState(1)
  const [salePricePerUnit, setSalePricePerUnit] = useState(0)
  const [margin, setMargin] = useState(50)

  const [currentRecipeId, setCurrentRecipeId] =
    useState<string | null>(null)

  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(
    () => getSavedRecipes(),
  )

  const [feedbackMessage, setFeedbackMessage] = useState('')

  const ingredientsCost = useMemo(
    () => calculateIngredientsCost(ingredients),
    [ingredients],
  )

  const packagingCost = useMemo(
    () => calculatePackagingCost(packaging),
    [packaging],
  )

  const totalCost = useMemo(
    () => calculateTotalCost(ingredients, packaging),
    [ingredients, packaging],
  )

  const safeYield = yieldQuantity > 0 ? yieldQuantity : 1

  const unitCost = calculateUnitValue(
    totalCost,
    safeYield,
  )

  const suggestedTotalPrice = useMemo(
    () => calculateSuggestedPrice(totalCost, margin),
    [totalCost, margin],
  )

  const suggestedUnitPrice = calculateUnitValue(
    suggestedTotalPrice,
    safeYield,
  )

  const suggestedProfit = calculateProfit(
    totalCost,
    suggestedTotalPrice,
  )

  const suggestedProfitPerUnit = calculateUnitValue(
    suggestedProfit,
    safeYield,
  )

  const currentRevenue =
    salePricePerUnit * safeYield

  const currentProfit = calculateProfit(
    totalCost,
    currentRevenue,
  )

  const currentMargin = calculateMargin(
    totalCost,
    currentRevenue,
  )

  const savedRecipe = useMemo(
    () =>
      savedRecipes.find(
        (recipe) => recipe.id === currentRecipeId,
      ) ?? null,
    [savedRecipes, currentRecipeId],
  )

  const hasUnsavedChanges = useMemo(() => {
    if (!savedRecipe) {
      return false
    }

    return (
      recipeName !== savedRecipe.name ||
      JSON.stringify(ingredients) !==
        JSON.stringify(savedRecipe.ingredients) ||
      JSON.stringify(packaging) !==
        JSON.stringify(savedRecipe.packaging) ||
      yieldQuantity !== savedRecipe.yieldQuantity ||
      salePricePerUnit !== savedRecipe.salePricePerUnit ||
      margin !== savedRecipe.margin
    )
  }, [
    savedRecipe,
    recipeName,
    ingredients,
    packaging,
    yieldQuantity,
    salePricePerUnit,
    margin,
  ])

  const hasNewRecipeData = useMemo(() => {
    if (currentRecipeId) {
      return false
    }

    const hasIngredientData = ingredients.some(
      (ingredient) =>
        ingredient.name.trim() !== '' ||
        ingredient.purchaseQuantity > 0 ||
        ingredient.purchasePrice > 0 ||
        ingredient.usedQuantity > 0,
    )

    const hasPackagingData =
      packaging.purchaseQuantity > 0 ||
      packaging.purchasePrice > 0 ||
      packaging.usedQuantity > 0

    return (
      recipeName.trim() !== '' ||
      hasIngredientData ||
      hasPackagingData ||
      yieldQuantity !== 1 ||
      salePricePerUnit > 0 ||
      margin !== 50
    )
  }, [
    currentRecipeId,
    recipeName,
    ingredients,
    packaging,
    yieldQuantity,
    salePricePerUnit,
    margin,
  ])

  const showFloatingActions =
    hasNewRecipeData ||
    Boolean(savedRecipe && hasUnsavedChanges)

  const updateIngredient = <K extends keyof Ingredient>(
    id: string,
    field: K,
    value: Ingredient[K],
  ) => {
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.id === id
          ? {
              ...ingredient,
              [field]: value,
            }
          : ingredient,
      ),
    )
  }

  const updatePurchaseUnit = (
    id: string,
    purchaseUnit: Unit,
  ) => {
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.id === id
          ? {
              ...ingredient,
              purchaseUnit,
              usedUnit: getDefaultUsedUnit(purchaseUnit),
            }
          : ingredient,
      ),
    )
  }

  const addIngredient = () => {
    setIngredients((current) => [
      ...current,
      createIngredient(),
    ])
  }

  const removeIngredient = (id: string) => {
    setIngredients((current) => {
      if (current.length === 1) {
        return current
      }

      return current.filter(
        (ingredient) => ingredient.id !== id,
      )
    })
  }

  const newRecipe = () => {
    setRecipeName('')
    setIngredients([createIngredient()])
    setPackaging(createPackaging())
    setYieldQuantity(1)
    setSalePricePerUnit(0)
    setMargin(50)
    setCurrentRecipeId(null)

    scrollToSection('recipe-section')
  }

  const saveRecipe = () => {
    const name = recipeName.trim()

    if (!name) {
      setFeedbackMessage('Informe o nome da receita.')
      return
    }

    const now = new Date().toISOString()

    const existingRecipe = savedRecipes.find(
      (recipe) => recipe.id === currentRecipeId,
    )

    const recipe: Recipe = {
      id: currentRecipeId ?? crypto.randomUUID(),
      name,

      ingredients: ingredients.map((ingredient) => ({
        ...ingredient,
      })),

      packaging: {
        ...packaging,
      },

      yieldQuantity: safeYield,
      salePricePerUnit,
      margin,

      createdAt:
        existingRecipe?.createdAt ?? now,

      updatedAt: now,
    }

    const updatedRecipes =
      saveRecipeToStorage(recipe)

    setSavedRecipes(updatedRecipes)
    setCurrentRecipeId(recipe.id)

    setFeedbackMessage(
      existingRecipe
        ? 'Receita atualizada.'
        : 'Receita salva neste dispositivo.',
    )

    scrollToSection('saved-recipes-section')
  }

  const loadRecipe = (recipe: Recipe) => {
    const snapshot = cloneRecipe(recipe)

    setCurrentRecipeId(snapshot.id)
    setRecipeName(snapshot.name)

    setIngredients(
      snapshot.ingredients.map((ingredient) => ({
        ...ingredient,
      })),
    )

    setPackaging({
      ...snapshot.packaging,
    })

    setYieldQuantity(snapshot.yieldQuantity)
    setSalePricePerUnit(snapshot.salePricePerUnit)
    setMargin(snapshot.margin)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const undoChanges = () => {
    if (!savedRecipe) {
      return
    }

    const snapshot = cloneRecipe(savedRecipe)

    setRecipeName(snapshot.name)

    setIngredients(
      snapshot.ingredients.map((ingredient) => ({
        ...ingredient,
      })),
    )

    setPackaging({
      ...snapshot.packaging,
    })

    setYieldQuantity(snapshot.yieldQuantity)
    setSalePricePerUnit(snapshot.salePricePerUnit)
    setMargin(snapshot.margin)

    setFeedbackMessage(
      'Alterações desfeitas. A receita voltou ao último estado salvo.',
    )
  }

  const duplicateRecipe = (recipe: Recipe) => {
    const now = new Date().toISOString()

    const duplicatedRecipe: Recipe = {
      ...recipe,

      id: crypto.randomUUID(),

      name: `${recipe.name} - cópia`,

      ingredients: recipe.ingredients.map(
        (ingredient) => ({
          ...ingredient,
          id: crypto.randomUUID(),
        }),
      ),

      packaging: {
        ...recipe.packaging,
      },

      createdAt: now,
      updatedAt: now,
    }

    const updatedRecipes =
      saveRecipeToStorage(duplicatedRecipe)

    setSavedRecipes(updatedRecipes)
    loadRecipe(duplicatedRecipe)

    setFeedbackMessage(
      'Receita duplicada. Você já pode alterar a cópia.',
    )
  }

  const deleteRecipe = (recipeId: string) => {
    const updatedRecipes =
      deleteRecipeFromStorage(recipeId)

    setSavedRecipes(updatedRecipes)

    if (currentRecipeId === recipeId) {
      newRecipe()
    }

    setFeedbackMessage('Receita excluída.')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: {
          xs: 3,
          md: 6,
        },
        pb: showFloatingActions
          ? {
              xs: 28,
              sm: 22,
            }
          : {
              xs: 3,
              md: 6,
            },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: {
                xs: 'column',
                sm: 'row',
              },
              justifyContent: 'space-between',
              alignItems: {
                xs: 'flex-start',
                sm: 'center',
              },
              gap: 2,
            }}
          >
            <Stack spacing={1}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 3,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary.contrastText',
                  }}
                >
                  <RestaurantMenuRoundedIcon />
                </Box>

                <Typography variant="h4">
                  Precifica
                </Typography>
              </Box>

              <Typography color="text.secondary">
                Calcule o custo, encontre o preço ideal e veja
                quanto realmente sobra em cada venda.
              </Typography>
            </Stack>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Button
                variant="outlined"
                startIcon={<NoteAddRoundedIcon />}
                onClick={newRecipe}
              >
                Nova receita
              </Button>

            </Box>
          </Box>

          <Paper
            id="saved-recipes-section"
            variant="outlined"
            sx={{
              p: {
                xs: 2,
                md: 3,
              },
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">
                  Abrir receitas
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Suas receitas ficam salvas neste dispositivo e
                  podem ser abertas, duplicadas ou excluídas.
                </Typography>
              </Box>

              {savedRecipes.length > 0 ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, minmax(0, 1fr))',
                      md: 'repeat(3, minmax(0, 1fr))',
                    },
                    gap: 1.5,
                  }}
                >
                  {savedRecipes.map((recipe) => (
                    <SavedRecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      selected={
                        currentRecipeId === recipe.id
                      }
                      onOpen={() =>
                        loadRecipe(recipe)
                      }
                      onDuplicate={() =>
                        duplicateRecipe(recipe)
                      }
                      onDelete={() =>
                        deleteRecipe(recipe.id)
                      }
                    />
                  ))}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Nenhuma receita salva ainda. Preencha sua primeira
                  receita e salve ao final do cálculo.
                </Typography>
              )}
            </Stack>
          </Paper>

          <Paper
            id="recipe-section"
            variant="outlined"
            sx={{
              p: {
                xs: 2,
                md: 3,
              },
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6">
                  1. Receita
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Informe o nome e tudo que é usado para
                  produzir a receita.
                </Typography>
              </Box>

              <TextField
                label="Nome da receita"
                placeholder="Ex.: Bolo de chocolate"
                value={recipeName}
                onChange={(event) =>
                  setRecipeName(event.target.value)
                }
                fullWidth
              />

              <Divider />

              <Stack spacing={2}>
                {ingredients.map(
                  (ingredient, index) => {
                    const ingredientCost =
                      calculateIngredientCost(
                        ingredient,
                      )

                    return (
                      <Paper
                        key={ingredient.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: 'grey.50',
                        }}
                      >
                        <Stack spacing={2}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 2,
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 600,
                              }}
                            >
                              {ingredient.name.trim() ||
                                `Ingrediente ${index + 1}`}
                            </Typography>

                            {ingredientCost > 0 && (
                              <Chip
                                size="small"
                                label={formatCurrency(
                                  ingredientCost,
                                )}
                                color="primary"
                                variant="outlined"
                              />
                            )}

                            <IconButton
                              size="small"
                              color="error"
                              disabled={
                                ingredients.length === 1
                              }
                              onClick={() =>
                                removeIngredient(
                                  ingredient.id,
                                )
                              }
                              aria-label="Excluir ingrediente"
                            >
                              <DeleteOutlineRoundedIcon />
                            </IconButton>
                          </Box>

                          <Box
                            sx={{
                              display: 'grid',

                              gridTemplateColumns: {
                                xs: '1fr',

                                sm: 'repeat(2, minmax(0, 1fr))',

                                md:
                                  '2fr 1fr 100px 1fr 1fr 100px',
                              },

                              gap: 1.5,
                            }}
                          >
                            <TextField
                              label="Produto"
                              placeholder="Farinha"
                              value={ingredient.name}
                              onChange={(event) =>
                                updateIngredient(
                                  ingredient.id,
                                  'name',
                                  event.target.value,
                                )
                              }
                            />

                            <TextField
                              label="Qtd. comprada"
                              type="number"
                              value={
                                ingredient.purchaseQuantity ||
                                ''
                              }
                              onChange={(event) =>
                                updateIngredient(
                                  ingredient.id,
                                  'purchaseQuantity',
                                  Number(
                                    event.target.value,
                                  ),
                                )
                              }
                              slotProps={{
                                htmlInput: {
                                  min: 0,
                                  step: 'any',
                                },
                              }}
                            />

                            <TextField
                              select
                              label="Unidade"
                              value={
                                ingredient.purchaseUnit
                              }
                              onChange={(event) =>
                                updatePurchaseUnit(
                                  ingredient.id,
                                  event.target.value as Unit,
                                )
                              }
                            >
                              {units.map((unit) => (
                                <MenuItem
                                  key={unit.value}
                                  value={unit.value}
                                >
                                  {unit.label}
                                </MenuItem>
                              ))}
                            </TextField>

                            <TextField
                              label="Valor pago"
                              value={formatCurrencyInput(
                                ingredient.purchasePrice,
                              )}
                              onChange={(event) =>
                                updateIngredient(
                                  ingredient.id,
                                  'purchasePrice',
                                  parseCurrencyInput(
                                    event.target.value,
                                  ),
                                )
                              }
                              slotProps={{
                                htmlInput: {
                                  inputMode: 'numeric',
                                },
                              }}
                            />

                            <TextField
                              label="Qtd. usada"
                              type="number"
                              value={
                                ingredient.usedQuantity ||
                                ''
                              }
                              onChange={(event) =>
                                updateIngredient(
                                  ingredient.id,
                                  'usedQuantity',
                                  Number(
                                    event.target.value,
                                  ),
                                )
                              }
                              slotProps={{
                                htmlInput: {
                                  min: 0,
                                  step: 'any',
                                },
                              }}
                            />

                            <TextField
                              select
                              label="Unidade"
                              value={
                                ingredient.usedUnit
                              }
                              onChange={(event) =>
                                updateIngredient(
                                  ingredient.id,
                                  'usedUnit',
                                  event.target.value as Unit,
                                )
                              }
                            >
                              {units.map((unit) => (
                                <MenuItem
                                  key={unit.value}
                                  value={unit.value}
                                >
                                  {unit.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Box>
                        </Stack>
                      </Paper>
                    )
                  },
                )}
              </Stack>

              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={addIngredient}
                sx={{
                  alignSelf: 'flex-start',
                }}
              >
                Adicionar ingrediente
              </Button>

              <Divider />

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                }}
              >
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Inventory2OutlinedIcon color="action" />

                    <Typography
                      sx={{
                        fontWeight: 600,
                      }}
                    >
                      Embalagem
                    </Typography>

                    <Chip
                      label="Opcional"
                      size="small"
                      variant="outlined"
                    />

                    {packagingCost > 0 && (
                      <Chip
                        label={formatCurrency(
                          packagingCost,
                        )}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Se houver embalagem, informe quantas
                    comprou, quanto pagou e quantas são usadas
                    nesta receita.
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',

                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(3, minmax(0, 1fr))',
                      },

                      gap: 1.5,
                    }}
                  >
                    <TextField
                      label="Qtd. comprada"
                      type="number"
                      value={
                        packaging.purchaseQuantity ||
                        ''
                      }
                      onChange={(event) =>
                        setPackaging((current) => ({
                          ...current,

                          purchaseQuantity: Number(
                            event.target.value,
                          ),
                        }))
                      }
                      slotProps={{
                        htmlInput: {
                          min: 0,
                          step: 1,
                        },
                      }}
                    />

                    <TextField
                      label="Valor pago"
                      value={formatCurrencyInput(
                        packaging.purchasePrice,
                      )}
                      onChange={(event) =>
                        setPackaging((current) => ({
                          ...current,

                          purchasePrice:
                            parseCurrencyInput(
                              event.target.value,
                            ),
                        }))
                      }
                      slotProps={{
                        htmlInput: {
                          inputMode: 'numeric',
                        },
                      }}
                    />

                    <TextField
                      label="Qtd. usada na receita"
                      type="number"
                      value={
                        packaging.usedQuantity ||
                        ''
                      }
                      onChange={(event) =>
                        setPackaging((current) => ({
                          ...current,

                          usedQuantity: Number(
                            event.target.value,
                          ),
                        }))
                      }
                      slotProps={{
                        htmlInput: {
                          min: 0,
                          step: 1,
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </Paper>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <Box
                  sx={{
                    minWidth: 180,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 4,
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Ingredientes
                    </Typography>

                    <Typography
                      sx={{
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(
                        ingredientsCost,
                      )}
                    </Typography>
                  </Box>

                  {packagingCost > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 4,
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Embalagens
                      </Typography>

                      <Typography
                        sx={{
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(
                          packagingCost,
                        )}
                      </Typography>
                    </Box>
                  )}

                  <Divider
                    sx={{
                      my: 1,
                    }}
                  />

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                      }}
                    >
                      Custo total
                    </Typography>

                    <Typography
                      variant="h6"
                      color="primary"
                    >
                      {formatCurrency(totalCost)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              p: {
                xs: 2,
                md: 3,
              },
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6">
                  2. Produção e venda
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Informe quantas unidades essa receita produz.
                  Se você já cobra um valor, informe também
                  para conferir se o preço está bom.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',

                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                  },

                  gap: 2,
                }}
              >
                <TextField
                  label="Rendimento da receita"
                  helperText="Quantas unidades esta receita produz?"
                  type="number"
                  value={yieldQuantity || ''}
                  onChange={(event) =>
                    setYieldQuantity(
                      Number(event.target.value),
                    )
                  }
                  onBlur={() => {
                    if (yieldQuantity <= 0) {
                      setYieldQuantity(1)
                    }
                  }}
                  slotProps={{
                    htmlInput: {
                      min: 1,
                      step: 1,
                    },
                  }}
                />

                <TextField
                  label="Preço que você cobra por unidade"
                  helperText="Opcional. Serve para conferir seu preço atual."
                  value={formatCurrencyInput(
                    salePricePerUnit,
                  )}
                  onChange={(event) =>
                    setSalePricePerUnit(
                      parseCurrencyInput(
                        event.target.value,
                      ),
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      inputMode: 'numeric',
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',

                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                  },

                  gap: 1.5,
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Custo por unidade
                  </Typography>

                  <Typography variant="h6">
                    {formatCurrency(unitCost)}
                  </Typography>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Rendimento
                  </Typography>

                  <Typography variant="h6">
                    {safeYield}{' '}
                    {safeYield === 1
                      ? 'unidade'
                      : 'unidades'}
                  </Typography>
                </Paper>
              </Box>

              {salePricePerUnit > 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                  }}
                >
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 600,
                          }}
                        >
                          Seu preço atual
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Resultado usando o valor que você
                          informou.
                        </Typography>
                      </Box>

                      <Chip
                        label={
                          currentProfit >= 0
                            ? 'Com lucro'
                            : 'Com prejuízo'
                        }
                        color={
                          currentProfit >= 0
                            ? 'success'
                            : 'error'
                        }
                      />
                    </Box>

                    <Divider />

                    <Box
                      sx={{
                        display: 'grid',

                        gridTemplateColumns: {
                          xs: 'repeat(2, minmax(0, 1fr))',

                          md:
                            'repeat(4, minmax(0, 1fr))',
                        },

                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Preço/unidade
                        </Typography>

                        <Typography
                          sx={{
                            fontWeight: 600,
                          }}
                        >
                          {formatCurrency(
                            salePricePerUnit,
                          )}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Venda total
                        </Typography>

                        <Typography
                          sx={{
                            fontWeight: 600,
                          }}
                        >
                          {formatCurrency(
                            currentRevenue,
                          )}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Lucro total
                        </Typography>

                        <Typography
                          sx={{
                            fontWeight: 600,
                            color:
                              currentProfit < 0
                                ? 'error.main'
                                : 'success.main',
                          }}
                        >
                          {formatCurrency(
                            currentProfit,
                          )}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Margem atual
                        </Typography>

                        <Typography
                          sx={{
                            fontWeight: 600,
                          }}
                        >
                          {formatPercentage(
                            currentMargin,
                          )}
                          %
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Paper>

          <Box
            sx={{
              display: 'grid',

              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },

              gap: 3,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 3,
              }}
            >
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6">
                    3. Margem desejada
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Escolha quanto do preço de venda deve
                    representar lucro.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  {marginOptions.map((option) => (
                    <Chip
                      key={option}
                      label={`${option}%`}
                      clickable
                      color={
                        margin === option
                          ? 'primary'
                          : 'default'
                      }
                      variant={
                        margin === option
                          ? 'filled'
                          : 'outlined'
                      }
                      onClick={() =>
                        setMargin(option)
                      }
                    />
                  ))}
                </Box>

                <TextField
                  label="Outra margem (%)"
                  type="number"
                  value={margin}
                  onChange={(event) => {
                    const value = Number(
                      event.target.value,
                    )

                    setMargin(
                      Math.min(
                        Math.max(value, 0),
                        99,
                      ),
                    )
                  }}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      max: 99,
                    },
                  }}
                />
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              <Stack spacing={2.5}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.8,
                    }}
                  >
                    {recipeName ||
                      'Resultado da receita'}
                  </Typography>

                  <Typography variant="h6">
                    Preço sugerido por unidade
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: {
                      xs: '2.3rem',
                      sm: '3rem',
                    },
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {formatCurrency(
                    suggestedUnitPrice,
                  )}
                </Typography>

                <Divider
                  sx={{
                    borderColor:
                      'rgba(255,255,255,0.25)',
                  }}
                />

                <Stack spacing={1.5}>
                  <ResultRow
                    label="Custo da receita"
                    value={formatCurrency(
                      totalCost,
                    )}
                  />

                  <ResultRow
                    label="Custo por unidade"
                    value={formatCurrency(
                      unitCost,
                    )}
                  />

                  {safeYield > 1 && (
                    <ResultRow
                      label="Venda da receita inteira"
                      value={formatCurrency(
                        suggestedTotalPrice,
                      )}
                    />
                  )}

                  <ResultRow
                    label="Lucro total"
                    value={formatCurrency(
                      suggestedProfit,
                    )}
                  />

                  <ResultRow
                    label="Lucro por unidade"
                    value={formatCurrency(
                      suggestedProfitPerUnit,
                    )}
                  />

                  <ResultRow
                    label="Margem"
                    value={`${margin}%`}
                  />
                </Stack>

                <Divider
                  sx={{
                    borderColor: 'rgba(255,255,255,0.25)',
                  }}
                />

              </Stack>
            </Paper>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 3,
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">
                  Comparação de preços
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Veja quanto cobrar por unidade em diferentes
                  margens.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',

                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',

                    sm:
                      'repeat(4, minmax(0, 1fr))',
                  },

                  gap: 1.5,
                }}
              >
                {marginOptions.map((option) => {
                  const price =
                    calculateSuggestedPrice(
                      totalCost,
                      option,
                    )

                  const unitPrice =
                    calculateUnitValue(
                      price,
                      safeYield,
                    )

                  const optionProfit =
                    calculateProfit(
                      totalCost,
                      price,
                    )

                  return (
                    <Paper
                      key={option}
                      variant="outlined"
                      sx={{
                        p: 2,

                        borderColor:
                          margin === option
                            ? 'primary.main'
                            : undefined,

                        borderWidth:
                          margin === option
                            ? 2
                            : 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Margem {option}%
                      </Typography>

                      <Typography
                        variant="h6"
                        sx={{
                          my: 0.5,
                        }}
                      >
                        {formatCurrency(
                          unitPrice,
                        )}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        por unidade
                      </Typography>

                      {safeYield > 1 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                          }}
                        >
                          Total:{' '}
                          {formatCurrency(price)}
                        </Typography>
                      )}

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                        }}
                      >
                        Lucro:{' '}
                        {formatCurrency(
                          optionProfit,
                        )}
                      </Typography>
                    </Paper>
                  )
                })}
              </Box>
            </Stack>
          </Paper>

        </Stack>
      </Container>

      {showFloatingActions && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            zIndex: 1300,
            right: {
              xs: 16,
              sm: 24,
            },
            left: {
              xs: 16,
              sm: 'auto',
            },
            bottom: {
              xs: 24,
              sm: 24,
            },
            width: {
              xs: 'auto',
              sm: 380,
            },
            p: 2,
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Stack spacing={1.5}>
            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                }}
              >
                {currentRecipeId
                  ? 'Alterações não salvas'
                  : 'Nova receita'}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {currentRecipeId
                  ? 'Esta receita está diferente da versão salva.'
                  : 'Você começou uma nova receita. Salve para não perder os dados deste navegador.'}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: {
                  xs: 'column',
                  sm: 'row',
                },
                gap: 1,
              }}
            >
              {currentRecipeId && savedRecipe && (
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<UndoRoundedIcon />}
                  onClick={undoChanges}
                  fullWidth
                >
                  Desfazer mudanças
                </Button>
              )}

              <Button
                variant="contained"
                startIcon={<SaveRoundedIcon />}
                onClick={saveRecipe}
                fullWidth
              >
                {currentRecipeId
                  ? 'Salvar alterações'
                  : 'Salvar receita'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}

      <Snackbar
        open={Boolean(feedbackMessage)}
        autoHideDuration={2500}
        onClose={() =>
          setFeedbackMessage('')
        }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() =>
            setFeedbackMessage('')
          }
        >
          {feedbackMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

interface ResultRowProps {
  label: string
  value: string
}

function ResultRow({
  label,
  value,
}: ResultRowProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        columnGap: 5,
        alignItems: 'center',
      }}
    >
      <Typography
        sx={{
          opacity: 0.8,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontWeight: 600,
          textAlign: 'right',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

interface SavedRecipeCardProps {
  recipe: Recipe
  selected: boolean
  onOpen: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function SavedRecipeCard({
  recipe,
  selected,
  onOpen,
  onDuplicate,
  onDelete,
}: SavedRecipeCardProps) {
  const totalCost =
    calculateTotalCost(
      recipe.ingredients,
      recipe.packaging,
    )

  const suggestedTotal =
    calculateSuggestedPrice(
      totalCost,
      recipe.margin,
    )

  const unitPrice =
    calculateUnitValue(
      suggestedTotal,
      recipe.yieldQuantity,
    )

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,

        borderColor: selected
          ? 'primary.main'
          : undefined,

        borderWidth: selected
          ? 2
          : 1,
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography
            noWrap
            sx={{
              fontWeight: 600,
            }}
          >
            {recipe.name}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Atualizada em{' '}
            {formatSavedDate(
              recipe.updatedAt,
            )}
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Preço sugerido
          </Typography>

          <Typography
            variant="h6"
            color="primary"
          >
            {formatCurrency(
              unitPrice,
            )}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            {recipe.yieldQuantity}{' '}
            {recipe.yieldQuantity === 1
              ? 'unidade'
              : 'unidades'}{' '}
            • Margem {recipe.margin}%
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={
              <FolderOpenRoundedIcon />
            }
            onClick={onOpen}
            fullWidth
          >
            Abrir
          </Button>

          <IconButton
            size="small"
            color="primary"
            onClick={onDuplicate}
            aria-label="Duplicar receita"
            title="Duplicar receita"
          >
            <ContentCopyRoundedIcon />
          </IconButton>

          <IconButton
            size="small"
            color="error"
            onClick={onDelete}
            aria-label="Excluir receita"
            title="Excluir receita"
          >
            <DeleteOutlineRoundedIcon />
          </IconButton>
        </Box>
      </Stack>
    </Paper>
  )
}

export default App
