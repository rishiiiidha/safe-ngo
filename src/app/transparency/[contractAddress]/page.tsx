"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card"
import { Progress } from "../../components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { useReadContract, useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { Badge } from "../../components/ui/badge"
import { Eye, FileText, ArrowLeft, LayoutDashboard, Loader2 } from "lucide-react"
import { useParams } from "next/navigation"

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

interface Donation {
  donor: string
  amount: bigint
  timestamp: bigint
}

interface Expenditure {
  description: string
  amount: bigint
  timestamp: bigint
  ipfsReceiptHash: string
}

export default function NGOTransparencyPage() {
  const params = useParams();
  const ngoContractAddress = Array.isArray(params.contractAddress)
    ? params.contractAddress[0]
    : params.contractAddress
  const activeAccount = useActiveAccount()
  const [isLoading, setIsLoading] = useState(true)

  const ngoContract = getContract({
    client,
    address: ngoContractAddress,
    chain: sepolia,
  })

  const { data: name, isLoading: nameLoading } = useReadContract({
    contract: ngoContract,
    method: "function name() view returns (string)",
    params: [],
  })

  const { data: description, isLoading: descLoading } = useReadContract({
    contract: ngoContract,
    method: "function description() view returns (string)",
    params: [],
  })

  const { data: ngoAdmin, isLoading: adminLoading } = useReadContract({
    contract: ngoContract,
    method: "function ngoAdmin() view returns (address)",
    params: [],
  })

  const { data: creationTime, isLoading: timeLoading } = useReadContract({
    contract: ngoContract,
    method: "function creationTime() view returns (uint256)",
    params: [],
  })

  const { data: transparencyScore, isLoading: scoreLoading } = useReadContract({
    contract: ngoContract,
    method: "function getTransparencyScore() view returns (uint256)",
    params: [],
  })

  const { data: currentBalance, isLoading: balanceLoading } = useReadContract({
    contract: ngoContract,
    method: "function getBalance() view returns (uint256)",
    params: [],
  })

  const { data: ipfsDocumentHash, isLoading: docHashLoading } = useReadContract({
    contract: ngoContract,
    method: "function ipfsDocumentHash() view returns (string)",
    params: [],
  })

  const { data: isActive, isLoading: activeLoading } = useReadContract({
    contract: ngoContract,
    method: "function isActive() view returns (bool)",
    params: [],
  })

  const { data: donationsData, isLoading: donationsLoading } = useReadContract({
    contract: ngoContract,
    method: "function getAllDonations() view returns ((address donor, uint256 amount, uint256 timestamp)[])",
    params: [],
  })

  const { data: expendituresData, isLoading: expendituresLoading } = useReadContract({
    contract: ngoContract,
    method: "function getAllExpenditures() view returns ((string description, uint256 amount, uint256 timestamp, string ipfsReceiptHash)[])",
    params: [],
  })

  useEffect(() => {
    if (!nameLoading && !descLoading && !adminLoading && !timeLoading &&
      !scoreLoading && !balanceLoading && !docHashLoading &&
      !activeLoading && !donationsLoading && !expendituresLoading) {
      setIsLoading(false);
    }
  }, [nameLoading, descLoading, adminLoading, timeLoading, scoreLoading,
    balanceLoading, docHashLoading, activeLoading, donationsLoading, expendituresLoading]);

  const donations: Donation[] = donationsData ? donationsData.map(donation => ({ ...donation })) : []
  const expenditures: Expenditure[] = expendituresData ? expendituresData.map(expenditure => ({ ...expenditure })) : []

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const formatEth = (wei: bigint) => {
    return Number(wei) / 10 ** 18
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  const sortedDonations = [...donations].sort((a, b) =>
    Number(b.timestamp) - Number(a.timestamp)
  )

  const sortedExpenditures = [...expenditures].sort((a, b) =>
    Number(b.timestamp) - Number(a.timestamp)
  )

  const totalDonations = donations.reduce((sum, donation) =>
    sum + formatEth(donation.amount), 0
  )

  const totalExpenditures = expenditures.reduce((sum, expenditure) =>
    sum + formatEth(expenditure.amount), 0
  )

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-primary py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/">
          <h1 className="text-xl font-bold text-primary-foreground">SAFE-NGO</h1>
          </Link>
           
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <h2 className="text-lg font-semibold">Loading NGO Information...</h2>
            <p className="text-muted-foreground">Please wait while we retrieve information from the blockchain.</p>
          </div>
        ) : (
          <>
            <Card className="mb-6 shadow">
              <CardHeader className="border-b bg-muted/40 py-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">{name || "NGO"}</CardTitle>
                  {isActive !== undefined && (
                    <Badge variant={isActive ? "default" : "destructive"}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{description || "No description available"}</p>
              </CardHeader>
              <CardContent className="py-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Admin</h3>
                    <p className="font-mono text-xs">
                      {ngoAdmin ? formatAddress(ngoAdmin) : "Loading..."}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Registration Date</h3>
                    <p className="text-sm">
                      {creationTime ? formatDate(creationTime) : "Loading..."}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Balance</h3>
                    <p className="text-sm font-medium">
                      {currentBalance ? `${formatEth(currentBalance).toFixed(4)} ETH` : "0.0000 ETH"}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Transparency Score</h3>
                    <div className="flex items-center">
                      <Progress
                        value={transparencyScore ? Number(transparencyScore) : 0}
                        className={`h-2 flex-grow mr-2 ${transparencyScore ? getScoreColor(Number(transparencyScore)) : ""}`}
                      />
                      <span className="text-sm font-medium">
                        {transparencyScore ? `${transparencyScore}/100` : "0/100"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              {ipfsDocumentHash && (
                <CardFooter className="border-t bg-muted/20 py-4 flex justify-center">
                  <a
                    href={`https://ipfs.io/ipfs/${ipfsDocumentHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" /> View Registration Documents
                  </a>
                </CardFooter>
              )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Total Donations</h3>
                    <span className="text-xs text-muted-foreground">{donations.length} transactions</span>
                  </div>
                  <p className="text-lg font-semibold">{totalDonations.toFixed(4)} ETH</p>
                </CardContent>
              </Card>

              <Card className="shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Total Expenditures</h3>
                    <span className="text-xs text-muted-foreground">{expenditures.length} transactions</span>
                  </div>
                  <p className="text-lg font-semibold">{totalExpenditures.toFixed(4)} ETH</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="donations" className="mb-6">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="donations">Donations History</TabsTrigger>
                <TabsTrigger value="expenditures">Expenditures History</TabsTrigger>
              </TabsList>

              <TabsContent value="donations">
                <Card className="shadow">
                  <CardHeader className="py-4 px-6 border-b">
                    <CardTitle>Donations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {sortedDonations.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-muted-foreground">No donations recorded yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="py-3">Donor</TableHead>
                              <TableHead className="text-right py-3">Amount (ETH)</TableHead>
                              <TableHead className="text-right py-3">Date & Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedDonations.map((donation, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono text-xs py-3">
                                  {formatAddress(donation.donor)}
                                </TableCell>
                                <TableCell className="text-right py-3">
                                  {formatEth(donation.amount).toFixed(4)}
                                </TableCell>
                                <TableCell className="text-right py-3">
                                  {formatDate(donation.timestamp)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenditures">
                <Card className="shadow">
                  <CardHeader className="py-4 px-6 border-b">
                    <CardTitle>Expenditures</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {sortedExpenditures.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-muted-foreground">No expenditures recorded yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="py-3">Description</TableHead>
                              <TableHead className="text-right py-3">Amount (ETH)</TableHead>
                              <TableHead className="text-right py-3">Date & Time</TableHead>
                              <TableHead className="text-right py-3">Receipt</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedExpenditures.map((expenditure, index) => (
                              <TableRow key={index}>
                                <TableCell className="py-3">{expenditure.description}</TableCell>
                                <TableCell className="text-right py-3">
                                  {formatEth(expenditure.amount).toFixed(4)}
                                </TableCell>
                                <TableCell className="text-right py-3">
                                  {formatDate(expenditure.timestamp)}
                                </TableCell>
                                <TableCell className="text-right py-3">
                                  <a
                                    href={`https://ipfs.io/ipfs/${expenditure.ipfsReceiptHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center"
                                  >
                                    <FileText className="h-5 w-5 mr-2" />
                                    <span>View Receipt</span>
                                  </a>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  )
}
