"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { useReadContract } from "thirdweb/react"
import { getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

const contract = getContract({
  client,
  address: "0x1dc0CC61B373Baad3824dEAC7a8537b89d0b818f",
  chain: sepolia,
})

interface NGO {
  ngoContractAddress: string
  name: string
  description: string
  ipfsDocumentHash: string
  ngoAdmin: string
  isActive: boolean
  registrationTime: string
}

export default function TransparencyPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const { data: ngosData, isPending } = useReadContract({
    contract,
    method: "function getAllNGOs() view returns ((address ngoContractAddress, string name, string description, string ipfsDocumentHash, address ngoAdmin, bool isActive, uint256 registrationTime)[])",
    params: [],
  })

  const ngos: NGO[] = ngosData ? ngosData.map((ngo: any) => ({
    ngoContractAddress: ngo.ngoContractAddress,
    name: ngo.name,
    description: ngo.description,
    ipfsDocumentHash: ngo.ipfsDocumentHash,
    ngoAdmin: ngo.ngoAdmin,
    isActive: ngo.isActive,
    registrationTime: ngo.registrationTime.toString()
  })) : []

  const filteredNGOs =
    searchTerm.trim() === ""
      ? ngos
      : ngos.filter(
        (ngo) =>
          ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ngo.ngoAdmin.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ngo.ngoContractAddress.toLowerCase().includes(searchTerm.toLowerCase())
      )

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-primary py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-xl font-bold text-primary-foreground">NGO Transparency Platform</h1>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Public Transparency Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mx-auto max-w-md">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search by NGO name or address"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button onClick={() => setSearchTerm("")} variant="outline" disabled={!searchTerm}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isPending ? (
          <div className="text-center py-8">
            <p className="text-lg">Loading NGOs...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNGOs.length > 0 ? (
              filteredNGOs.map((ngo) => (
                <Card key={ngo.ngoContractAddress} className="flex flex-col h-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl truncate">{ngo.name}</CardTitle>
                      <Badge variant={ngo.isActive ? "secondary" : "destructive"}>
                        {ngo.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                    <p className="mb-4 text-muted-foreground line-clamp-3">{ngo.description}</p>
                    <div className="space-y-2">
                      <p className="text-xs">
                        <span className="font-semibold">Admin:</span>{" "}
                        <span className="font-mono">
                          {ngo.ngoAdmin.substring(0, 6)}...{ngo.ngoAdmin.substring(ngo.ngoAdmin.length - 4)}
                        </span>
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">Contract:</span>{" "}
                        <span className="font-mono">
                          {ngo.ngoContractAddress.substring(0, 6)}...{ngo.ngoContractAddress.substring(ngo.ngoContractAddress.length - 4)}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Link href={`/transparency/${ngo.ngoContractAddress}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center">
                <p className="text-lg text-muted-foreground">
                  {ngos.length === 0 ? "No NGOs registered yet." : "No NGOs found matching your search criteria."}
                </p>
              </div>
            )}
          </div>
        )}
      </main>


    </div>
  )
}