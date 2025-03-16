"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Separator } from "../../components/ui/separator"
import { toast } from "../../hooks/use-toast"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import DashboardLayout from "../../components/dashboard-layout"
import { ConnectButton } from "thirdweb/react"
import { createWallet, inAppWallet } from "thirdweb/wallets"
import { sepolia } from "thirdweb/chains"
import { createThirdwebClient, getContract } from "thirdweb"

const navItems = [
  { label: "Home", href: "/admin" },
  { label: "Manage Admins", href: "/admin/manage-admins" },
  { label: "Manage NGOs", href: "/admin/manage-ngos" },
  { label: "View All NGOs", href: "/admin/view-ngos" },
]

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

const contract = getContract({
  client,
  address: "0xb2c62A5c0845efbAD49cBcf72575C01FD00dFFEe",
  chain: sepolia,
})

const wallets = [
  inAppWallet({
    auth: {
      options: ["google"],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
]


export default function AdminProfilePage() {
  const [formData, setFormData] = useState({
    name: "Admin User",
    email: "admin@example.com",
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
  })

  const [isEditing, setIsEditing] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleWalletConnect = (address: string) => {
    setFormData((prev) => ({ ...prev, walletAddress: address }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // In a real app, you would update the profile in your backend
    console.log("Updating profile:", formData)

    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully",
    })

    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <DashboardLayout title="My Profile" navItems={navItems} userRole="admin">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{getInitials(formData.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                    {formData.walletAddress}
                  </div>
                  <ConnectButton
                client={client}
                wallets={wallets}
                connectModal={{ size: "compact" }}
                connectButton={{ label: "Connect Wallet" }}
              />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <div className="flex justify-end">
              <Button>Update Password</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

