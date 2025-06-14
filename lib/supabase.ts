import { createClient } from "@supabase/supabase-js"

// Debug functie voor logging
function debugLog(message: string, data?: any) {
  console.log(`[DEBUG ${new Date().toISOString()}] ${message}`, data || "")
}

// Supabase client voor client-side gebruik (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null
let isSupabaseAvailable = false

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("🔧 Supabase configuratie check:", {
      url: supabaseUrl ? "✅ Aanwezig" : "❌ Ontbreekt",
      key: supabaseAnonKey ? "✅ Aanwezig" : "❌ Ontbreekt",
    })

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("⚠️ Supabase omgevingsvariabelen ontbreken - app draait in lokale modus")
      isSupabaseAvailable = false

      // Return een mock client die geen echte operaties uitvoert
      return createMockSupabaseClient()
    }

    try {
      console.log("🚀 Supabase client wordt geïnitialiseerd...")
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
      isSupabaseAvailable = true
      console.log("✅ Supabase client succesvol geïnitialiseerd")
    } catch (error) {
      console.error("❌ Fout bij initialiseren Supabase client:", error)
      isSupabaseAvailable = false
      return createMockSupabaseClient()
    }
  }
  return supabaseClient
}

// Mock Supabase client voor wanneer omgevingsvariabelen ontbreken
function createMockSupabaseClient() {
  console.log("🔄 Mock Supabase client wordt gebruikt")

  return {
    from: (table: string) => ({
      select: (columns?: string) => {
        console.log(`📋 Mock: SELECT ${columns || "*"} FROM ${table}`)
        return Promise.resolve({
          data: [],
          error: { message: "Supabase niet geconfigureerd - lokale modus actief", code: "MOCK_MODE" },
        })
      },
      insert: (data: any) => {
        console.log(`📝 Mock: INSERT INTO ${table}`, data)
        return {
          select: () =>
            Promise.resolve({
              data: null,
              error: { message: "Supabase niet geconfigureerd - lokale modus actief", code: "MOCK_MODE" },
            }),
        }
      },
      update: (data: any) => {
        console.log(`🔄 Mock: UPDATE ${table}`, data)
        return {
          eq: (column: string, value: any) => ({
            select: () =>
              Promise.resolve({
                data: null,
                error: { message: "Supabase niet geconfigureerd - lokale modus actief", code: "MOCK_MODE" },
              }),
          }),
        }
      },
      delete: () => {
        console.log(`🗑️ Mock: DELETE FROM ${table}`)
        return {
          eq: (column: string, value: any) =>
            Promise.resolve({
              error: { message: "Supabase niet geconfigureerd - lokale modus actief", code: "MOCK_MODE" },
            }),
        }
      },
      order: (column: string, options?: any) => ({
        select: (columns?: string) =>
          Promise.resolve({
            data: [],
            error: { message: "Supabase niet geconfigureerd - lokale modus actief", code: "MOCK_MODE" },
          }),
      }),
    }),
    channel: (name: string) => ({
      on: (event: string, config: any, callback: Function) => ({
        subscribe: (statusCallback?: Function) => {
          console.log(`🔔 Mock: Subscription to ${name} (${event})`)
          if (statusCallback) statusCallback("SUBSCRIBED")
          return { unsubscribe: () => console.log(`🔕 Mock: Unsubscribed from ${name}`) }
        },
      }),
    }),
  } as any
}

// Check of Supabase beschikbaar is
export const isSupabaseConfigured = (): boolean => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("🔧 Checking Supabase configuration:", {
    url: supabaseUrl ? "✅ Present" : "❌ Missing",
    key: supabaseAnonKey ? "✅ Present" : "❌ Missing",
  })

  return !!(supabaseUrl && supabaseAnonKey)
}

// Type definities - AANGEPAST voor nieuwe tabel structuur
export interface Product {
  id?: string
  name: string
  qrcode?: string
  category?: string
  qr_code?: string
  categoryId?: string
}

export interface Category {
  id: string
  name: string
}

export interface RegistrationEntry {
  id?: string
  user_name: string
  product_name: string
  location: string
  purpose: string
  timestamp: string
  date: string
  time: string
  qr_code?: string
  created_at?: string
}

