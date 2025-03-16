"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import DashboardLayout from "../../components/dashboard-layout"
import { useReadContract } from "thirdweb/react"
import { getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
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

export default function ViewNGOs() {
  const [ngos, setNgos] = useState<Array<{
    ngoContractAddress: string
    name: string
    description: string
    ipfsDocumentHash: string
    ngoAdmin: string
    isActive: boolean
    registrationTime: number
  }>>([])

  // Fetch all NGOs from the blockchain
  const { data, isPending } = useReadContract({
    contract,
    method: "function getAllNGOs() view returns ((address ngoContractAddress, string name, string description, string ipfsDocumentHash, address ngoAdmin, bool isActive, uint256 registrationTime)[])",
    params: [],
  })

  // Update the NGOs state when data is fetched
  useEffect(() => {
    if (data) {
      //@ts-ignore
      setNgos(data)
    }
  }, [data])

  return (
    <DashboardLayout title="View All NGOs" navItems={navItems}>
      <Card>
        <CardContent className="p-6">
          {isPending ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NGO Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Admin Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ngos.map((ngo) => (
                  <TableRow key={ngo.ngoContractAddress}>
                    <TableCell className="font-medium">{ngo.name}</TableCell>
                    <TableCell>{ngo.description}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {ngo.ngoAdmin.substring(0, 6)}...{ngo.ngoAdmin.substring(ngo.ngoAdmin.length - 4)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ngo.isActive ? "default" : "secondary"}>
                        {ngo.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(Number(ngo.registrationTime) * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/transparency/${ngo.ngoContractAddress}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}