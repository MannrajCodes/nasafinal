// Blockchain utility functions and types
import { ethers } from "ethers"
export type TransactionMetadataValue = string | number | boolean | null

export type TransactionMetadata = Record<string, TransactionMetadataValue>

export interface Transaction {
  id: string
  type: "debris_capture" | "material_processing" | "satellite_servicing" | "power_transfer"
  timestamp: string
  blockHeight: number
  hash: string
  from: string
  to: string
  data: TransactionMetadata
  status: "pending" | "confirmed" | "failed"
  gasUsed: number
  signature: string
}

export interface Block {
  height: number
  hash: string
  timestamp: string
  previousHash: string
  merkleRoot: string
  transactions: string[]
  validator: string
  gasUsed: number
  gasLimit: number
  difficulty: number
  nonce: number
  size: number
}

export interface SmartContract {
  address: string
  name: string
  type: string
  deployedAt: string
  version: string
  status: "active" | "paused" | "deprecated"
  totalTransactions: number
  lastActivity: string
  abi: ContractAbiItem[]
  bytecode: string
}

export interface ContractAbiParameter {
  name: string
  type: string
}

export interface ContractAbiItem {
  inputs: ContractAbiParameter[]
  name: string
  outputs?: ContractAbiParameter[]
  type: "function" | "event" | "constructor"
}

export type ContractCallParameter = string | number | boolean | null | Record<string, unknown>

export interface ContractExecutionResult {
  transactionHash: string
  contractAddress: string
  functionName: string
  parameters: ContractCallParameter[]
  gasUsed: number
  status: "pending" | "confirmed" | "failed"
  blockNumber: number | null
}

export interface NetworkAnalytics {
  totalTransactions: number
  totalBlocks: number
  activeValidators: number
  networkHashRate: string
  avgBlockTime: string
  tps: number
  uptime: number
}

export interface DailyTransactionMetric {
  date: string
  count: number
  volume: number
}

export interface TransactionAnalytics {
  daily: DailyTransactionMetric[]
  byType: {
    debris_capture: number
    material_processing: number
    satellite_servicing: number
    power_transfer: number
  }
}

export interface ContractsAnalytics {
  totalDeployed: number
  totalInteractions: number
  mostActive: string
  gasConsumption: {
    total: number
    average: number
  }
}

export interface ValidatorAnalytics {
  name: string
  address: string
  blocksProduced: number
  uptime: number
  stake: string
}

export interface SecurityAnalytics {
  threatLevel: string
  lastSecurityAudit: string
  encryptionStandard: string
  consensusAlgorithm: string
  decentralizationScore: number
}

export interface BlockchainAnalytics {
  network: NetworkAnalytics
  transactions: TransactionAnalytics
  contracts: ContractsAnalytics
  validators: ValidatorAnalytics[]
  security: SecurityAnalytics
}

// Blockchain API client
export class BlockchainClient {
  private baseUrl: string
  private blocks: Block[] = [] // Add this property to store blocks
  private transactions: Transaction[] = [] // Add this property to store transactions

  constructor(baseUrl = "/api/blockchain") {
    this.baseUrl = baseUrl
  }

  async getTransactions(params?: {
    type?: string
    status?: string
    limit?: number
  }): Promise<{ data: Transaction[]; total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.set("type", params.type)
    if (params?.status) searchParams.set("status", params.status)
    if (params?.limit) searchParams.set("limit", params.limit.toString())

    const response = await fetch(`${this.baseUrl}/transactions?${searchParams}`)
    const result: {
      success: boolean
      data: Transaction[]
      total: number
      error?: string
    } = await response.json()

    if (!result.success) {
      throw new Error(result.error)
    }

    return { data: result.data, total: result.total }
  }
  

  async createTransaction(txData: {
  type: Transaction["type"]
  data: TransactionMetadata
  from: string
  to: string
  timestamp: number
  signature: string // Expect a signature
}): Promise<{ success: boolean }> {
  const { signature, ...payload } = txData
  const message = JSON.stringify(payload)

  // 1. Verify the signature
  try {
    const signerAddress = ethers.verifyMessage(message, signature)

    // 2. Check if the signer's address matches the 'from' address
    if (signerAddress.toLowerCase() !== payload.from.toLowerCase()) {
      throw new Error("Signature is invalid or does not match the sender's address.")
    }
  } catch (error) {
    console.error("Signature verification failed:", error)
    throw new Error("Invalid signature.")
  }

  // If verification passes, proceed to add the transaction
  console.log("✅ Signature Verified Successfully!")

  const newTransaction: Transaction = {
    id: `tx_${Math.random().toString(36).substring(2, 10)}`,
    ...payload,
    timestamp: payload.timestamp.toString(),
    status: "confirmed",
    blockHeight: this.blocks[this.blocks.length - 1].height,
    hash: ethers.id(JSON.stringify(payload) + Date.now()), // simple hash
    gasUsed: 21000, // default or estimate as needed
    signature: signature,
  }
  this.transactions.unshift(newTransaction)
  return { success: true }
}

  async getBlocks(params?: {
    limit?: number
    height?: number
  }): Promise<{ data: Block | Block[]; total?: number }> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.height) searchParams.set("height", params.height.toString())

    const response = await fetch(`${this.baseUrl}/blocks?${searchParams}`)
    const result: {
      success: boolean
      data: Block | Block[]
      total?: number
      error?: string
    } = await response.json()

    if (!result.success) {
      throw new Error(result.error)
    }

    return { data: result.data, total: result.total }
  }

  async getSmartContracts(params?: {
    type?: string
    address?: string
  }): Promise<{ data: SmartContract | SmartContract[]; total?: number }> {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.set("type", params.type)
    if (params?.address) searchParams.set("address", params.address)

    const response = await fetch(`${this.baseUrl}/smart-contracts?${searchParams}`)
    const result: {
      success: boolean
      data: SmartContract | SmartContract[]
      total?: number
      error?: string
    } = await response.json()

    if (!result.success) {
      throw new Error(result.error)
    }

    return { data: result.data, total: result.total }
  }

  async executeContract(params: {
    contractAddress: string
    functionName: string
    parameters: ContractCallParameter[]
  }): Promise<ContractExecutionResult> {
    const response = await fetch(`${this.baseUrl}/smart-contracts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    const result: {
      success: boolean
      data: ContractExecutionResult
      error?: string
    } = await response.json()

    if (!result.success) {
      throw new Error(result.error)
    }

    return result.data
  }

  async getAnalytics(timeframe = "7d"): Promise<BlockchainAnalytics> {
    const response = await fetch(`${this.baseUrl}/analytics?timeframe=${timeframe}`)
    const result: {
      success: boolean
      data: BlockchainAnalytics
      error?: string
    } = await response.json()

    if (!result.success) {
      throw new Error(result.error)
    }

    return result.data
  }
}

// Utility functions
export function formatTransactionHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function calculateTransactionFee(gasUsed: number, gasPrice = 20): number {
  return (gasUsed * gasPrice) / 1e9 // Convert to ORB tokens
}

export function validateTransactionData(type: string, data: TransactionMetadata): boolean {
  switch (type) {
    case "debris_capture":
      return Boolean(data.satellite && data.debris && data.quantity)
    case "material_processing":
      return Boolean(data.material && data.quantity)
    case "satellite_servicing":
      return Boolean(data.target && data.service)
    case "power_transfer":
      return Boolean(data.target && data.powerAmount)
    default:
      return false
  }
}

// Create singleton instance
export const blockchainClient = new BlockchainClient()