// Helper functions voor category mapping
const getCategoryIdFromName = (categoryName: string | null): string | undefined => {
  if (!categoryName) return undefined

  const mapping: { [key: string]: string } = {
    Smeermiddelen: "1",
    Reinigers: "2",
    Onderhoud: "3",
  }

  const result = mapping[categoryName]
  console.log(`🔄 getCategoryIdFromName: "${categoryName}" -> "${result}"`)
  return result
}

const getCategoryNameFromId = (categoryId: string | undefined): string | null => {
  if (!categoryId) return null

  const mapping: { [key: string]: string } = {
    "1": "Smeermiddelen",
    "2": "Reinigers",
    "3": "Onderhoud",
  }

  const result = mapping[categoryId] || null
  console.log(`🔄 getCategoryNameFromId: "${categoryId}" -> "${result}"`)
  return result
}

// Mock data voor fallback
const mockCategories: Category[] = [
  { id: "1", name: "Smeermiddelen" },
  { id: "2", name: "Reinigers" },
  { id: "3", name: "Onderhoud" },
]

const mockUsers = ["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg"]
const mockLocations = ["Magazijn A", "Productielijn 1", "Productielijn 2", "Onderhoud werkplaats", "Kantoor"]
const mockPurposes = ["Preventief onderhoud", "Reparatie", "Reiniging", "Smering", "Inspectie"]
const mockProducts: Product[] = [
  { id: "1", name: "Interflon Fin Super", qr_code: "IFS001", category: "Smeermiddelen", categoryId: "1" },
  { id: "2", name: "Interflon Grease MP2", qr_code: "IGM002", category: "Smeermiddelen", categoryId: "1" },
  { id: "3", name: "Interflon Cleaner", qr_code: "IC003", category: "Reinigers", categoryId: "2" },
  { id: "4", name: "Interflon Lube", qr_code: "IL004", category: "Smeermiddelen", categoryId: "1" },
  { id: "5", name: "Interflon Spray", qr_code: "IS005", category: "Smeermiddelen", categoryId: "1" },
  { id: "6", name: "Interflon Degreaser", qr_code: "ID006", category: "Reinigers", categoryId: "2" },
]

// ===== PRODUCT FUNCTIONALITEIT =====
export async function fetchProducts() {
  try {
    if (!isSupabaseConfigured()) {
      console.log("📦 Supabase niet beschikbaar - gebruik mock producten")
      return { data: mockProducts, error: null }
    }

    const supabase = getSupabaseClient()
    console.log("📦 Fetching products from Supabase...")
    const { data, error } = await supabase.from("products").select("*").order("id", { ascending: true })

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("📦 Mock modus - gebruik lokale producten")
        return { data: mockProducts, error: null }
      }

      console.error("❌ Error fetching products:", error)
      return { data: mockProducts, error: null }
    }

    console.log("📦 Raw products from Supabase:", data)

    // Map de data naar het verwachte formaat met correcte category mapping
    const mappedProducts =
      data?.map((product) => {
        const categoryId = getCategoryIdFromName(product.category)

        console.log("🔄 Mapping product:", {
          id: product.id,
          name: product.name,
          supabaseCategory: product.category,
          mappedCategoryId: categoryId,
          qr_code: product.qr_code,
        })

        return {
          id: product.id.toString(),
          name: product.name,
          qrcode: product.qr_code,
          categoryId: categoryId,
          category: product.category, // Keep original for reference
          created_at: product.created_at,
        }
      }) || mockProducts

    console.log("📦 Final mapped products:", mappedProducts)
    return { data: mappedProducts, error: null }
  } catch (error) {
    console.log("📦 Onverwachte fout bij ophalen producten - gebruik mock data:", error)
    return { data: mockProducts, error: null }
  }
}

