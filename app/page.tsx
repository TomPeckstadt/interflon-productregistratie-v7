"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Search, X, QrCode, ChevronDown, Edit } from "lucide-react"

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
} from "@/lib/supabase"

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

  // Data arrays
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
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [editingLocation, setEditingLocation] = useState<string | null>(null)
  const [showEditLocationDialog, setShowEditLocationDialog] = useState(false)
  const [editingPurpose, setEditingPurpose] = useState<string | null>(null)
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
    console.log("🔄 Loading data from Supabase...")
    setConnectionStatus("Verbinden met database...")

    try {
      // Check if Supabase is configured first
      const supabaseConfigured = isSupabaseConfigured()

      const [usersResult, productsResult, locationsResult, purposesResult, categoriesResult, registrationsResult] =
        await Promise.all([
          fetchUsers(),
          fetchProducts(),
          fetchLocations(),
          fetchPurposes(),
          fetchCategories(),
          fetchRegistrations(),
        ])

      console.log("📊 Data loaded:", {
        users: usersResult.data?.length || 0,
        products: productsResult.data?.length || 0,
        locations: locationsResult.data?.length || 0,
        purposes: purposesResult.data?.length || 0,
        categories: categoriesResult.data?.length || 0,
      })

      // Check if we have a real Supabase connection (not mock mode)
      const hasRealSupabaseConnection =
        supabaseConfigured && (!usersResult.error || (usersResult.error && usersResult.error.code !== "MOCK_MODE"))

      if (hasRealSupabaseConnection) {
        console.log("✅ Supabase connected successfully")
        setIsSupabaseConnected(true)
        setConnectionStatus("Supabase verbonden")

        // Set data from Supabase (even if empty arrays)
        setUsers(usersResult.data || [])
        setProducts(productsResult.data || [])
        setLocations(locationsResult.data || [])
        setPurposes(purposesResult.data || [])
        setCategories(categoriesResult.data || [])
        setRegistrations(registrationsResult.data || [])

        // Set default user if available
        if (usersResult.data && usersResult.data.length > 0) {
          setCurrentUser(usersResult.data[0])
        }

        // Set up real-time subscriptions
        setupSubscriptions()
      } else {
        console.log("⚠️ Supabase connection failed, using localStorage")
        setIsSupabaseConnected(false)
        setConnectionStatus("Lokale opslag actief")
        loadLocalStorageData()
      }
    } catch (error) {
      console.error("❌ Error loading data:", error)
      setIsSupabaseConnected(false)
      setConnectionStatus("Lokale opslag actief")
      loadLocalStorageData()
    }
  }

  const loadLocalStorageData = () => {
    console.log("📱 Loading from localStorage...")
    const savedUsers = localStorage.getItem("interflon-users")
    const savedProducts = localStorage.getItem("interflon-products")
    const savedLocations = localStorage.getItem("interflon-locations")
    const savedPurposes = localStorage.getItem("interflon-purposes")
    const savedCategories = localStorage.getItem("interflon-categories")
    const savedRegistrations = localStorage.getItem("interflon-registrations")

    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers)
      setUsers(parsedUsers)
    } else {
      const defaultUsers = ["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg"]
      setUsers(defaultUsers)
    }

    if (savedProducts) {
      const parsedProducts = JSON.parse(savedProducts)
      setProducts(parsedProducts)
    } else {
      const defaultProducts = [
        { id: "1", name: "Interflon Fin Super", qrcode: "IFLS001", categoryId: "1" },
        { id: "2", name: "Interflon Food Lube", qrcode: "IFFL002", categoryId: "1" },
        { id: "3", name: "Interflon Degreaser", qrcode: "IFD003", categoryId: "2" },
        { id: "4", name: "Interflon Fin Grease", qrcode: "IFGR004", categoryId: "1" },
        { id: "5", name: "Interflon Metal Clean", qrcode: "IFMC005", categoryId: "2" },
        { id: "6", name: "Interflon Maintenance Kit", qrcode: "IFMK006", categoryId: "3" },
      ]
      setProducts(defaultProducts)
    }

    if (savedLocations) {
      const parsedLocations = JSON.parse(savedLocations)
      setLocations(parsedLocations)
    } else {
      const defaultLocations = ["Kantoor 1.1", "Kantoor 1.2", "Vergaderzaal A", "Warehouse", "Thuis"]
      setLocations(defaultLocations)
    }

    if (savedPurposes) {
      const parsedPurposes = JSON.parse(savedPurposes)
      setPurposes(parsedPurposes)
    } else {
      const defaultPurposes = ["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie"]
      setPurposes(defaultPurposes)
    }

    if (savedCategories) {
      const parsedCategories = JSON.parse(savedCategories)
      setCategories(parsedCategories)
    } else {
      const defaultCategories = [
        { id: "1", name: "Smeermiddelen" },
        { id: "2", name: "Reinigers" },
        { id: "3", name: "Onderhoud" },
      ]
      setCategories(defaultCategories)
    }

    if (savedRegistrations) {
      const parsedRegistrations = JSON.parse(savedRegistrations)
      setRegistrations(parsedRegistrations)
    } else {
      setRegistrations([])
    }

    // Set default user
    if (!currentUser && users.length > 0) {
      setCurrentUser(users[0])
    }
  }

  const setupSubscriptions = () => {
    console.log("🔔 Setting up real-time subscriptions...")

    const usersSub = subscribeToUsers((newUsers) => {
      console.log("👥 Users updated:", newUsers.length)
      setUsers(newUsers)
    })

    const productsSub = subscribeToProducts((newProducts) => {
      console.log("📦 Products updated:", newProducts.length)
      setProducts(newProducts)
    })

    const locationsSub = subscribeToLocations((newLocations) => {
      console.log("📍 Locations updated:", newLocations.length)
      setLocations(newLocations)
    })

    const purposesSub = subscribeToPurposes((newPurposes) => {
      console.log("🎯 Purposes updated:", newPurposes.length)
      setPurposes(newPurposes)
    })

    const categoriesSub = subscribeToCategories((newCategories) => {
      console.log("🗂️ Categories updated:", newCategories.length)
      setCategories(newCategories)
    })

    const registrationsSub = subscribeToRegistrations((newRegistrations) => {
      console.log("📋 Registrations updated:", newRegistrations.length)
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

  // Save to localStorage whenever data changes (fallback)
  useEffect(() => {
    if (!isSupabaseConnected) {
      localStorage.setItem("interflon-users", JSON.stringify(users))
    }
  }, [users, isSupabaseConnected])

  useEffect(() => {
    if (!isSupabaseConnected) {
      localStorage.setItem("interflon-products", JSON.stringify(products))
    }
  }, [products, isSupabaseConnected])

  useEffect(() => {
    if (!isSupabaseConnected) {
      localStorage.setItem("interflon-locations", JSON.stringify(locations))
    }
  }, [locations, isSupabaseConnected])

  useEffect(() => {
    if (!isSupabaseConnected) {
      localStorage.setItem("interflon-purposes", JSON.stringify(purposes))
    }
  }, [purposes, isSupabaseConnected])

  useEffect(() => {
    if (!isSupabaseConnected) {
      localStorage.setItem("interflon-categories", JSON.stringify(categories))
    }
  }, [categories, isSupabaseConnected])

  useEffect(() => {
    if (!isSupabaseConnected) {
      localStorage.setItem("interflon-registrations", JSON.stringify(registrations))
    }
  }, [registrations, isSupabaseConnected])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !selectedProduct || !location || !purpose) {
      return
    }

    setIsLoading(true)

    try {
      const now = new Date()
      const product = products.find((p) => p.name === selectedProduct)

      const newRegistration: Registration = {
        id: Date.now().toString(),
        user: currentUser,
        product: selectedProduct,
        location,
        purpose,
        timestamp: now.toISOString(),
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
        qrcode: product?.qrcode,
      }

      if (isSupabaseConnected) {
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
          console.log("✅ Registration saved to Supabase")
        }
      } else {
        setRegistrations((prev) => [newRegistration, ...prev])
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

  // Add functions
  const addNewUser = async () => {
    if (newUserName.trim() && !users.includes(newUserName.trim())) {
      const userName = newUserName.trim()

      if (isSupabaseConnected) {
        console.log("💾 Saving user to Supabase:", userName)
        const result = await saveUser(userName)
        if (result.error) {
          console.error("Error saving user:", result.error)
          setImportError("Fout bij opslaan gebruiker")
          setTimeout(() => setImportError(""), 3000)
        } else {
          console.log("✅ User saved to Supabase")
          setUsers((prev) => [...prev, userName])
        }
      } else {
        setUsers((prev) => [...prev, userName])
      }

      setNewUserName("")
      setImportMessage("✅ Gebruiker toegevoegd!")
      setTimeout(() => setImportMessage(""), 2000)
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

      if (isSupabaseConnected) {
        console.log("💾 Saving product to Supabase:", newProduct)
        const result = await saveProduct(newProduct)
        if (result.error) {
          console.error("Error saving product:", result.error)
          setImportError("Fout bij opslaan product")
          setTimeout(() => setImportError(""), 3000)
        } else {
          console.log("✅ Product saved to Supabase")
          setProducts((prev) => [result.data, ...prev])
        }
      } else {
        setProducts((prev) => [newProduct, ...prev])
      }

      setNewProductName("")
      setNewProductQrCode("")
      setNewProductCategory("none")
      setImportMessage("✅ Product toegevoegd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const addNewLocation = async () => {
    if (newLocationName.trim() && !locations.includes(newLocationName.trim())) {
      const locationName = newLocationName.trim()

      if (isSupabaseConnected) {
        console.log("💾 Saving location to Supabase:", locationName)
        const result = await saveLocation(locationName)
        if (result.error) {
          console.error("Error saving location:", result.error)
          setImportError("Fout bij opslaan locatie")
          setTimeout(() => setImportError(""), 3000)
        } else {
          console.log("✅ Location saved to Supabase")
          setLocations((prev) => [...prev, locationName])
        }
      } else {
        setLocations((prev) => [...prev, locationName])
      }

      setNewLocationName("")
      setImportMessage("✅ Locatie toegevoegd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const addNewPurpose = async () => {
    if (newPurposeName.trim() && !purposes.includes(newPurposeName.trim())) {
      const purposeName = newPurposeName.trim()

      if (isSupabaseConnected) {
        console.log("💾 Saving purpose to Supabase:", purposeName)
        const result = await savePurpose(purposeName)
        if (result.error) {
          console.error("Error saving purpose:", result.error)
          setImportError("Fout bij opslaan doel")
          setTimeout(() => setImportError(""), 3000)
        } else {
          console.log("✅ Purpose saved to Supabase")
          setPurposes((prev) => [...prev, purposeName])
        }
      } else {
        setPurposes((prev) => [...prev, purposeName])
      }

      setNewPurposeName("")
      setImportMessage("✅ Doel toegevoegd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const addNewCategory = async () => {
    if (newCategoryName.trim() && !categories.find((c) => c.name === newCategoryName.trim())) {
      const categoryName = newCategoryName.trim()

      if (isSupabaseConnected) {
        console.log("💾 Saving category to Supabase:", categoryName)
        const result = await saveCategory({ name: categoryName })
        if (result.error) {
          console.error("Error saving category:", result.error)
          setImportError("Fout bij opslaan categorie")
          setTimeout(() => setImportError(""), 3000)
        } else {
          console.log("✅ Category saved to Supabase")
          setCategories((prev) => [...prev, result.data])
        }
      } else {
        const newCategory: Category = {
          id: Date.now().toString(),
          name: categoryName,
        }
        setCategories((prev) => [...prev, newCategory])
      }

      setNewCategoryName("")
      setImportMessage("✅ Categorie toegevoegd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  // Remove functions
  const removeUser = async (userToRemove: string) => {
    if (isSupabaseConnected) {
      console.log("🗑️ Deleting user from Supabase:", userToRemove)
      const result = await deleteUser(userToRemove)
      if (result.error) {
        console.error("Error deleting user:", result.error)
        setImportError("Fout bij verwijderen gebruiker")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ User deleted from Supabase")
        setUsers((prev) => prev.filter((u) => u !== userToRemove))
      }
    } else {
      setUsers((prev) => prev.filter((u) => u !== userToRemove))
    }

    setImportMessage("✅ Gebruiker verwijderd!")
    setTimeout(() => setImportMessage(""), 2000)
  }

  const removeProduct = async (productToRemove: Product) => {
    if (isSupabaseConnected) {
      console.log("🗑️ Deleting product from Supabase:", productToRemove.id)
      const result = await deleteProduct(productToRemove.id)
      if (result.error) {
        console.error("Error deleting product:", result.error)
        setImportError("Fout bij verwijderen product")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ Product deleted from Supabase")
        setProducts((prev) => prev.filter((p) => p.id !== productToRemove.id))
      }
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== productToRemove.id))
    }

    setImportMessage("✅ Product verwijderd!")
    setTimeout(() => setImportMessage(""), 2000)
  }

  const removeLocation = async (locationToRemove: string) => {
    if (isSupabaseConnected) {
      console.log("🗑️ Deleting location from Supabase:", locationToRemove)
      const result = await deleteLocation(locationToRemove)
      if (result.error) {
        console.error("Error deleting location:", result.error)
        setImportError("Fout bij verwijderen locatie")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ Location deleted from Supabase")
        setLocations((prev) => prev.filter((l) => l !== locationToRemove))
      }
    } else {
      setLocations((prev) => prev.filter((l) => l !== locationToRemove))
    }

    setImportMessage("✅ Locatie verwijderd!")
    setTimeout(() => setImportMessage(""), 2000)
  }

  const removePurpose = async (purposeToRemove: string) => {
    if (isSupabaseConnected) {
      console.log("🗑️ Deleting purpose from Supabase:", purposeToRemove)
      const result = await deletePurpose(purposeToRemove)
      if (result.error) {
        console.error("Error deleting purpose:", result.error)
        setImportError("Fout bij verwijderen doel")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ Purpose deleted from Supabase")
        setPurposes((prev) => prev.filter((p) => p !== purposeToRemove))
      }
    } else {
      setPurposes((prev) => prev.filter((p) => p !== purposeToRemove))
    }

    setImportMessage("✅ Doel verwijderd!")
    setTimeout(() => setImportMessage(""), 2000)
  }

  const removeCategory = async (categoryToRemove: Category) => {
    if (isSupabaseConnected) {
      console.log("🗑️ Deleting category from Supabase:", categoryToRemove.id)
      const result = await deleteCategory(categoryToRemove.id)
      if (result.error) {
        console.error("Error deleting category:", result.error)
        setImportError("Fout bij verwijderen categorie")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ Category deleted from Supabase")
        setCategories((prev) => prev.filter((c) => c.id !== categoryToRemove.id))
      }
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== categoryToRemove.id))
    }

    setImportMessage("✅ Categorie verwijderd!")
    setTimeout(() => setImportMessage(""), 2000)
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

          <TabsContent value="users">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">👥 Gebruikers Beheren</CardTitle>
                <CardDescription>Voeg nieuwe gebruikers toe of verwijder bestaande</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="text"
                      placeholder="Nieuwe gebruiker"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                    />
                    <Button onClick={addNewUser} className="bg-orange-600 hover:bg-orange-700">
                      <Plus className="mr-2 h-4 w-4" /> Toevoegen
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-search" className="text-sm font-medium">
                      Zoek gebruiker
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="user-search"
                        type="text"
                        placeholder="Zoek op naam..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                      {userSearchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-6 w-6 p-0"
                          onClick={() => setUserSearchQuery("")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    {getFilteredAndSortedUsers().length} van {users.length} gebruikers
                    {userSearchQuery && ` (gefilterd op "${userSearchQuery}")`}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Naam</TableHead>
                        <TableHead className="text-right">Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredAndSortedUsers().length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                            {userSearchQuery
                              ? `Geen gebruikers gevonden voor "${userSearchQuery}"`
                              : "Geen gebruikers beschikbaar"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        getFilteredAndSortedUsers().map((user) => (
                          <TableRow key={user}>
                            <TableCell>{user}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditingUser(user)
                                    setShowEditUserDialog(true)
                                  }}
                                  className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => removeUser(user)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">📦 Producten Beheren</CardTitle>
                <CardDescription>Voeg nieuwe producten toe of verwijder bestaande</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      type="text"
                      placeholder="Product naam"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                    />
                    <Input
                      type="text"
                      placeholder="QR Code (optioneel)"
                      value={newProductQrCode}
                      onChange={(e) => setNewProductQrCode(e.target.value)}
                    />
                    <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Geen categorie</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addNewProduct} className="bg-orange-600 hover:bg-orange-700">
                      <Plus className="mr-2 h-4 w-4" /> Toevoegen
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Naam</TableHead>
                        <TableHead>QR Code</TableHead>
                        <TableHead>Categorie</TableHead>
                        <TableHead className="text-right">Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            Geen producten beschikbaar
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>
                              {product.qrcode ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {product.qrcode}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {product.categoryId ? (
                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                                  {categories.find((c) => c.id === product.categoryId)?.name || "-"}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditingProduct(product)
                                    setShowEditDialog(true)
                                  }}
                                  className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => removeProduct(product)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">🗂️ Categorieën Beheren</CardTitle>
                <CardDescription>Voeg nieuwe categorieën toe of verwijder bestaande</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="text"
                      placeholder="Nieuwe categorie"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <Button onClick={addNewCategory} className="bg-orange-600 hover:bg-orange-700">
                      <Plus className="mr-2 h-4 w-4" /> Toevoegen
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Naam</TableHead>
                        <TableHead className="text-right">Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                            Geen categorieën beschikbaar
                          </TableCell>
                        </TableRow>
                      ) : (
                        categories.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell>{category.name}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditingCategory(category)
                                    setShowEditCategoryDialog(true)
                                  }}
                                  className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => removeCategory(category)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">📍 Locaties Beheren</CardTitle>
                <CardDescription>Voeg nieuwe locaties toe of verwijder bestaande</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="text"
                      placeholder="Nieuwe locatie"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                    />
                    <Button onClick={addNewLocation} className="bg-orange-600 hover:bg-orange-700">
                      <Plus className="mr-2 h-4 w-4" /> Toevoegen
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Naam</TableHead>
                        <TableHead className="text-right">Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                            Geen locaties beschikbaar
                          </TableCell>
                        </TableRow>
                      ) : (
                        locations.map((location) => (
                          <TableRow key={location}>
                            <TableCell>{location}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditingLocation(location)
                                    setShowEditLocationDialog(true)
                                  }}
                                  className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => removeLocation(location)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purposes">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">🎯 Doelen Beheren</CardTitle>
                <CardDescription>Voeg nieuwe doelen toe of verwijder bestaande</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="text"
                      placeholder="Nieuw doel"
                      value={newPurposeName}
                      onChange={(e) => setNewPurposeName(e.target.value)}
                    />
                    <Button onClick={addNewPurpose} className="bg-orange-600 hover:bg-orange-700">
                      <Plus className="mr-2 h-4 w-4" /> Toevoegen
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Naam</TableHead>
                        <TableHead className="text-right">Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purposes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                            Geen doelen beschikbaar
                          </TableCell>
                        </TableRow>
                      ) : (
                        purposes.map((purpose) => (
                          <TableRow key={purpose}>
                            <TableCell>{purpose}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditingPurpose(purpose)
                                    setShowEditPurposeDialog(true)
                                  }}
                                  className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => removePurpose(purpose)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">📋 Registratie Geschiedenis</CardTitle>
                <CardDescription>Bekijk alle product registraties</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Gebruiker</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Locatie</TableHead>
                      <TableHead>Doel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Geen registraties beschikbaar
                        </TableCell>
                      </TableRow>
                    ) : (
                      registrations.map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell>{new Date(registration.timestamp).toLocaleDateString("nl-NL")}</TableCell>
                          <TableCell>{registration.user}</TableCell>
                          <TableCell>{registration.product}</TableCell>
                          <TableCell>{registration.location}</TableCell>
                          <TableCell>{registration.purpose}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">📊 Statistieken</CardTitle>
                <CardDescription>Overzicht van alle registraties</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className\
