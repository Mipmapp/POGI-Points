// ============================================================
// EMAIL SERVICE - Gmail account rotation, email sending
// ============================================================

import nodemailer from 'nodemailer';
import { sanitizeHtml } from '../utils/validators.js';
import { parseGmailAccounts } from '../utils/constants.js';

/**
 * Email service with automatic fallback/rotation
 * Tracks failed accounts and rotates through available Gmail accounts
 */
export class EmailService {
    constructor() {
        this.accounts = parseGmailAccounts();
        this.currentIndex = 0;
        this.failedAccounts = new Set();
        this.lastResetTime = Date.now();
        this.RESET_INTERVAL_MS = 30 * 60 * 1000; // Reset failed accounts after 30 minutes
    }

    /**
     * Get a configured Nodemailer transporter for a specific account
     * @param {number} accountIndex - Index of the account to use
     * @returns {Object} Nodemailer transporter
     */
    getTransporter(accountIndex) {
        const account = this.accounts[accountIndex];
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: account.user,
                pass: account.pass
            }
        });
    }

    /**
     * Get the current active account
     * @returns {Object|null} Current Gmail account
     */
    getCurrentAccount() {
        return this.accounts[this.currentIndex] || null;
    }

    /**
     * Reset failed accounts list if enough time has passed
     */
    resetFailedAccountsIfNeeded() {
        const now = Date.now();
        if (now - this.lastResetTime > this.RESET_INTERVAL_MS) {
            this.failedAccounts.clear();
            this.lastResetTime = now;
            console.log('[EmailService] Reset failed accounts list');
        }
    }

    /**
     * Find the next available account (not recently failed)
     * @param {number} startIndex - Starting index to search from
     * @returns {number} Index of next available account, or -1 if all failed
     */
    findNextAvailableAccount(startIndex = 0) {
        this.resetFailedAccountsIfNeeded();

        for (let i = 0; i < this.accounts.length; i++) {
            const index = (startIndex + i) % this.accounts.length;
            if (!this.failedAccounts.has(index)) {
                return index;
            }
        }
        return -1; // All accounts failed
    }

    /**
     * Mark an account as failed and log the failure
     * @param {number} index - Index of failed account
     */
    markAccountFailed(index) {
        this.failedAccounts.add(index);
        const account = this.accounts[index];
        console.log(`[EmailService] Marked account ${account.user} as failed. Failed accounts: ${this.failedAccounts.size}/${this.accounts.length}`);
    }

    /**
     * Send an email, automatically rotating through Gmail accounts
     * @param {Object} mailOptions - Nodemailer mail options
     * @returns {Promise<Object>} Send result
     * @throws Error if all accounts fail
     */
    async sendMail(mailOptions) {
        if (this.accounts.length === 0) {
            throw new Error('Email sending is disabled — no Gmail accounts configured (set GMAIL_ACCOUNTS env var)');
        }

        this.resetFailedAccountsIfNeeded();

        let attempts = 0;
        let lastError = null;
        const startIndex = this.findNextAvailableAccount(this.currentIndex);

        if (startIndex === -1) {
            // All accounts have failed recently, reset and try again
            console.log('[EmailService] All accounts failed, resetting and retrying...');
            this.failedAccounts.clear();
            this.lastResetTime = Date.now();
        }

        for (let i = 0; i < this.accounts.length; i++) {
            const accountIndex = (startIndex === -1 ? i : (startIndex + i) % this.accounts.length);

            if (this.failedAccounts.has(accountIndex) && startIndex !== -1) {
                continue; // Skip already failed accounts unless we reset
            }

            const account = this.accounts[accountIndex];
            attempts++;

            try {
                const transporter = this.getTransporter(accountIndex);

                // Update the "from" field to use current account
                const updatedMailOptions = {
                    ...mailOptions,
                    from: mailOptions.from ? mailOptions.from.replace(/<[^>]+>/, `<${account.user}>`) : `SSAAM <${account.user}>`
                };

                console.log(`[EmailService] Attempting to send email via ${account.user} (attempt ${attempts})`);

                const result = await transporter.sendMail(updatedMailOptions);

                // Success! Update current index to this working account
                this.currentIndex = accountIndex;
                console.log(`[EmailService] Email sent successfully via ${account.user}`);

                return result;
            } catch (error) {
                lastError = error;
                console.error(`[EmailService] Failed to send via ${account.user}: ${error.message}`);
                this.markAccountFailed(accountIndex);
            }
        }

        // All accounts failed
        console.error(`[EmailService] All ${this.accounts.length} accounts failed to send email`);
        throw new Error(`Email sending failed after trying all ${this.accounts.length} accounts. Last error: ${lastError?.message}`);
    }

    /**
     * Get service status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            totalAccounts: this.accounts.length,
            currentAccount: this.accounts[this.currentIndex]?.user || 'none',
            failedCount: this.failedAccounts.size,
            availableCount: this.accounts.length - this.failedAccounts.size
        };
    }
}

// Create singleton instance
export const emailService = new EmailService();

// ============================================================
// EMAIL TEMPLATES
// ============================================================

/**
 * Send email verification code to student
 * @param {Object} emailService - Email service instance
 * @param {string} toEmail - Recipient email
 * @param {string} code - 6-digit verification code
 * @param {string} studentName - Student full name
 */