export async function saveProduct(product: Product) {
  try {
    if (!isSupabaseConfigured()) {
      console.log("💾 Supabase niet beschikbaar - simuleer opslaan product")
      const newProduct = { ...product, id: Date.now().toString() }
      return { data: newProduct, error: null }
    }

    const supabase = getSupabaseClient()

    // Map categoryId naar category naam voor Supabase
    const categoryName = getCategoryNameFromId(product.categoryId)

    const productData = {
      name: product.name,
      category: categoryName,
      qr_code: product.qrcode,
    }

    console.log("💾 Saving product data to Supabase:", {
      original: product,
      mapped: productData,
      categoryMapping: {
        inputCategoryId: product.categoryId,
        outputCategoryName: categoryName,
      },
    })

    // Check if this is an update (has ID) or insert (new product)
    if (product.id && product.id !== Date.now().toString()) {
      // Update existing product
      console.log(`💾 Updating product with ID: ${product.id}`)
      const { data, error } = await supabase.from("products").update(productData).eq("id", product.id).select()

      if (error) {
        console.error("❌ Error updating product:", error)
        return { data: product, error: error }
      }

      console.log("✅ Product updated in Supabase:", data)

      // Return the updated product with correct mapping
      const updatedProduct = data?.[0]
      if (updatedProduct) {
        const mappedResult = {
          id: updatedProduct.id.toString(),
          name: updatedProduct.name,
          qrcode: updatedProduct.qr_code,
          categoryId: getCategoryIdFromName(updatedProduct.category),
          category: updatedProduct.category,
        }

        console.log("✅ Returning mapped updated product:", mappedResult)
        return {
          data: mappedResult,
          error: null,
        }
      }

      return { data: product, error: null }
    } else {
      // Insert new product
      console.log("💾 Inserting new product")
      const { data, error } = await supabase.from("products").insert([productData]).select()

      if (error) {
        console.error("❌ Error saving product:", error)
        const newProduct = { ...product, id: Date.now().toString() }
        return { data: newProduct, error: error }
      }

      console.log("✅ Product saved to Supabase:", data)

      // Return the new product with correct mapping
      const newProduct = data?.[0]
      if (newProduct) {
        const mappedResult = {
          id: newProduct.id.toString(),
          name: newProduct.name,
          qrcode: newProduct.qr_code,
          categoryId: getCategoryIdFromName(newProduct.category),
          category: newProduct.category,
        }

        console.log("✅ Returning mapped new product:", mappedResult)
        return {
          data: mappedResult,
          error: null,
        }
      }

      return { data: data?.[0] || null, error: null }
    }
  } catch (error) {
    console.log("💾 Onverwachte fout bij opslaan product - simuleer lokaal:", error)
    const newProduct = { ...product, id: Date.now().toString() }
    return { data: newProduct, error: error }
  }
}

export async function deleteProduct(id: string) {
  debugLog("deleteProduct aangeroepen met ID:", id)

  if (!isSupabaseConfigured()) {
    console.log("🗑️ Supabase niet beschikbaar - simuleer verwijderen product")
    return { success: true, error: null }
  }

  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error && error.code !== "MOCK_MODE") {
      console.error("❌ Error deleting product:", error)
    }

    debugLog("✅ Product succesvol verwijderd met ID:", id)
    return { success: true, error: null }
  } catch (error) {
    console.error("❌ Onverwachte fout bij verwijderen product:", error)
    return { success: true, error: null }
  }
}

// ===== GEBRUIKERS FUNCTIONALITEIT =====
export async function fetchUsers() {
  try {
    if (!isSupabaseConfigured()) {
      console.log("👥 Supabase niet beschikbaar - gebruik mock gebruikers")
      return { data: mockUsers, error: null }
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("users").select("*").order("id", { ascending: true })

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("👥 Mock modus - gebruik lokale gebruikers")
        return { data: mockUsers, error: null }
      }

      console.error("❌ Error fetching users:", error)
      return { data: mockUsers, error: null }
    }

    const userNames = data?.map((user) => user.name) || mockUsers
    console.log("👥 Users fetched:", userNames.length)
    return { data: userNames, error: null }
  } catch (error) {
    console.log("👥 Onverwachte fout bij ophalen gebruikers - gebruik mock data:", error)
    return { data: mockUsers, error: null }
  }
}

export async function saveUser(name: string) {
  debugLog("saveUser aangeroepen met:", name)

  if (!isSupabaseConfigured()) {
    console.log("💾 Supabase niet beschikbaar - simuleer opslaan gebruiker")
    return { data: { name }, error: null }
  }

  const supabase = getSupabaseClient()

  try {
    debugLog("Bezig met opslaan van gebruiker...")
    const { data, error } = await supabase.from("users").insert([{ name }]).select()

    if (error) {
      console.error("❌ Database error bij opslaan gebruiker:", error)
      return { data: { name }, error: null }
    }

    debugLog("✅ Gebruiker succesvol opgeslagen:", data)
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error("❌ Onverwachte fout bij opslaan gebruiker:", error)
    return { data: { name }, error: null }
  }
}

