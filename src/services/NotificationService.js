const fetch = require("node-fetch");
const { config } = require("../utils/env");
const { log } = require("../utils/logger");

/**
 * Notification Service
 * Handles alerts via external channels like WhatsApp.
 */
class NotificationService {
    constructor() {
        this.phone = process.env.WHATSAPP_PHONE;
        this.apiKey = process.env.WHATSAPP_API_KEY;
        this.enabled = !!(this.phone && this.apiKey);

        if (!this.enabled) {
            log.warn("WhatsApp notifications are disabled. Set WHATSAPP_PHONE and WHATSAPP_API_KEY in .env to enable.");
        }
    }

    /**
     * Sends a message via WhatsApp (using CallMeBot API)
     * @param {string} message The text to send.
     */
    async sendWhatsApp(message) {
        if (!this.enabled) return;

        // Clean message for URL
        const encodedMsg = encodeURIComponent(`[DSU-V4] ${message}`);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${this.phone}&text=${encodedMsg}&apikey=${this.apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`CallMeBot returned ${response.status}`);
            }
            log.info("WhatsApp alert sent successfully.");
        } catch (error) {
            log.error("Failed to send WhatsApp notification:", error.message);
        }
    }

    /**
     * Specific alert for Bot Startup
     */
    async notifyStartup() {
        const mode = config.production ? "PRODUCTION" : "DEVELOPMENT";
        await this.sendWhatsApp(`🚀 Bot started successfully in **${mode}** mode.`);
    }

    /**
     * Specific alert for Database Failure
     */
    async notifyDbFailure(error) {
        await this.sendWhatsApp(`📴 **CRITICAL: Database Failure!**\nError: ${error.message || error}`);
    }

    /**
     * Specific alert for Script/Command Failure
     */
    async notifyComponentFailure(component, error) {
        await this.sendWhatsApp(`🛑 **BOT FAILURE:** Component [${component}] crashed.\nError: ${error.message || "Unknown error"}`);
    }

    /**
     * Global process crash
     */
    async notifyGlobalCrash(error) {
        await this.sendWhatsApp(`🚨 **FATAL CRASH:** The process is shutting down!\nReason: ${error.message || error}`);
    }
}

module.exports = new NotificationService();
