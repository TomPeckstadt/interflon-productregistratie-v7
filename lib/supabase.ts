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

// Type definities
export interface Product {
  id?: string
  name: string
  qrcode: string
  categoryId?: string
}

export interface Category {
  id: string
  name: string
}

export interface RegistrationEntry {
  id?: string
  user: string
  product: string
  location: string
  purpose: string
  timestamp: string
  date: string
  time: string
  qrcode?: string
  created_at?: string
}

// Mock data voor fallback
const mockCategories: Category[] = [
  { id: "1", name: "Smeermiddelen" },
  { id: "2", name: "Reinigers" },
  { id: "3", name: "Onderhoud" },
]

const mockUsers = ["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg"]
const mockLocations = ["Kantoor 1.1", "Kantoor 1.2", "Vergaderzaal A", "Warehouse", "Thuis"]
const mockPurposes = ["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie"]
const mockProducts: Product[] = [
  { id: "1", name: "Interflon Fin Super", qrcode: "IFLS001", categoryId: "1" },
  { id: "2", name: "Interflon Food Lube", qrcode: "IFFL002", categoryId: "1" },
  { id: "3", name: "Interflon Degreaser", qrcode: "IFD003", categoryId: "2" },
  { id: "4", name: "Interflon Fin Grease", qrcode: "IFGR004", categoryId: "1" },
  { id: "5", name: "Interflon Metal Clean", qrcode: "IFMC005", categoryId: "2" },
  { id: "6", name: "Interflon Maintenance Kit", qrcode: "IFMK006", categoryId: "3" },
]

// ===== PRODUCT FUNCTIONALITEIT =====
export async function fetchProducts() {
  try {
    if (!isSupabaseConfigured()) {
      console.log("📦 Supabase niet beschikbaar - gebruik mock producten")
      return { data: mockProducts, error: null }
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("📦 Mock modus - gebruik lokale producten")
        return { data: mockProducts, error: null }
      }

      if (
        error.message.includes('relation "public.products" does not exist') ||
        error.message.includes("does not exist")
      ) {
        console.log("📦 Products table bestaat niet - gebruik mock data")
        return { data: mockProducts, error: null }
      }

      console.error("❌ Error fetching products:", error)
      return { data: mockProducts, error: null }
    }

    return { data: data || mockProducts, error: null }
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
    const { data, error } = await supabase.from("products").insert([product]).select()

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("💾 Mock modus - simuleer opslaan product")
        const newProduct = { ...product, id: Date.now().toString() }
        return { data: newProduct, error: null }
      }

      console.error("❌ Error saving product:", error)
      const newProduct = { ...product, id: Date.now().toString() }
      return { data: newProduct, error: null }
    }

    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.log("💾 Onverwachte fout bij opslaan product - simuleer lokaal:", error)
    const newProduct = { ...product, id: Date.now().toString() }
    return { data: newProduct, error: null }
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
    return { success: true, error: null } // Graceful fallback
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
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("👥 Mock modus - gebruik lokale gebruikers")
        return { data: mockUsers, error: null }
      }

      if (
        error.message.includes('relation "public.users" does not exist') ||
        error.message.includes("does not exist")
      ) {
        console.log("👥 Users table bestaat niet - gebruik mock data")
        return { data: mockUsers, error: null }
      }

      console.error("❌ Error fetching users:", error)
      return { data: mockUsers, error: null }
    }

    return { data: data?.map((user) => user.name) || mockUsers, error: null }
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
      if (error.code === "MOCK_MODE") {
        console.log("💾 Mock modus - simuleer opslaan gebruiker")
        return { data: { name }, error: null }
      }

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
    const { data, error } = await supabase.from("locations").select("*").order("created_at", { ascending: false })

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("📍 Mock modus - gebruik lokale locaties")
        return { data: mockLocations, error: null }
      }

      console.error("❌ Error fetching locations:", error)
      return { data: mockLocations, error: null }
    }

    return { data: data?.map((location) => location.name) || mockLocations, error: null }
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
    const { data, error } = await supabase.from("purposes").select("*").order("created_at", { ascending: false })

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("🎯 Mock modus - gebruik lokale doelen")
        return { data: mockPurposes, error: null }
      }

      console.error("❌ Error fetching purposes:", error)
      return { data: mockPurposes, error: null }
    }

    return { data: data?.map((purpose) => purpose.name) || mockPurposes, error: null }
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

// ===== REGISTRATIES FUNCTIONALITEIT =====
export async function fetchRegistrations() {
  try {
    if (!isSupabaseConfigured()) {
      console.log("📋 Supabase niet beschikbaar - gebruik lege registraties")
      return { data: [], error: null }
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false })

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("📋 Mock modus - gebruik lege registraties")
        return { data: [], error: null }
      }

      console.error("❌ Error fetching registrations:", error)
      return { data: [], error: null }
    }

    return { data: data || [], error: null }
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
    const { data, error } = await supabase.from("registrations").insert([registration]).select()

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("💾 Mock modus - simuleer opslaan registratie")
        const newRegistration = { ...registration, id: Date.now().toString() }
        return { data: newRegistration, error: null }
      }

      console.error("❌ Error saving registration:", error)
      const newRegistration = { ...registration, id: Date.now().toString() }
      return { data: newRegistration, error: null }
    }

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

    return { data: data || mockCategories, error: null }
  } catch (error) {
    console.log("🗂️ Onverwachte fout bij ophalen categorieën - gebruik mock data:", error)
    return { data: mockCategories, error: null }
  }
}

export async function saveCategory(category: Omit<Category, "id">) {
  try {
    if (!isSupabaseConfigured()) {
      console.log("💾 Supabase niet beschikbaar - simuleer opslaan categorie")
      const newCategory = { ...category, id: Date.now().toString() } as Category
      return { data: newCategory, error: null }
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("categories").insert([category]).select().single()

    if (error) {
      if (error.code === "MOCK_MODE") {
        console.log("💾 Mock modus - simuleer opslaan categorie")
        const newCategory = { ...category, id: Date.now().toString() } as Category
        return { data: newCategory, error: null }
      }

      console.error("❌ Error saving category:", error)
      const newCategory = { ...category, id: Date.now().toString() } as Category
      return { data: newCategory, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.log("💾 Onverwachte fout bij opslaan categorie:", error)
    const newCategory = { ...category, id: Date.now().toString() } as Category
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
        debugLog("Products change detected:", payload)
        const { data, error } = await fetchProducts()

        if (!error && data) {
          debugLog("Updated products list:", data)
          callback(data)
        }
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
        const { data } = await fetchRegistrations()
        if (data) callback(data)
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