export async function updateUser(oldName: string, newName: string) {
  console.log("🔄 updateUser aangeroepen:", { oldName, newName })

  if (!isSupabaseConfigured()) {
    console.log("💾 Supabase niet beschikbaar - simuleer bijwerken gebruiker")
    return { data: { name: newName }, error: null }
  }

  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.from("users").update({ name: newName }).eq("name", oldName).select()

    if (error && error.code !== "MOCK_MODE") {
      console.error("❌ Database error bij bijwerken gebruiker:", error)
      return { data: { name: newName }, error: null }
    }

    console.log("✅ Gebruiker succesvol bijgewerkt")
    return { data: data?.[0] || { name: newName }, error: null }
  } catch (error) {
    console.error("❌ Onverwachte fout bij bijwerken gebruiker:", error)
    return { data: { name: newName }, error: null }
  }
}

export async function deleteUser(name: string) {
  console.log("deleteUser aangeroepen met:", name)

  if (!isSupabaseConfigured()) {
    console.log("🗑️ Supabase niet beschikbaar - simuleer verwijderen gebruiker")
    return { success: true, error: null }
  }

  const supabase = getSupabaseClient()

  try {
    console.log("Bezig met verwijderen van gebruiker...")
    const { error } = await supabase.from("users").delete().eq("name", name)

    if (error && error.code !== "MOCK_MODE") {
      console.error("❌ Database error bij verwijderen gebruiker:", error)
    }

    console.log("✅ Gebruiker succesvol verwijderd")
    return { success: true, error: null }
  } catch (error) {
    console.error("❌ Onverwachte fout bij verwijderen gebruiker:", error)
    return { success: true, error: null }
  }
}

// ===== LOCATIES FUNCTIONALITEIT =====
export async function fetchLocations() {
  try {
    if (!isSupabaseConfigured()) {
      console.log("📍 Supabase niet beschikbaar - gebruik mock locaties")
      return { data: mockLocations, error: null }
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("locations").select("*").order("id", { ascending: true })

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("📍 Mock modus - gebruik lokale locaties")
        return { data: mockLocations, error: null }
      }

      console.error("❌ Error fetching locations:", error)
      return { data: mockLocations, error: null }
    }

    const locationNames = data?.map((location) => location.name) || mockLocations
    console.log("📍 Locations fetched:", locationNames.length)
    return { data: locationNames, error: null }
  } catch (error) {
    console.log("📍 Onverwachte fout bij ophalen locaties - gebruik mock data:", error)
    return { data: mockLocations, error: null }
  }
}

export async function saveLocation(name: string) {
  if (!isSupabaseConfigured()) {
    console.log("💾 Supabase niet beschikbaar - simuleer opslaan locatie")
    return { data: { name }, error: null }
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("locations").insert([{ name }]).select()

  if (error && error.code !== "MOCK_MODE") {
    console.error("❌ Error saving location:", error)
  }

  return { data: data?.[0] || { name }, error: null }
}

export async function updateLocation(oldName: string, newName: string) {
  console.log("🔄 updateLocation aangeroepen:", { oldName, newName })

  if (!isSupabaseConfigured()) {
    console.log("💾 Supabase niet beschikbaar - simuleer bijwerken locatie")
    return { data: { name: newName }, error: null }
  }

  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.from("locations").update({ name: newName }).eq("name", oldName).select()

    if (error && error.code !== "MOCK_MODE") {
      console.error("❌ Database error bij bijwerken locatie:", error)
      return { data: { name: newName }, error: null }
    }

    console.log("✅ Locatie succesvol bijgewerkt")
    return { data: data?.[0] || { name: newName }, error: null }
  } catch (error) {
    console.error("❌ Onverwachte fout bij bijwerken locatie:", error)
    return { data: { name: newName }, error: null }
  }
}

