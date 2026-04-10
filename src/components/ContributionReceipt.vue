<template>
  <div>
    <!-- Action Buttons -->
    <div class="flex gap-2">
      <button
        @click="showPreview = true"
        class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white rounded-lg font-medium hover:from-ssaam-dark hover:to-ssaam-light transition-all duration-300 hover:shadow-lg"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>
        Preview
      </button>
      <button
        @click="downloadReceipt"
        class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white rounded-lg font-medium hover:from-ssaam-dark hover:to-ssaam-light transition-all duration-300 hover:shadow-lg"
        :disabled="isDownloading"
      >
        <svg v-if="!isDownloading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19v-7m0 0V5m0 7H5m7 0h7"></path>
        </svg>
        <svg v-else class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        {{ isDownloading ? 'Downloading...' : 'Download Receipt' }}
      </button>
    </div>

    <!-- Receipt Preview Modal -->
    <transition name="fade">
      <div v-if="showPreview" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="showPreview = false">
        <transition name="modal-bounce" appear>
          <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="flex justify-between items-center sticky top-0 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white p-6 border-b border-gray-200">
              <h3 class="text-2xl font-bold">Receipt Preview</h3>
              <button @click="showPreview = false" class="text-white hover:text-gray-200 text-3xl">&times;</button>
            </div>

            <!-- Receipt Content -->
            <div class="p-6">
              <div ref="receiptContent" class="bg-white">
                <div class="receipt-document" style="width: 100%; max-width: 8.5in; background: white; padding: 2rem; font-family: 'Arial', sans-serif; box-sizing: border-box; margin: 0 auto; border: 1px solid #e5e7eb;">
                  <!-- Header with Logos -->
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6b21a8; padding-bottom: 1rem; margin-bottom: 1.5rem;">
                    <!-- JRMSU Logo -->
                    <div style="flex: 1; text-align: center;">
                      <img src="/jrmsu.svg" alt="JRMSU" style="height: 80px; width: auto;" />
                    </div>
                    <!-- Center Title -->
                    <div style="flex: 2; text-align: center; padding: 0 1rem;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #6b21a8;">CONTRIBUTION RECEIPT</h1>
                      <p style="margin: 0.25rem 0 0 0; font-size: 12px; color: #666;">SSAAM - Student Scholars and Achievers Alliance for Mindset</p>
                    </div>
                    <!-- SSAAM Logo -->
                    <div style="flex: 1; text-align: center;">
                      <img src="/assets/ssaam_logo.jpg" alt="SSAAM" style="height: 80px; width: auto;" />
                    </div>
                  </div>

                  <!-- Receipt Number and Date -->
                  <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.75rem;">
                    <div>
                      <p style="margin: 0; font-size: 11px; color: #666;">Receipt No.</p>
                      <p style="margin: 0.25rem 0 0 0; font-size: 13px; font-weight: bold; color: #6b21a8;">{{ receiptNumber }}</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; font-size: 11px; color: #666;">Date Issued</p>
                      <p style="margin: 0.25rem 0 0 0; font-size: 13px; font-weight: bold; color: #6b21a8;">{{ currentDate }}</p>
                    </div>
                  </div>

                  <!-- Student Information Section -->
                  <div style="background: linear-gradient(to right, #1e3bdb, #4f62ff); color: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0 0 0.75rem 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">Student Information</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 12px;">
                      <div>
                        <p style="margin: 0; opacity: 0.9;">Full Name</p>
                        <p style="margin: 0.25rem 0 0 0; font-size: 14px; font-weight: bold;">{{ studentName }}</p>
                      </div>
                      <div>
                        <p style="margin: 0; opacity: 0.9;">Student ID</p>
                        <p style="margin: 0.25rem 0 0 0; font-size: 14px; font-weight: bold;">{{ studentId }}</p>
                      </div>
                      <div>
                        <p style="margin: 0; opacity: 0.9;">Year Level</p>
                        <p style="margin: 0.25rem 0 0 0; font-size: 14px; font-weight: bold;">{{ yearLevel || 'N/A' }}</p>
                      </div>
                      <div>
                        <p style="margin: 0; opacity: 0.9;">Program</p>
                        <p style="margin: 0.25rem 0 0 0; font-size: 14px; font-weight: bold;">{{ program || 'N/A' }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Event Information Section -->
                  <div style="background: #f3f4f6; border-left: 4px solid #6b21a8; padding: 1rem; border-radius: 0.25rem; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0 0 0.75rem 0; font-size: 14px; font-weight: bold; color: #6b21a8; text-transform: uppercase;">Event Details</h3>
                    <div style="font-size: 12px; color: #374151;">
                      <div style="margin-bottom: 0.5rem;">
                        <p style="margin: 0; color: #666;">Event Title</p>
                        <p style="margin: 0.25rem 0 0 0; font-weight: bold; font-size: 13px;">{{ eventTitle }}</p>
                      </div>
                      <div style="margin-bottom: 0.5rem;">
                        <p style="margin: 0; color: #666;">Event Date</p>
                        <p style="margin: 0.25rem 0 0 0; font-weight: bold; font-size: 13px;">{{ eventDate }}</p>
                      </div>
                      <div v-if="paidAt">
                        <p style="margin: 0; color: #666;">Payment Recorded Date</p>
                        <p style="margin: 0.25rem 0 0 0; font-weight: bold; font-size: 13px;">{{ paidAt }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Contribution Status -->
                  <div style="display: flex; justify-content: space-between; align-items: center; background: #dcfce7; border: 1px solid #86efac; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                    <div>
                      <p style="margin: 0; font-size: 12px; color: #365f0f;">Contribution Status</p>
                      <p style="margin: 0.25rem 0 0 0; font-size: 16px; font-weight: bold; color: #16a34a;">PAYMENT RECORDED</p>
                    </div>
                    <div style="font-size: 32px; color: #22c55e;">✓</div>
                  </div>

                  <!-- Notes Section -->
                  <div v-if="notes" style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 0.25rem; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 12px; font-weight: bold; color: #1e40af; text-transform: uppercase;">Treasurer Notes</h3>
                    <p style="margin: 0; font-size: 12px; color: #1e3a8a; line-height: 1.5;">{{ notes }}</p>
                  </div>

                  <!-- Approval Section -->
                  <div style="margin-top: 2rem; padding-top: 1rem; border-top: 2px solid #e5e7eb;">
                    <p style="margin: 0 0 0.5rem 0; font-size: 11px; color: #666; font-style: italic;">This receipt certifies that the student has fulfilled their contribution requirements for the event. This document is valid proof of payment.</p>
                    <div style="display: flex; justify-content: space-between; margin-top: 1.5rem; font-size: 12px;">
                      <div style="text-align: center;">
                        <div style="border-top: 1px solid #000; width: 150px; margin-bottom: 0.5rem;"></div>
                        <p style="margin: 0; font-weight: bold;">Treasurer</p>
                        <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 11px;">{{ paidByTreasurer || 'SSAAM Treasurer' }}</p>
                      </div>
                      <div style="text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #666;">Verified and Processed</p>
                        <p style="margin: 0.5rem 0 0 0; font-size: 14px; font-weight: bold; color: #6b21a8;">SSAAM OFFICE</p>
                      </div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #999;">
                    <p style="margin: 0;">For inquiries, contact: ssaamjrmsu@gmail.com</p>
                    <p style="margin: 0.25rem 0 0 0;">Jose Rizal Memorial State University - College of Computing Studies</p>
                    <p style="margin: 0.25rem 0 0 0; font-style: italic;">Generated on {{ generatedDate }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex gap-2 justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                @click="showPreview = false"
                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Close
              </button>
              <button
                @click="downloadReceipt; showPreview = false"
                class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ssaam-dark to-ssaam-light text-white rounded-lg font-medium hover:from-ssaam-dark hover:to-ssaam-light transition-all duration-300"
                :disabled="isDownloading"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19v-7m0 0V5m0 7H5m7 0h7"></path>
                </svg>
                Download PDF
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Hidden Receipt Content for PDF Rendering -->
    <div ref="pdfContent" class="hidden">
      <div class="receipt-document" style="width: 8.5in; height: 11in; background: white; padding: 0.5in; font-family: 'Arial', sans-serif; box-sizing: border-box;">
        <!-- Header with Logos -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6b21a8; padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <!-- JRMSU Logo -->
          <div style="flex: 1; text-align: center;">
            <img src="/jrmsu.svg" alt="JRMSU" style="height: 80px; width: auto;" />
          </div>
          <!-- Center Title -->
          <div style="flex: 2; text-align: center; padding: 0 1rem;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #6b21a8;">CONTRIBUTION RECEIPT</h1>
            <p style="margin: 0.25rem 0 0 0; font-size: 12px; color: #666;">SSAAM - Student Scholars and Achievers Alliance for Mindset</p>
          </div>
          <!-- SSAAM Logo -->
          <div style="flex: 1; text-align: center;">
            <img src="/assets/ssaam_logo.jpg" alt="SSAAM" style="height: 80px; width: auto;" />
          </div>
        </div>

        <!-- Receipt Number and Date -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.75rem;">
          <div>
            <p style="margin: 0; font-size: 11px; color: #666;">Receipt No.</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 13px; font-weight: bold; color: #6b21a8;">{{ receiptNumber }}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 11px; color: #666;">Date Issued</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 13px; font-weight: bold; color: #6b21a8;">{{ currentDate }}</p>
          </div>
        </div>

        <!-- Student Information Section -->
        <div style="background: linear-gradient(to right, #1e3bdb, #4f62ff); color: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
          <h3 style="margin: 0 0 0.75rem 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">Student Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 12px;">
            <div>
              <p style="margin: 0; opacity: 0.9;">Full Name</p>
              <p style="margin: 0.25rem 0 0 0; font-size: 14px; font-weight: bold;">{{ studentName }}</p>
            </div>
            <div>
              <p style="margin: 0; opacity: 0.9;">Student ID</p>
              <p style="margin: 0.25rem 0 0 0; font-size: 14px; font-weight: bold;">{{ studentId }}</p>
            </div>
            <div>
              <p style="margin: 0; opacity: 0.9;">Year Level</p>
              <p style="margin: 0.25rem 0 0 0; font-size: 14px; font-weight: bold;">{{ yearLevel || 'N/A' }}</p>
            </div>
            <div>
              <p style="margin: 0; opacity: 0.9;">Program</p>
              <p style="margin: 0.25rem 0 0 0; font-size: 14px; font-weight: bold;">{{ program || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <!-- Event Information Section -->
        <div style="background: #f3f4f6; border-left: 4px solid #6b21a8; padding: 1rem; border-radius: 0.25rem; margin-bottom: 1.5rem;">
          <h3 style="margin: 0 0 0.75rem 0; font-size: 14px; font-weight: bold; color: #6b21a8; text-transform: uppercase;">Event Details</h3>
          <div style="font-size: 12px; color: #374151;">
            <div style="margin-bottom: 0.5rem;">
              <p style="margin: 0; color: #666;">Event Title</p>
              <p style="margin: 0.25rem 0 0 0; font-weight: bold; font-size: 13px;">{{ eventTitle }}</p>
            </div>
            <div style="margin-bottom: 0.5rem;">
              <p style="margin: 0; color: #666;">Event Date</p>
              <p style="margin: 0.25rem 0 0 0; font-weight: bold; font-size: 13px;">{{ eventDate }}</p>
            </div>
            <div v-if="paidAt">
              <p style="margin: 0; color: #666;">Payment Recorded Date</p>
              <p style="margin: 0.25rem 0 0 0; font-weight: bold; font-size: 13px;">{{ paidAt }}</p>
            </div>
          </div>
        </div>

        <!-- Contribution Status -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #dcfce7; border: 1px solid #86efac; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
          <div>
            <p style="margin: 0; font-size: 12px; color: #365f0f;">Contribution Status</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 16px; font-weight: bold; color: #16a34a;">PAYMENT RECORDED</p>
          </div>
          <div style="font-size: 32px; color: #22c55e;">✓</div>
        </div>

        <!-- Notes Section -->
        <div v-if="notes" style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 0.25rem; margin-bottom: 1.5rem;">
          <h3 style="margin: 0 0 0.5rem 0; font-size: 12px; font-weight: bold; color: #1e40af; text-transform: uppercase;">Treasurer Notes</h3>
          <p style="margin: 0; font-size: 12px; color: #1e3a8a; line-height: 1.5;">{{ notes }}</p>
        </div>

        <!-- Approval Section -->
        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 2px solid #e5e7eb;">
          <p style="margin: 0 0 0.5rem 0; font-size: 11px; color: #666; font-style: italic;">This receipt certifies that the student has fulfilled their contribution requirements for the event. This document is valid proof of payment.</p>
          <div style="display: flex; justify-content: space-between; margin-top: 1.5rem; font-size: 12px;">
            <div style="text-align: center;">
              <div style="border-top: 1px solid #000; width: 150px; margin-bottom: 0.5rem;"></div>
              <p style="margin: 0; font-weight: bold;">Treasurer</p>
              <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 11px;">{{ paidByTreasurer || 'SSAAM Treasurer' }}</p>
            </div>
            <div style="text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #666;">Verified and Processed</p>
              <p style="margin: 0.5rem 0 0 0; font-size: 14px; font-weight: bold; color: #6b21a8;">SSAAM OFFICE</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #999;">
          <p style="margin: 0;">For inquiries, contact: ssaamjrmsu@gmail.com</p>
          <p style="margin: 0.25rem 0 0 0;">Jose Rizal Memorial State University - College of Computing Studies</p>
          <p style="margin: 0.25rem 0 0 0; font-style: italic;">Generated on {{ generatedDate }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContributionReceipt',
  props: {
    studentName: {
      type: String,
      required: true
    },
    studentId: {
      type: String,
      required: true
    },
    eventTitle: {
      type: String,
      required: true
    },
    eventDate: {
      type: String,
      required: true
    },
    paidAt: {
      type: String,
      default: null
    },
    paidByTreasurer: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: null
    },
    yearLevel: {
      type: String,
      default: null
    },
    program: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      isDownloading: false,
      showPreview: false,
      receiptNumber: '',
      currentDate: '',
      generatedDate: '',
      html2pdf: null
    }
  },
  async mounted() {
    this.generateReceiptNumber()
    this.setCurrentDate()
    // Load html2pdf library
    try {
      const { default: html2pdfLib } = await import('html2pdf.js')
      this.html2pdf = html2pdfLib
    } catch (err) {
      console.error('Failed to load html2pdf:', err)
    }
  },
  methods: {
    generateReceiptNumber() {
      // Generate receipt number based on date and random suffix
      const now = new Date()
      const timestamp = now.getTime().toString().slice(-6)
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      this.receiptNumber = `RCP-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${timestamp}${random}`
    },
    setCurrentDate() {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      this.currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      this.generatedDate = new Date().toLocaleString('en-US', options)
    },
    async downloadReceipt() {
      if (!this.html2pdf) {
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { type: 'warning', message: 'PDF library is still loading. Please try again in a moment.' } }))
        return
      }

      this.isDownloading = true
      try {
        const element = this.$refs.pdfContent
        const filename = `SSAAM_Receipt_${this.studentId}_${this.eventTitle.replace(/\s+/g, '_')}.pdf`

        const opt = {
          margin: 0,
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }

        this.html2pdf().set(opt).from(element).save()
      } catch (error) {
        console.error('Error downloading receipt:', error)
        window.dispatchEvent(new CustomEvent('app-notification', { detail: { type: 'error', message: 'Failed to download receipt. Please try again.' } }))
      } finally {
        this.isDownloading = false
      }
    },
    // Added discount functionality
    applyDiscount() {
      const discountAmount = this.discountType === 'amount' ? this.discountValue : (this.discountValue / 100) * this.campaignFee;
      this.targetPayment = this.campaignFee - discountAmount;
    },
    searchByRfid() {
      // Logic to search by RFID
    }
  }
}
</script>

<style scoped>
.receipt-document {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-bounce-enter-active {
  animation: modal-bounce 0.4s ease;
}

.modal-bounce-leave-active {
  animation: modal-bounce 0.3s ease reverse;
}

@keyframes modal-bounce {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
