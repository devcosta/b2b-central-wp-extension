/**
 * Utilitários para a extensão WhatsApp Bridge
 */
const WPP_Bridge_Utils = {
    /**
     * Gera um ID único baseado em timestamp e string aleatória
     * @returns {string} ID único
     */
    generateUniqueId: () => {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 5);
        return timestamp + randomStr;
    }
};