export async function deleteLocation(name: string) {
  if (!isSupabaseConfigured()) {
    console.log("🗑️ Supabase niet beschikbaar - simuleer verwijderen locatie")
    return { success: true, error: null }
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.from("locations").delete().eq("name", name)

  if (error && error.code !== "MOCK_MODE") {
    console.error("❌ Error deleting location:", error)
  }

  return { success: true, error: null }
}

// ===== DOELEN FUNCTIONALITEIT =====
export async function fetchPurposes() {
  try {
    if (!isSupabaseConfigured()) {
      console.log("🎯 Supabase niet beschikbaar - gebruik mock doelen")
      return { data: mockPurposes, error: null }
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("purposes").select("*").order("id", { ascending: true })

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("🎯 Mock modus - gebruik lokale doelen")
        return { data: mockPurposes, error: null }
      }

      console.error("❌ Error fetching purposes:", error)
      return { data: mockPurposes, error: null }
    }

    const purposeNames = data?.map((purpose) => purpose.name) || mockPurposes
    console.log("🎯 Purposes fetched:", purposeNames.length)
    return { data: purposeNames, error: null }
  } catch (error) {
    console.log("🎯 Onverwachte fout bij ophalen doelen - gebruik mock data:", error)
    return { data: mockPurposes, error: null }
  }
}

export async function savePurpose(name: string) {
  if (!isSupabaseConfigured()) {
    console.log("💾 Supabase niet beschikbaar - simuleer opslaan doel")
    return { data: { name }, error: null }
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("purposes").insert([{ name }]).select()

  if (error && error.code !== "MOCK_MODE") {
    console.error("❌ Error saving purpose:", error)
  }

  return { data: data?.[0] || { name }, error: null }
}

export async function updatePurpose(oldName: string, newName: string) {
  console.log("🔄 updatePurpose aangeroepen:", { oldName, newName })

  if (!isSupabaseConfigured()) {
    console.log("💾 Supabase niet beschikbaar - simuleer bijwerken doel")
    return { data: { name: newName }, error: null }
  }

  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.from("purposes").update({ name: newName }).eq("name", oldName).select()

    if (error && error.code !== "MOCK_MODE") {
      console.error("❌ Database error bij bijwerken doel:", error)
      return { data: { name: newName }, error: null }
    }

    console.log("✅ Doel succesvol bijgewerkt")
    return { data: data?.[0] || { name: newName }, error: null }
  } catch (error) {
    console.error("❌ Onverwachte fout bij bijwerken doel:", error)
    return { data: { name: newName }, error: null }
  }
}

export async function deletePurpose(name: string) {
  if (!isSupabaseConfigured()) {
    console.log("🗑️ Supabase niet beschikbaar - simuleer verwijderen doel")
    return { success: true, error: null }
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.from("purposes").delete().eq("name", name)

  if (error && error.code !== "MOCK_MODE") {
    console.error("❌ Error deleting purpose:", error)
  }

  return { success: true, error: null }
}

// ===== REGISTRATIES FUNCTIONALITEIT - AANGEPAST =====
export async function fetchRegistrations() {
  try {
    if (!isSupabaseConfigured()) {
      console.log("📋 Supabase niet beschikbaar - gebruik lege registraties")
      return { data: [], error: null }
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("registrations").select("*").order("timestamp", { ascending: false })

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("📋 Mock modus - gebruik lege registraties")
        return { data: [], error: null }
      }

      console.error("❌ Error fetching registrations:", error)
      return { data: [], error: null }
    }

    console.log("📋 Raw registrations from Supabase:", data)

    // Map de data naar het verwachte formaat
    const mappedRegistrations =
      data?.map((reg) => ({
        id: reg.id.toString(),
        user: reg.user_name,
        product: reg.product_name,
        location: reg.location,
        purpose: reg.purpose,
        timestamp: reg.timestamp,
        date: reg.date,
        time: reg.time,
        qrcode: reg.qr_code,
      })) || []

    console.log("📋 Mapped registrations:", mappedRegistrations)
    return { data: mappedRegistrations, error: null }
  } catch (error) {
    console.log("📋 Onverwachte fout bij ophalen registraties:", error)
    return { data: [], error: null }
  }
}

export async function saveRegistration(registration: Omit<RegistrationEntry, "id" | "created_at">) {
  try {
    if (!isSupabaseConfigured()) {
      console.log("💾 Supabase niet beschikbaar - simuleer opslaan registratie")
      const newRegistration = { ...registration, id: Date.now().toString() }
      return { data: newRegistration, error: null }
    }

    const supabase = getSupabaseClient()

    // Map de data naar de juiste kolom namen
    const registrationData = {
      user_name: registration.user_name,
      product_name: registration.product_name,
      location: registration.location,
      purpose: registration.purpose,
      timestamp: registration.timestamp,
      date: registration.date,
      time: registration.time,
      qr_code: registration.qr_code,
    }

    console.log("💾 Saving registration to Supabase:", registrationData)

    const { data, error } = await supabase.from("registrations").insert([registrationData]).select()

    if (error) {
      console.error("❌ Error saving registration:", error)
      const newRegistration = { ...registration, id: Date.now().toString() }
      return { data: newRegistration, error: null }
    }

    console.log("✅ Registration saved to Supabase:", data)
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.log("💾 Onverwachte fout bij opslaan registratie:", error)
    const newRegistration = { ...registration, id: Date.now().toString() }
    return { data: newRegistration, error: null }
  }
}

