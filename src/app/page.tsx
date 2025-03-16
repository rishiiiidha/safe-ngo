"use client"
import Link from "next/link"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { createThirdwebClient } from "thirdweb"
import { ConnectButton } from "thirdweb/react"
import { inAppWallet, createWallet } from "thirdweb/wallets"

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type ButtonSize = "default" | "sm" | "lg" | "icon"

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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-primary py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-foreground">NGO Transparency Platform</h1>
            <div className="flex items-center gap-4">
              <ConnectButton
                client={client}
                wallets={wallets}
                connectModal={{ size: "compact" }}
              />
              <Link href="/login">
                <Button variant="secondary" className="text-[1rem] p-[1.5rem] ">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-muted py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-4xl font-bold">Transparent Donations for a Better World</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Our blockchain-based platform ensures complete transparency in how NGOs receive and utilize donations.
            </p>
            <div className="flex justify-center gap-4 flex-wrap ">
              <ConnectButton
                client={client}
                wallets={wallets}
                connectModal={{ size: "compact" }}
                theme={"light"}
                connectButton={{ label: "Connect Wallet" }}
              />
             
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Connect</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Connect your wallet securely to our platform using MetaMask, Coinbase Wallet, or social login.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Donate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Make secure donations to verified NGOs using cryptocurrency directly from your wallet.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Track</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Follow your donations and see how NGOs utilize funds in real-time on the blockchain.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-3xl font-bold">Explore NGO Transparency</h2>
            <p className="mx-auto mb-8 max-w-2xl">
              View detailed information about NGOs, their donations, and expenditures without needing to register.
            </p>
            <Link href="/transparency">
              <Button variant="default" size="default" className="p-[1.5rem]">
                View Public Transparency Page
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-primary py-6 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} NGO Transparency Platform. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:underline">Terms</Link>
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/faq" className="hover:underline">FAQ</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}