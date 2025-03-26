"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { toast } from "../../../hooks/use-toast"
import DashboardLayout from "../../../components/dashboard-layout"

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

export default function DonateToNGOPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [ngo, setNgo] = useState<(typeof mockNGOs)[0] | null>(null)
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // In a real app, you would fetch the NGO details from your backend/blockchain
    const selectedNGO = mockNGOs.find((n) => n.id === params.id)
    if (selectedNGO) {
      setNgo(selectedNGO)
    } else {
      router.push("/donor/donate")
    }
  }, [params.id, router])

  const handleDonate = async () => {
    if (!ngo || !amount) return

    setIsLoading(true)

    try {
      console.log("Donating:", { ngoId: ngo.id, amount })

      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Donation Successful",
        description: `You have donated ${amount} ETH to ${ngo.name}.`,
      })

      router.push("/donor/donate")
    } catch (error) {
      toast({
        title: "Donation Failed",
        description: "There was an error processing your donation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!ngo) {
    return (
      <DashboardLayout title="Donate to NGO" navItems={navItems}>
        <div className="flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={`Donate to ${ngo.name}`} navItems={navItems}>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Make a Donation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">{ngo.name}</h3>
              <p className="text-muted-foreground">{ngo.description}</p>
              <p className="mt-2 text-sm">Current Balance: {ngo.balance}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Donation Amount (ETH)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => router.push("/donor/donate")} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleDonate} className="flex-1" disabled={!amount || isLoading}>
                  {isLoading ? "Processing..." : "Donate"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

