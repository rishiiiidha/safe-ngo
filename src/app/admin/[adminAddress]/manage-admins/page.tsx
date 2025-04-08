"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import DashboardLayout from "../../../components/dashboard-layout"
import { useSendTransaction, useReadContract, useActiveAccount } from "thirdweb/react"
import { prepareContractCall, getContract, createThirdwebClient, readContract } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { useToast } from "../../../hooks/use-toast"
import { Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "../../../components/ui/alert"

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

const contract = getContract({
  client,
  address: "0x1dc0CC61B373Baad3824dEAC7a8537b89d0b818f", 
  chain: sepolia,
})

export default function ManageAdmins() {
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
  
  const [newAdminAddress, setNewAdminAddress] = useState("")
  const [adminToRemove, setAdminToRemove] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const navItems = [
    { label: "Home", href: `/admin/${adminAddress}` },
    { label: "Manage Admins", href: `/admin/${adminAddress}/manage-admins` },
    { label: "Manage NGOs", href: `/admin/${adminAddress}/manage-ngos` },
    { label: "Change NGO Status", href: `/admin/${adminAddress}/change-ngo-status` },
    { label: "View All NGOs", href: `/admin/${adminAddress}/view-ngos` },
  ]

  const { data: admins, isPending: isLoadingAdmins, error: adminsError } = useReadContract({
    contract,
    method: "function getAllAdmins() view returns (address[])",
    params: [],
    //@ts-ignore
    queryKey: ["admins", refreshKey],
    enabled: isAuthorized,
  })

  const { mutate: sendTransaction } = useSendTransaction()

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

  const refreshAdminList = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleAddAdmin = async () => {
    if (!isAuthorized) {
      toast({
        title: "Unauthorized",
        description: "You need admin privileges to perform this action",
        variant: "destructive",
      })
      return
    }
    
    if (!newAdminAddress) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid admin address",
        variant: "destructive",
      })
      return
    }

    setIsAdding(true)

    try {
      const transaction = prepareContractCall({
        contract,
        method: "function addAdmin(address _admin)",
        params: [newAdminAddress],
      })

      await sendTransaction(transaction)

      toast({
        title: "Admin added",
        description: `Admin ${newAdminAddress.substring(0, 10)}... has been added successfully`,
        variant: "default",
        className: "bg-green-100 border-green-400 text-green-900",
      })

      setNewAdminAddress("")
      refreshAdminList()
    } catch (error) {
      console.error("Error adding admin:", error)
      toast({
        title: "Failed to add admin",
        description: "There was an error adding the admin",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveAdmin = async () => {
    if (!isAuthorized) {
      toast({
        title: "Unauthorized",
        description: "You need admin privileges to perform this action",
        variant: "destructive",
      })
      return
    }
    
    if (!adminToRemove) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid admin address",
        variant: "destructive",
      })
      return
    }

    setIsRemoving(true)

    try {
      const transaction = prepareContractCall({
        contract,
        method: "function removeAdmin(address _admin)",
        params: [adminToRemove],
      })

      await sendTransaction(transaction)

      toast({
        title: "Admin removed",
        description: `Admin ${adminToRemove.substring(0, 10)}... has been removed successfully`,
        variant: "default",
        className: "bg-green-100 border-green-400 text-green-900",
      })

      setAdminToRemove("")
      refreshAdminList()
    } catch (error) {
      console.error("Error removing admin:", error)
      toast({
        title: "Failed to remove admin",
        description: "There was an error removing the admin",
        variant: "destructive",
      })
    } finally {
      setIsRemoving(false)
    }
  }

  const handleSelectAdmin = (address: string) => {
    setAdminToRemove(address)
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Manage Admins" navItems={navItems} userRole="admin">
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
      <DashboardLayout title="Manage Admins" navItems={navItems} userRole="admin">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
            <p className="text-muted-foreground mt-2">You are not authorized to manage admins.</p>
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
    <DashboardLayout title="Manage Admins" navItems={navItems} userRole="admin">
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Admin management should be handled with care. Admins have full control over NGO registration and status changes.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminAddress">Admin Address</Label>
                <Input
                  id="adminAddress"
                  placeholder="0x..."
                  value={newAdminAddress}
                  onChange={(e) => setNewAdminAddress(e.target.value)}
                  disabled={isAdding}
                />
                <p className="text-xs text-muted-foreground">Enter the Ethereum address of the new admin</p>
              </div>
              <Button 
                onClick={handleAddAdmin} 
                disabled={isAdding || !isAuthorized}
                className="w-full"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Admin"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Remove Admin</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshAdminList}
              disabled={isLoadingAdmins}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingAdmins ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminToRemove">Admin Address</Label>
                <Input
                  id="adminToRemove"
                  placeholder="0x..."
                  value={adminToRemove}
                  onChange={(e) => setAdminToRemove(e.target.value)}
                  disabled={isRemoving}
                />
                <p className="text-xs text-muted-foreground">You can select an admin from the list below or enter the address manually</p>
              </div>
              
              <div className="space-y-2">
                <Label>Current Admins</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                  {isLoadingAdmins ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading admins...</span>
                    </div>
                  ) : adminsError ? (
                    <div className="text-red-500 text-sm py-2">
                      Error loading admins. Please try refreshing.
                    </div>
                  ) : admins && admins.length > 0 ? (
                    <div className="space-y-2">
                      {admins.map((admin: string, index: number) => (
                        <div 
                          key={index}
                          className={`p-2 rounded-md cursor-pointer hover:bg-gray-100 text-sm truncate ${
                            admin === adminToRemove ? 'bg-blue-50 border border-blue-200' : ''
                          }`}
                          onClick={() => handleSelectAdmin(admin)}
                        >
                          {admin}
                          {admin.toLowerCase() === activeAccount?.address?.toLowerCase() && (
                            <span className="ml-2 text-xs text-blue-500">(You)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm py-2">
                      No admins found.
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                variant="destructive"
                onClick={handleRemoveAdmin}
                disabled={!adminToRemove || isRemoving || !isAuthorized || adminToRemove.toLowerCase() === activeAccount?.address?.toLowerCase()}
                className="w-full"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove Admin"
                )}
              </Button>
              {adminToRemove.toLowerCase() === activeAccount?.address?.toLowerCase() && (
                <p className="text-xs text-red-500 text-center">You cannot remove yourself as an admin</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}