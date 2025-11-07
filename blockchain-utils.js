// Blockchain utility functions
class BlockchainUtils {
    static async generateImageHash(imageData) {
        // Simple hash generation from image data
        let hash = 0;
        for (let i = 0; i < Math.min(imageData.length, 1000); i++) {
            const char = imageData.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'img_' + Math.abs(hash).toString(16);
    }

    static generateRecordId(cropId) {
        return 'PLANT_' + cropId + '_' + Date.now();
    }

    static formatPlantingDate(plantingDate) {
        if (!plantingDate) return Math.floor(Date.now() / 1000);
        return Math.floor(new Date(plantingDate).getTime() / 1000);
    }

    static async generateQRCode(recordId, transactionHash) {
        return new Promise((resolve) => {
            // Create a URL that buyers can scan to view the plant journey
            const verificationUrl = `${window.location.origin}/verify-plant.html?recordId=${recordId}&txHash=${transactionHash}`;
            
            // Generate QR code
            const qr = qrcode(0, 'M');
            qr.addData(verificationUrl);
            qr.make();
            
            // Create QR code HTML
            const qrCodeHTML = qr.createImgTag(4);
            resolve(qrCodeHTML);
        });
    }

    static downloadQRCode(recordId) {
        const qrContainer = document.querySelector('.qr-container img');
        if (qrContainer) {
            const link = document.createElement('a');
            link.download = `plant-journey-${recordId}.png`;
            link.href = qrContainer.src;
            link.click();
        }
    }
}

window.blockchainUtils = BlockchainUtils;
