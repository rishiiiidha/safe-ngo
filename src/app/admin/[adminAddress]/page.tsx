"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import DashboardLayout from "../../components/dashboard-layout"
import { useReadContract, useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient, readContract } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "../../hooks/use-toast"
import { ArrowRight, Loader2, Users, Building, ToggleLeft, ListChecks } from "lucide-react"
import Link from "next/link"

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

const contract = getContract({
  client,
  address: "0x1dc0CC61B373Baad3824dEAC7a8537b89d0b818f", 
  chain: sepolia,
})

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const activeAccount = useActiveAccount()
  const params = useParams()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  const adminAddress = Array.isArray(params.adminAddress) 
    ? params.adminAddress[0] 
    : params.adminAddress

  const navItems = [
    { label: "Home", href: `/admin/${adminAddress}` },
    { label: "Manage Admins", href: `/admin/${adminAddress}/manage-admins` },
    { label: "Manage NGOs", href: `/admin/${adminAddress}/manage-ngos` },
    { label: "Change NGO Status", href: `/admin/${adminAddress}/change-ngo-status` },
    { label: "View All NGOs", href: `/admin/${adminAddress}/view-ngos` },
  ]

  const { data: ngoCount, isPending: isNgoCountPending } = useReadContract({
    contract,
    method: "function getNGOCount() view returns (uint256)",
    params: [],
    //@ts-ignore
    enabled: isAuthorized,
  })

  const { data: admins, isPending: isAdminsPending } = useReadContract({
    contract,
    method: "function getAllAdmins() view returns (address[])",
    params: [],
    //@ts-ignore
    enabled: isAuthorized,
  })

  const { data: ngos, isPending: isNgosPending } = useReadContract({
    contract,
    method: "function getAllNGOs() view returns ((address ngoContractAddress, string name, string description, string ipfsDocumentHash, address ngoAdmin, bool isActive, uint256 registrationTime)[])",
    params: [],
    //@ts-ignore
    enabled: isAuthorized,
  })

  const activeNGOsCount = ngos ? ngos.filter((ngo) => ngo.isActive).length : 0
  const inactiveNGOsCount = ngos ? ngos.length - activeNGOsCount : 0

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!activeAccount?.address) {
        toast({
          title: "No wallet connected",
          description: "Please connect your wallet to access the dashboard",
          variant: "destructive",
          duration: 5000,
        })
        router.push("/login")
        return
      }

      setIsLoading(true)
      setErrorMessage("")
      
      try {
        const isAdmin = await readContract({
          contract,
          method: "function isAdmin(address _admin) view returns (bool)",
          params: [activeAccount.address],
        })

        if (!isAdmin) {
          toast({
            title: "Access denied",
            description: "You are not registered as an admin",
            variant: "destructive",
            duration: 5000,
          })
          router.push("/login")
          return
        }

        if (adminAddress && adminAddress.toLowerCase() !== activeAccount.address.toLowerCase()) {
          toast({
            title: "Invalid admin address",
            description: "You are not authorized to access this admin dashboard",
            variant: "destructive",
            duration: 5000,
          })
          router.push("/login")
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Error verifying admin access:", error)
        setErrorMessage("Authentication error: " + (error instanceof Error ? error.message : "Unknown error"))
        
        toast({
          title: "Authentication error",
          description: "There was an error verifying your access. Please try again.",
          variant: "destructive",
          duration: 5000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (activeAccount?.address) {
      verifyAdminAccess()
    }
  }, [activeAccount?.address, adminAddress, router, toast])

  if (isLoading) {
    return (
      <DashboardLayout title="Admin Dashboard" navItems={navItems} userRole="admin">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">Loading dashboard...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we verify your admin access.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthorized) {
    return (
      <DashboardLayout title="Admin Dashboard" navItems={navItems} userRole="admin">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
            <p className="text-muted-foreground mt-2">You are not authorized to access this admin dashboard.</p>
            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-500">{errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Admin Dashboard" navItems={navItems} userRole="admin">
      <div className="space-y-8">
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Welcome, Admin</h2>
          <p className="text-muted-foreground">
            Manage platform administrators, NGOs, and system settings from this dashboard. Your wallet address: <span className="font-mono text-xs bg-slate-100 p-1 rounded">{activeAccount?.address}</span>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total NGOs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isNgoCountPending ? <Loader2 className="h-5 w-5 animate-spin" /> : ngoCount ? ngoCount.toString() : "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered organizations on platform
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active NGOs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isNgosPending ? <Loader2 className="h-5 w-5 animate-spin" /> : activeNGOsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently active and receiving donations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Inactive NGOs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">
                {isNgosPending ? <Loader2 className="h-5 w-5 animate-spin" /> : inactiveNGOsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently paused or disabled
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Platform Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isAdminsPending ? <Loader2 className="h-5 w-5 animate-spin" /> : admins ? admins.length : "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Users with administrative access
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href={`/admin/${adminAddress}/manage-ngos`} className="block">
                  <div className="border rounded-md p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <Building className="h-5 w-5 text-blue-500" />
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <h3 className="font-medium">Register New NGO</h3>
                    <p className="text-sm text-muted-foreground mt-1">Add a new organization to the platform</p>
                  </div>
                </Link>
                
                <Link href={`/admin/${adminAddress}/manage-admins`} className="block">
                  <div className="border rounded-md p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <h3 className="font-medium">Manage Admins</h3>
                    <p className="text-sm text-muted-foreground mt-1">Add or remove platform administrators</p>
                  </div>
                </Link>
                
                <Link href={`/admin/${adminAddress}/change-ngo-status`} className="block">
                  <div className="border rounded-md p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <ToggleLeft className="h-5 w-5 text-blue-500" />
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <h3 className="font-medium">Change NGO Status</h3>
                    <p className="text-sm text-muted-foreground mt-1">Activate or deactivate organizations</p>
                  </div>
                </Link>
                
                <Link href={`/admin/${adminAddress}/view-ngos`} className="block">
                  <div className="border rounded-md p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <ListChecks className="h-5 w-5 text-blue-500" />
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <h3 className="font-medium">View All NGOs</h3>
                    <p className="text-sm text-muted-foreground mt-1">See detailed information about all NGOs</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Administrator Information</CardTitle>
              <CardDescription>Your role and capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-md">
                  <h3 className="font-medium  mb-2">Admin Privileges</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="mr-2">•</span> 
                      <span>Register new NGOs with verified documentation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span> 
                      <span>Manage NGO status (active/inactive)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span> 
                      <span>Add or remove other platform administrators</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span> 
                      <span>View detailed information about all NGOs</span>
                    </li>
                  </ul>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Your Admin Identity</h3>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Wallet Address:</span>
                      <span className="font-mono text-xs bg-slate-100 p-1 rounded">{activeAccount?.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Role:</span>
                      <span className="text-sm font-medium">Platform Administrator</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Network:</span>
                      <span className="text-sm">{sepolia.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}