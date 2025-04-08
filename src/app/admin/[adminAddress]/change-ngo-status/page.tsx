"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Switch } from "../../../components/ui/switch"
import { useToast } from "../../../hooks/use-toast"
import { prepareContractCall, readContract } from "thirdweb"
import { useSendTransaction, useReadContract, useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { Loader2, AlertCircle } from "lucide-react"
import DashboardLayout from "../../../components/dashboard-layout"
import { Alert, AlertDescription } from "../../../components/ui/alert"

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

const contract = getContract({
  client,
  address: "0x1dc0CC61B373Baad3824dEAC7a8537b89d0b818f",
  chain: sepolia,
})

export default function ChangeNGOStatus() {
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
  
  const [selectedNGO, setSelectedNGO] = useState<string | null>(null)
  const [selectedNGOName, setSelectedNGOName] = useState<string>("")
  const [ngoStatus, setNgoStatus] = useState<boolean>(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const navItems = [
    { label: "Home", href: `/admin/${adminAddress}` },
    { label: "Manage Admins", href: `/admin/${adminAddress}/manage-admins` },
    { label: "Manage NGOs", href: `/admin/${adminAddress}/manage-ngos` },
    { label: "Change NGO Status", href: `/admin/${adminAddress}/change-ngo-status` },
    { label: "View All NGOs", href: `/admin/${adminAddress}/view-ngos` },
  ]

  const { data: ngos, isPending: isNGOsPending } = useReadContract({
    contract,
    method:
      "function getAllNGOs() view returns ((address ngoContractAddress, string name, string description, string ipfsDocumentHash, address ngoAdmin, bool isActive, uint256 registrationTime)[])",
    params: [],
    //@ts-ignore
    enabled: isAuthorized,
  })

  const { mutate: sendTransaction, isPending: isTransactionPending } = useSendTransaction()

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

  const handleNGOSelect = (value: string) => {
    setSelectedNGO(value)
    //@ts-ignore
    const selected = ngos?.find((ngo) => ngo.ngoContractAddress === value)
    if (selected) {
      //@ts-ignore
      setNgoStatus(selected.isActive)
      //@ts-ignore
      setSelectedNGOName(selected.name)
    }
  }

  const handleUpdateStatus = async () => {
    if (!isAuthorized) {
      toast({
        title: "Unauthorized",
        description: "You need admin privileges to perform this action",
        variant: "destructive",
      })
      return
    }
    
    if (!selectedNGO) {
      toast({
        title: "No NGO selected",
        description: "Please select an NGO to update its status",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)

    try {
      toast({
        title: "Processing",
        description: "Please confirm the transaction in your wallet",
        duration: 5000,
      })
      
      const transaction = prepareContractCall({
        contract,
        method: "function changeNGOStatus(address _ngoContract, bool _isActive)",
        params: [selectedNGO, ngoStatus],
      })

      await sendTransaction(transaction)

      toast({
        title: "Status updated",
        description: `${selectedNGOName} status has been updated to ${ngoStatus ? "Active" : "Inactive"}`,
        variant: "default",
        className: "bg-green-100 border-green-400 text-green-900",
      })
    } catch (error) {
      console.error("Error updating NGO status:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating the NGO status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Change NGO Status" navItems={navItems} userRole="admin">
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
      <DashboardLayout title="Change NGO Status" navItems={navItems} userRole="admin">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
            <p className="text-muted-foreground mt-2">You are not authorized to change NGO status.</p>
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
    <DashboardLayout title="Change NGO Status" navItems={navItems} userRole="admin">
      <Alert className="mb-6" variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Changing an NGO&apos;s status will affect its visibility and ability to receive donations. Please use this feature responsibly.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Change NGO Status</CardTitle>
            <CardDescription>
              Select an NGO and toggle its active status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="selectNGO">Select NGO</Label>
                <Select value={selectedNGO || ""} onValueChange={handleNGOSelect}>
                  <SelectTrigger id="selectNGO" className="w-full">
                    <SelectValue placeholder="Select an NGO" />
                  </SelectTrigger>
                  <SelectContent>
                    {isNGOsPending ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                        Loading NGOs...
                      </SelectItem>
                    ) : ngos && ngos.length > 0 ? (
                      ngos.map((ngo, index) => (
                        //@ts-ignore
                        <SelectItem key={index} value={ngo.ngoContractAddress}>
                          {ngo.name} ({ngo.isActive ? "Active" : "Inactive"})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="empty" disabled>
                        No NGOs registered
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedNGO && (
                <>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md">
                    <div>
                      <p className="font-medium">{selectedNGOName}</p>
                      <p className="text-sm text-muted-foreground">Current Status: {ngoStatus ? "Active" : "Inactive"}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ngoStatus"
                        checked={ngoStatus}
                        onCheckedChange={setNgoStatus}
                        disabled={isUpdating}
                      />
                      <Label htmlFor="ngoStatus" className="font-medium text-sm">
                        {ngoStatus ? "Active" : "Inactive"}
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm">
                      {ngoStatus 
                        ? "Setting an NGO to Active allows it to receive donations and appear in public listings."
                        : "Setting an NGO to Inactive will hide it from public listings and prevent it from receiving donations."}
                    </p>
                    
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={!selectedNGO || isUpdating || isTransactionPending}
                      className="w-full"
                    >
                      {isUpdating || isTransactionPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        `Update to ${ngoStatus ? "Active" : "Inactive"}`
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status Information</CardTitle>
            <CardDescription>
              About NGO status management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <h3 className="font-medium mb-2">Active Status</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>NGO is visible on the public platform</li>
                  <li>Can receive donations from users</li>
                  <li>Financial transactions are enabled</li>
                  <li>Listed in search results and directories</li>
                </ul>
              </div>
              
              <div className="rounded-md border p-4">
                <h3 className="font-medium mb-2">Inactive Status</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>NGO is hidden from public view</li>
                  <li>Cannot receive new donations</li>
                  <li>Financial transactions are disabled</li>
                  <li>Not listed in search results or directories</li>
                </ul>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Status changes are recorded on the blockchain and are visible to all network participants.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}