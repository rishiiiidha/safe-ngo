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

const navItems = [
  { label: "Home", href: "/ngo-admin" },
  { label: "Update NGO Details", href: "/ngo-admin/update-details" },
  { label: "Record Expenditure", href: "/ngo-admin/record-expenditure" },
  { label: "View Donations", href: "/ngo-admin/view-donations" },
  { label: "View Expenditures", href: "/ngo-admin/view-expenditures" },
]


const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})


const contract = getContract({
  client,
  address: "0x5FC907DC9B4Bc9E85607eb5B280D382F46c5dDDC", 
  chain: sepolia,
})

export default function ViewExpenditures() {
  const [searchTerm, setSearchTerm] = useState("")
  const params = useParams();
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
  
  
  const { data: expenditures, isPending } = useReadContract({
    contract:ngoContract,
    method: "function getAllExpenditures() view returns ((string description, uint256 amount, uint256 timestamp, string ipfsReceiptHash)[])",
    params: [],
  })

 
  const filteredExpenditures = expenditures
    ? expenditures.filter((expenditure) =>
        expenditure.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : []

  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000) 
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const cleanIpfsHash = (ipfsHash: string) => {
    return ipfsHash.replace("ipfs://", "")
  }

  return (
    <DashboardLayout title="View Expenditures" navItems={navItems}>
      <div className="space-y-4">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="Search by description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount (ETH)</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>IPFS Receipt Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Loading expenditures...
                    </TableCell>
                  </TableRow>
                ) : filteredExpenditures.length > 0 ? (
                  filteredExpenditures.map((expenditure, index) => (
                    <TableRow key={index}>
                      <TableCell>{expenditure.description}</TableCell>
                      <TableCell>{formatEther(expenditure.amount)}</TableCell>
                      <TableCell>{formatDate(Number(expenditure.timestamp))}</TableCell>
                      <TableCell className="font-mono text-xs">
                        <a
                          href={`https://ipfs.io/ipfs/${cleanIpfsHash(expenditure.ipfsReceiptHash)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {cleanIpfsHash(expenditure.ipfsReceiptHash).substring(0, 10)}...
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No expenditures found
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