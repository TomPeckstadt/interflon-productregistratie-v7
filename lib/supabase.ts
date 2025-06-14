import { createClient } from "@supabase/supabase-js"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("🔧 Supabase Configuration Check:")
console.log("URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
console.log("Key:", supabaseAnonKey ? "✅ Set" : "❌ Missing")

// Global edit flags to pause subscriptions during edits
let isProductEditInProgress = false
let isUserEditInProgress = false
let isCategoryEditInProgress = false
let isLocationEditInProgress = false
let isPurposeEditInProgress = false

// Functions to control edit flags
export const setProductEditInProgress = (value: boolean) => {
  console.log(`🔧 Product edit in progress: ${value}`)
  isProductEditInProgress = value
}

export const setUserEditInProgress = (value: boolean) => {
  console.log(`🔧 User edit in progress: ${value}`)
  isUserEditInProgress = value
}

export const setCategoryEditInProgress = (value: boolean) => {
  console.log(`🔧 Category edit in progress: ${value}`)
  isCategoryEditInProgress = value
}

export const setLocationEditInProgress = (value: boolean) => {
  console.log(`🔧 Location edit in progress: ${value}`)
  isLocationEditInProgress = value
}

export const setPurposeEditInProgress = (value: boolean) => {
  console.log(`🔧 Purpose edit in progress: ${value}`)
  isPurposeEditInProgress = value
}

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  const configured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.includes("supabase"))
  console.log("🔍 Supabase configured:", configured)
  return configured
}

// Create Supabase client
let supabase: any = null

if (isSupabaseConfigured()) {
  try {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!)
    console.log("✅ Supabase client initialized")
  } catch (error) {
    console.error("❌ Error creating Supabase client:", error)
    supabase = null
  }
} else {
  console.log("⚠️ Supabase not configured, using localStorage mode")
}

// Types
interface Product {
  id: string
  name: string
  qrcode?: string
  categoryId?: string
  created_at?: string
  attachmentUrl?: string
  attachmentName?: string
}

interface Category {
  id: string
  name: string
}

interface Registration {
  id: string
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

// Mock data for when Supabase is not configured OR when database is empty
const mockUsers = ["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg"]
const mockProducts: Product[] = [
  { id: "1", name: "Interflon Fin Super", qrcode: "IFLS001", categoryId: "1" },
  { id: "2", name: "Interflon Food Lube", qrcode: "IFFL002", categoryId: "1" },
  { id: "3", name: "Interflon Degreaser", qrcode: "IFD003", categoryId: "2" },
  { id: "4", name: "Interflon Fin Grease", qrcode: "IFGR004", categoryId: "1" },
  { id: "5", name: "Interflon Metal Clean", qrcode: "IFMC005", categoryId: "2" },
  { id: "6", name: "Interflon Maintenance Kit", qrcode: "IFMK006", categoryId: "3" },
]
const mockLocations = ["Kantoor 1.1", "Kantoor 1.2", "Vergaderzaal A", "Warehouse", "Thuis"]
const mockPurposes = ["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie"]
const mockCategories: Category[] = [
  { id: "1", name: "Smeermiddelen" },
  { id: "2", name: "Reinigers" },
  { id: "3", name: "Onderhoud" },
]
const mockRegistrations: Registration[] = []

// Fetch functions with proper fallback
export const fetchUsers = async () => {
  if (!supabase) {
    console.log("📊 No Supabase - using mock users")
    return { data: mockUsers, error: null }
  }

  try {
    console.log("📊 Fetching users from Supabase...")
    const { data, error } = await supabase.from("users").select("name").order("name")

    if (error) {
      console.error("❌ Error fetching users:", error)
      console.log("📊 Falling back to mock users")
      return { data: mockUsers, error: null }
    }

    const userNames = data?.map((user: any) => user.name) || []
    console.log(`📊 Fetched ${userNames.length} users from Supabase`)

    // If database is empty, use mock data
    if (userNames.length === 0) {
      console.log("📊 Database empty - using mock users")
      return { data: mockUsers, error: null }
    }

    return { data: userNames, error: null }
  } catch (error) {
    console.error("❌ Error in fetchUsers:", error)
    console.log("📊 Falling back to mock users")
    return { data: mockUsers, error: null }
  }
}

export const fetchProducts = async () => {
  if (!supabase) {
    console.log("📊 No Supabase - using mock products")
    return { data: mockProducts, error: null }
  }

  try {
    console.log("📊 Fetching products from Supabase...")
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching products:", error)
      console.log("📊 Falling back to mock products")
      return { data: mockProducts, error: null }
    }

    const products =
      data?.map((product: any) => ({
        id: product.id.toString(),
        name: product.name,
        qrcode: product.qr_code,
        categoryId: product.category_id?.toString(),
        created_at: product.created_at,
        attachmentUrl: product.attachment_url,
        attachmentName: product.attachment_name,
      })) || []

    console.log(`📊 Fetched ${products.length} products from Supabase`)

    // If database is empty, use mock data
    if (products.length === 0) {
      console.log("📊 Database empty - using mock products")
      return { data: mockProducts, error: null }
    }

    return { data: products, error: null }
  } catch (error) {
    console.error("❌ Error in fetchProducts:", error)
    console.log("📊 Falling back to mock products")
    return { data: mockProducts, error: null }
  }
}