// ===== CATEGORIEËN FUNCTIONALITEIT =====
export async function fetchCategories() {
  try {
    if (!isSupabaseConfigured()) {
      console.log("🗂️ Supabase niet beschikbaar - gebruik mock categorieën")
      return { data: mockCategories, error: null }
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("categories").select("*").order("name")

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("🗂️ Mock modus - gebruik lokale categorieën")
        return { data: mockCategories, error: null }
      }

      console.error("❌ Error fetching categories:", error)
      return { data: mockCategories, error: null }
    }

    const mappedCategories =
      data?.map((cat) => ({
        id: cat.id.toString(),
        name: cat.name,
      })) || mockCategories

    console.log("🗂️ Categories fetched:", mappedCategories.length)
    return { data: mappedCategories, error: null }
  } catch (error) {
    console.log("🗂️ Onverwachte fout bij ophalen categorieën - gebruik mock data:", error)
    return { data: mockCategories, error: null }
  }
}

export async function saveCategory(category: Omit<Category, "id"> | Category) {
  try {
    if (!isSupabaseConfigured()) {
      console.log("💾 Supabase niet beschikbaar - simuleer opslaan categorie")
      const newCategory = { ...category, id: (category as Category).id || Date.now().toString() } as Category
      return { data: newCategory, error: null }
    }

    const supabase = getSupabaseClient()

    // Check if this is an update (has ID) or insert (new category)
    if ("id" in category && category.id) {
      // Update existing category
      const { data, error } = await supabase
        .from("categories")
        .update({ name: category.name })
        .eq("id", category.id)
        .select()
        .single()

      if (error) {
        console.error("❌ Error updating category:", error)
        return { data: category as Category, error: null }
      }

      const mappedCategory = {
        id: data.id.toString(),
        name: data.name,
      }

      return { data: mappedCategory, error: null }
    } else {
      // Insert new category
      const { data, error } = await supabase
        .from("categories")
        .insert([{ name: category.name }])
        .select()
        .single()

      if (error) {
        console.error("❌ Error saving category:", error)
        const newCategory = { ...category, id: Date.now().toString() } as Category
        return { data: newCategory, error: null }
      }

      const mappedCategory = {
        id: data.id.toString(),
        name: data.name,
      }

      return { data: mappedCategory, error: null }
    }
  } catch (error) {
    console.log("💾 Onverwachte fout bij opslaan categorie:", error)
    const newCategory = { ...category, id: (category as Category).id || Date.now().toString() } as Category
    return { data: newCategory, error: null }
  }
}

export async function deleteCategory(id: string) {
  if (!isSupabaseConfigured()) {
    console.log("🗑️ Supabase niet beschikbaar - simuleer verwijderen categorie")
    return { error: null }
  }

  const supabase = getSupabaseClient()
  try {
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error && error.code !== "MOCK_MODE") {
      console.error("❌ Error deleting category:", error)
    }

    return { error: null }
  } catch (error) {
    console.error("❌ Unexpected error deleting category:", error)
    return { error: null }
  }
}

// ===== REALTIME SUBSCRIPTIONS (SAFE FALLBACKS) =====
export function subscribeToUsers(callback: (users: string[]) => void) {
  debugLog("Setting up users subscription")

  if (!isSupabaseConfigured()) {
    console.log("🔔 Supabase niet beschikbaar - geen real-time updates")
    return { unsubscribe: () => {} }
  }

  const supabase = getSupabaseClient()

  try {
    const subscription = supabase
      .channel("users-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, async (payload) => {
        debugLog("Users change detected:", payload)
        const { data, error } = await fetchUsers()

        if (!error && data) {
          debugLog("Updated users list:", data)
          callback(data)
        }
      })
      .subscribe((status) => {
        debugLog(`Users subscription status: ${status}`)
      })

    return subscription
  } catch (error) {
    console.error("❌ Error setting up users subscription:", error)
    return { unsubscribe: () => {} }
  }
}

