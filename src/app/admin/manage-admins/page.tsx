"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import DashboardLayout from "../../components/dashboard-layout"
import { useSendTransaction, useReadContract } from "thirdweb/react"
import { prepareContractCall, getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { useToast } from "../../hooks/use-toast"
import { Loader2, RefreshCw } from "lucide-react"

const navItems = [
  { label: "Home", href: "/admin" },
  { label: "Manage Admins", href: "/admin/manage-admins" },
  { label: "Manage NGOs", href: "/admin/manage-ngos" },
  { label: "Change NGO Status", href: "/admin/change-ngo-status" },
  { label: "View All NGOs", href: "/admin/view-ngos" },
]

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

const contract = getContract({
  client,
  address: "0x1dc0CC61B373Baad3824dEAC7a8537b89d0b818f", 
  chain: sepolia,
})

export default function ManageAdmins() {
  const { toast } = useToast()
  const [newAdminAddress, setNewAdminAddress] = useState("")
  const [adminToRemove, setAdminToRemove] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: admins, isPending: isLoadingAdmins, error: adminsError } = useReadContract({
    contract,
    method: "function getAllAdmins() view returns (address[])",
    params: [],
    //@ts-ignore
    queryKey: ["admins", refreshKey],
  })

  const { mutate: sendTransaction } = useSendTransaction()

  const refreshAdminList = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleAddAdmin = async () => {
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
  //@ts-ignore
  const handleSelectAdmin = (address) => {
    setAdminToRemove(address)
  }

  return (
    <DashboardLayout title="Manage Admins" navItems={navItems}>
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
              </div>
              <Button onClick={handleAddAdmin} disabled={isAdding}>
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
                      {admins.map((admin, index) => (
                        <div 
                          key={index}
                          className={`p-2 rounded-md cursor-pointer hover:bg-gray-100 text-sm truncate ${
                            admin === adminToRemove ? 'bg-blue-50 border border-blue-200' : ''
                          }`}
                          onClick={() => handleSelectAdmin(admin)}
                        >
                          {admin}
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
                disabled={!adminToRemove || isRemoving}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}