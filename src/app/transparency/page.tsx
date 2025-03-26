"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"


const mockNGOs = [
  {
    id: "1",
    name: "Clean Water Initiative",
    description: "Providing clean water to rural communities",
    adminAddress: "0x1234567890abcdef1234567890abcdef12345678",
  },
  {
    id: "2",
    name: "Education for All",
    description: "Supporting education in underprivileged areas",
    adminAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
  },
  {
    id: "3",
    name: "Food Security Project",
    description: "Ensuring food security in vulnerable communities",
    adminAddress: "0x7890abcdef1234567890abcdef1234567890abcd",
  },
  {
    id: "4",
    name: "Healthcare Access Program",
    description: "Improving healthcare access in remote areas",
    adminAddress: "0xdef1234567890abcdef1234567890abcdef1234",
  },
  {
    id: "5",
    name: "Environmental Conservation Trust",
    description: "Protecting natural habitats and biodiversity",
    adminAddress: "0x567890abcdef1234567890abcdef1234567890ab",
  },
]

export default function TransparencyPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [ngos] = useState(mockNGOs)


  const filteredNGOs =
    searchTerm.trim() === ""
      ? ngos
      : ngos.filter(
          (ngo) =>
            ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ngo.adminAddress.toLowerCase().includes(searchTerm.toLowerCase()),
        )

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-primary py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-foreground">NGO Transparency Platform</h1>
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNGOs.length > 0 ? (
            filteredNGOs.map((ngo) => (
              <Card key={ngo.id} className="overflow-hidden">
                <CardHeader className="bg-secondary/10 pb-2">
                  <CardTitle className="text-xl">{ngo.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="mb-4 text-muted-foreground">{ngo.description}</p>
                  <p className="mb-4 text-xs">
                    <span className="font-semibold">Admin Address:</span>{" "}
                    <span className="font-mono">
                      {ngo.adminAddress.substring(0, 6)}...{ngo.adminAddress.substring(ngo.adminAddress.length - 4)}
                    </span>
                  </p>
                  <Link href={`/transparency/${ngo.id}`}>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center">
              <p className="text-lg text-muted-foreground">No NGOs found matching your search criteria.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-primary py-6 text-primary-foreground">
        <div className="container mx-auto px-4">
          <p className="text-center">© {new Date().getFullYear()} NGO Transparency Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

