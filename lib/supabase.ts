import { createClient } from "@supabase/supabase-js"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
  return !!(supabaseUrl && supabaseAnonKey)
}

// Create Supabase client
let supabase: any = null

if (isSupabaseConfigured()) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!)
  console.log("✅ Supabase client initialized")
} else {
  console.log("⚠️ Supabase not configured, using mock mode")
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

// Save functions
export const saveUser = async (name: string) => {
  if (!supabase) {
    console.log("💾 No Supabase - simulating save user")
    return { data: name, error: null }
  }

  try {
    console.log("💾 Saving user to Supabase:", name)
    const { data, error } = await supabase.from("users").insert([{ name }]).select().single()

    if (error) {
      console.error("❌ Error saving user:", error)
      return { data: null, error }
    }

    console.log("✅ User saved:", data)
    return { data: data.name, error: null }
  } catch (error) {
    console.error("❌ Error in saveUser:", error)
    return { data: null, error }
  }
}

export const saveProduct = async (product: Product) => {
  if (!supabase) {
    console.log("💾 No Supabase - simulating save product")
    return { data: product, error: null }
  }

  try {
    console.log("💾 Saving product to Supabase:", product)
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: product.name,
          qr_code: product.qrcode,
          category_id: product.categoryId ? Number.parseInt(product.categoryId) : null,
          attachment_url: product.attachmentUrl,
          attachment_name: product.attachmentName,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("❌ Error saving product:", error)
      return { data: null, error }
    }

    const savedProduct: Product = {
      id: data.id.toString(),
      name: data.name,
      qrcode: data.qr_code,
      categoryId: data.category_id?.toString(),
      created_at: data.created_at,
      attachmentUrl: data.attachment_url,
      attachmentName: data.attachment_name,
    }

    console.log("✅ Product saved:", savedProduct)
    return { data: savedProduct, error: null }
  } catch (error) {
    console.error("❌ Error in saveProduct:", error)
    return { data: null, error }
  }
}

export const saveLocation = async (name: string) => {
  if (!supabase) {
    console.log("💾 No Supabase - simulating save location")
    return { data: name, error: null }
  }

  try {
    console.log("💾 Saving location to Supabase:", name)
    const { data, error } = await supabase.from("locations").insert([{ name }]).select().single()

    if (error) {
      console.error("❌ Error saving location:", error)
      return { data: null, error }
    }

    console.log("✅ Location saved:", data)
    return { data: data.name, error: null }
  } catch (error) {
    console.error("❌ Error in saveLocation:", error)
    return { data: null, error }
  }
}

export const savePurpose = async (name: string) => {
  if (!supabase) {
    console.log("💾 No Supabase - simulating save purpose")
    return { data: name, error: null }
  }

  try {
    console.log("💾 Saving purpose to Supabase:", name)
    const { data, error } = await supabase.from("purposes").insert([{ name }]).select().single()

    if (error) {
      console.error("❌ Error saving purpose:", error)
      return { data: null, error }
    }

    console.log("✅ Purpose saved:", data)
    return { data: data.name, error: null }
  } catch (error) {
    console.error("❌ Error in savePurpose:", error)
    return { data: null, error }
  }
}

export const saveCategory = async (category: { name: string }) => {
  if (!supabase) {
    console.log("💾 No Supabase - simulating save category")
    const mockCategory: Category = { id: Date.now().toString(), name: category.name }
    return { data: mockCategory, error: null }
  }

  try {
    console.log("💾 Saving category to Supabase:", category)
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name: category.name }])
      .select()
      .single()

    if (error) {
      console.error("❌ Error saving category:", error)
      return { data: null, error }
    }

    const savedCategory: Category = {
      id: data.id.toString(),
      name: data.name,
    }

    console.log("✅ Category saved:", savedCategory)
    return { data: savedCategory, error: null }
  } catch (error) {
    console.error("❌ Error in saveCategory:", error)
    return { data: null, error }
  }
}

export const saveRegistration = async (registration: any) => {
  if (!supabase) {
    console.log("💾 No Supabase - simulating save registration")
    return { data: registration, error: null }
  }

  try {
    console.log("💾 Saving registration to Supabase:", registration)
    const { data, error } = await supabase.from("registrations").insert([registration]).select().single()

    if (error) {
      console.error("❌ Error saving registration:", error)
      return { data: null, error }
    }

    console.log("✅ Registration saved:", data)
    return { data, error: null }
  } catch (error) {
    console.error("❌ Error in saveRegistration:", error)
    return { data: null, error }
  }
}

// Delete functions
export const deleteUser = async (name: string) => {
  if (!supabase) {
    console.log("🗑️ No Supabase - simulating delete user")
    return { data: null, error: null }
  }

  try {
    console.log("🗑️ Deleting user from Supabase:", name)
    const { error } = await supabase.from("users").delete().eq("name", name)

    if (error) {
      console.error("❌ Error deleting user:", error)
      return { data: null, error }
    }

    console.log("✅ User deleted:", name)
    return { data: null, error: null }
  } catch (error) {
    console.error("❌ Error in deleteUser:", error)
    return { data: null, error }
  }
}

