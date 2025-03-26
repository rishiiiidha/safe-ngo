"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import DashboardLayout from "../../components/dashboard-layout"

const navItems = [
  { label: "Home", href: "/donor" },
  { label: "Donate to NGO", href: "/donor/donate" },
  { label: "View My Donations", href: "/donor/my-donations" },
]

const mockNGOs = [
  {
    id: "1",
    name: "Clean Water Initiative",
    description: "Providing clean water to rural communities",
    balance: "2.49 ETH",
  },
  {
    id: "2",
    name: "Education for All",
    description: "Supporting education in underprivileged areas",
    balance: "3.75 ETH",
  },
  {
    id: "3",
    name: "Food Security Project",
    description: "Ensuring food security in vulnerable communities",
    balance: "1.20 ETH",
  },
  {
    id: "4",
    name: "Healthcare Access Program",
    description: "Improving healthcare access in remote areas",
    balance: "4.10 ETH",
  },
  {
    id: "5",
    name: "Environmental Conservation Trust",
    description: "Protecting natural habitats and biodiversity",
    balance: "2.85 ETH",
  },
]

export default function DonatePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [ngos] = useState(mockNGOs)

  const filteredNGOs =
    searchTerm.trim() === "" ? ngos : ngos.filter((ngo) => ngo.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleDonateClick = (ngoId: string) => {
    router.push(`/donor/donate/${ngoId}`)
  }

  return (
    <DashboardLayout title="Donate to NGO" navItems={navItems}>
      <div className="space-y-6">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input placeholder="Search by NGO name" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Button onClick={() => setSearchTerm("")} variant="outline" disabled={!searchTerm}>
            Clear
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNGOs.map((ngo) => (
            <Card key={ngo.id}>
              <CardHeader className="pb-2">
                <CardTitle>{ngo.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{ngo.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Balance: {ngo.balance}</span>
                  <Button onClick={() => handleDonateClick(ngo.id)}>Donate</Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredNGOs.length === 0 && (
            <div className="col-span-full text-center">
              <p className="text-lg text-muted-foreground">No NGOs found matching your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