export function subscribeToProducts(callback: (products: Product[]) => void) {
  debugLog("Setting up products subscription")

  if (!isSupabaseConfigured()) {
    console.log("🔔 Supabase niet beschikbaar - geen real-time updates")
    return { unsubscribe: () => {} }
  }

  const supabase = getSupabaseClient()

  try {
    const subscription = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, async (payload) => {
        console.log("📦 Products change detected:", payload)

        // Add a small delay to allow local state to update first
        setTimeout(async () => {
          console.log("🔄 Fetching updated products due to subscription (with delay)")
          const { data, error } = await fetchProducts()

          if (!error && data) {
            console.log("📦 Calling callback with updated products:", data.length)
            callback(data)
          }
        }, 500) // 500ms delay
      })
      .subscribe((status) => {
        debugLog(`Products subscription status: ${status}`)
      })

    return subscription
  } catch (error) {
    console.error("❌ Error setting up products subscription:", error)
    return { unsubscribe: () => {} }
  }
}

export function subscribeToLocations(callback: (locations: string[]) => void) {
  debugLog("Setting up locations subscription")

  if (!isSupabaseConfigured()) {
    console.log("🔔 Supabase niet beschikbaar - geen real-time updates")
    return { unsubscribe: () => {} }
  }

  const supabase = getSupabaseClient()

  try {
    const subscription = supabase
      .channel("locations-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, async (payload) => {
        debugLog("Locations change detected:", payload)
        const { data, error } = await fetchLocations()

        if (!error && data) {
          debugLog("Updated locations list:", data)
          callback(data)
        }
      })
      .subscribe((status) => {
        debugLog(`Locations subscription status: ${status}`)
      })

    return subscription
  } catch (error) {
    console.error("❌ Error setting up locations subscription:", error)
    return { unsubscribe: () => {} }
  }
}

export function subscribeToPurposes(callback: (purposes: string[]) => void) {
  debugLog("Setting up purposes subscription")

  if (!isSupabaseConfigured()) {
    console.log("🔔 Supabase niet beschikbaar - geen real-time updates")
    return { unsubscribe: () => {} }
  }

  const supabase = getSupabaseClient()

  try {
    const subscription = supabase
      .channel("purposes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "purposes" }, async (payload) => {
        debugLog("Purposes change detected:", payload)
        const { data, error } = await fetchPurposes()

        if (!error && data) {
          debugLog("Updated purposes list:", data)
          callback(data)
        }
      })
      .subscribe((status) => {
        debugLog(`Purposes subscription status: ${status}`)
      })

    return subscription
  } catch (error) {
    console.error("❌ Error setting up purposes subscription:", error)
    return { unsubscribe: () => {} }
  }
}

export function subscribeToRegistrations(callback: (registrations: RegistrationEntry[]) => void) {
  if (!isSupabaseConfigured()) {
    console.log("🔔 Supabase niet beschikbaar - geen real-time updates")
    return { unsubscribe: () => {} }
  }

  const supabase = getSupabaseClient()

  try {
    return supabase
      .channel("registrations-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, async () => {
        console.log("📋 Registrations change detected - fetching updated data")
        const { data } = await fetchRegistrations()
        if (data) {
          console.log("📋 Calling callback with updated registrations:", data.length)
          callback(data)
        }
      })
      .subscribe()
  } catch (error) {
    console.error("❌ Error setting up registrations subscription:", error)
    return { unsubscribe: () => {} }
  }
}

export function subscribeToCategories(callback: (categories: Category[]) => void) {
  debugLog("Setting up categories subscription")

  if (!isSupabaseConfigured()) {
    console.log("🔔 Supabase niet beschikbaar - geen real-time updates")
    return { unsubscribe: () => {} }
  }

  const supabase = getSupabaseClient()

  try {
    const subscription = supabase
      .channel("categories-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, async (payload) => {
        debugLog("Categories change detected:", payload)
        const { data, error } = await fetchCategories()

        if (!error && data) {
          debugLog("Updated categories list:", data)
          callback(data)
        }
      })
      .subscribe((status) => {
        debugLog(`Categories subscription status: ${status}`)
      })

    return subscription
  } catch (error) {
    console.error("❌ Error setting up categories subscription:", error)
    return { unsubscribe: () => {} }
  }
}

// Export the configuration check function
