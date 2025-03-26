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

export default function RecordExpenditure() {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    ipfsHash: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    console.log("Recording expenditure:", formData)

    toast({
      title: "Success",
      description: "Expenditure recorded successfully",
    })

    setFormData({
      description: "",
      amount: "",
      ipfsHash: "",
    })
  }

  return (
    <DashboardLayout title="Record Expenditure" navItems={navItems}>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Record New Expenditure</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Purpose of the expenditure"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ETH)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ipfsHash">IPFS Receipt Hash</Label>
              <Input
                id="ipfsHash"
                name="ipfsHash"
                placeholder="QmXyz..."
                value={formData.ipfsHash}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Upload receipt or supporting documents to IPFS and provide the hash here.
              </p>
            </div>
            <Button type="submit" className="w-full">
              Record Expenditure
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