export async function sendVerificationEmail(emailService, toEmail, code, studentName) {
    const mailOptions = {
        from: "SSAAM <ssaamjrmsu@gmail.com>",
        to: toEmail,
        subject: "SSAAM Email Verification Code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">SSAAM</h1>
                    <p style="color: white; opacity: 0.9; margin: 5px 0 0 0;">Student School Activities Attendance Monitoring</p>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                    <h2 style="color: #1f2937; margin-top: 0;">Hello ${sanitizeHtml(studentName)}!</h2>
                    <p style="color: #4b5563;">Your email verification code is:</p>
                    <div style="background: white; border: 2px solid #7c3aed; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">${code}</span>
                    </div>
                    <p style="color: #4b5563;">This code will expire in <strong>30 minutes</strong>.</p>
                    <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">Powered by CCS - Creatives Committee</p>
                </div>
            </div>
        `
    };

    return emailService.sendMail(mailOptions);
}

/**
 * Send account approval/rejection email
 * @param {Object} emailService - Email service instance
 * @param {string} toEmail - Recipient email
 * @param {string} studentName - Student full name
 * @param {boolean} approved - Whether account was approved
 * @param {string} rejectionReason - Reason for rejection (if rejected)
 */
export async function sendApprovalEmail(emailService, toEmail, studentName, approved, rejectionReason = '') {
    const subject = approved ? "SSAAM Account Approved - You Can Now Login!" : "SSAAM Account Status Update";
    const statusColor = approved ? "#10b981" : "#ef4444";
    const statusText = approved ? "Approved" : "Not Approved";
    const message = approved
        ? "Congratulations! Your SSAAM account has been approved. You can now login to your account using your Student ID and your Last Name as the temporary password. You may change your password anytime in the Dashboard settings."
        : `Unfortunately, your account registration was not approved.${rejectionReason ? ` Reason: ${sanitizeHtml(rejectionReason)}` : ''}`;

    const mailOptions = {
        from: "SSAAM <ssaamjrmsu@gmail.com>",
        to: toEmail,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">SSAAM</h1>
                    <p style="color: white; opacity: 0.9; margin: 5px 0 0 0;">Student School Activities Attendance Monitoring</p>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                    <h2 style="color: #1f2937; margin-top: 0;">Hello ${sanitizeHtml(studentName)}!</h2>
                    <div style="background: white; border: 2px solid ${statusColor}; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 24px; font-weight: bold; color: ${statusColor};">Account ${statusText}</span>
                    </div>
                    <p style="color: #4b5563;">${message}</p>
                    ${approved ? `
                    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 15px 0;">
                        <p style="color: #92400e; margin: 0; font-weight: bold;">Important:</p>
                        <p style="color: #92400e; margin: 5px 0 0 0;">Your temporary password is your <strong>Last Name</strong> (in uppercase). You can change it anytime from your Dashboard settings.</p>
                    </div>
                    <p style="color: #4b5563;">Login at: <a href="https://ssaam.vercel.app" style="color: #7c3aed;">ssaam.vercel.app</a></p>` : ''}
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">Powered by CCS - Creatives Committee</p>
                </div>
            </div>
        `
    };

    return emailService.sendMail(mailOptions);
}

