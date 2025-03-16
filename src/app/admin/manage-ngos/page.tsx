"use client"


import { useState, useRef, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import DashboardLayout from "../../components/dashboard-layout"
import { useToast } from "../../hooks/use-toast"
import { prepareContractCall } from "thirdweb"
import { useSendTransaction, useReadContract, useActiveAccount } from "thirdweb/react"
import { getContract, createThirdwebClient } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { uploadToPinata } from "../../lib/pinata"

const navItems = [
  { label: "Home", href: "/admin" },
  { label: "Manage Admins", href: "/admin/manage-admins" },
  { label: "Manage NGOs", href: "/admin/manage-ngos" },
  { label: "Change NGO Status", href: "/admin/change-ngo-status" },
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

export default function ManageNGOs() {
  const { toast } = useToast()
  const activeAccount = useActiveAccount()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [registerForm, setRegisterForm] = useState({
    adminAddress: "",
    name: "",
    description: "",
    ipfsHash: "",
  })


  const [isUploading, setIsUploading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [fileName, setFileName] = useState("")


  const { data: ngoCount, isPending: isNgoCountPending } = useReadContract({
    contract,
    method: "function getNGOCount() view returns (uint256)",
    params: [],
    //@ts-ignore
    enabled: !!activeAccount,
  })


  const { mutate: sendTransaction, isPending: isTransactionPending } = useSendTransaction()

 
  const { data: isAdmin, isPending: isAdminPending } = useReadContract({
    contract,
    method: "function isAdmin(address _admin) view returns (bool)",
    //@ts-ignore
    params: activeAccount ? [activeAccount.address] : undefined,
    enabled: !!activeAccount,
  })

  


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
    if (!activeAccount) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to register an NGO",
        variant: "destructive",
      })
      return
    }
    
    if (!isAdmin) {
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

 



  return (
    <DashboardLayout title="Manage NGOs" navItems={navItems}>
      {!isAdminPending && !isAdmin && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your account does not have admin privileges. You need admin access to manage NGOs.
          </AlertDescription>
        </Alert>
      )}
      
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
                />
              </div>
              
              <Button 
                onClick={handleRegisterNGO} 
                disabled={isRegistering || isUploading || isTransactionPending || !isAdmin}
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

     
      </div>
    </DashboardLayout>
  )
}