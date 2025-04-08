"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import DashboardLayout from "../../../components/dashboard-layout"
import { useToast } from "../../../hooks/use-toast"
import { prepareContractCall, readContract } from "thirdweb"
import { useSendTransaction, useReadContract, useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { uploadToPinata } from "../../../lib/pinata"

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
})

const contract = getContract({
  client,
  address: "0x1dc0CC61B373Baad3824dEAC7a8537b89d0b818f",
  chain: sepolia,
})

export default function ManageNGOs() {
  const router = useRouter()
  const { toast } = useToast()
  const activeAccount = useActiveAccount()
  const params = useParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  const adminAddress = Array.isArray(params.adminAddress) 
    ? params.adminAddress[0] 
    : params.adminAddress
  
  const [registerForm, setRegisterForm] = useState({
    adminAddress: "",
    name: "",
    description: "",
    ipfsHash: "",
  })

  const [isUploading, setIsUploading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [fileName, setFileName] = useState("")

  const navItems = [
    { label: "Home", href: `/admin/${adminAddress}` },
    { label: "Manage Admins", href: `/admin/${adminAddress}/manage-admins` },
    { label: "Manage NGOs", href: `/admin/${adminAddress}/manage-ngos` },
    { label: "Change NGO Status", href: `/admin/${adminAddress}/change-ngo-status` },
    { label: "View All NGOs", href: `/admin/${adminAddress}/view-ngos` },
  ]

  const { data: ngoCount, isPending: isNgoCountPending } = useReadContract({
    contract,
    method: "function getNGOCount() view returns (uint256)",
    params: [],
    //@ts-ignore
    enabled: isAuthorized,
  })

  const { mutate: sendTransaction, isPending: isTransactionPending } = useSendTransaction()

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!activeAccount?.address) {
        toast({
          title: "No wallet connected",
          description: "Please connect your wallet to access the dashboard",
          variant: "destructive",
          duration: 5000,
        })
        router.push("/login")
        return
      }

      setIsLoading(true)
      setErrorMessage("")
      
      try {
        const isAdmin = await readContract({
          contract,
          method: "function isAdmin(address _admin) view returns (bool)",
          params: [activeAccount.address],
        })

        if (!isAdmin) {
          toast({
            title: "Access denied",
            description: "You are not registered as an admin",
            variant: "destructive",
            duration: 5000,
          })
          router.push("/login")
          return
        }

        if (adminAddress && adminAddress.toLowerCase() !== activeAccount.address.toLowerCase()) {
          toast({
            title: "Invalid admin address",
            description: "You are not authorized to access this admin dashboard",
            variant: "destructive",
            duration: 5000,
          })
          router.push("/login")
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Error verifying admin access:", error)
        setErrorMessage("Authentication error: " + (error instanceof Error ? error.message : "Unknown error"))
        
        toast({
          title: "Authentication error",
          description: "There was an error verifying your access. Please try again.",
          variant: "destructive",
          duration: 5000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (activeAccount?.address) {
      verifyAdminAccess()
    }
  }, [activeAccount?.address, adminAddress, router, toast])

  const handleRegisterFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setRegisterForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setFileName(file.name)
    setIsUploading(true)
    
    try {
      const ipfsHash = await uploadToPinata(file)
      setRegisterForm(prev => ({ ...prev, ipfsHash }))
      
      toast({
        title: "Document uploaded successfully",
        description: `File "${file.name}" has been uploaded to IPFS`,
        variant: "default",
        className: "bg-green-100 border-green-400 text-green-900",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRegisterNGO = async () => {
    if (!isAuthorized) {
      toast({
        title: "Unauthorized",
        description: "Only admin users can register NGOs",
        variant: "destructive",
      })
      return
    }

    if (!registerForm.adminAddress || !registerForm.name || !registerForm.description || !registerForm.ipfsHash) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to register an NGO",
        variant: "destructive",
      })
      return
    }
    
    setIsRegistering(true)
    
    try {
      toast({
        title: "Registering NGO",
        description: "Please confirm the transaction in your wallet",
        duration: 5000,
      })
      
      const transaction = prepareContractCall({
        contract,
        method: "function registerNGO(address _ngoAdmin, string _name, string _description, string _ipfsDocumentHash)",
        params: [
          registerForm.adminAddress,
          registerForm.name,
          registerForm.description,
          registerForm.ipfsHash,
        ],
      })
      
      const txResult = await sendTransaction(transaction)
      console.log("Transaction submitted:", txResult)
      
      toast({
        title: "NGO registration submitted",
        description: "Transaction has been submitted to the blockchain",
        variant: "default",
        className: "bg-green-100 border-green-400 text-green-900",
        duration: 5000,
      })
      
      setRegisterForm({
        adminAddress: "",
        name: "",
        description: "",
        ipfsHash: "",
      })
      setFileName("")
      
    } catch (error) {
      console.error("Error registering NGO:", error)
      toast({
        title: "Registration failed",
        description: "There was an error registering the NGO",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsRegistering(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Manage NGOs" navItems={navItems} userRole="admin">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">Loading dashboard...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we verify your admin access.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthorized) {
    return (
      <DashboardLayout title="Manage NGOs" navItems={navItems} userRole="admin">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
            <p className="text-muted-foreground mt-2">You are not authorized to manage NGOs.</p>
            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-500">{errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Manage NGOs" navItems={navItems} userRole="admin">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Register NGO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminAddress">NGO Admin Address</Label>
                <Input
                  id="adminAddress"
                  name="adminAddress"
                  placeholder="0x..."
                  value={registerForm.adminAddress}
                  onChange={handleRegisterFormChange}
                  disabled={isRegistering}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="NGO Name"
                  value={registerForm.name}
                  onChange={handleRegisterFormChange}
                  disabled={isRegistering}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="NGO Description"
                  value={registerForm.description}
                  onChange={handleRegisterFormChange}
                  disabled={isRegistering}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Documentation</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading || isRegistering}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isRegistering}
                    className="flex-shrink-0"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload PDF"
                    )}
                  </Button>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                    {fileName ? (
                      <span className="flex items-center">
                        <Check className="mr-1 h-4 w-4 text-green-500" />
                        {fileName}
                      </span>
                    ) : (
                      "No file selected"
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ipfsHash">IPFS Document Hash</Label>
                <Input
                  id="ipfsHash"
                  name="ipfsHash"
                  placeholder="QmXyz..."
                  value={registerForm.ipfsHash}
                  onChange={handleRegisterFormChange}
                  disabled={isRegistering}
                  readOnly
                />
                <p className="text-xs text-muted-foreground">This field will be automatically filled when a document is uploaded</p>
              </div>
              
              <Button 
                onClick={handleRegisterNGO} 
                disabled={isRegistering || isUploading || isTransactionPending || !isAuthorized}
                className="w-full"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register NGO"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NGO Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-6 border rounded-lg bg-slate-50">
                <div className="text-center">
                  <h3 className="text-3xl font-bold">
                    {isNgoCountPending ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    ) : (
                      ngoCount?.toString() || "0"
                    )}
                  </h3>
                  <p className="text-muted-foreground mt-2">Total NGOs Registered</p>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  All NGO registrations are recorded on the blockchain and cannot be modified after submission. 
                  Please verify all information before registering.
                </AlertDescription>
              </Alert>
              
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">To register a new NGO:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Enter the NGO admin's wallet address</li>
                  <li>Provide a name and description for the NGO</li>
                  <li>Upload required documentation (PDF format)</li>
                  <li>Submit the registration transaction</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}