/**
 * Send RFID verification confirmation email
 * @param {Object} emailService - Email service instance
 * @param {string} toEmail - Recipient email
 * @param {string} studentName - Student full name
 * @param {string} rfidCode - RFID code assigned
 * @param {string} verifiedBy - Admin who verified the RFID
 */
export async function sendRFIDVerificationEmail(emailService, toEmail, studentName, rfidCode, verifiedBy) {
    const mailOptions = {
        from: "SSAAM <ssaamjrmsu@gmail.com>",
        to: toEmail,
        subject: "SSAAM RFID Verified - Your Attendance Card is Now Active!",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">SSAAM</h1>
                    <p style="color: white; opacity: 0.9; margin: 5px 0 0 0;">Student School Activities Attendance Monitoring</p>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                    <h2 style="color: #1f2937; margin-top: 0;">Hello ${sanitizeHtml(studentName)}!</h2>
                    <div style="background: white; border: 2px solid #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 24px; font-weight: bold; color: #10b981;">RFID Verified!</span>
                    </div>
                    <p style="color: #4b5563;">Great news! Your RFID attendance card has been verified and is now active.</p>
                    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <p style="color: #6b7280; margin: 5px 0;"><strong>RFID Code:</strong> ${sanitizeHtml(rfidCode)}</p>
                        <p style="color: #6b7280; margin: 5px 0;"><strong>Verified By:</strong> ${sanitizeHtml(verifiedBy)}</p>
                        <p style="color: #6b7280; margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <p style="color: #4b5563;">You can now use your RFID card to log your attendance at school activities.</p>
                    <p style="color: #4b5563;">Check your status at: <a href="https://ssaam.vercel.app" style="color: #7c3aed;">ssaam.vercel.app</a></p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">Powered by CCS - Creatives Committee</p>
                </div>
            </div>
        `
    };

    return emailService.sendMail(mailOptions);
}

/**
 * Send password reset code email
 * @param {Object} emailService - Email service instance
 * @param {string} toEmail - Recipient email
 * @param {string} code - Password reset code
 * @param {string} studentName - Student full name
 */
export async function sendPasswordResetEmail(emailService, toEmail, code, studentName) {
    const mailOptions = {
        from: "SSAAM <ssaamjrmsu@gmail.com>",
        to: toEmail,
        subject: "SSAAM Password Reset Code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-family: Arial, sans-serif; font-size: 28px; letter-spacing: 2px;">SSAAM</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 13px;">Student School Activities Attendance Monitoring</p>
                </div>
                <div style="background: #ffffff; padding: 32px 30px; border-radius: 0 0 10px 10px; border: 1px solid #dbeafe; border-top: none;">
                    <h2 style="color: #1e3a8a; margin-top: 0; font-size: 20px;">Hello ${sanitizeHtml(studentName)}!</h2>
                    <p style="color: #4b5563; margin-bottom: 8px;">You requested a password reset. Your verification code is:</p>
                    <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 24px 20px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #1d4ed8; font-family: 'Courier New', monospace;">${code}</span>
                    </div>
                    <p style="color: #4b5563;">This code will expire in <strong style="color: #1d4ed8;">15 minutes</strong>.</p>
                    <p style="color: #6b7280; font-size: 13px;">If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
                    <hr style="border: none; border-top: 1px solid #dbeafe; margin: 20px 0;">
                    <p style="color: #93c5fd; font-size: 12px; text-align: center;">Powered by CCS - Creatives Committee</p>
                </div>
            </div>
        `
    };

    return emailService.sendMail(mailOptions);
}