export const deleteProduct = async (id: string) => {
  if (!supabase) {
    console.log("🗑️ No Supabase - simulating delete product")
    return { data: null, error: null }
  }

  try {
    console.log("🗑️ Deleting product from Supabase:", id)
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting product:", error)
      return { data: null, error }
    }

    console.log("✅ Product deleted:", id)
    return { data: null, error: null }
  } catch (error) {
    console.error("❌ Error in deleteProduct:", error)
    return { data: null, error }
  }
}

export const deleteLocation = async (name: string) => {
  if (!supabase) {
    console.log("🗑️ No Supabase - simulating delete location")
    return { data: null, error: null }
  }

  try {
    console.log("🗑️ Deleting location from Supabase:", name)
    const { error } = await supabase.from("locations").delete().eq("name", name)

    if (error) {
      console.error("❌ Error deleting location:", error)
      return { data: null, error }
    }

    console.log("✅ Location deleted:", name)
    return { data: null, error: null }
  } catch (error) {
    console.error("❌ Error in deleteLocation:", error)
    return { data: null, error }
  }
}

export const deletePurpose = async (name: string) => {
  if (!supabase) {
    console.log("🗑️ No Supabase - simulating delete purpose")
    return { data: null, error: null }
  }

  try {
    console.log("🗑️ Deleting purpose from Supabase:", name)
    const { error } = await supabase.from("purposes").delete().eq("name", name)

    if (error) {
      console.error("❌ Error deleting purpose:", error)
      return { data: null, error }
    }

    console.log("✅ Purpose deleted:", name)
    return { data: null, error: null }
  } catch (error) {
    console.error("❌ Error in deletePurpose:", error)
    return { data: null, error }
  }
}

export const deleteCategory = async (id: string) => {
  if (!supabase) {
    console.log("🗑️ No Supabase - simulating delete category")
    return { data: null, error: null }
  }

  try {
    console.log("🗑️ Deleting category from Supabase:", id)
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting category:", error)
      return { data: null, error }
    }

    console.log("✅ Category deleted:", id)
    return { data: null, error: null }
  } catch (error) {
    console.error("❌ Error in deleteCategory:", error)
    return { data: null, error }
  }
}

// Update functions
export const updateProduct = async (id: string, updates: any) => {
  if (!supabase) {
    console.log("🔄 No Supabase - simulating update product")
    return { data: null, error: null }
  }

  try {
    console.log("🔄 Updating product in Supabase:", { id, updates })

    const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("❌ Error updating product:", error)
      return { data: null, error }
    }

    console.log("✅ Product updated successfully:", data)
    return { data, error: null }
  } catch (error) {
    console.error("❌ Error in updateProduct:", error)
    return { data: null, error }
  }
}

export const updateUser = async (oldName: string, newName: string) => {
  if (!supabase) {
    console.log("🔄 No Supabase - simulating update user")
    return { data: null, error: null }
  }

  try {
    console.log("🔄 Updating user in Supabase:", { oldName, newName })
    const { data, error } = await supabase.from("users").update({ name: newName }).eq("name", oldName).select().single()

    if (error) {
      console.error("❌ Error updating user:", error)
      return { data: null, error }
    }

    console.log("✅ User updated:", data)
    return { data, error: null }
  } catch (error) {
    console.error("❌ Error in updateUser:", error)
    return { data: null, error }
  }
}

export const updateCategory = async (id: string, updates: any) => {
  if (!supabase) {
    console.log("🔄 No Supabase - simulating update category")
    return { data: null, error: null }
  }

  try {
    console.log("🔄 Updating category in Supabase:", { id, updates })
    const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("❌ Error updating category:", error)
      return { data: null, error }
    }

    console.log("✅ Category updated:", data)
    return { data, error: null }
  } catch (error) {
    console.error("❌ Error in updateCategory:", error)
    return { data: null, error }
  }
}

export const updateLocation = async (oldName: string, newName: string) => {
  if (!supabase) {
    console.log("🔄 No Supabase - simulating update location")
    return { data: null, error: null }
  }

  try {
    console.log("🔄 Updating location in Supabase:", { oldName, newName })
    const { data, error } = await supabase
      .from("locations")
      .update({ name: newName })
      .eq("name", oldName)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating location:", error)
      return { data: null, error }
    }

    console.log("✅ Location updated:", data)
    return { data, error: null }
  } catch (error) {
    console.error("❌ Error in updateLocation:", error)
    return { data: null, error }
  }
}

