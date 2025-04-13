# SAFE-NGO

**Secure Accounting Framework with End-to-end Verification System for NGOs**

A blockchain-based solution for transparent NGO donation management.

![SAFE-NGO Platform](https://github.com/user-attachments/assets/cc40608a-83d9-460d-bfbe-41f836f97310)

## Overview

SAFE-NGO revolutionizes donation tracking by bringing complete transparency to the donation process using blockchain technology. Every transaction—from donation to expenditure—is permanently recorded and publicly verifiable.

### Why It Matters

Traditional NGO donation systems often lack transparency. Our platform addresses this by:
- Creating immutable records of all financial transactions
- Making all donation and expenditure data publicly accessible
- Requiring receipt verification for expenditures
- Calculating transparency scores based on NGO activity


### For Donors

| Connect Wallet | Donor Dashboard | Browse Verified NGOs |
|:---:|:---:|:---:|
| ![Connect Wallet](https://github.com/user-attachments/assets/148c356d-a1f9-401f-bc7d-1d31d5d877fd) | ![Donor Dashboard](https://github.com/user-attachments/assets/1af3a419-1529-4883-9ed3-303625ed9661) | ![Browse NGOs](https://github.com/user-attachments/assets/e6923f4f-b1dd-4a20-a502-a3d99dd194f3) |

| Make Donations | View Donation History |
|:---:|:---:|
| ![Browse NGOs](https://github.com/user-attachments/assets/e6923f4f-b1dd-4a20-a502-a3d99dd194f3) | ![Donation History](https://github.com/user-attachments/assets/583eb90a-1746-4c50-a1de-4e1527e4fa0c) |



### For NGOs

| NGO Dashboard | Manage Profile | Record Expenditures | 
|:---:|:---:|:---:|
| ![NGO Dashboard](https://github.com/user-attachments/assets/c3aa6dd5-bfd4-4bb9-b03a-0ccc212c455f) | ![Manage Profile](https://github.com/user-attachments/assets/ab8db066-2629-4c1e-8ba8-0315202ba50d) | ![Record Expenditures](https://github.com/user-attachments/assets/37853198-3975-4804-ab6f-90dcb869abe2)  | 

| View Donation History | Track Expenditures |
|:---:|:---:|
|![View Donations](https://github.com/user-attachments/assets/7be71820-5c4b-461e-af14-5d6988a0df83) | ![Track Expenditures](https://github.com/user-attachments/assets/96f18b14-658b-4fb4-bebd-e620f162fa1b) | |

### For Administrators

| Admin Dashboard | Manage Access |
|:---:|:---:|
| ![Admin Dashboard](https://github.com/user-attachments/assets/5244db86-8ab1-447b-83d5-4a4f9f85c423) | ![Manage Access](https://github.com/user-attachments/assets/41306c3f-c03c-45ba-8e79-7f0b2dc55429) |

| Register NGOs | Activate/Deactivate NGOs |
|:---:|:---:|
| ![Register NGOs](https://github.com/user-attachments/assets/e5868431-9cc5-4c49-a0fa-e6cdc2c9d6ef) | ![Manage NGO Status](https://github.com/user-attachments/assets/b78c76b2-a032-435c-adae-20a3779bcee3) |

## Getting Started

### Prerequisites
- Node.js 16.x or later
- MetaMask or compatible Ethereum wallet

### Installation

```bash

git clone https://github.com/rishiiiidha/safe-ngo.git

cd safe-ngo

npm install

cp .env.example .env

npm run dev
```

### Environment Variables

```
NEXT_PUBLIC_TEMPLATE_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_API_KEY=your_pinata_secret_key
```

## How It Works

1. **Smart Contract Integration**: All transactions recorded on the Sepolia testnet
2. **IPFS Document Storage**: Supporting documents stored via Pinata IPFS
3. **Real-time Transparency**: All records publicly accessible
4. **Role-Based Access**: Different interfaces for donors, NGO admins, and platform admins

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Blockchain**: Ethereum (Sepolia Testnet), Solidity
- **Web3 Integration**: ThirdWeb SDK
- **Storage**: IPFS (via Pinata)
- **Authentication**: Social login, MetaMask, and Coinbase Wallet

## Smart Contracts

The Solidity smart contract for this project are available in a separate repository:

[SAFE-NGO Smart Contract](https://github.com/rishiiiidha/safe-ngo-contract)

## Resources

- [ThirdWeb](https://thirdweb.com/)
- [Pinata](https://www.pinata.cloud/)
- [shadcn/ui](https://ui.shadcn.com/)

---

Built with ❤️ by Rishi