export const fetchLocations = async () => {
  if (!supabase) {
    console.log("📊 No Supabase - using mock locations")
    return { data: mockLocations, error: null }
  }

  try {
    console.log("📊 Fetching locations from Supabase...")
    const { data, error } = await supabase.from("locations").select("name").order("name")

    if (error) {
      console.error("❌ Error fetching locations:", error)
      console.log("📊 Falling back to mock locations")
      return { data: mockLocations, error: null }
    }

    const locationNames = data?.map((location: any) => location.name) || []
    console.log(`📊 Fetched ${locationNames.length} locations from Supabase`)

    // If database is empty, use mock data
    if (locationNames.length === 0) {
      console.log("📊 Database empty - using mock locations")
      return { data: mockLocations, error: null }
    }

    return { data: locationNames, error: null }
  } catch (error) {
    console.error("❌ Error in fetchLocations:", error)
    console.log("📊 Falling back to mock locations")
    return { data: mockLocations, error: null }
  }
}

export const fetchPurposes = async () => {
  if (!supabase) {
    console.log("📊 No Supabase - using mock purposes")
    return { data: mockPurposes, error: null }
  }

  try {
    console.log("📊 Fetching purposes from Supabase...")
    const { data, error } = await supabase.from("purposes").select("name").order("name")

    if (error) {
      console.error("❌ Error fetching purposes:", error)
      console.log("📊 Falling back to mock purposes")
      return { data: mockPurposes, error: null }
    }

    const purposeNames = data?.map((purpose: any) => purpose.name) || []
    console.log(`📊 Fetched ${purposeNames.length} purposes from Supabase`)

    // If database is empty, use mock data
    if (purposeNames.length === 0) {
      console.log("📊 Database empty - using mock purposes")
      return { data: mockPurposes, error: null }
    }

    return { data: purposeNames, error: null }
  } catch (error) {
    console.error("❌ Error in fetchPurposes:", error)
    console.log("📊 Falling back to mock purposes")
    return { data: mockPurposes, error: null }
  }
}

export const fetchCategories = async () => {
  if (!supabase) {
    console.log("📊 No Supabase - using mock categories")
    return { data: mockCategories, error: null }
  }

  try {
    console.log("📊 Fetching categories from Supabase...")
    const { data, error } = await supabase.from("categories").select("*").order("name")

    if (error) {
      console.error("❌ Error fetching categories:", error)
      console.log("📊 Falling back to mock categories")
      return { data: mockCategories, error: null }
    }

    const categories =
      data?.map((category: any) => ({
        id: category.id.toString(),
        name: category.name,
      })) || []

    console.log(`📊 Fetched ${categories.length} categories from Supabase`)

    // If database is empty, use mock data
    if (categories.length === 0) {
      console.log("📊 Database empty - using mock categories")
      return { data: mockCategories, error: null }
    }

    return { data: categories, error: null }
  } catch (error) {
    console.error("❌ Error in fetchCategories:", error)
    console.log("📊 Falling back to mock categories")
    return { data: mockCategories, error: null }
  }
}

