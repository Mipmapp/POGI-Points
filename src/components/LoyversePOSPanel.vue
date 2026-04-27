<template>
  <div class="pos-panel bg-white rounded-3xl shadow-xl border border-teal-100 overflow-hidden">
    <!-- Header -->
    <div class="px-4 sm:px-6 py-4 bg-gradient-to-r from-[#36b37e] to-[#00a884] text-white flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-sm sm:text-base font-extrabold leading-tight">Loyverse POS</h3>
        <p class="text-[11px] sm:text-xs text-white/80 truncate">{{ student ? `Sale for ${customerName}` : 'No student selected' }}</p>
      </div>
      <div class="hidden sm:flex items-center gap-2 text-[11px]">
        <span :class="['px-2 py-1 rounded-full font-bold flex items-center gap-1', usbConnected ? 'bg-white text-[#00a884]' : 'bg-white/15 text-white/80']">
          <span :class="['w-1.5 h-1.5 rounded-full', usbConnected ? 'bg-[#00a884]' : 'bg-white/60']"></span>
          USB
        </span>
        <span :class="['px-2 py-1 rounded-full font-bold flex items-center gap-1', btConnected ? 'bg-white text-[#00a884]' : 'bg-white/15 text-white/80']">
          <span :class="['w-1.5 h-1.5 rounded-full', btConnected ? 'bg-[#00a884]' : 'bg-white/60']"></span>
          BT
        </span>
      </div>
      <button @click="showSettings = true" class="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Header
      </button>
    </div>

    <!-- Connection bar -->
    <div class="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2">
      <button @click="connectUSB" :disabled="connectingUSB"
        :class="['flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border', usbConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-200 hover:border-[#00a884] hover:text-[#00a884]']">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        {{ usbConnected ? 'USB Connected' : (connectingUSB ? 'Connecting...' : 'Connect USB Printer') }}
      </button>
      <button @click="connectBT" :disabled="connectingBT"
        :class="['flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border', btConnected ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-500 hover:text-blue-600']">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l5-7-5-7v14zM7 19l5-7-5-7"/></svg>
        {{ btConnected ? 'BT Connected' : (connectingBT ? 'Connecting...' : 'Connect Bluetooth') }}
      </button>
      <button v-if="usbConnected || btConnected" @click="disconnectAll" class="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-100 transition">
        Disconnect
      </button>
      <span v-if="printerStatus" class="ml-auto text-[11px] font-semibold text-gray-500 self-center px-2">{{ printerStatus }}</span>
    </div>

    <!-- Body: receipt preview only -->
    <div class="p-4 sm:p-6">
      <div v-if="!hasSale" class="text-center text-gray-400 text-sm py-10">
        <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center">
          <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </div>
        Select a student and an active payment to compose the receipt.
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Sale summary (left) -->
        <div class="space-y-3">
          <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <p class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Sale</p>
            <p class="text-sm font-extrabold text-gray-800">{{ itemName }}</p>
            <p class="text-[11px] text-gray-500 mt-0.5">Auto-loaded from the active payment</p>
            <div class="mt-3 flex items-end justify-between">
              <span class="text-xs text-gray-500">Amount</span>
              <span class="text-2xl font-extrabold text-[#00a884]">₱{{ amount.toFixed(2) }}</span>
            </div>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <p class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Customer</p>
            <p class="text-sm font-extrabold text-gray-800">{{ customerName || '—' }}</p>
            <p v-if="student && student.student_id" class="text-[11px] text-gray-500 mt-0.5">ID: {{ student.student_id }}</p>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <p class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Cashier</p>
            <p class="text-sm font-extrabold text-gray-800">{{ employeeName || 'Owner' }}</p>
            <p class="text-[11px] text-gray-500 mt-0.5">POS: {{ posName }}</p>
          </div>

          <div class="flex gap-2 pt-1">
            <button @click="printReceipt" :disabled="!hasSale || (!usbConnected && !btConnected) || isPrinting"
              class="flex-1 py-2.5 bg-gradient-to-r from-[#36b37e] to-[#00a884] text-white rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200">
              <svg v-if="isPrinting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              {{ isPrinting ? 'Printing...' : 'Print Receipt' }}
            </button>
          </div>
        </div>

        <!-- Receipt preview (right) -->
        <div>
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Receipt Preview</p>
          <div class="bg-white border border-gray-200 rounded-2xl shadow-inner mx-auto overflow-hidden" style="max-width: 280px;">
            <div class="receipt-paper px-5 py-5 text-[11px] text-black leading-snug font-mono">
              <div class="flex justify-center mb-3">
                <img :src="logoUrl" alt="Logo" class="w-20 h-auto" @error="logoFailed = true" />
              </div>
              <p class="text-center font-bold tracking-wider mb-1">{{ businessHeader }}</p>
              <p class="text-center mb-1">{{ businessAddress }}</p>
              <p class="text-center font-bold mb-1 leading-tight">{{ businessName }}</p>
              <p class="text-center mb-3">Phone No: {{ businessPhone }}</p>

              <p class="mb-0.5"><span class="font-bold">Employee:</span> {{ employeeName || 'Owner' }}</p>
              <p class="mb-2"><span class="font-bold">POS:</span> {{ posName }}</p>
              <p class="mb-3"><span class="font-bold">Customer:</span> {{ customerName || '—' }}</p>

              <div class="border-t border-dashed border-black/60 my-2"></div>

              <div class="flex justify-between font-bold">
                <span class="uppercase">{{ itemName }}</span>
                <span>₱{{ amount.toFixed(2) }}</span>
              </div>
              <p class="mt-1">1 x ₱{{ amount.toFixed(2) }}</p>

              <div class="border-t border-dashed border-black/60 my-2"></div>

              <div class="flex justify-between font-extrabold text-[13px]">
                <span>Total</span>
                <span>₱{{ amount.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span>Cash</span>
                <span>₱{{ amount.toFixed(2) }}</span>
              </div>

              <div class="border-t border-dashed border-black/60 my-3"></div>

              <p class="text-center font-bold mb-3">THANK YOU FOR YOUR PURCHASE!</p>
              <p class="text-center italic text-[10px]">*Please retain this receipt as proof of purchase and to claim your item*</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Header settings modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showSettings" class="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" @click.self="showSettings = false">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div class="px-5 py-4 bg-gradient-to-r from-[#36b37e] to-[#00a884] text-white flex items-center justify-between">
              <h3 class="text-base font-extrabold">Receipt Header</h3>
              <button @click="showSettings = false" class="p-1 rounded-lg hover:bg-white/15">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <label class="block">
                <span class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Header Title</span>
                <input v-model="businessHeader" @change="persistSettings" class="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none" />
              </label>
              <label class="block">
                <span class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Address</span>
                <input v-model="businessAddress" @change="persistSettings" class="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none" />
              </label>
              <label class="block">
                <span class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Organization Name</span>
                <textarea v-model="businessName" @change="persistSettings" rows="2" class="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"></textarea>
              </label>
              <label class="block">
                <span class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Phone</span>
                <input v-model="businessPhone" @change="persistSettings" class="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none" />
              </label>
              <label class="block">
                <span class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">POS Name</span>
                <input v-model="posName" @change="persistSettings" class="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none" />
              </label>
              <label class="block">
                <span class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Cashier (Employee)</span>
                <input v-model="employeeName" @change="persistSettings" class="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none" />
                <p class="text-[10px] text-gray-400 mt-1">Auto-filled with the logged-in treasurer or co-admin's name. You can override it here.</p>
              </label>
              <div class="flex gap-2 pt-2">
                <button @click="resetSettings" class="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50">Reset to Default</button>
                <button @click="showSettings = false" class="ml-auto px-4 py-2 rounded-xl text-xs font-bold bg-[#00a884] text-white hover:opacity-90">Done</button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
// Logo is served by Vite from `public/assets/` at the root URL.
const CCS_LOGO_URL = '/assets/ccs_logo.png';

const SETTINGS_KEY = 'ssaam_pos_receipt_v2';

const DEFAULT_SETTINGS = {
  businessHeader: 'ACADEMIC',
  businessAddress: 'Dapitan City, Zamboanga del Norte',
  businessName: 'COLLEGE OF COMPUTING STUDIES STUDENT GOVERNMENT',
  businessPhone: '+63 955 447 6313',
  posName: 'POS 1',
  employeeName: '',
};

// Common ESC/POS thermal printer USB vendor IDs (Epson, Star, Citizen, Bixolon, etc.)
const PRINTER_VENDORS = [
  0x04b8, 0x0519, 0x0fe6, 0x1504, 0x1659, 0x0dd4, 0x1a86, 0x067b, 0x154f, 0x0416, 0x0483, 0x28e9
];

// Known BLE thermal printer services (POS58, MTP, GOOJPRT, ZJ, Xprinter, etc.)
const BT_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ffb0-0000-1000-8000-00805f9b34fb',
];

export default {
  name: 'LoyversePOSPanel',
  props: {
    student: { type: Object, default: null },
    suggestedAmount: { type: Number, default: 0 },
    activePayment: { type: Object, default: null },
  },
  data() {
    return {
      // Editable receipt-header settings (persisted)
      businessHeader: DEFAULT_SETTINGS.businessHeader,
      businessAddress: DEFAULT_SETTINGS.businessAddress,
      businessName: DEFAULT_SETTINGS.businessName,
      businessPhone: DEFAULT_SETTINGS.businessPhone,
      posName: DEFAULT_SETTINGS.posName,
      employeeName: '',
      logoUrl: CCS_LOGO_URL,
      logoFailed: false,
      showSettings: false,
      // Printer state
      usbDevice: null,
      usbEndpoint: null,
      usbConnected: false,
      connectingUSB: false,
      btDevice: null,
      btCharacteristic: null,
      btConnected: false,
      connectingBT: false,
      isPrinting: false,
      printerStatus: '',
    };
  },
  computed: {
    customerName() {
      if (!this.student) return '';
      const n = this.student.full_name || `${this.student.first_name || ''} ${this.student.middle_name || ''} ${this.student.last_name || ''} ${this.student.suffix || ''}`;
      return n.replace(/\s+/g, ' ').trim().toUpperCase();
    },
    itemName() {
      return (this.activePayment && this.activePayment.title) ? this.activePayment.title.toUpperCase() : 'CONTRIBUTION';
    },
    amount() {
      const a = Number(this.suggestedAmount || (this.activePayment && this.activePayment.amount_due) || 0);
      return a > 0 ? a : 0;
    },
    hasSale() {
      return !!this.student && !!this.activePayment && this.amount > 0;
    },
  },
  mounted() {
    this.loadSettings();
    this.autoFillEmployee();
  },
  beforeUnmount() {
    this.disconnectAll(true);
  },
  watch: {
    student() { this.autoFillEmployee(); },
  },
  methods: {
    notify(message, type = 'info') {
      window.dispatchEvent(new CustomEvent('app-notification', { detail: { message, type } }));
    },
    loadSettings() {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.businessHeader) this.businessHeader = s.businessHeader;
          if (s.businessAddress) this.businessAddress = s.businessAddress;
          if (s.businessName) this.businessName = s.businessName;
          if (s.businessPhone) this.businessPhone = s.businessPhone;
          if (s.posName) this.posName = s.posName;
          if (s.employeeName) this.employeeName = s.employeeName;
        }
      } catch {}
    },
    persistSettings() {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
          businessHeader: this.businessHeader,
          businessAddress: this.businessAddress,
          businessName: this.businessName,
          businessPhone: this.businessPhone,
          posName: this.posName,
          employeeName: this.employeeName,
        }));
      } catch {}
    },
    resetSettings() {
      Object.assign(this, DEFAULT_SETTINGS);
      this.autoFillEmployee();
      this.persistSettings();
    },
    // Auto-fill the cashier name from the logged-in admin (treasurer / co-admin / admin).
    // We only overwrite when the field is blank, so any user override is preserved.
    autoFillEmployee() {
      if (this.employeeName) return;
      try {
        const cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const name = cu.full_name || cu.fullName ||
          [cu.first_name, cu.middle_name, cu.last_name, cu.suffix].filter(Boolean).join(' ') ||
          cu.username || '';
        if (name) this.employeeName = String(name).trim();
      } catch {}
    },

    // ---------- ESC/POS receipt build ----------
    async loadLogoBitmap() {
      // Render the CCS logo into a monochrome ESC/POS raster (GS v 0).
      if (this.logoFailed) return null;
      const targetWidth = 192; // multiple of 8, fits 58mm (384 dot) nicely centered
      try {
        const img = await new Promise((resolve, reject) => {
          const i = new Image();
          i.crossOrigin = 'anonymous';
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = this.logoUrl;
        });
        const w = targetWidth;
        const h = Math.max(8, Math.round((img.height / img.width) * w));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        const bytesPerRow = w / 8;
        const bytes = new Uint8Array(bytesPerRow * h);
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            const lum = a < 128 ? 255 : (0.299 * r + 0.587 * g + 0.114 * b);
            if (lum < 128) {
              bytes[y * bytesPerRow + (x >> 3)] |= (1 << (7 - (x & 7)));
            }
          }
        }
        const xL = bytesPerRow & 0xff, xH = (bytesPerRow >> 8) & 0xff;
        const yL = h & 0xff, yH = (h >> 8) & 0xff;
        const header = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
        const out = new Uint8Array(header.length + bytes.length);
        out.set(header, 0);
        out.set(bytes, header.length);
        return out;
      } catch (e) {
        console.warn('Logo bitmap failed:', e);
        return null;
      }
    },

    async buildEscPos() {
      const enc = new TextEncoder();
      const W = 32; // 58mm printers ~ 32 chars wide
      const parts = [];

      // Init
      parts.push(new Uint8Array([0x1b, 0x40]));

      // Center align
      parts.push(new Uint8Array([0x1b, 0x61, 0x01]));

      // Logo (raster bitmap)
      const logo = await this.loadLogoBitmap();
      if (logo) parts.push(logo);
      parts.push(enc.encode('\n'));

      // Header text — bold
      parts.push(new Uint8Array([0x1b, 0x45, 0x01]));
      parts.push(enc.encode(this.businessHeader + '\n'));
      parts.push(new Uint8Array([0x1b, 0x45, 0x00]));
      parts.push(enc.encode(this.businessAddress + '\n'));
      parts.push(enc.encode('\n'));

      parts.push(new Uint8Array([0x1b, 0x45, 0x01]));
      // wrap long org name into ~W chars
      this.wrapText(this.businessName, W).forEach(line => parts.push(enc.encode(line + '\n')));
      parts.push(new Uint8Array([0x1b, 0x45, 0x00]));
      parts.push(enc.encode('Phone No: ' + this.businessPhone + '\n'));
      parts.push(enc.encode('\n'));

      // Left align
      parts.push(new Uint8Array([0x1b, 0x61, 0x00]));
      parts.push(enc.encode('Employee: ' + (this.employeeName || 'Owner') + '\n'));
      parts.push(enc.encode('POS: ' + this.posName + '\n'));
      parts.push(enc.encode('\n'));
      parts.push(enc.encode('Customer: ' + (this.customerName || '—') + '\n'));
      parts.push(enc.encode('\n'));
      parts.push(enc.encode(this.dashed(W) + '\n'));

      // Item line
      const priceText = '₱' + this.amount.toFixed(2);
      const itemUpper = this.itemName;
      // Two-line: ITEM NAME .... ₱xxx
      parts.push(new Uint8Array([0x1b, 0x45, 0x01]));
      parts.push(enc.encode(this.row(itemUpper.slice(0, W - priceText.length - 1), priceText, W) + '\n'));
      parts.push(new Uint8Array([0x1b, 0x45, 0x00]));
      parts.push(enc.encode(`1 x ${priceText}\n`));
      parts.push(enc.encode('\n'));
      parts.push(enc.encode(this.dashed(W) + '\n'));

      // Total / Cash
      parts.push(new Uint8Array([0x1b, 0x21, 0x10])); // double height
      parts.push(enc.encode(this.row('Total', priceText, W) + '\n'));
      parts.push(new Uint8Array([0x1b, 0x21, 0x00]));
      parts.push(enc.encode(this.row('Cash', priceText, W) + '\n'));
      parts.push(enc.encode('\n'));

      // Footer
      parts.push(new Uint8Array([0x1b, 0x61, 0x01]));
      parts.push(new Uint8Array([0x1b, 0x45, 0x01]));
      parts.push(enc.encode('THANK YOU FOR YOUR PURCHASE!\n'));
      parts.push(new Uint8Array([0x1b, 0x45, 0x00]));
      parts.push(enc.encode('*Please retain this receipt as proof\n'));
      parts.push(enc.encode('of purchase and to claim your item*\n'));
      parts.push(enc.encode('\n\n\n'));

      // Cut
      parts.push(new Uint8Array([0x1d, 0x56, 0x00]));

      const total = parts.reduce((n, p) => n + p.byteLength, 0);
      const out = new Uint8Array(total);
      let offset = 0;
      for (const p of parts) {
        out.set(p, offset);
        offset += p.byteLength;
      }
      return out;
    },
    row(left, right, w = 32) {
      const space = Math.max(1, w - left.length - right.length);
      return left + ' '.repeat(space) + right;
    },
    dashed(w = 32) {
      return '-'.repeat(w);
    },
    wrapText(text, w = 32) {
      const words = String(text || '').split(/\s+/).filter(Boolean);
      const lines = [];
      let cur = '';
      for (const word of words) {
        if (!cur.length) { cur = word; continue; }
        if (cur.length + 1 + word.length <= w) { cur += ' ' + word; }
        else { lines.push(cur); cur = word; }
      }
      if (cur) lines.push(cur);
      return lines.length ? lines : [''];
    },

    // ---------- USB printer ----------
    async pickUSBDevice() {
      const filters = [
        { classCode: 0x07 },
        ...PRINTER_VENDORS.map(v => ({ vendorId: v })),
      ];
      try {
        return await navigator.usb.requestDevice({ filters });
      } catch (e) {
        if (e && e.name === 'NotFoundError') {
          return await navigator.usb.requestDevice({ filters: [{}] });
        }
        throw e;
      }
    },
    async connectUSB() {
      if (!navigator.usb) {
        this.notify('WebUSB is not supported in this browser', 'error');
        this.printerStatus = 'WebUSB unavailable — try Chrome/Edge';
        return;
      }
      this.connectingUSB = true;
      this.printerStatus = 'Requesting USB device...';
      try {
        const device = await this.pickUSBDevice();
        this.printerStatus = `Opening ${device.productName || device.manufacturerName || 'printer'}...`;
        await device.open();
        try { await device.reset(); } catch (_) {}
        if (device.configuration === null) {
          try { await device.selectConfiguration(1); } catch (_) {}
        }
        let claimedIface = null;
        let endpointNumber = null;
        const interfaces = (device.configuration && device.configuration.interfaces) || [];
        for (const iface of interfaces) {
          for (const alt of iface.alternates) {
            const out = alt.endpoints.find(e => e.direction === 'out' && e.type === 'bulk');
            if (!out) continue;
            try {
              await device.claimInterface(iface.interfaceNumber);
              if (alt.alternateSetting !== 0) {
                try { await device.selectAlternateInterface(iface.interfaceNumber, alt.alternateSetting); } catch (_) {}
              }
              claimedIface = iface.interfaceNumber;
              endpointNumber = out.endpointNumber;
              break;
            } catch (e) {
              this.printerStatus = 'OS driver is holding the printer';
            }
          }
          if (claimedIface !== null) break;
        }
        if (claimedIface === null) {
          throw new Error('Could not claim a printable USB interface (the OS print driver may already own it — unplug then replug, or remove the printer from the system print queue, then try again)');
        }
        this.usbDevice = device;
        this.usbEndpoint = endpointNumber;
        this.usbConnected = true;
        this.printerStatus = `USB ready: ${device.productName || device.manufacturerName || 'Printer'}`;
        this.notify('USB printer connected', 'success');
      } catch (e) {
        console.error('USB connect error:', e);
        const msg = (e && e.message) ? e.message : String(e);
        if (e && e.name === 'NotFoundError') {
          this.printerStatus = 'No USB printer selected';
          this.notify('No USB printer selected', 'warning');
        } else if (e && e.name === 'SecurityError') {
          this.printerStatus = 'Blocked by browser permissions — open the app in a normal tab';
          this.notify('USB blocked. Open the app outside the preview iframe in Chrome.', 'error');
        } else {
          this.printerStatus = 'USB failed: ' + msg.slice(0, 80);
          this.notify('USB connect failed: ' + msg, 'error');
        }
      } finally {
        this.connectingUSB = false;
      }
    },

    // ---------- Bluetooth printer ----------
    async pickBTDevice() {
      try {
        return await navigator.bluetooth.requestDevice({
          filters: BT_SERVICES.map(s => ({ services: [s] })),
          optionalServices: BT_SERVICES,
        });
      } catch (e) {
        if (e && e.name === 'NotFoundError') {
          return await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: BT_SERVICES,
          });
        }
        throw e;
      }
    },
    async findWritableCharacteristic(server) {
      for (const uuid of BT_SERVICES) {
        try {
          const svc = await server.getPrimaryService(uuid);
          const chars = await svc.getCharacteristics();
          const writable = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
          if (writable) return writable;
        } catch (_) {}
      }
      try {
        const services = await server.getPrimaryServices();
        for (const svc of services) {
          try {
            const chars = await svc.getCharacteristics();
            const writable = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
            if (writable) return writable;
          } catch (_) {}
        }
      } catch (_) {}
      return null;
    },
    async connectBT() {
      if (!navigator.bluetooth) {
        this.notify('Web Bluetooth is not supported in this browser', 'error');
        return;
      }
      this.connectingBT = true;
      this.printerStatus = 'Requesting Bluetooth device...';
      try {
        const device = await this.pickBTDevice();
        this.printerStatus = `Pairing with ${device.name || 'printer'}...`;
        const server = await device.gatt.connect();
        this.printerStatus = 'Discovering printer service...';
        const characteristic = await this.findWritableCharacteristic(server);
        if (!characteristic) throw new Error('No writable characteristic found on this device');
        this.btDevice = device;
        this.btCharacteristic = characteristic;
        this.btConnected = true;
        this.printerStatus = `BT ready: ${device.name || 'Printer'}`;
        device.addEventListener('gattserverdisconnected', () => {
          this.btConnected = false;
          this.btCharacteristic = null;
          this.printerStatus = 'Bluetooth disconnected';
        });
        this.notify('Bluetooth printer connected', 'success');
      } catch (e) {
        console.error('BT connect error:', e);
        const msg = (e && e.message) ? e.message : String(e);
        this.printerStatus = 'BT failed: ' + msg.slice(0, 60);
        if (e && e.name === 'NotFoundError') {
          this.notify('No printer selected', 'warning');
        } else {
          this.notify('Bluetooth connection failed: ' + msg, 'error');
        }
      } finally {
        this.connectingBT = false;
      }
    },
    async disconnectAll(silent = false) {
      try {
        if (this.usbDevice) { try { await this.usbDevice.close(); } catch {} }
        if (this.btDevice && this.btDevice.gatt && this.btDevice.gatt.connected) {
          try { this.btDevice.gatt.disconnect(); } catch {}
        }
      } finally {
        this.usbDevice = null;
        this.usbEndpoint = null;
        this.usbConnected = false;
        this.btDevice = null;
        this.btCharacteristic = null;
        this.btConnected = false;
        this.printerStatus = silent ? '' : 'Disconnected';
      }
    },

    async printReceipt() {
      if (!this.hasSale) return;
      this.isPrinting = true;
      this.printerStatus = 'Printing...';
      try {
        const data = await this.buildEscPos();
        if (this.usbConnected && this.usbDevice && this.usbEndpoint != null) {
          await this.usbDevice.transferOut(this.usbEndpoint, data);
        } else if (this.btConnected && this.btCharacteristic) {
          const chunkSize = 180;
          for (let i = 0; i < data.length; i += chunkSize) {
            const slice = data.slice(i, i + chunkSize);
            if (this.btCharacteristic.writeValueWithoutResponse) {
              await this.btCharacteristic.writeValueWithoutResponse(slice);
            } else {
              await this.btCharacteristic.writeValue(slice);
            }
          }
        } else {
          throw new Error('No printer connected');
        }
        this.printerStatus = 'Printed ✓';
        this.notify('Receipt sent to printer', 'success');
        this.$emit('printed', { item: this.itemName, amount: this.amount, customer: this.customerName });
      } catch (e) {
        console.error(e);
        this.printerStatus = 'Print failed';
        this.notify('Printing failed: ' + (e.message || e), 'error');
      } finally {
        this.isPrinting = false;
      }
    },
  },
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.pos-panel ::-webkit-scrollbar { width: 6px; }
.pos-panel ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }

/* Receipt paper look */
.receipt-paper {
  background: #fff;
  background-image:
    repeating-linear-gradient(90deg, transparent 0 11px, rgba(0,0,0,.02) 11px 12px);
}
</style>
