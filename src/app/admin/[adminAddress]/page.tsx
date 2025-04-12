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
import { Loader2 } from "lucide-react"
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
        <div className="flex flex-col items-center justify-center h-64  ">
          <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-2">Loading dashboard...</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your admin access.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthorized) {
    return (
      <DashboardLayout title="Admin Dashboard" navItems={navItems} userRole="admin">
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold text-primary mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You are not authorized to access this admin dashboard.
            </p>
            {errorMessage && (
              <div className="my-4 p-4 border rounded-md">
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
            <Button
              className="mt-2"
              onClick={() => router.push("/login")}
            >
              Return to Login
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Admin Dashboard" navItems={navItems} userRole="admin">
      <div className="space-y-6">
   

            <div className="flex flex-col space-y-2">
              <h2 className="text-2xl font-bold">Welcome, Admin</h2>
              <p className="text-muted-foreground">
                Manage platform administrators, NGOs, and system settings from this dashboard.
              </p>
              <p className="text-muted-foreground">
                
                Connected: {activeAccount?.address ? 
                  `${activeAccount.address.substring(0, 6)}...${activeAccount.address.substring(activeAccount.address.length - 4)}` : 
                  "Not connected"}
              </p>
            </div>
        

     
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-primary/10">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium mb-1">Total NGOs</h3>
              <div className="text-3xl font-bold">
                {isNgoCountPending ? <Loader2 className="h-5 w-5 animate-spin" /> : ngoCount ? ngoCount.toString() : "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-primary/10">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium mb-1">Active NGOs</h3>
              <div className="text-3xl font-bold">
                {isNgosPending ? <Loader2 className="h-5 w-5 animate-spin" /> : activeNGOsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Accepting donations
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-primary/10">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium mb-1">Inactive NGOs</h3>
              <div className="text-3xl font-bold">
                {isNgosPending ? <Loader2 className="h-5 w-5 animate-spin" /> : inactiveNGOsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                On hold
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-primary/10">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium mb-1">Platform Admins</h3>
              <div className="text-3xl font-bold">
                {isAdminsPending ? <Loader2 className="h-5 w-5 animate-spin" /> : admins ? admins.length : "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                With admin access
              </p>
            </CardContent>
          </Card>
        </div>

      
        <Card className="border border-primary/10">
          <CardHeader>
            <CardTitle>Administrator Information</CardTitle>
            <CardDescription>Your role and capabilities on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
             
              
              <div className="space-y-3">
                <h3 className="font-medium text-lg mb-2">Your Admin Identity</h3>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <span className="text-sm font-medium">Wallet Address:</span>
                    <span className="font-mono text-xs">
                      {activeAccount?.address}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <span className="text-sm font-medium">Role:</span>
                    <span>Platform Administrator</span>
                  </div>
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <span className="text-sm font-medium">Network:</span>
                    <span>{sepolia.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 flex justify-end space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/admin/${adminAddress}/manage-ngos`)}
                >
                  Manage NGOs
                </Button>
                <Button 
                  onClick={() => router.push(`/admin/${adminAddress}/manage-admins`)}
                >
                  Manage Admins
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}