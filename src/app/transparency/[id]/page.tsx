"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Progress } from "../../components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"


const mockNGODetails = {
  id: "1",
  name: "Clean Water Initiative",
  description: "Providing clean water to rural communities through sustainable infrastructure and education.",
  adminAddress: "0x1234567890abcdef1234567890abcdef12345678",
  registrationDate: "2023-01-15",
  transparencyScore: 85,
  currentBalance: "2.49",
}


const mockDonations = [
  {
    id: "1",
    donorAddress: "0x1234567890abcdef1234567890abcdef12345678",
    amount: "0.5",
    timestamp: "2023-05-15T10:30:00Z",
  },
  {
    id: "2",
    donorAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    amount: "1.2",
    timestamp: "2023-05-20T14:45:00Z",
  },
  {
    id: "3",
    donorAddress: "0x7890abcdef1234567890abcdef1234567890abcd",
    amount: "0.75",
    timestamp: "2023-05-25T09:15:00Z",
  },
  {
    id: "4",
    donorAddress: "0x1234567890abcdef1234567890abcdef12345678",
    amount: "0.3",
    timestamp: "2023-06-01T16:20:00Z",
  },
  {
    id: "5",
    donorAddress: "0xdef1234567890abcdef1234567890abcdef1234",
    amount: "2.0",
    timestamp: "2023-06-05T11:10:00Z",
  },
]


const mockExpenditures = [
  {
    id: "1",
    description: "Water purification equipment",
    amount: "1.2",
    timestamp: "2023-05-18T11:30:00Z",
    ipfsHash: "QmXyz123456789abcdef1",
  },
  {
    id: "2",
    description: "Community training program",
    amount: "0.5",
    timestamp: "2023-05-22T15:45:00Z",
    ipfsHash: "QmXyz123456789abcdef2",
  },
  {
    id: "3",
    description: "Transportation costs",
    amount: "0.25",
    timestamp: "2023-05-28T10:15:00Z",
    ipfsHash: "QmXyz123456789abcdef3",
  },
  {
    id: "4",
    description: "Well construction materials",
    amount: "0.8",
    timestamp: "2023-06-03T14:20:00Z",
    ipfsHash: "QmXyz123456789abcdef4",
  },
]

export default function NGOTransparencyPage({ params }: { params: { id: string } }) {
  const [ngoDetails, setNgoDetails] = useState(mockNGODetails)
  const [donations, setDonations] = useState(mockDonations)
  const [expenditures, setExpenditures] = useState(mockExpenditures)

  useEffect(() => {
    console.log("Fetching data for NGO ID:", params.id)

 
  }, [params.id])


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-primary py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-foreground">NGO Transparency Platform</h1>
            <div className="space-x-2">
              <Link href="/transparency">
                <Button variant="ghost" className="text-primary-foreground">
                  Back to Search
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{ngoDetails.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{ngoDetails.description}</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Admin Address</h3>
                <p className="font-mono text-xs">
                  {ngoDetails.adminAddress.substring(0, 6)}...
                  {ngoDetails.adminAddress.substring(ngoDetails.adminAddress.length - 4)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Registration Date</h3>
                <p>{ngoDetails.registrationDate}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Current Balance</h3>
                <p>{ngoDetails.currentBalance} ETH</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Transparency Score</h3>
                <div className="flex items-center space-x-2">
                  <Progress value={ngoDetails.transparencyScore} className="h-2" />
                  <span>{ngoDetails.transparencyScore}/100</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="donations">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="expenditures">Expenditures</TabsTrigger>
          </TabsList>

          <TabsContent value="donations">
            <Card>
              <CardHeader>
                <CardTitle>Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor Address</TableHead>
                      <TableHead>Amount (ETH)</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell className="font-mono text-xs">
                          {donation.donorAddress.substring(0, 6)}...
                          {donation.donorAddress.substring(donation.donorAddress.length - 4)}
                        </TableCell>
                        <TableCell>{donation.amount}</TableCell>
                        <TableCell>{formatDate(donation.timestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenditures">
            <Card>
              <CardHeader>
                <CardTitle>Expenditures</CardTitle>
              </CardHeader>
              <CardContent>
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
                    {expenditures.map((expenditure) => (
                      <TableRow key={expenditure.id}>
                        <TableCell>{expenditure.description}</TableCell>
                        <TableCell>{expenditure.amount}</TableCell>
                        <TableCell>{formatDate(expenditure.timestamp)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          <a
                            href={`https://ipfs.io/ipfs/${expenditure.ipfsHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {expenditure.ipfsHash.substring(0, 10)}...
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-primary py-6 text-primary-foreground">
        <div className="container mx-auto px-4">
          <p className="text-center">© {new Date().getFullYear()} NGO Transparency Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

