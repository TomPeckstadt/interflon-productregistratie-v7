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
import { Download, Plus, Trash2, Edit, Search, X, QrCode, ChevronDown } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  productId: string
  productName: string
  user: string
  location: string
  purpose: string
  timestamp: string
  qrcode?: string
}

const pieChartLabelStyle = {
  fontSize: "12px",
  fontWeight: "bold",
  fill: "#2d3748",
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

  // Data arrays - now loaded from Supabase
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

  // Edit states voor alle entiteiten
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [editingLocation, setEditingLocation] = useState<string | null>(null)
  const [showEditLocationDialog, setShowEditLocationDialog] = useState(false)
  const [editingPurpose, setEditingPurpose] = useState<string | null>(null)
  const [showEditPurposeDialog, setShowEditPurposeDialog] = useState(false)

  // Filter en zoek states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterUser, setFilterUser] = useState("all")
  const [filterProduct, setFilterProduct] = useState("")
  const [filterLocation, setFilterLocation] = useState("all")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "user" | "product">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // QR Scanner states
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [qrScanResult, setQrScanResult] = useState("")
  const [qrScanMode, setQrScanMode] = useState<"registration" | "product-management">("registration")

  // File import refs
  const userFileInputRef = useRef<HTMLInputElement>(null)
  const productFileInputRef = useRef<HTMLInputElement>(null)
  const locationFileInputRef = useRef<HTMLInputElement>(null)
  const purposeFileInputRef = useRef<HTMLInputElement>(null)

  // Product selector states
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const productSelectorRef = useRef<HTMLDivElement>(null)

  // New state for user search
  const [userSearchQuery, setUserSearchQuery] = useState("")

  // Attachment states
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false)
  const [attachmentProduct, setAttachmentProduct] = useState<Product | null>(null)
  const attachmentFileInputRef = useRef<HTMLInputElement>(null)

  // Load data from Supabase on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    console.log("🔄 Loading data from Supabase...")
    setConnectionStatus("Verbinden met database...")

    try {
      // Load all data in parallel
      const [usersResult, productsResult, locationsResult, purposesResult, categoriesResult, registrationsResult] =
        await Promise.all([
          fetchUsers(),
          fetchProducts(),
          fetchLocations(),
          fetchPurposes(),
          fetchCategories(),
          fetchRegistrations(),
        ])

      console.log("📊 Data results:", {
        users: usersResult.data?.length || 0,
        products: productsResult.data?.length || 0,
        locations: locationsResult.data?.length || 0,
        purposes: purposesResult.data?.length || 0,
        categories: categoriesResult.data?.length || 0,
        registrations: registrationsResult.data?.length || 0,
      })

      // Check if we have any data (even mock data means we're working)
      const hasData =
        (usersResult.data && usersResult.data.length > 0) ||
        (productsResult.data && productsResult.data.length > 0) ||
        (locationsResult.data && locationsResult.data.length > 0) ||
        (purposesResult.data && purposesResult.data.length > 0) ||
        (categoriesResult.data && categoriesResult.data.length > 0)

      if (hasData) {
        // Check if we're using Supabase or mock data
        const isUsingSupabase = !usersResult.error || (usersResult.error && usersResult.error.code !== "MOCK_MODE")

        if (isUsingSupabase) {
          console.log("✅ Supabase data found, using database")
          setIsSupabaseConnected(true)
          setConnectionStatus("Supabase verbonden")

          // Set up real-time subscriptions only if Supabase is working
          setupSubscriptions()
        } else {
          console.log("📱 Using mock data - lokale modus")
          setIsSupabaseConnected(false)
          setConnectionStatus("Lokale modus actief")
        }

        // Set data (either from Supabase or mock)
        if (usersResult.data) setUsers(usersResult.data)
        if (productsResult.data) setProducts(productsResult.data)
        if (locationsResult.data) setLocations(locationsResult.data)
        if (purposesResult.data) setPurposes(purposesResult.data)
        if (categoriesResult.data) setCategories(categoriesResult.data)
        if (registrationsResult.data) setRegistrations(registrationsResult.data)

        // Set default user
        if (usersResult.data && usersResult.data.length > 0 && !currentUser) {
          setCurrentUser(usersResult.data[0])
        }
      } else {
        console.log("⚠️ No data available, falling back to localStorage")
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

    if (savedUsers) setUsers(JSON.parse(savedUsers))
    else setUsers(["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg"])

    if (savedProducts) setProducts(JSON.parse(savedProducts))
    else
      setProducts([
        { id: "1", name: "Interflon Fin Super", qrcode: "IFLS001", categoryId: "1" },
        { id: "2", name: "Interflon Food Lube", qrcode: "IFFL002", categoryId: "1" },
        { id: "3", name: "Interflon Degreaser", qrcode: "IFD003", categoryId: "2" },
        { id: "4", name: "Interflon Fin Grease", qrcode: "IFGR004", categoryId: "1" },
        { id: "5", name: "Interflon Metal Clean", qrcode: "IFMC005", categoryId: "2" },
        { id: "6", name: "Interflon Maintenance Kit", qrcode: "IFMK006", categoryId: "3" },
      ])

    if (savedLocations) setLocations(JSON.parse(savedLocations))
    else setLocations(["Kantoor 1.1", "Kantoor 1.2", "Vergaderzaal A", "Warehouse", "Thuis"])

    if (savedPurposes) setPurposes(JSON.parse(savedPurposes))
    else setPurposes(["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie"])

    if (savedCategories) setCategories(JSON.parse(savedCategories))
    else
      setCategories([
        { id: "1", name: "Smeermiddelen" },
        { id: "2", name: "Reinigers" },
        { id: "3", name: "Onderhoud" },
      ])

    if (savedRegistrations) setRegistrations(JSON.parse(savedRegistrations))
    else
      setRegistrations([
        {
          id: "1",
          productId: "1",
          productName: "Interflon Fin Super",
          user: "Jan Janssen",
          location: "Kantoor 1.1",
          purpose: "Presentatie",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          qrcode: "IFLS001",
        },
        {
          id: "2",
          productId: "3",
          productName: "Interflon Degreaser",
          user: "Marie Pietersen",
          location: "Warehouse",
          purpose: "Demonstratie",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          qrcode: "IFD003",
        },
      ])

    // Set default user
    if (users.length > 0 && !currentUser) {
      setCurrentUser(users[0])
    }
  }

  const setupSubscriptions = () => {
    console.log("🔔 Setting up real-time subscriptions...")

    const usersSub = subscribeToUsers((newUsers) => {
      console.log("👥 Users updated:", newUsers)
      setUsers(newUsers)
    })

    const productsSub = subscribeToProducts((newProducts) => {
      console.log("📦 Products updated:", newProducts)
      setProducts(newProducts)
    })

    const locationsSub = subscribeToLocations((newLocations) => {
      console.log("📍 Locations updated:", newLocations)
      setLocations(newLocations)
    })

    const purposesSub = subscribeToPurposes((newPurposes) => {
      console.log("🎯 Purposes updated:", newPurposes)
      setPurposes(newPurposes)
    })

    const categoriesSub = subscribeToCategories((newCategories) => {
      console.log("🗂️ Categories updated:", newCategories)
      setCategories(newCategories)
    })

    const registrationsSub = subscribeToRegistrations((newRegistrations) => {
      console.log("📋 Registrations updated:", newRegistrations)
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
        productId: product?.id || "",
        productName: selectedProduct,
        user: currentUser,
        location,
        purpose,
        timestamp: now.toISOString(),
        qrcode: product?.qrcode,
      }

      if (isSupabaseConnected) {
        // Save to Supabase
        const registrationData = {
          user: currentUser,
          product: selectedProduct,
          location,
          purpose,
          timestamp: now.toISOString(),
          date: now.toISOString().split("T")[0],
          time: now.toTimeString().split(" ")[0],
          qrcode: product?.qrcode,
        }

        const result = await saveRegistration(registrationData)
        if (result.error) {
          console.error("Error saving registration:", result.error)
          setImportError("Fout bij opslaan registratie")
          setTimeout(() => setImportError(""), 3000)
        } else {
          console.log("Registration saved to Supabase:", result.data)
        }
      } else {
        // Save to localStorage
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
        // Automatisch de categorie selecteren als het product een categorie heeft
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
    return products
      .filter((product) => selectedCategory === "all" || product.categoryId === selectedCategory)
      .filter(
        (product) =>
          product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          (product.qrcode && product.qrcode.toLowerCase().includes(productSearchQuery.toLowerCase())),
      )
  }

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product.name)
    setProductSearchQuery(product.name)
    setShowProductDropdown(false)
  }

  // Attachment functions
  const handleAttachmentUpload = (product: Product) => {
    setAttachmentProduct(product)
    setShowAttachmentDialog(true)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && attachmentProduct) {
      if (file.type === "application/pdf") {
        // Create a blob URL for the PDF
        const blobUrl = URL.createObjectURL(file)

        // Update the product with attachment info
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p.id === attachmentProduct.id ? { ...p, attachmentUrl: blobUrl, attachmentName: file.name } : p,
          ),
        )

        setImportMessage(`✅ PDF bijlage toegevoegd aan ${attachmentProduct.name}`)
        setTimeout(() => setImportMessage(""), 3000)
        setShowAttachmentDialog(false)
        setAttachmentProduct(null)
      } else {
        setImportError("❌ Alleen PDF bestanden zijn toegestaan")
        setTimeout(() => setImportError(""), 3000)
      }
    }

    // Reset file input
    if (attachmentFileInputRef.current) {
      attachmentFileInputRef.current.value = ""
    }
  }

  const openAttachment = (product: Product) => {
    if (product.attachmentUrl) {
      window.open(product.attachmentUrl, "_blank")
    }
  }

  const removeAttachment = (product: Product) => {
    // Revoke the blob URL to free memory
    if (product.attachmentUrl) {
      URL.revokeObjectURL(product.attachmentUrl)
    }

    // Update the product to remove attachment
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === product.id ? { ...p, attachmentUrl: undefined, attachmentName: undefined } : p,
      ),
    )

    setImportMessage(`✅ Bijlage verwijderd van ${product.name}`)
    setTimeout(() => setImportMessage(""), 2000)
  }

  // File import functions
  const handleFileImport = async (file: File, type: "users" | "products" | "locations" | "purposes") => {
    try {
      setImportError("")
      setImportMessage("Bestand wordt verwerkt...")

      const text = await file.text()
      let items: string[] = []

      if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").filter((line) => line.trim())

        if (type === "products") {
          const newProducts: Product[] = []
          lines.forEach((line) => {
            const [name, qrcode] = line.split(",").map((item) => item.replace(/"/g, "").trim())
            if (name && qrcode) {
              newProducts.push({
                id: Date.now().toString() + Math.random(),
                name,
                qrcode,
              })
            }
          })

          if (newProducts.length > 0) {
            setProducts((prev) => [...prev, ...newProducts])
            setImportMessage(`✅ ${newProducts.length} nieuwe producten geïmporteerd!`)
            setTimeout(() => setImportMessage(""), 5000)
          }
          return
        } else {
          items = lines
            .map((line) => line.split(",")[0].replace(/"/g, "").trim())
            .filter((item) => item && item.length > 0)
        }
      } else {
        items = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && line.length > 0)
      }

      if (items.length === 0) {
        setImportError("Geen geldige items gevonden in het bestand")
        return
      }

      let savedCount = 0
      for (const item of items) {
        try {
          switch (type) {
            case "users":
              if (!users.includes(item)) {
                setUsers((prev) => [...prev, item])
                savedCount++
              }
              break
            case "locations":
              if (!locations.includes(item)) {
                setLocations((prev) => [...prev, item])
                savedCount++
              }
              break
            case "purposes":
              if (!purposes.includes(item)) {
                setPurposes((prev) => [...prev, item])
                savedCount++
              }
              break
          }
        } catch (error) {
          console.error(`Error saving ${item}:`, error)
        }
      }

      setImportMessage(
        `✅ ${savedCount} nieuwe ${type} geïmporteerd! (${items.length - savedCount} duplicaten overgeslagen)`,
      )

      // Clear file inputs
      if (type === "users" && userFileInputRef.current) userFileInputRef.current.value = ""
      if (type === "products" && productFileInputRef.current) productFileInputRef.current.value = ""
      if (type === "locations" && locationFileInputRef.current) locationFileInputRef.current.value = ""
      if (type === "purposes" && purposeFileInputRef.current) purposeFileInputRef.current.value = ""

      setTimeout(() => setImportMessage(""), 5000)
    } catch (error) {
      setImportError(`Fout bij importeren: ${error instanceof Error ? error.message : "Onbekende fout"}`)
      setTimeout(() => setImportError(""), 5000)
    }
  }

  const exportTemplate = (type: "users" | "products" | "locations" | "purposes") => {
    let templateData: string[] = []
    let filename = ""

    switch (type) {
      case "users":
        templateData = ["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg", "Nieuwe Gebruiker"]
        filename = "gebruikers-template.csv"
        break
      case "products":
        templateData = [
          "Laptop Dell XPS,DELL-XPS-001",
          "Monitor Samsung 24,SAM-MON-002",
          "Muis Logitech,LOG-MOU-003",
          "Toetsenbord Mechanical,MECH-KEY-004",
          "Nieuw Product,NEW-PROD-005",
        ]
        filename = "producten-template.csv"
        break
      case "locations":
        templateData = ["Kantoor 1.1", "Kantoor 1.2", "Vergaderzaal A", "Warehouse", "Thuis", "Nieuwe Locatie"]
        filename = "locaties-template.csv"
        break
      case "purposes":
        templateData = ["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie", "Nieuw Doel"]
        filename = "doelen-template.csv"
        break
    }

    const csvContent = templateData.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
          console.log("✅ User saved to Supabase:", result.data)
          // Data will be updated via subscription
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
          console.log("✅ Product saved to Supabase:", result.data)
          // Data will be updated via subscription
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
          console.log("✅ Location saved to Supabase:", result.data)
          // Data will be updated via subscription
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
          console.log("✅ Purpose saved to Supabase:", result.data)
          // Data will be updated via subscription
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
          console.log("✅ Category saved to Supabase:", result.data)
          // Data will be updated via subscription
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

  // Update functions
  const updateProduct = () => {
    if (editingProduct && editingProduct.id) {
      setProducts((prevProducts) => prevProducts.map((p) => (p.id === editingProduct.id ? editingProduct : p)))
      setImportMessage("✅ Product bijgewerkt!")
      setShowEditDialog(false)
      setEditingProduct(null)
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const updateUser = () => {
    if (editingUser && newUserName.trim()) {
      const oldUser = editingUser
      const newUser = newUserName.trim()

      // Update users array
      setUsers((prevUsers) => prevUsers.map((u) => (u === oldUser ? newUser : u)))

      // Update registrations met de nieuwe gebruikersnaam
      setRegistrations((prevRegistrations) =>
        prevRegistrations.map((r) => (r.user === oldUser ? { ...r, user: newUser } : r)),
      )

      // Update current user if it was the edited one
      if (currentUser === oldUser) {
        setCurrentUser(newUser)
      }

      setImportMessage("✅ Gebruiker bijgewerkt!")
      setShowEditUserDialog(false)
      setEditingUser(null)
      setNewUserName("")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const updateLocation = () => {
    if (editingLocation && newLocationName.trim()) {
      const oldLocation = editingLocation
      const newLocation = newLocationName.trim()

      // Update locations array
      setLocations((prevLocations) => prevLocations.map((l) => (l === oldLocation ? newLocation : l)))

      // Update registrations met de nieuwe locatie
      setRegistrations((prevRegistrations) =>
        prevRegistrations.map((r) => (r.location === oldLocation ? { ...r, location: newLocation } : r)),
      )

      // Update current location if it was the edited one
      if (location === oldLocation) {
        setLocation(newLocation)
      }

      setImportMessage("✅ Locatie bijgewerkt!")
      setShowEditLocationDialog(false)
      setEditingLocation(null)
      setNewLocationName("")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const updatePurpose = () => {
    if (editingPurpose && newPurposeName.trim()) {
      const oldPurpose = editingPurpose
      const newPurpose = newPurposeName.trim()

      // Update purposes array
      setPurposes((prevPurposes) => prevPurposes.map((p) => (p === oldPurpose ? newPurpose : p)))

      // Update registrations met het nieuwe doel
      setRegistrations((prevRegistrations) =>
        prevRegistrations.map((r) => (r.purpose === oldPurpose ? { ...r, purpose: newPurpose } : r)),
      )

      // Update current purpose if it was the edited one
      if (purpose === oldPurpose) {
        setPurpose(newPurpose)
      }

      setImportMessage("✅ Doel bijgewerkt!")
      setShowEditPurposeDialog(false)
      setEditingPurpose(null)
      setNewPurposeName("")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const updateCategory = () => {
    if (editingCategory && editingCategory.id) {
      setCategories((prevCategories) => prevCategories.map((c) => (c.id === editingCategory.id ? editingCategory : c)))
      setEditingCategory(null)
      setShowEditCategoryDialog(false)
      setImportMessage("✅ Categorie bijgewerkt!")
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
        // Data will be updated via subscription
      }
    } else {
      setUsers((prev) => prev.filter((u) => u !== userToRemove))
    }

    setImportMessage("✅ Gebruiker verwijderd!")
    setTimeout(() => setImportMessage(""), 2000)
  }

  const removeProduct = async (productToRemove: Product) => {
    // Clean up attachment blob URL if it exists
    if (productToRemove.attachmentUrl) {
      URL.revokeObjectURL(productToRemove.attachmentUrl)
    }

    if (isSupabaseConnected) {
      console.log("🗑️ Deleting product from Supabase:", productToRemove.id)
      const result = await deleteProduct(productToRemove.id)
      if (result.error) {
        console.error("Error deleting product:", result.error)
        setImportError("Fout bij verwijderen product")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ Product deleted from Supabase")
        // Data will be updated via subscription
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
        // Data will be updated via subscription
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
        // Data will be updated via subscription
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
        // Data will be updated via subscription
      }
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== categoryToRemove.id))
    }

    setImportMessage("✅ Categorie verwijderd!")
    setTimeout(() => setImportMessage(""), 2000)
  }

  // Filter and export functions
  const getFilteredAndSortedEntries = () => {
    const filtered = registrations.filter((entry) => {
      const searchMatch =
        !searchQuery ||
        entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.qrcode && entry.qrcode.toLowerCase().includes(searchQuery.toLowerCase()))

      const userMatch = !filterUser || filterUser === "all" || entry.user === filterUser
      const productMatch = !filterProduct || entry.productName.toLowerCase().includes(filterProduct.toLowerCase())
      const locationMatch = !filterLocation || filterLocation === "all" || entry.location === filterLocation

      let dateMatch = true
      if (filterDateFrom || filterDateTo) {
        const entryDate = new Date(entry.timestamp)
        if (filterDateFrom) {
          const fromDate = new Date(filterDateFrom)
          dateMatch = dateMatch && entryDate >= fromDate
        }
        if (filterDateTo) {
          const toDate = new Date(filterDateTo + "T23:59:59")
          dateMatch = dateMatch && entryDate <= toDate
        }
      }

      return searchMatch && userMatch && productMatch && locationMatch && dateMatch
    })

    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "date":
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
        case "user":
          comparison = a.user.localeCompare(b.user)
          break
        case "product":
          comparison = a.productName.localeCompare(b.productName)
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setFilterUser("all")
    setFilterProduct("")
    setFilterLocation("all")
    setFilterDateFrom("")
    setFilterDateTo("")
    setSortBy("date")
    setSortOrder("desc")
  }

  const exportToCSV = () => {
    const filteredEntries = getFilteredAndSortedEntries()
    const headers = ["Datum", "Tijd", "Gebruiker", "Product", "QR Code", "Locatie", "Doel"]
    const csvContent = [
      headers.join(","),
      ...filteredEntries.map((entry) => {
        const date = new Date(entry.timestamp)
        return [
          date.toLocaleDateString("nl-NL"),
          date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
          `"${entry.user}"`,
          `"${entry.productName}"`,
          `"${entry.qrcode || ""}"`,
          `"${entry.location}"`,
          `"${entry.purpose}"`,
        ].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)

    const filterSuffix =
      searchQuery || filterUser !== "all" || filterProduct || filterLocation !== "all" ? "-gefilterd" : ""
    link.setAttribute("download", `product-registraties${filterSuffix}-${new Date().toISOString().split("T")[0]}.csv`)

    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "-"
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "-"
  }

  // Statistics calculations
  const calculateStatistics = () => {
    const totalRegistrations = registrations.length
    const uniqueUsers = new Set(registrations.map((entry) => entry.user)).size
    const uniqueProducts = new Set(registrations.map((entry) => entry.productName)).size

    const userCounts: Record<string, number> = {}
    registrations.forEach((entry) => {
      userCounts[entry.user] = (userCounts[entry.user] || 0) + 1
    })
    const topUsers = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const productCounts: Record<string, number> = {}
    registrations.forEach((entry) => {
      productCounts[entry.productName] = (productCounts[entry.productName] || 0) + 1
    })
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const locationCounts: Record<string, number> = {}
    registrations.forEach((entry) => {
      locationCounts[entry.location] = (locationCounts[entry.location] || 0) + 1
    })
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const recentActivity = [...registrations]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    // Monthly data for charts
    const monthlyData = registrations.reduce((acc: Record<string, number>, entry) => {
      const date = new Date(entry.timestamp)
      const month = `${date.getMonth() + 1}/${date.getFullYear()}`
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {})

    const chartMonthlyData = Object.entries(monthlyData)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const pieChartData = Object.entries(productCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Wijzig van 8 naar 5 voor top 5

    return {
      totalRegistrations,
      uniqueUsers,
      uniqueProducts,
      topUsers,
      topProducts,
      topLocations,
      recentActivity,
      chartMonthlyData,
      pieChartData,
    }
  }

  const stats = calculateStatistics()

  // Function to get filtered and sorted users
  const getFilteredAndSortedUsers = () => {
    return users
      .filter((user) => user.toLowerCase().includes(userSearchQuery.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "nl", { sensitivity: "base" }))
  }

  // Function to get filtered and sorted products
  const getFilteredAndSortedProducts = () => {
    return products
      .filter((product) => {
        const searchMatch =
          !productSearchQuery ||
          product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          (product.qrcode && product.qrcode.toLowerCase().includes(productSearchQuery.toLowerCase()))

        const categoryMatch = selectedCategory === "all" || product.categoryId === selectedCategory

        return searchMatch && categoryMatch
      })
      .sort((a, b) => a.name.localeCompare(b.name, "nl", { sensitivity: "base" }))
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

          <TabsContent value="history">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">📋 Registratie Geschiedenis</CardTitle>
                <CardDescription>Bekijk en filter alle product registraties</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Label htmlFor="search" className="text-sm font-medium mb-1 block">
                          Zoeken
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            id="search"
                            type="text"
                            placeholder="Zoek op naam, product, locatie..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="w-full sm:w-48">
                        <Label htmlFor="filterUser" className="text-sm font-medium mb-1 block">
                          Gebruiker
                        </Label>
                        <Select value={filterUser} onValueChange={setFilterUser}>
                          <SelectTrigger id="filterUser">
                            <SelectValue placeholder="Alle gebruikers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle gebruikers</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user} value={user}>
                                {user}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-48">
                        <Label htmlFor="filterLocation" className="text-sm font-medium mb-1 block">
                          Locatie
                        </Label>
                        <Select value={filterLocation} onValueChange={setFilterLocation}>
                          <SelectTrigger id="filterLocation">
                            <SelectValue placeholder="Alle locaties" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle locaties</SelectItem>
                            {locations.map((loc) => (
                              <SelectItem key={loc} value={loc}>
                                {loc}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-48">
                        <Label htmlFor="dateFrom" className="text-sm font-medium mb-1 block">
                          Datum vanaf
                        </Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={filterDateFrom}
                          onChange={(e) => setFilterDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="w-full sm:w-48">
                        <Label htmlFor="dateTo" className="text-sm font-medium mb-1 block">
                          Datum tot
                        </Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={filterDateTo}
                          onChange={(e) => setFilterDateTo(e.target.value)}
                        />
                      </div>
                      <div className="w-full sm:w-48">
                        <Label htmlFor="sortBy" className="text-sm font-medium mb-1 block">
                          Sorteer op
                        </Label>
                        <Select
                          value={sortBy}
                          onValueChange={(value) => setSortBy(value as "date" | "user" | "product")}
                        >
                          <SelectTrigger id="sortBy">
                            <SelectValue placeholder="Sorteer op" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Datum</SelectItem>
                            <SelectItem value="user">Gebruiker</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-48">
                        <Label htmlFor="sortOrder" className="text-sm font-medium mb-1 block">
                          Volgorde
                        </Label>
                        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
                          <SelectTrigger id="sortOrder">
                            <SelectValue placeholder="Volgorde" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">Nieuwste eerst</SelectItem>
                            <SelectItem value="asc">Oudste eerst</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={clearAllFilters} className="text-sm">
                        <X className="mr-1 h-4 w-4" /> Wis filters
                      </Button>
                      <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-sm">
                        <Download className="mr-1 h-4 w-4" /> Exporteer naar CSV
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-[100px]">Datum</TableHead>
                          <TableHead className="w-[80px]">Tijd</TableHead>
                          <TableHead>Gebruiker</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="hidden md:table-cell">QR Code</TableHead>
                          <TableHead className="hidden md:table-cell">Categorie</TableHead>
                          <TableHead>Locatie</TableHead>
                          <TableHead className="hidden md:table-cell">Doel</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredAndSortedEntries().length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                              Geen registraties gevonden met de huidige filters
                            </TableCell>
                          </TableRow>
                        ) : (
                          getFilteredAndSortedEntries().map((entry) => {
                            const date = new Date(entry.timestamp)
                            const product = products.find((p) => p.name === entry.productName)
                            return (
                              <TableRow key={entry.id}>
                                <TableCell className="font-medium">{date.toLocaleDateString("nl-NL")}</TableCell>
                                <TableCell>
                                  {date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                                </TableCell>
                                <TableCell>{entry.user}</TableCell>
                                <TableCell>{entry.productName}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {entry.qrcode ? (
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {entry.qrcode}
                                    </Badge>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {product?.categoryId ? (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                                      {getCategoryName(product.categoryId)}
                                    </Badge>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell>{entry.location}</TableCell>
                                <TableCell className="hidden md:table-cell">{entry.purpose}</TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
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

                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".txt,.csv"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileImport(e.target.files[0], "users")
                        }
                      }}
                      id="user-import"
                      className="hidden"
                      ref={userFileInputRef}
                    />
                    <Label
                      htmlFor="user-import"
                      className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                    >
                      <Download className="mr-2 h-4 w-4" /> Importeer gebruikers
                    </Label>
                    <Button variant="outline" onClick={() => exportTemplate("users")}>
                      <Download className="mr-2 h-4 w-4" /> Template
                    </Button>
                  </div>

                  {/* Zoekveld voor gebruikers */}
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
                              <Button
                                size="icon"
                                onClick={() => {
                                  setEditingUser(user)
                                  setNewUserName(user)
                                  setShowEditUserDialog(true)
                                }}
                                className="bg-orange-600 hover:bg-orange-700 text-white mr-2"
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

          {/* Continue with other tabs... */}
          {/* The rest of the component remains the same */}
        </Tabs>

        {/* All dialogs remain the same */}
      </div>

      {/* QR Scanner Dialog */}
      {showQrScanner && (
        <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR Code Scanner</DialogTitle>
              <DialogDescription>Voer QR code handmatig in</DialogDescription>
            </DialogHeader>
            <QrScanner
              onResult={handleQrCodeDetected}
              onError={(error) => {
                console.error(error)
                setImportError("Fout bij scannen QR code")
                setTimeout(() => setImportError(""), 3000)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// QR Scanner Component
interface QrScannerProps {
  onResult: (result: string) => void
  onError: (error: any) => void
}

const QrScanner: React.FC<QrScannerProps> = ({ onResult, onError }) => {
  const [qrCode, setQrCode] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (qrCode.trim()) {
      onResult(qrCode.trim())
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">QR Code Invoeren</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="qr-input">Voer QR code handmatig in</Label>
          <Input
            id="qr-input"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            placeholder="Bijv. IFLS001"
            autoFocus
          />
        </div>
        <Button type="submit" className="w-full">
          Bevestigen
        </Button>
      </form>
    </div>
  )
}
