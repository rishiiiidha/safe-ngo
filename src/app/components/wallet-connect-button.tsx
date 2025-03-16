// "use client"

// import { useState, useEffect } from "react"
// import { Button } from "../components/ui/button"
// import { toast } from "../hooks/use-toast"

// interface WalletConnectButtonProps {
//   onConnect?: (address: string) => void
//   className?: string
//   variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
// }

// export default function WalletConnectButton({ onConnect, className, variant = "default" }: WalletConnectButtonProps) {
//   const [address, setAddress] = useState<string | null>(null)
//   const [isConnecting, setIsConnecting] = useState(false)

//   // Check if MetaMask is installed
//   const isMetaMaskInstalled = typeof window !== "undefined" && window.ethereum

//   useEffect(() => {
//     // Check if already connected
//     const checkConnection = async () => {
//       if (isMetaMaskInstalled) {
//         try {
//           const accounts = await window.ethereum.request({ method: "eth_accounts" })
//           if (accounts.length > 0) {
//             setAddress(accounts[0])
//             onConnect?.(accounts[0])
//           }
//         } catch (error) {
//           console.error("Error checking connection:", error)
//         }
//       }
//     }

//     checkConnection()
//   }, [isMetaMaskInstalled, onConnect])

//   const connectWallet = async () => {
//     if (!isMetaMaskInstalled) {
//       toast({
//         title: "MetaMask not installed",
//         description: "Please install MetaMask to connect your wallet",
//         variant: "destructive",
//       })
//       window.open("https://metamask.io/download/", "_blank")
//       return
//     }

//     setIsConnecting(true)

//     try {
//       const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
//       setAddress(accounts[0])
//       onConnect?.(accounts[0])

//       toast({
//         title: "Wallet Connected",
//         description: "Your wallet has been successfully connected",
//       })
//     } catch (error: any) {
//       console.error("Error connecting wallet:", error)
//       toast({
//         title: "Connection Failed",
//         description: error.message || "Failed to connect wallet",
//         variant: "destructive",
//       })
//     } finally {
//       setIsConnecting(false)
//     }
//   }

//   const disconnectWallet = () => {
//     setAddress(null)
//     toast({
//       title: "Wallet Disconnected",
//       description: "Your wallet has been disconnected",
//     })
//   }

//   if (address) {
//     return (
//       <Button variant="outline" className={className} onClick={disconnectWallet}>
//         {`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
//       </Button>
//     )
//   }

//   return (
//     <Button onClick={connectWallet} disabled={isConnecting} className={className} variant={variant}>
//       {isConnecting ? "Connecting..." : "Connect Wallet"}
//     </Button>
//   )
// }

