"use client"

import React, { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Switch } from "../../components/ui/switch"
import { useToast } from "../../hooks/use-toast"
import {prepareContractCall} from "thirdweb"
import {  useSendTransaction, useReadContract } from "thirdweb/react"
import { getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { Loader2 } from "lucide-react"
import DashboardLayout from "../../components/dashboard-layout"

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

export default function ChangeNGOStatus() {
  const { toast } = useToast()
  const [selectedNGO, setSelectedNGO] = useState<string | null>(null)
  const [ngoStatus, setNgoStatus] = useState<boolean>(true)
  const [isUpdating, setIsUpdating] = useState(false)

  
  const { data: ngos, isPending: isNGOsPending } = useReadContract({
    contract,
    method:
      "function getAllNGOs() view returns ((address ngoContractAddress, string name, string description, string ipfsDocumentHash, address ngoAdmin, bool isActive, uint256 registrationTime)[])",
      //@ts-ignore
    params: [],
  })


  const { mutate: sendTransaction, isPending: isTransactionPending } = useSendTransaction()


  const handleNGOSelect = (value: string) => {
    setSelectedNGO(value)
     //@ts-ignore
    const selected = ngos?.find((ngo) => ngo.ngoContractAddress === value)
    if (selected) {
         //@ts-ignore
      setNgoStatus(selected.isActive)
    }
  }

 
  const handleUpdateStatus = async () => {
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
      const transaction = prepareContractCall({
        contract,
        method: "function changeNGOStatus(address _ngoContract, bool _isActive)",
        params: [selectedNGO, ngoStatus],
      })

      await sendTransaction(transaction)

      toast({
        title: "Status updated",
        description: `NGO status has been updated to ${ngoStatus ? "Active" : "Inactive"}`,
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

  return (
    <DashboardLayout title="Change NGO Status" navItems={navItems}>
      <Card>
        <CardHeader>
          <CardTitle>Change NGO Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="selectNGO">Select NGO</Label>
              <Select value={selectedNGO || ""} onValueChange={handleNGOSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an NGO" />
                </SelectTrigger>
                <SelectContent>
                  {isNGOsPending ? (
                    <SelectItem value="loading" disabled>
                      Loading NGOs...
                    </SelectItem>
                  ) : ngos && ngos.length > 0 ? (
                    ngos.map((ngo) => (
                         //@ts-ignore
                      <SelectItem key={ngo.ngoContractAddress} value={ngo.ngoContractAddress}>{ ngo.name} ({ngo.isActive ? "Active" : "Inactive"})
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

            <div className="flex items-center space-x-2">
              <Label>Status</Label>
              <Switch
                checked={ngoStatus}
                onCheckedChange={setNgoStatus}
                disabled={!selectedNGO || isUpdating}
              />
              <span>{ngoStatus ? "Active" : "Inactive"}</span>
            </div>

            <Button
              onClick={handleUpdateStatus}
              disabled={!selectedNGO || isUpdating || isTransactionPending}
            >
              {isUpdating || isTransactionPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}