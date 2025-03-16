// "use client"

// import { useState } from "react"
// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import { LogOut, User, Wallet, Settings } from "lucide-react"
// import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
// import { Button } from "../components/ui/button"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuGroup,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "../components/ui/dropdown-menu"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "../components/ui/dialog"

// interface UserAccountNavProps {
//   user: {
//     name: string
//     email: string
//     walletAddress: string
//     role: string
//     avatarUrl?: string
//   }
// }

// export default function UserAccountNav({ user }: UserAccountNavProps) {
//   const router = useRouter()
//   const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

//   const handleLogout = () => {
//     // In a real app, you would handle logout logic here
//     console.log("Logging out")
//     setLogoutDialogOpen(false)
//     router.push("/login")
//   }

//   const getInitials = (name: string) => {
//     return name
//       .split(" ")
//       .map((part) => part[0])
//       .join("")
//       .toUpperCase()
//       .substring(0, 2)
//   }

//   const getProfileLink = () => {
//     switch (user.role) {
//       case "admin":
//         return "/admin/profile"
//       case "ngo":
//         return "/ngo-admin/profile"
//       case "donor":
//         return "/donor/profile"
//       default:
//         return "#"
//     }
//   }

//   return (
//     <>
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button variant="ghost" className="relative h-8 w-8 rounded-full">
//             <Avatar className="h-8 w-8">
//               {user.avatarUrl ? (
//                 <AvatarImage src={user.avatarUrl} alt={user.name} />
//               ) : (
//                 <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
//               )}
//             </Avatar>
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent className="w-56" align="end" forceMount>
//           <DropdownMenuLabel className="font-normal">
//             <div className="flex flex-col space-y-1">
//               <p className="text-sm font-medium leading-none">{user.name}</p>
//               <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
//             </div>
//           </DropdownMenuLabel>
//           <DropdownMenuSeparator />
//           <DropdownMenuGroup>
//             <DropdownMenuItem>
//               <User className="mr-2 h-4 w-4" />
//               <Link href={getProfileLink()}>Profile</Link>
//             </DropdownMenuItem>
//             <DropdownMenuItem>
//               <Wallet className="mr-2 h-4 w-4" />
//               <span className="flex-1 truncate">
//                 {`${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 4)}`}
//               </span>
//             </DropdownMenuItem>
//             <DropdownMenuItem>
//               <Settings className="mr-2 h-4 w-4" />
//               <span>Settings</span>
//             </DropdownMenuItem>
//           </DropdownMenuGroup>
//           <DropdownMenuSeparator />
//           <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)}>
//             <LogOut className="mr-2 h-4 w-4" />
//             <span>Log out</span>
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>

//       {/* Logout confirmation dialog */}
//       <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Logout Confirmation</DialogTitle>
//             <DialogDescription>Are you sure you want to log out?</DialogDescription>
//           </DialogHeader>
//           <DialogFooter className="flex justify-end space-x-2">
//             <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
//               Cancel
//             </Button>
//             <Button variant="destructive" onClick={handleLogout}>
//               Yes, Logout
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   )
// }

