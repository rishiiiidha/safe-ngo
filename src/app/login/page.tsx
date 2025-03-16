"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { createThirdwebClient, getContract } from "thirdweb"
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react"
import { inAppWallet, createWallet } from "thirdweb/wallets"
import { prepareContractCall } from "thirdweb"
import { useToast } from "../hooks/use-toast"
import { sepolia } from "thirdweb/chains";

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

export default function LoginPage() {
  const router = useRouter()
  const activeAccount = useActiveAccount()
  const [selectedRole, setSelectedRole] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const { mutate: sendTransaction, isPending: isTransactionPending } = useSendTransaction()
  const {toast} = useToast()

  const { data: isAdmin, isPending: isAdminPending } = useReadContract({
    contract,
    method: "function isAdmin(address _admin) view returns (bool)",
    // @ts-ignore
    params: activeAccount ? [activeAccount.address] : undefined,
    enabled: !!activeAccount && selectedRole === "admin",
  })

  const { data: isNGOAdmin, isPending: isNGOAdminPending } = useReadContract({
    contract,
    method: "function isNGOAdmin(address _ngoAdmin) view returns (bool)",
    //@ts-ignore
    params: activeAccount ? [activeAccount.address] : undefined,
    enabled: !!activeAccount && selectedRole === "ngo",
  })

  const { data: isDonor, isPending: isDonorPending, refetch: refetchIsDonor } = useReadContract({
    contract,
    method: "function isDonor(address _donor) view returns (bool)",
    //@ts-ignore
    params: activeAccount ? [activeAccount.address] : undefined,
    enabled: !!activeAccount && selectedRole === "donor",
  })

  useEffect(() => {
    if (selectedRole === "admin" && isAdmin !== undefined) {
      console.log("Admin check result:", isAdmin)
      
    }
    if (selectedRole === "ngo" && isNGOAdmin !== undefined) {
      console.log("NGO Admin check result:", isNGOAdmin)
    }
    if (selectedRole === "donor" && isDonor !== undefined) {
      console.log("Donor check result:", isDonor)
    }
  }, [isAdmin, isNGOAdmin, isDonor, selectedRole])

  const handleRoleChange = (value : string) => {
    console.log("Role selected:", value)
    setSelectedRole(value)
  }


  const registerAsDonor = async () => {
    console.log("Attempting to register as donor...");
    setIsRegistering(true);
  
    try {
      toast({
        title: "Registering as donor",
        description: "Please confirm the transaction in your wallet",
        duration: 5000,
      });
  
      console.log("Preparing transaction...");
      const transaction = prepareContractCall({
        contract,
        method: "function registerDonor()",
        params: [],
      });
  
      console.log("Sending transaction...");
      const txResult = await sendTransaction(transaction);
  
      console.log("Transaction submitted:", txResult);
  
      toast({
        title: "Transaction submitted",
        description: "Waiting for confirmation...",
        duration: 5000,
      });
  
      const checkRegistration = async () => {
        try {
          const { data: updatedIsDonor } = await refetchIsDonor();
  
          if (updatedIsDonor) {
            console.log("Donor registration confirmed!");
            toast({
              title: "Registration successful",
              description: "You are now registered as a donor. Please refresh the page to log in.",
              variant: "default",
              className: "bg-green-100 border-green-400 text-green-900", 
              duration: 7000, 
            });
  
            setIsRegistering(false);
            return;
          } else {
            console.log("Registration not yet confirmed. Checking again...");
  
            setTimeout(checkRegistration, 3000);
          }
        } catch (error) {
          console.error("Error checking registration status:", error);
          toast({
            title: "Error checking registration",
            description: "Please refresh the page to verify your registration status",
            variant: "destructive",
            duration: 5000,
          });
          setIsRegistering(false);
        }
      };
  
      checkRegistration();
    } catch (error) {
      console.error("Donor registration failed:", error);
  
      toast({
        title: "Registration failed",
        description: "Please try again later",
        variant: "destructive",
        duration: 5000,
      });
      setIsRegistering(false);
    }
  };

  const handleWalletLogin = async () => {
    console.log("Wallet login attempt with role:", selectedRole)
    
    if (!activeAccount?.address) {
      console.log("No wallet connected")
      toast({
        title: "No wallet connected",
        description: "Please connect your wallet first",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    if (!selectedRole) {
      console.log("No role selected")
      toast({
        title: "No role selected",
        description: "Please select a role to continue",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    setIsAuthenticating(true)
    console.log("Authentication started for role:", selectedRole)

    try {
      if (selectedRole === "admin") {
        console.log("Admin authentication check:", isAdmin)
        if (isAdmin) {
          console.log("Admin authentication successful")
          toast({
            title: "Authentication successful",
            description: "Redirecting to admin dashboard",
            variant: "default",
            className: "bg-green-100 border-green-400 text-green-900", 
            duration: 3000,
          })
          setTimeout(() => router.push("/admin"), 1000)
        } else {
          console.log("Admin authentication failed")
          toast({
            title: "Access denied",
            description: "You are not registered as an admin",
            variant: "destructive",
            duration: 5000,
          })
        }
      } else if (selectedRole === "ngo") {
        console.log("NGO Admin authentication check:", isNGOAdmin)
        if (isNGOAdmin) {
          console.log("NGO Admin authentication successful")
          toast({
            title: "Authentication successful",
            description: "Redirecting to NGO admin dashboard",
            variant: "default",
            className: "bg-green-100 border-green-400 text-green-900", 
            duration: 3000,
          })
          setTimeout(() => router.push("/ngo-admin"), 1000)
        } else {
          console.log("NGO Admin authentication failed")
          toast({
            title: "Access denied",
            description: "You are not registered as an NGO admin",
            variant: "destructive",
            duration: 5000,
          })
        }
      } else if (selectedRole === "donor") {
        console.log("Donor authentication check:", isDonor)
        if (isDonor) {
          console.log("Donor authentication successful")
          toast({
            title: "Authentication successful",
            description: "Redirecting to donor dashboard",
            variant: "default",
            className: "bg-green-100 border-green-400 text-green-900", 
            duration: 3000,
          })
          setTimeout(() => router.push("/donor"), 1000)
        } else {
          console.log("Donor not registered, attempting registration")
          await registerAsDonor()
        }
      }
    } catch (error) {
      console.error("Authentication error:", error)
      toast({
        title: "Authentication failed",
        description: "Please try again later",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      if (!isRegistering) {
        setIsAuthenticating(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Connect your wallet to access the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <ConnectButton
                client={client}
                wallets={wallets}
                connectModal={{ size: "compact" }}
                connectButton={{ label: "Connect Wallet" }}
              />
            </div>

            {activeAccount?.address && (
              <>
                <div className="rounded-md bg-muted p-2 text-center text-sm">
                  <p>
                    Wallet connected: {activeAccount.address.substring(0, 6)}...
                    {activeAccount.address.substring(activeAccount.address.length - 4)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Select Your Role</Label>
                  <Select onValueChange={handleRoleChange} value={selectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="ngo">NGO Admin</SelectItem>
                      <SelectItem value="donor">Donor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="button" 
                  className="w-full"
                  onClick={handleWalletLogin}
                  disabled={isAuthenticating || isRegistering || !selectedRole || isAdminPending || isNGOAdminPending || isDonorPending || isTransactionPending}
                >
                  {isAuthenticating || isRegistering 
                    ? isRegistering 
                      ? "Registering as Donor..." 
                      : "Authenticating..." 
                    : "Login with Wallet"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm">
            <Link href="/transparency" className="text-primary hover:underline">
              Public Transparency Page
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}