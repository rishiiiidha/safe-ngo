"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { toast } from "../../hooks/use-toast"
import DashboardLayout from "../../components/dashboard-layout"

const navItems = [
  { label: "Home", href: "/ngo-admin" },
  { label: "Update NGO Details", href: "/ngo-admin/update-details" },
  { label: "Record Expenditure", href: "/ngo-admin/record-expenditure" },
  { label: "View Donations", href: "/ngo-admin/view-donations" },
  { label: "View Expenditures", href: "/ngo-admin/view-expenditures" },
]

// Mock data for the NGO
const mockNGO = {
  name: "Clean Water Initiative",
  description: "Providing clean water to rural communities through sustainable infrastructure and education.",
  ipfsHash: "QmXyz123456789abcdef",
}

export default function UpdateNGODetails() {
  const [formData, setFormData] = useState(mockNGO)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // In a real app, you would call your backend/smart contract here
    console.log("Updating NGO details:", formData)

    // Show success message
    toast({
      title: "Success",
      description: "NGO details updated successfully",
    })
  }

  return (
    <DashboardLayout title="Update NGO Details" navItems={navItems}>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Update NGO Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ipfsHash">IPFS Document Hash</Label>
              <Input id="ipfsHash" name="ipfsHash" value={formData.ipfsHash} onChange={handleChange} />
              <p className="text-xs text-muted-foreground">
                Upload your NGO documentation to IPFS and provide the hash here.
              </p>
            </div>
            <Button type="submit" className="w-full">
              Update Details
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

