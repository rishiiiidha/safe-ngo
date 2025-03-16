"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import DashboardLayout from "../components/dashboard-layout"
import { useReadContract, useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { formatEther } from "ethers"

const navItems = [
  { label: "Home", href: "/ngo-admin" },
  { label: "Update NGO Details", href: "/ngo-admin/update-details" },
  { label: "Record Expenditure", href: "/ngo-admin/record-expenditure" },
  { label: "View Donations", href: "/ngo-admin/view-donations" },
  { label: "View Expenditures", href: "/ngo-admin/view-expenditures" },
]

// Create thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})
// const activeAccount = useActiveAccount()
// // Get main contract instance
// const mainContract = getContract({
//   client,
//   address: "0xb2c62A5c0845efbAD49cBcf72575C01FD00dFFEe", // Replace with your main contract address
//   chain: sepolia,
// })
// const { data: ngoContractAddressData } = useReadContract({
//   contract: mainContract,
//   method: "function ngoAddressToContract(address) view returns (address)",
//   params: [activeAccount?.address || ""],
//    //@ts-ignore
//   enabled: !!activeAccount?.address,
// })

  const ngoContract = getContract({
      client,
      address: "0x2025685e9D3C317a3502BdFBa9A1CDDE10bD6711",
      chain: sepolia,
    })
 

export default function NGOAdminDashboard() {
  


 

  // Fetch NGO details using useReadContract
  const { data: name } = useReadContract({
    
    contract: ngoContract || undefined, // Pass undefined if ngoContract is null
    method: "function name() view returns (string)",
    params: [],
     //@ts-ignore
    enabled: !!ngoContract, // Only run if ngoContract is valid
  })

  const { data: description } = useReadContract({
     
    contract: ngoContract || undefined,
    method: "function description() view returns (string)",
    params: [],
    //@ts-ignore
    enabled: !!ngoContract,
  })

  const { data: creationTime } = useReadContract({
     //@ts-ignore
    contract: ngoContract || undefined,
    method: "function creationTime() view returns (uint256)",
    params: [],
    //@ts-ignore
    enabled: !!ngoContract,
  })

  const { data: balance } = useReadContract({
     //@ts-ignore
    contract: ngoContract || undefined,
    method: "function getBalance() view returns (uint256)",
    params: [],
    //@ts-ignore
    enabled: !!ngoContract,
  })

  const { data: donationCount } = useReadContract({
     //@ts-ignore
    contract: ngoContract || undefined,
    method: "function getDonationCount() view returns (uint256)",
    params: [],
    //@ts-ignore
    enabled: !!ngoContract,
  })

  const { data: totalDonations } = useReadContract({
     //@ts-ignore
    contract: ngoContract || undefined,
    method: "function totalDonations() view returns (uint256)",
    params: [],
    //@ts-ignore
    enabled: !!ngoContract,
  })

  const { data: totalExpenditures } = useReadContract({
     //@ts-ignore
    contract: ngoContract || undefined,
    method: "function totalExpenditures() view returns (uint256)",
    params: [],
    //@ts-ignore
    enabled: !!ngoContract,
  })

  const { data: transparencyScore } = useReadContract({
     //@ts-ignore
    contract: ngoContract || undefined,
    method: "function getTransparencyScore() view returns (uint256)",
    params: [],
    //@ts-ignore
    enabled: !!ngoContract,
  })

  const { data: ipfsDocumentHash } = useReadContract({
     //@ts-ignore
    contract: ngoContract || undefined,
    method: "function ipfsDocumentHash() view returns (string)",
    params: [],
    //@ts-ignore
    enabled: !!ngoContract,
  })

  const { data: expenditureCount } = useReadContract({
    //@ts-ignore
    contract: ngoContract || undefined,
    method: "function getExpenditureCount() view returns (uint256)",
    params: [],
    //@ts-ignore
    enabled: !!ngoContract,
  })

  return (
    <DashboardLayout title="NGO Admin Dashboard" navItems={navItems} userRole="ngo">
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Welcome, {name || "Loading..."}</h2>
          <p className="text-muted-foreground">
            {description || "Loading NGO description..."}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Created on: {creationTime ? new Date(Number(creationTime) * 1000).toLocaleDateString() : "Loading..."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalDonations ? `${formatEther(totalDonations)} ETH` : "Loading..."}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Expenditures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalExpenditures ? `${formatEther(totalExpenditures)} ETH` : "Loading..."}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {balance ? `${formatEther(balance)} ETH` : "Loading..."}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Donation Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donationCount?.toString() || "Loading..."}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expenditure Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenditureCount?.toString() || "Loading..."}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transparency Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transparencyScore?.toString() || "Loading..."}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IPFS Document</CardTitle>
          </CardHeader>
          <CardContent>
            {ipfsDocumentHash ? (
              <a
                href={`https://ipfs.io/ipfs/${ipfsDocumentHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Document
              </a>
            ) : (
              <p className="text-muted-foreground">No document uploaded</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}