export const updatePurpose = async (oldName: string, newName: string) => {
  if (!supabase) {
    console.log("🔄 No Supabase - simulating update purpose")
    return { data: null, error: null }
  }

  try {
    console.log("🔄 Updating purpose in Supabase:", { oldName, newName })
    const { data, error } = await supabase
      .from("purposes")
      .update({ name: newName })
      .eq("name", oldName)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating purpose:", error)
      return { data: null, error }
    }

    console.log("✅ Purpose updated:", data)
    return { data, error: null }
  } catch (error) {
    console.error("❌ Error in updatePurpose:", error)
    return { data: null, error }
  }
}

// Subscription functions with pause mechanism
export const subscribeToUsers = (callback: (users: string[]) => void) => {
  if (!supabase) {
    console.log("⚠️ No Supabase client, skipping users subscription")
    return null
  }

  console.log("🔔 Setting up users subscription...")

  const subscription = supabase
    .channel("users-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "users" }, async (payload: any) => {
      // Check if edit is in progress
      if (isUserEditInProgress) {
        console.log("⏸️ User edit in progress, skipping subscription update")
        return
      }

      console.log("👥 Users table changed:", payload)

      // Fetch fresh data
      const result = await fetchUsers()
      if (result.data && !result.error) {
        callback(result.data)
      }
    })
    .subscribe((status: string) => {
      console.log("👥 Users subscription status:", status)
    })

  return subscription
}

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  if (!supabase) {
    console.log("⚠️ No Supabase client, skipping products subscription")
    return null
  }

  console.log("🔔 Setting up products subscription...")

  const subscription = supabase
    .channel("products-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, async (payload: any) => {
      // Check if edit is in progress
      if (isProductEditInProgress) {
        console.log("⏸️ Product edit in progress, skipping subscription update")
        return
      }

      console.log("📦 Products table changed:", payload)

      // Fetch fresh data
      const result = await fetchProducts()
      if (result.data && !result.error) {
        callback(result.data)
      }
    })
    .subscribe((status: string) => {
      console.log("📦 Products subscription status:", status)
    })

  return subscription
}

export const subscribeToLocations = (callback: (locations: string[]) => void) => {
  if (!supabase) {
    console.log("⚠️ No Supabase client, skipping locations subscription")
    return null
  }

  console.log("🔔 Setting up locations subscription...")

  const subscription = supabase
    .channel("locations-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, async (payload: any) => {
      // Check if edit is in progress
      if (isLocationEditInProgress) {
        console.log("⏸️ Location edit in progress, skipping subscription update")
        return
      }

      console.log("📍 Locations table changed:", payload)

      // Fetch fresh data
      const result = await fetchLocations()
      if (result.data && !result.error) {
        callback(result.data)
      }
    })
    .subscribe((status: string) => {
      console.log("📍 Locations subscription status:", status)
    })

  return subscription
}

export const subscribeToPurposes = (callback: (purposes: string[]) => void) => {
  if (!supabase) {
    console.log("⚠️ No Supabase client, skipping purposes subscription")
    return null
  }

  console.log("🔔 Setting up purposes subscription...")

  const subscription = supabase
    .channel("purposes-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "purposes" }, async (payload: any) => {
      // Check if edit is in progress
      if (isPurposeEditInProgress) {
        console.log("⏸️ Purpose edit in progress, skipping subscription update")
        return
      }

      console.log("🎯 Purposes table changed:", payload)

      // Fetch fresh data
      const result = await fetchPurposes()
      if (result.data && !result.error) {
        callback(result.data)
      }
    })
    .subscribe((status: string) => {
      console.log("🎯 Purposes subscription status:", status)
    })

  return subscription
}

export const subscribeToCategories = (callback: (categories: Category[]) => void) => {
  if (!supabase) {
    console.log("⚠️ No Supabase client, skipping categories subscription")
    return null
  }

  console.log("🔔 Setting up categories subscription...")

  const subscription = supabase
    .channel("categories-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, async (payload: any) => {
      // Check if edit is in progress
      if (isCategoryEditInProgress) {
        console.log("⏸️ Category edit in progress, skipping subscription update")
        return
      }

      console.log("🗂️ Categories table changed:", payload)

      // Fetch fresh data
      const result = await fetchCategories()
      if (result.data && !result.error) {
        callback(result.data)
      }
    })
    .subscribe((status: string) => {
      console.log("🗂️ Categories subscription status:", status)
    })

  return subscription
}

export const subscribeToRegistrations = (callback: (registrations: Registration[]) => void) => {
  if (!supabase) {
    console.log("⚠️ No Supabase client, skipping registrations subscription")
    return null
  }

  console.log("🔔 Setting up registrations subscription...")

  const subscription = supabase
    .channel("registrations-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, async (payload: any) => {
      console.log("📋 Registrations table changed:", payload)

      // Fetch fresh data
      const result = await fetchRegistrations()
      if (result.data && !result.error) {
        callback(result.data)
      }
    })
    .subscribe((status: string) => {
      console.log("📋 Registrations subscription status:", status)
    })

  return subscription
}
