"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"

// Supabase imports
import {
  fetchUsers,
  fetchProducts,
  fetchLocations,
  fetchPurposes,
  fetchCategories,
  fetchRegistrations,
  saveUser,
  saveProduct,
  saveLocation,
  savePurpose,
  saveCategory,
  saveRegistration,
  deleteUser,
  deleteProduct,
  deleteLocation,
  deletePurpose,
  deleteCategory,
  subscribeToUsers,
  subscribeToProducts,
  subscribeToLocations,
  subscribeToPurposes,
  subscribeToCategories,
  subscribeToRegistrations,
  isSupabaseConfigured,
  updateUser,
  updateLocation,
  updatePurpose,
  updateProduct,
  updateCategory,
} from "@/lib/supabase"

// Types
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { QrCode, ChevronDown } from "lucide-react"

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

export default function ProductRegistrationApp() {
  // Basic state
  const [currentUser, setCurrentUser] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [location, setLocation] = useState("")
  const [purpose, setPurpose] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [importMessage, setImportMessage] = useState("")
  const [importError, setImportError] = useState("")

  // Connection state
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Controleren...")

  // Data arrays - SINGLE SOURCE OF TRUTH
  const [users, setUsers] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [purposes, setPurposes] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])

  // New item states
  const [newUserName, setNewUserName] = useState("")
  const [newProductName, setNewProductName] = useState("")
  const [newProductQrCode, setNewProductQrCode] = useState("")
  const [newProductCategory, setNewProductCategory] = useState("none")
  const [newLocationName, setNewLocationName] = useState("")
  const [newPurposeName, setNewPurposeName] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")

  // Edit states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [originalCategory, setOriginalCategory] = useState<Category | null>(null)
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false)

  const [editingUser, setEditingUser] = useState<string>("")
  const [originalUser, setOriginalUser] = useState<string>("")
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)

  const [editingLocation, setEditingLocation] = useState<string>("")
  const [originalLocation, setOriginalLocation] = useState<string>("")
  const [showEditLocationDialog, setShowEditLocationDialog] = useState(false)

  const [editingPurpose, setEditingPurpose] = useState<string>("")
  const [originalPurpose, setOriginalPurpose] = useState<string>("")
  const [showEditPurposeDialog, setShowEditPurposeDialog] = useState(false)

  // Product selector states
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const productSelectorRef = useRef<HTMLDivElement>(null)
  const [userSearchQuery, setUserSearchQuery] = useState("")

  // QR Scanner states
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [qrScanResult, setQrScanResult] = useState("")
  const [qrScanMode, setQrScanMode] = useState<"registration" | "product-management">("registration")

  // Load data on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    console.log("🔄 Loading all data...")
    setConnectionStatus("Verbinden met database...")

    try {
      const supabaseConfigured = isSupabaseConfigured()
      console.log("🔧 Supabase configured:", supabaseConfigured)

      if (supabaseConfigured) {
        console.log("🔄 Loading from Supabase...")
        const [usersResult, productsResult, locationsResult, purposesResult, categoriesResult, registrationsResult] =
          await Promise.all([
            fetchUsers(),
            fetchProducts(),
            fetchLocations(),
            fetchPurposes(),
            fetchCategories(),
            fetchRegistrations(),
          ])

        console.log("📊 Supabase results:", {
          users: { success: !usersResult.error, count: usersResult.data?.length || 0 },
          products: { success: !productsResult.error, count: productsResult.data?.length || 0 },
          locations: { success: !locationsResult.error, count: locationsResult.data?.length || 0 },
          purposes: { success: !purposesResult.error, count: purposesResult.data?.length || 0 },
          categories: { success: !categoriesResult.error, count: categoriesResult.data?.length || 0 },
        })

        // Check if we have successful connection
        const hasErrors = usersResult.error || productsResult.error || categoriesResult.error

        if (!hasErrors) {
          console.log("✅ Supabase connected successfully")
          setIsSupabaseConnected(true)
          setConnectionStatus("Supabase verbonden")

          // Set data from Supabase
          setUsers(usersResult.data || [])
          setProducts(productsResult.data || [])
          setLocations(locationsResult.data || [])
          setPurposes(purposesResult.data || [])
          setCategories(categoriesResult.data || [])
          setRegistrations(registrationsResult.data || [])

          // Set up real-time subscriptions
          setupSubscriptions()
        } else {
          console.log("⚠️ Supabase connection failed - using mock data")
          setIsSupabaseConnected(false)
          setConnectionStatus("Mock data actief")
          loadMockData()
        }
      } else {
        console.log("⚠️ Supabase not configured - using mock data")
        setIsSupabaseConnected(false)
        setConnectionStatus("Mock data actief")
        loadMockData()
      }

      // Set default user if available and not already set
      if (!currentUser && users.length > 0) {
        setCurrentUser(users[0])
      }
    } catch (error) {
      console.error("❌ Error loading data:", error)
      setIsSupabaseConnected(false)
      setConnectionStatus("Mock data actief")
      loadMockData()
    }
  }

  const loadMockData = () => {
    console.log("📱 Loading mock data...")
    const mockUsers = ["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg"]
    const mockProducts = [
      { id: "1", name: "Interflon Fin Super", qrcode: "IFLS001", categoryId: "1" },
      { id: "2", name: "Interflon Food Lube", qrcode: "IFFL002", categoryId: "1" },
      { id: "3", name: "Interflon Degreaser", qrcode: "IFD003", categoryId: "2" },
      { id: "4", name: "Interflon Fin Grease", qrcode: "IFGR004", categoryId: "1" },
      { id: "5", name: "Interflon Metal Clean", qrcode: "IFMC005", categoryId: "2" },
      { id: "6", name: "Interflon Maintenance Kit", qrcode: "IFMK006", categoryId: "3" },
    ]
    const mockLocations = ["Kantoor 1.1", "Kantoor 1.2", "Vergaderzaal A", "Warehouse", "Thuis"]
    const mockPurposes = ["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie"]
    const mockCategories = [
      { id: "1", name: "Smeermiddelen" },
      { id: "2", name: "Reinigers" },
      { id: "3", name: "Onderhoud" },
    ]

    setUsers(mockUsers)
    setProducts(mockProducts)
    setLocations(mockLocations)
    setPurposes(mockPurposes)
    setCategories(mockCategories)
    setRegistrations([])
  }

  const setupSubscriptions = () => {
    console.log("🔔 Setting up real-time subscriptions...")

    const usersSub = subscribeToUsers((newUsers) => {
      console.log("🔔 Users updated via subscription:", newUsers.length)
      setUsers(newUsers)
    })

    const productsSub = subscribeToProducts((newProducts) => {
      console.log("🔔 Products updated via subscription:", newProducts.length)
      setProducts(newProducts)
    })

    const locationsSub = subscribeToLocations((newLocations) => {
      console.log("🔔 Locations updated via subscription:", newLocations.length)
      setLocations(newLocations)
    })

    const purposesSub = subscribeToPurposes((newPurposes) => {
      console.log("🔔 Purposes updated via subscription:", newPurposes.length)
      setPurposes(newPurposes)
    })

    const categoriesSub = subscribeToCategories((newCategories) => {
      console.log("🔔 Categories updated via subscription:", newCategories.length)
      setCategories(newCategories)
    })

    const registrationsSub = subscribeToRegistrations((newRegistrations) => {
      console.log("🔔 Registrations updated via subscription:", newRegistrations.length)
      setRegistrations(newRegistrations)
    })

    // Cleanup subscriptions on unmount
    return () => {
      usersSub?.unsubscribe?.()
      productsSub?.unsubscribe?.()
      locationsSub?.unsubscribe?.()
      purposesSub?.unsubscribe?.()
      categoriesSub?.unsubscribe?.()
      registrationsSub?.unsubscribe?.()
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productSelectorRef.current && !productSelectorRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !selectedProduct || !location || !purpose) {
      return
    }

    setIsLoading(true)

    try {
      const now = new Date()
      const product = products.find((p) => p.name === selectedProduct)

      const registrationData = {
        user_name: currentUser,
        product_name: selectedProduct,
        location,
        purpose,
        timestamp: now.toISOString(),
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
        qr_code: product?.qrcode,
      }

      const result = await saveRegistration(registrationData)
      if (result.error) {
        console.error("Error saving registration:", result.error)
        setImportError("Fout bij opslaan registratie")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ Registration saved")
        // Real-time subscription will update the UI automatically
      }

      // Reset form
      setSelectedProduct("")
      setProductSearchQuery("")
      setSelectedCategory("all")
      setLocation("")
      setPurpose("")
      setQrScanResult("")

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error("Error saving registration:", error)
      setImportError("Fout bij opslaan registratie")
      setTimeout(() => setImportError(""), 3000)
    }

    setIsLoading(false)
  }

  // QR Scanner functions
  const startQrScanner = () => {
    setShowQrScanner(true)
  }

  const stopQrScanner = () => {
    setShowQrScanner(false)
  }

  const handleQrCodeDetected = (qrCode: string) => {
    setQrScanResult(qrCode)

    if (qrScanMode === "registration") {
      const foundProduct = products.find((p) => p.qrcode === qrCode)

      if (foundProduct) {
        setSelectedProduct(foundProduct.name)
        setProductSearchQuery(foundProduct.name)
        if (foundProduct.categoryId) {
          setSelectedCategory(foundProduct.categoryId)
        }
        setImportMessage(`✅ Product gevonden: ${foundProduct.name}`)
        setTimeout(() => setImportMessage(""), 3000)
      } else {
        setImportError(`❌ Geen product gevonden voor QR code: ${qrCode}`)
        setTimeout(() => setImportError(""), 3000)
      }
    } else if (qrScanMode === "product-management") {
      setNewProductQrCode(qrCode)
      setImportMessage(`✅ QR code gescand: ${qrCode}`)
      setTimeout(() => setImportMessage(""), 3000)
    }

    stopQrScanner()
  }

  // Get filtered products for dropdown
  const getFilteredProducts = () => {
    const filtered = products
      .filter((product) => {
        if (selectedCategory === "all") return true
        return product.categoryId === selectedCategory
      })
      .filter(
        (product) =>
          product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          (product.qrcode && product.qrcode.toLowerCase().includes(productSearchQuery.toLowerCase())),
      )

    return filtered
  }

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product.name)
    setProductSearchQuery(product.name)
    setShowProductDropdown(false)
  }

  // Edit handlers
  const handleEditProduct = (product: Product) => {
    console.log("🔧 Starting product edit:", product)
    setOriginalProduct({ ...product })
    setEditingProduct({ ...product })
    setShowEditDialog(true)
  }

  const handleEditUser = (user: string) => {
    console.log("🔧 Starting user edit:", user)
    setOriginalUser(user)
    setEditingUser(user)
    setShowEditUserDialog(true)
  }

  const handleEditCategory = (category: Category) => {
    console.log("🔧 Starting category edit:", category)
    setOriginalCategory({ ...category })
    setEditingCategory({ ...category })
    setShowEditCategoryDialog(true)
  }

  const handleEditLocation = (location: string) => {
    console.log("🔧 Starting location edit:", location)
    setOriginalLocation(location)
    setEditingLocation(location)
    setShowEditLocationDialog(true)
  }

  const handleEditPurpose = (purpose: string) => {
    console.log("🔧 Starting purpose edit:", purpose)
    setOriginalPurpose(purpose)
    setEditingPurpose(purpose)
    setShowEditPurposeDialog(true)
  }

  // SIMPLIFIED: Save handlers - NO COMPLEX LOGIC
  const handleSaveProduct = async () => {
    if (!editingProduct || !originalProduct) return

    const hasChanges =
      editingProduct.name !== originalProduct.name ||
      editingProduct.qrcode !== originalProduct.qrcode ||
      editingProduct.categoryId !== originalProduct.categoryId

    if (!hasChanges) {
      setShowEditDialog(false)
      return
    }

    console.log("💾 Saving product changes:", { original: originalProduct, edited: editingProduct })

    const updateData = {
      name: editingProduct.name,
      qr_code: editingProduct.qrcode || null,
      category_id: editingProduct.categoryId ? Number.parseInt(editingProduct.categoryId) : null,
    }

    const result = await updateProduct(originalProduct.id, updateData)

    if (result.error) {
      console.error("❌ Error updating product:", result.error)
      setImportError("Fout bij bijwerken product")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Product updated successfully")
      setImportMessage("✅ Product bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)
      // Real-time subscription will update the UI automatically
    }

    setShowEditDialog(false)
  }

  const handleSaveUser = async () => {
    if (!editingUser.trim() || !originalUser) return

    const hasChanges = editingUser.trim() !== originalUser
    if (!hasChanges) {
      setShowEditUserDialog(false)
      return
    }

    console.log("💾 Saving user changes:", { original: originalUser, edited: editingUser.trim() })

    const result = await updateUser(originalUser, editingUser.trim())

    if (result.error) {
      console.error("❌ Error updating user:", result.error)
      setImportError("Fout bij bijwerken gebruiker")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ User updated successfully")
      setImportMessage("✅ Gebruiker bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)
      // Real-time subscription will update the UI automatically
    }

    setShowEditUserDialog(false)
  }

  const handleSaveCategory = async () => {
    if (!editingCategory || !originalCategory) return

    const hasChanges = editingCategory.name.trim() !== originalCategory.name
    if (!hasChanges) {
      setShowEditCategoryDialog(false)
      return
    }

    console.log("💾 Saving category changes:", { original: originalCategory, edited: editingCategory })

    const result = await updateCategory(originalCategory.id, { name: editingCategory.name.trim() })

    if (result.error) {
      console.error("❌ Error updating category:", result.error)
      setImportError("Fout bij bijwerken categorie")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Category updated successfully")
      setImportMessage("✅ Categorie bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)
      // Real-time subscription will update the UI automatically
    }

    setShowEditCategoryDialog(false)
  }

  const handleSaveLocation = async () => {
    if (!editingLocation.trim() || !originalLocation) return

    const hasChanges = editingLocation.trim() !== originalLocation
    if (!hasChanges) {
      setShowEditLocationDialog(false)
      return
    }

    console.log("💾 Saving location changes:", { original: originalLocation, edited: editingLocation.trim() })

    const result = await updateLocation(originalLocation, editingLocation.trim())

    if (result.error) {
      console.error("❌ Error updating location:", result.error)
      setImportError("Fout bij bijwerken locatie")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Location updated successfully")
      setImportMessage("✅ Locatie bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)
      // Real-time subscription will update the UI automatically
    }

    setShowEditLocationDialog(false)
  }

  const handleSavePurpose = async () => {
    if (!editingPurpose.trim() || !originalPurpose) return

    const hasChanges = editingPurpose.trim() !== originalPurpose
    if (!hasChanges) {
      setShowEditPurposeDialog(false)
      return
    }

    console.log("💾 Saving purpose changes:", { original: originalPurpose, edited: editingPurpose.trim() })

    const result = await updatePurpose(originalPurpose, editingPurpose.trim())

    if (result.error) {
      console.error("❌ Error updating purpose:", result.error)
      setImportError("Fout bij bijwerken doel")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Purpose updated successfully")
      setImportMessage("✅ Doel bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)
      // Real-time subscription will update the UI automatically
    }

    setShowEditPurposeDialog(false)
  }

  // Add functions
  const addNewUser = async () => {
    if (newUserName.trim() && !users.includes(newUserName.trim())) {
      const userName = newUserName.trim()
      console.log("💾 Adding new user:", userName)

      const result = await saveUser(userName)
      if (result.error) {
        console.error("Error saving user:", result.error)
        setImportError("Fout bij opslaan gebruiker")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ User added successfully")
        setImportMessage("✅ Gebruiker toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
        // Real-time subscription will update the UI automatically
      }

      setNewUserName("")
    }
  }

  const addNewProduct = async () => {
    if (newProductName.trim()) {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: newProductName.trim(),
        qrcode: newProductQrCode.trim() || undefined,
        categoryId: newProductCategory === "none" ? undefined : newProductCategory,
        created_at: new Date().toISOString(),
      }

      console.log("💾 Adding new product:", newProduct)

      const result = await saveProduct(newProduct)
      if (result.error) {
        console.error("Error saving product:", result.error)
        setImportError("Fout bij opslaan product")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ Product added successfully")
        setImportMessage("✅ Product toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
        // Real-time subscription will update the UI automatically
      }

      setNewProductName("")
      setNewProductQrCode("")
      setNewProductCategory("none")
    }
  }

  const addNewLocation = async () => {
    if (newLocationName.trim() && !locations.includes(newLocationName.trim())) {
      const locationName = newLocationName.trim()
      console.log("💾 Adding new location:", locationName)

      const result = await saveLocation(locationName)
      if (result.error) {
        console.error("Error saving location:", result.error)
        setImportError("Fout bij opslaan locatie")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ Location added successfully")
        setImportMessage("✅ Locatie toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
        // Real-time subscription will update the UI automatically
      }

      setNewLocationName("")
    }
  }

  const addNewPurpose = async () => {
    if (newPurposeName.trim() && !purposes.includes(newPurposeName.trim())) {
      const purposeName = newPurposeName.trim()
      console.log("💾 Adding new purpose:", purposeName)

      const result = await savePurpose(purposeName)
      if (result.error) {
        console.error("Error saving purpose:", result.error)
        setImportError("Fout bij opslaan doel")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ Purpose added successfully")
        setImportMessage("✅ Doel toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
        // Real-time subscription will update the UI automatically
      }

      setNewPurposeName("")
    }
  }

  const addNewCategory = async () => {
    if (newCategoryName.trim() && !categories.find((c) => c.name === newCategoryName.trim())) {
      const categoryName = newCategoryName.trim()
      console.log("💾 Adding new category:", categoryName)

      const result = await saveCategory({ name: categoryName })
      if (result.error) {
        console.error("Error saving category:", result.error)
        setImportError("Fout bij opslaan categorie")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ Category added successfully")
        setImportMessage("✅ Categorie toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
        // Real-time subscription will update the UI automatically
      }

      setNewCategoryName("")
    }
  }

  // Remove functions
  const removeUser = async (userToRemove: string) => {
    console.log("🗑️ Removing user:", userToRemove)

    const result = await deleteUser(userToRemove)
    if (result.error) {
      console.error("Error deleting user:", result.error)
      setImportError("Fout bij verwijderen gebruiker")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ User removed successfully")
      setImportMessage("✅ Gebruiker verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
      // Real-time subscription will update the UI automatically
    }
  }

  const removeProduct = async (productToRemove: Product) => {
    console.log("🗑️ Removing product:", productToRemove.id)

    const result = await deleteProduct(productToRemove.id)
    if (result.error) {
      console.error("Error deleting product:", result.error)
      setImportError("Fout bij verwijderen product")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Product removed successfully")
      setImportMessage("✅ Product verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
      // Real-time subscription will update the UI automatically
    }
  }

  const removeLocation = async (locationToRemove: string) => {
    console.log("🗑️ Removing location:", locationToRemove)

    const result = await deleteLocation(locationToRemove)
    if (result.error) {
      console.error("Error deleting location:", result.error)
      setImportError("Fout bij verwijderen locatie")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Location removed successfully")
      setImportMessage("✅ Locatie verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
      // Real-time subscription will update the UI automatically
    }
  }

  const removePurpose = async (purposeToRemove: string) => {
    console.log("🗑️ Removing purpose:", purposeToRemove)

    const result = await deletePurpose(purposeToRemove)
    if (result.error) {
      console.error("Error deleting purpose:", result.error)
      setImportError("Fout bij verwijderen doel")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Purpose removed successfully")
      setImportMessage("✅ Doel verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
      // Real-time subscription will update the UI automatically
    }
  }

  const removeCategory = async (categoryToRemove: Category) => {
    console.log("🗑️ Removing category:", categoryToRemove.id)

    const result = await deleteCategory(categoryToRemove.id)
    if (result.error) {
      console.error("Error deleting category:", result.error)
      setImportError("Fout bij verwijderen categorie")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Category removed successfully")
      setImportMessage("✅ Categorie verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
      // Real-time subscription will update the UI automatically
    }
  }

  // Function to get filtered and sorted users
  const getFilteredAndSortedUsers = () => {
    return users
      .filter((user) => user.toLowerCase().includes(userSearchQuery.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "nl", { sensitivity: "base" }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div
                  className="flex items-center bg-white p-4 rounded-lg shadow-sm border"
                  style={{ minWidth: "200px", height: "80px", position: "relative" }}
                >
                  <div className="w-1 h-12 bg-amber-500 absolute left-4"></div>
                  <div
                    className="text-2xl font-bold text-gray-800 tracking-wide absolute"
                    style={{ bottom: "16px", left: "32px" }}
                  >
                    DEMATIC
                  </div>
                </div>
              </div>

              <div className="hidden lg:block w-px h-16 bg-gray-300"></div>

              <div className="text-center lg:text-left">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Product Registratie</h1>
                <p className="text-sm lg:text-base text-gray-600 mt-1">Registreer product gebruik en locatie</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSupabaseConnected ? "bg-green-500" : "bg-orange-500"}`}></div>
                <span>{connectionStatus}</span>
              </div>
              <div className="hidden md:block">{registrations.length} registraties</div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">✅ Product succesvol geregistreerd!</AlertDescription>
          </Alert>
        )}

        {importMessage && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">{importMessage}</AlertDescription>
          </Alert>
        )}

        {importError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{importError}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 bg-white border border-gray-200 shadow-sm">
            <TabsTrigger
              value="register"
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              Registreren
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
              Geschiedenis ({registrations.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
              Gebruikers ({users.length})
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              Producten ({products.length})
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              Categorieën ({categories.length})
            </TabsTrigger>
            <TabsTrigger
              value="locations"
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              Locaties ({locations.length})
            </TabsTrigger>
            <TabsTrigger
              value="purposes"
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              Doelen ({purposes.length})
            </TabsTrigger>
            <TabsTrigger
              value="statistics"
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
            >
              Statistieken
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">📦 Nieuw Product Registreren</CardTitle>
                <CardDescription>Scan een QR code of vul onderstaande gegevens handmatig in</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-medium">👤 Gebruiker</Label>
                      <Select value={currentUser} onValueChange={setCurrentUser} required>
                        <SelectTrigger className="h-10 sm:h-12">
                          <SelectValue placeholder="Selecteer gebruiker" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user} value={user}>
                              {user}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-medium">🗂️ Categorie</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-10 sm:h-12">
                          <SelectValue placeholder="Selecteer een categorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle categorieën</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-medium">📦 Product</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1" ref={productSelectorRef}>
                          <div className="relative">
                            <Input
                              type="text"
                              placeholder="Zoek product..."
                              value={productSearchQuery}
                              onChange={(e) => {
                                setProductSearchQuery(e.target.value)
                                setShowProductDropdown(true)
                              }}
                              onFocus={() => setShowProductDropdown(true)}
                              className="h-10 sm:h-12 pr-8"
                              required
                            />
                            <ChevronDown
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
                              onClick={() => setShowProductDropdown(!showProductDropdown)}
                            />
                          </div>

                          {showProductDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {getFilteredProducts().length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500">Geen producten gevonden</div>
                              ) : (
                                getFilteredProducts().map((product) => (
                                  <div
                                    key={product.id}
                                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                    onClick={() => handleProductSelect(product)}
                                  >
                                    <div className="font-medium">{product.name}</div>
                                    {product.qrcode && (
                                      <div className="text-xs text-gray-500">QR: {product.qrcode}</div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            setQrScanMode("registration")
                            startQrScanner()
                          }}
                          className="h-10 sm:h-12 px-4 bg-blue-600 hover:bg-blue-700"
                          disabled={showQrScanner}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Scan QR
                        </Button>
                      </div>
                      {qrScanResult && <p className="text-sm text-green-600">✅ QR Code gescand: {qrScanResult}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-medium">📍 Locatie</Label>
                      <Select value={location} onValueChange={setLocation} required>
                        <SelectTrigger className="h-10 sm:h-12">
                          <SelectValue placeholder="Selecteer een locatie" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-medium">🎯 Doel</Label>
                      <Select value={purpose} onValueChange={setPurpose} required>
                        <SelectTrigger className="h-10 sm:h-12">
                          <SelectValue placeholder="Selecteer een doel" />
                        </SelectTrigger>
                        <SelectContent>
                          {purposes.map((purposeItem) => (
                            <SelectItem key={purposeItem} value={purposeItem}>
                              {purposeItem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 h-12 sm:h-14 text-base sm:text-lg font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "Bezig met registreren..." : "💾 Product Registreren"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add all other TabsContent sections here - users, products, categories, locations, purposes, history, statistics */}
        </Tabs>
      </div>

      {/* Add all dialogs and modals here */}
    </div>
  )
}
