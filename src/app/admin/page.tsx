"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import DashboardLayout from "../components/dashboard-layout"
import { useReadContract, useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { useEffect, useState } from "react"

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
  address: "0xb2c62A5c0845efbAD49cBcf72575C01FD00dFFEe", 
  chain: sepolia,
})

export default function AdminDashboard() {
  const activeAccount = useActiveAccount()
  const [isAuthorized, setIsAuthorized] = useState(false)


  const { data: ngoCount, isPending: isNgoCountPending } = useReadContract({
    contract,
    method: "function getNGOCount() view returns (uint256)",
    params: [],
     //@ts-ignore
    enabled: !!activeAccount,
  })

 


  const { data: isAdmin, isPending: isAdminPending } = useReadContract({
    contract,
    method: "function isAdmin(address _admin) view returns (bool)",
     //@ts-ignore
    params: activeAccount ? [activeAccount.address] : undefined,
    enabled: !!activeAccount,
  })


  useEffect(() => {
    if (isAdmin !== undefined) {
      setIsAuthorized(!!isAdmin)
    }
  }, [isAdmin])

  return (
    <DashboardLayout title="Admin Dashboard" navItems={navItems} userRole="admin">
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Welcome, Admin</h2>
          <p className="text-muted-foreground">
            Manage platform administrators, NGOs, and system settings from this dashboard.
          </p>
        </div>

        {!isAdminPending && !isAuthorized && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            <p className="font-medium">Warning: Your account is not authorized as an admin.</p>
            <p className="text-sm mt-1">Please connect with an admin wallet to access all features.</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total NGOs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isNgoCountPending ? "Loading..." : ngoCount ? ngoCount.toString() : "0"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}