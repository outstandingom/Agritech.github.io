// Blockchain configuration
const BLOCKCHAIN_CONFIG = {
    contractAddress: "YOUR_DEPLOYED_CONTRACT_ADDRESS", // Replace after deployment
    contractABI: [
        {
            "inputs": [
                {"internalType": "string", "name": "recordId", "type": "string"},
                {"internalType": "string", "name": "cropName", "type": "string"},
                {"internalType": "string", "name": "landName", "type": "string"},
                {"internalType": "string", "name": "currentStage", "type": "string"},
                {"internalType": "uint256", "name": "plantingDate", "type": "uint256"},
                {"internalType": "string", "name": "imageHash", "type": "string"},
                {"internalType": "string", "name": "analysisData", "type": "string"}
            ],
            "name": "addPlantRecord",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "string", "name": "recordId", "type": "string"}],
            "name": "getPlantRecord",
            "outputs": [
                {"internalType": "string", "name": "cropName", "type": "string"},
                {"internalType": "string", "name": "landName", "type": "string"},
                {"internalType": "string", "name": "currentStage", "type": "string"},
                {"internalType": "uint256", "name": "plantingDate", "type": "uint256"},
                {"internalType": "string", "name": "imageHash", "type": "string"},
                {"internalType": "string", "name": "analysisData", "type": "string"},
                {"internalType": "address", "name": "farmer", "type": "address"},
                {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ],
    infuraUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID", // Replace with your Infura ID
    chainId: "0xaa36a7", // Sepolia testnet
    chainName: "Sepolia"
};

// Blockchain service class
class BlockchainService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.isConnected = false;
    }

    async connectToBlockchain() {
        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed. Please install MetaMask to use blockchain features.');
            }

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Create provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            
            // Check network
            const network = await this.provider.getNetwork();
            const expectedChainId = parseInt(BLOCKCHAIN_CONFIG.chainId, 16);
            
            if (network.chainId !== expectedChainId) {
                throw new Error(`Please switch to ${BLOCKCHAIN_CONFIG.chainName} network in MetaMask`);
            }

            // Initialize contract
            this.contract = new ethers.Contract(
                BLOCKCHAIN_CONFIG.contractAddress,
                BLOCKCHAIN_CONFIG.contractABI,
                this.signer
            );

            this.isConnected = true;
            return true;
            
        } catch (error) {
            console.error('Blockchain connection error:', error);
            throw error;
        }
    }

    async getCurrentAddress() {
        if (!this.signer) return null;
        return await this.signer.getAddress();
    }

    async storePlantRecord(recordData) {
        if (!this.isConnected || !this.contract) {
            throw new Error('Not connected to blockchain');
        }

        try {
            const tx = await this.contract.addPlantRecord(
                recordData.recordId,
                recordData.cropName,
                recordData.landName,
                recordData.currentStage,
                recordData.plantingDate,
                recordData.imageHash,
                recordData.analysisData
            );

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            return receipt;
            
        } catch (error) {
            console.error('Error storing plant record:', error);
            throw error;
        }
    }

    async getPlantRecord(recordId) {
        if (!this.isConnected || !this.contract) {
            throw new Error('Not connected to blockchain');
        }

        try {
            const record = await this.contract.getPlantRecord(recordId);
            return record;
        } catch (error) {
            console.error('Error fetching plant record:', error);
            throw error;
        }
    }
}

// Initialize global blockchain service
window.blockchainService = new BlockchainService();