export const fetchRegistrations = async () => {
  if (!supabase) {
    console.log("📊 No Supabase - using mock registrations")
    return { data: mockRegistrations, error: null }
  }

  try {
    console.log("📊 Fetching registrations from Supabase...")
    const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching registrations:", error)
      console.log("📊 Falling back to mock registrations")
      return { data: mockRegistrations, error: null }
    }

    const registrations =
      data?.map((registration: any) => ({
        id: registration.id.toString(),
        user: registration.user_name,
        product: registration.product_name,
        location: registration.location,
        purpose: registration.purpose,
        timestamp: registration.timestamp,
        date: registration.date,
        time: registration.time,
        qrcode: registration.qr_code,
        created_at: registration.created_at,
      })) || []

    console.log(`📊 Fetched ${registrations.length} registrations from Supabase`)
    return { data: registrations, error: null }
  } catch (error) {
    console.error("❌ Error in fetchRegistrations:", error)
    console.log("📊 Falling back to mock registrations")
    return { data: mockRegistrations, error: null }
  }
}

// Save functions - FORCE localStorage mode for now
export const saveUser = async (name: string) => {
  console.log("💾 Saving user (localStorage mode):", name)
  return { data: name, error: null }
}

export const saveProduct = async (product: Product) => {
  console.log("💾 Saving product (localStorage mode):", product)
  return { data: product, error: null }
}

export const saveLocation = async (name: string) => {
  console.log("💾 Saving location (localStorage mode):", name)
  return { data: name, error: null }
}

export const savePurpose = async (name: string) => {
  console.log("💾 Saving purpose (localStorage mode):", name)
  return { data: name, error: null }
}

export const saveCategory = async (category: { name: string }) => {
  console.log("💾 Saving category (localStorage mode):", category)
  const mockCategory: Category = { id: Date.now().toString(), name: category.name }
  return { data: mockCategory, error: null }
}

export const saveRegistration = async (registration: any) => {
  console.log("💾 Saving registration (localStorage mode):", registration)
  return { data: registration, error: null }
}

// Delete functions - FORCE localStorage mode for now
export const deleteUser = async (name: string) => {
  console.log("🗑️ Deleting user (localStorage mode):", name)
  return { data: null, error: null }
}

export const deleteProduct = async (id: string) => {
  console.log("🗑️ Deleting product (localStorage mode):", id)
  return { data: null, error: null }
}

export const deleteLocation = async (name: string) => {
  console.log("🗑️ Deleting location (localStorage mode):", name)
  return { data: null, error: null }
}

export const deletePurpose = async (name: string) => {
  console.log("🗑️ Deleting purpose (localStorage mode):", name)
  return { data: null, error: null }
}

export const deleteCategory = async (id: string) => {
  console.log("🗑️ Deleting category (localStorage mode):", id)
  return { data: null, error: null }
}

// Update functions - FORCE localStorage mode for now
export const updateProduct = async (id: string, updates: any) => {
  console.log("🔄 Updating product (localStorage mode):", { id, updates })
  return { data: { id, ...updates }, error: null }
}

export const updateUser = async (oldName: string, newName: string) => {
  console.log("🔄 Updating user (localStorage mode):", { oldName, newName })
  return { data: { name: newName }, error: null }
}

export const updateCategory = async (id: string, updates: any) => {
  console.log("🔄 Updating category (localStorage mode):", { id, updates })
  return { data: { id, ...updates }, error: null }
}

export const updateLocation = async (oldName: string, newName: string) => {
  console.log("🔄 Updating location (localStorage mode):", { oldName, newName })
  return { data: { name: newName }, error: null }
}

export const updatePurpose = async (oldName: string, newName: string) => {
  console.log("🔄 Updating purpose (localStorage mode):", { oldName, newName })
  return { data: { name: newName }, error: null }
}

// Subscription functions - DISABLED for now to avoid errors
export const subscribeToUsers = (callback: (users: string[]) => void) => {
  console.log("🔔 Users subscription disabled (localStorage mode)")
  return null
}

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  console.log("🔔 Products subscription disabled (localStorage mode)")
  return null
}

export const subscribeToLocations = (callback: (locations: string[]) => void) => {
  console.log("🔔 Locations subscription disabled (localStorage mode)")
  return null
}

export const subscribeToPurposes = (callback: (purposes: string[]) => void) => {
  console.log("🔔 Purposes subscription disabled (localStorage mode)")
  return null
}

export const subscribeToCategories = (callback: (categories: Category[]) => void) => {
  console.log("🔔 Categories subscription disabled (localStorage mode)")
  return null
}

export const subscribeToRegistrations = (callback: (registrations: Registration[]) => void) => {
  console.log("🔔 Registrations subscription disabled (localStorage mode)")
  return null
}
