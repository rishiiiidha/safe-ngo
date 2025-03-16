"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import DashboardLayout from "../../components/dashboard-layout"
import {  useSendTransaction } from "thirdweb/react"
import { prepareContractCall, getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { useToast } from "../../hooks/use-toast"
import { Loader2 } from "lucide-react"

const navItems = [
  { label: "Home", href: "/admin" },
  { label: "Manage Admins", href: "/admin/manage-admins" },
  { label: "Manage NGOs", href: "/admin/manage-ngos" },
  { label: "Change NGO Status", href: "/admin/change-ngo-status" },
  { label: "View All NGOs", href: "/admin/view-ngos" },
]

// Create thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

// Get contract instance
const contract = getContract({
  client,
  address: "0xb2c62A5c0845efbAD49cBcf72575C01FD00dFFEe", // Replace with your contract address
  chain: sepolia,
})

export default function ManageAdmins() {
  const { toast } = useToast()
  const [newAdminAddress, setNewAdminAddress] = useState("")
  const [adminToRemove, setAdminToRemove] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  // For transaction submission
  const { mutate: sendTransaction } = useSendTransaction()

  // Handle adding an admin
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

  // Handle removing an admin
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
          <CardHeader>
            <CardTitle>Remove Admin</CardTitle>
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