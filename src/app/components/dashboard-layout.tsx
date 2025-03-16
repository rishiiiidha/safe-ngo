"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { ConnectButton, useActiveAccount } from "thirdweb/react"
import { createThirdwebClient } from "thirdweb"
import { createWallet, inAppWallet } from "thirdweb/wallets"

interface NavItem {
  label: string
  href: string
}

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  navItems: NavItem[]
  userRole?: "admin" | "ngo" | "donor"
}
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
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


export default function DashboardLayout({ children, title, navItems, userRole = "admin" }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const activeAccount = useActiveAccount()
  
  const user = {
    name: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} User`,
    email: `${userRole}@example.com`,
    walletAddress: activeAccount?.address || "Not connected",
    role: userRole,
  }

  const handleLogout = () => {
    console.log("Logging out")
    setLogoutDialogOpen(false)
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full bg-primary p-4 text-primary-foreground md:w-64">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">NGO Platform</h1>
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setLogoutDialogOpen(true)}>
            Logout
          </Button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-2 transition-colors hover:bg-primary-foreground/10 ${
                pathname === item.href ? "bg-primary-foreground/20 font-medium" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => setLogoutDialogOpen(true)}
            className="hidden w-full rounded-lg px-4 py-2 text-left transition-colors hover:bg-primary-foreground/10 md:block"
          >
            Logout
          </button>
        </nav>
        
      
        <div className="mt-6 pt-6 border-t border-primary-foreground/20">
          <div className="text-sm">
            <p className="text-primary-foreground/70">Connected Wallet:</p>
            <p className="font-mono text-xs break-all mt-1">
              {activeAccount?.address || "Not connected"}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <header className="border-b bg-background p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
           
            <div className="flex items-center gap-4">
              <ConnectButton
                client={client}
                wallets={wallets}
                connectModal={{ size: "compact" }}
              />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8">{children}</div>
      </main>

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout Confirmation</DialogTitle>
            <DialogDescription>Are you sure you want to log out?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Yes, Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}