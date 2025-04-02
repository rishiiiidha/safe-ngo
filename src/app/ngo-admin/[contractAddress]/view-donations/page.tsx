"use client"

import { useState } from "react"
import { Card, CardContent } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import DashboardLayout from "../../../components/dashboard-layout"
import { useReadContract } from "thirdweb/react"
import { getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { formatEther } from "ethers"
import { useParams } from "next/navigation"



const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

export default function ViewDonations() {
  const [searchTerm, setSearchTerm] = useState("")
  const params = useParams()
  const contractAddress = Array.isArray(params.contractAddress) 
    ? params.contractAddress[0] 
    : params.contractAddress

  const navItems = [
    { label: "Home", href: `/ngo-admin/${contractAddress}` },
    { label: "Update NGO Details", href: `/ngo-admin/${contractAddress}/update-details` },
    { label: "Record Expenditure", href: `/ngo-admin/${contractAddress}/record-expenditure` },
    { label: "View Donations", href: `/ngo-admin/${contractAddress}/view-donations` },
    { label: "View Expenditures", href: `/ngo-admin/${contractAddress}/view-expenditures` },
  ]

  const ngoContract = getContract({
    client,
    address: contractAddress,
    chain: sepolia,
  })
  
  const { data: donations, isPending } = useReadContract({
    contract:ngoContract,
    method: "function getAllDonations() view returns ((address donor, uint256 amount, uint256 timestamp)[])",
    params: [],
  })

 
  const filteredDonations = donations
    ? donations.filter((donation) =>
        donation.donor.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : []

 
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000) 
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <DashboardLayout title="View Donations" navItems={navItems}>
      <div className="space-y-4">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="Search by donor address"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor Address</TableHead>
                  <TableHead>Amount (ETH)</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Loading donations...
                    </TableCell>
                  </TableRow>
                ) : filteredDonations.length > 0 ? (
                  filteredDonations.map((donation, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">
                        {donation.donor.substring(0, 6)}...
                        {donation.donor.substring(donation.donor.length - 4)}
                      </TableCell>
                      <TableCell>{formatEther(donation.amount)}</TableCell>
                      <TableCell>{formatDate(Number(donation.timestamp))}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No donations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}