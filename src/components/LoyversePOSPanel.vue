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
      <button @click="connectBT" :disabled="connectingBT"
        :class="['flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border', btConnected ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-500 hover:text-blue-600']">
        <img :src="'/bluetooth.svg'" class="w-3.5 h-3.5 flex-shrink-0" alt="Bluetooth" />
        {{ btConnected ? 'BT Connected' : (connectingBT ? 'Connecting...' : 'Connect Bluetooth Printer') }}
      </button>
      <button v-if="btConnected" @click="disconnectAll" class="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-100 transition">
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

          <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <p class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Copies to Print</p>
            <div class="flex items-center gap-2">
              <button type="button" @click="copies = Math.max(1, copies - 1)"
                class="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center">−</button>
              <input
                type="number" min="1" max="10"
                v-model.number="copies"
                @blur="copies = Math.min(10, Math.max(1, Number(copies) || 1))"
                class="flex-1 text-center px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none" />
              <button type="button" @click="copies = Math.min(10, copies + 1)"
                class="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center">+</button>
            </div>
            <p class="text-[10px] text-gray-400 mt-1">Maximum 10 copies per print run.</p>
          </div>

          <div class="flex gap-2 pt-1">
            <button @click="printReceipt" :disabled="!hasSale || !btConnected || isPrinting"
              class="flex-1 py-2.5 bg-gradient-to-r from-[#36b37e] to-[#00a884] text-white rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200">
              <svg v-if="isPrinting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              {{ isPrinting ? 'Printing...' : (copies > 1 ? `Print ${copies} Receipts` : 'Print Receipt') }}
            </button>
          </div>
        </div>

        <!-- Receipt preview (right) -->
        <div>
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Receipt Preview</p>
          <div class="bg-white border border-gray-200 rounded-2xl shadow-inner mx-auto overflow-hidden" style="max-width: 240px;">
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

              <template v-if="addonItems && addonItems.length > 0">
                <div v-for="addon in addonItems" :key="addon.name" class="mt-1">
                  <div class="flex justify-between">
                    <span class="uppercase truncate pr-1" style="max-width:65%">{{ addon.name }}</span>
                    <span>₱{{ addon.subtotal.toFixed(2) }}</span>
                  </div>
                  <p class="text-[10px]">{{ addon.qty }} x ₱{{ addon.price.toFixed(2) }}</p>
                </div>
              </template>

              <div class="border-t border-dashed border-black/60 my-2"></div>

              <div class="flex justify-between font-extrabold text-[13px]">
                <span>Total</span>
                <span>₱{{ receiptTotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span>Cash</span>
                <span>₱{{ receiptTotal.toFixed(2) }}</span>
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
import { getPersonDisplayName } from '../utils/formatters.js'

// Logo is served by Vite from `public/assets/` at the root URL.
const CCS_LOGO_URL = '/img/ccs_logo.png';

const SETTINGS_KEY = 'ssaam_pos_receipt_v2';
const BT_LAST_DEVICE_KEY = 'ssaam_pos_bt_last_device';

const DEFAULT_SETTINGS = {
  businessHeader: 'ACADEMIC',
  businessAddress: 'Dapitan City, Zamboanga del Norte',
  businessName: 'COLLEGE OF COMPUTING STUDIES STUDENT GOVERNMENT',
  businessPhone: '+63 955 447 6313',
  posName: 'POS 1',
  employeeName: '',
};

// Known BLE thermal printer services (POS58, MTP, GOOJPRT, ZJ, Xprinter, etc.)
const BT_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ffb0-0000-1000-8000-00805f9b34fb',
];

// Module-level singleton for the Bluetooth printer connection. The actual
// `BluetoothDevice` and characteristic live OUTSIDE the component instance so
// the connection survives navigation / re-mounts of the POS panel. The set of
// component instances currently mounted is tracked so we can broadcast state
// changes (connect / disconnect / reconnect) to all of them.
const btState = {
  device: null,
  characteristic: null,
  connected: false,
  reconnecting: false,
  listenerBound: false,
  listeners: new Set(),
  notify(status) {
    for (const cb of this.listeners) {
      try { cb(status); } catch (_) {}
    }
  },
};

async function findWritableCharacteristicOnServer(server) {
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
}

async function tryReconnectBT() {
  if (!btState.device || btState.reconnecting) return;
  btState.reconnecting = true;
  // Try a few times with backoff; bail if the device is no longer available.
  const delays = [800, 1500, 3000, 6000, 10000];
  for (let i = 0; i < delays.length; i++) {
    if (!btState.device) break;
    try {
      btState.notify(`Reconnecting printer (attempt ${i + 1})...`);
      const server = await btState.device.gatt.connect();
      const characteristic = await findWritableCharacteristicOnServer(server);
      if (characteristic) {
        btState.characteristic = characteristic;
        btState.connected = true;
        btState.reconnecting = false;
        btState.notify(`BT ready: ${btState.device.name || 'Printer'}`);
        return;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, delays[i]));
  }
  btState.reconnecting = false;
  btState.notify('Bluetooth disconnected');
}

export default {
  name: 'LoyversePOSPanel',
  props: {
    student: { type: Object, default: null },
    suggestedAmount: { type: Number, default: 0 },
    activePayment: { type: Object, default: null },
    addonItems: { type: Array, default: () => [] },
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
      copies: 1,
      // Printer state (Bluetooth only) — these mirror the module-level
      // singleton (btState) so the template stays reactive while the actual
      // BluetoothDevice survives across mounts.
      btConnected: false,
      connectingBT: false,
      isPrinting: false,
      printerStatus: '',
      _btUnsubscribe: null,
    };
  },
  computed: {
    btDevice() { return btState.device; },
    btCharacteristic() { return btState.characteristic; },
    customerName() {
      if (!this.student) return '';
       return getPersonDisplayName(this.student).replace(/\s+/g, ' ').trim().toUpperCase();
    },
    itemName() {
      return (this.activePayment && this.activePayment.title) ? this.activePayment.title.toUpperCase() : 'CONTRIBUTION';
    },
    amount() {
      const a = Number(this.suggestedAmount || (this.activePayment && this.activePayment.amount_due) || 0);
      return a > 0 ? a : 0;
    },
    addonTotal() {
      return (this.addonItems || []).reduce((s, i) => s + Number(i.subtotal || 0), 0);
    },
    receiptTotal() {
      return this.amount + this.addonTotal;
    },
    hasSale() {
      return !!this.student && !!this.activePayment && this.receiptTotal > 0;
    },
  },
  mounted() {
    this.loadSettings();
    this.autoFillEmployee();
    // Hydrate from the singleton so a re-mounted panel reflects an existing
    // connection instead of looking like nothing is paired.
    this.btConnected = btState.connected;
    // Attempt silent auto-reconnect using previously authorized devices.
    if (!btState.connected) this.autoReconnectBT();
    if (btState.connected) {
      this.printerStatus = `BT ready: ${btState.device?.name || 'Printer'}`;
    }
    // Subscribe to global BT state changes (connect / disconnect / reconnect).
    const onBtChange = (status) => {
      this.btConnected = btState.connected;
      if (typeof status === 'string') this.printerStatus = status;
    };
    btState.listeners.add(onBtChange);
    this._btUnsubscribe = () => btState.listeners.delete(onBtChange);
  },
  beforeUnmount() {
    // IMPORTANT: do NOT disconnect Bluetooth here. The whole point of the
    // singleton is to keep the printer paired even if this panel unmounts
    // (e.g. user navigates between admin tabs). The user can disconnect
    // explicitly via the "Disconnect" button.
    if (typeof this._btUnsubscribe === 'function') {
      this._btUnsubscribe();
      this._btUnsubscribe = null;
    }
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
        const name = getPersonDisplayName(cu, cu.username || '');
        if (name) this.employeeName = String(name).trim();
      } catch {}
    },

    // ---------- ESC/POS receipt build ----------
    async loadLogoBitmap() {
      // Render the CCS logo into a monochrome ESC/POS raster (GS v 0).
      if (this.logoFailed) return null;
      // 57mm rolls have ~48mm printable area = ~384 dots @ 203 DPI.
      // Use 160 dots so the logo sits comfortably with margin on both sides.
      const targetWidth = 160; // multiple of 8
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
      this.wrapText(this.businessAddress, W)
      .forEach(line => parts.push(enc.encode(line + '\n')));
      parts.push(enc.encode('\n'));

      parts.push(new Uint8Array([0x1b, 0x45, 0x01]));
      // wrap long org name into ~W chars
      this.wrapText(this.businessName, W).forEach(line => parts.push(enc.encode(line + '\n')));
      parts.push(new Uint8Array([0x1b, 0x45, 0x00]));
      parts.push(enc.encode('Phone No: ' + this.businessPhone + '\n'));
      parts.push(enc.encode('\n'));

      // Left align
      parts.push(new Uint8Array([0x1b, 0x61, 0x00]));
      // Word-wrap long values so we never split a word in the middle
      // (e.g. "MAGLINTE" must not become "MAG" + "LINTE").
      this.wrapText('Employee: ' + (this.employeeName || 'Owner'), W)
        .forEach(line => parts.push(enc.encode(line + '\n')));
      parts.push(enc.encode('POS: ' + this.posName + '\n'));
      parts.push(enc.encode('\n'));
      this.wrapText('Customer: ' + (this.customerName || '—'), W)
        .forEach(line => parts.push(enc.encode(line + '\n')));
      parts.push(enc.encode('\n'));
      parts.push(enc.encode(this.dashed(W) + '\n'));

      // Item line — use plain "P" instead of the unicode peso sign because
      // most ESC/POS thermal printers default to code page 437/PC850 which do
      // NOT contain U+20B1 (₱). The on-screen preview keeps the real ₱ glyph.
      const priceText = 'P' + this.amount.toFixed(2);
      const itemUpper = this.itemName;
      parts.push(new Uint8Array([0x1b, 0x45, 0x01]));
      this.itemRow(itemUpper, priceText, W)
        .forEach(line => parts.push(enc.encode(line + '\n')));
      parts.push(new Uint8Array([0x1b, 0x45, 0x00]));
      parts.push(enc.encode(`1 x ${priceText}\n`));

      // Add-on lines
      if (this.addonItems && this.addonItems.length > 0) {
        for (const addon of this.addonItems) {
          const addonPrice = 'P' + Number(addon.subtotal || 0).toFixed(2);
          const addonName = String(addon.name || 'ADD-ON').toUpperCase();
          parts.push(new Uint8Array([0x1b, 0x45, 0x01]));
          this.itemRow(addonName, addonPrice, W)
            .forEach(line => parts.push(enc.encode(line + '\n')));
          parts.push(new Uint8Array([0x1b, 0x45, 0x00]));
          parts.push(enc.encode(`${addon.qty} x P${Number(addon.price || 0).toFixed(2)}\n`));
        }
      }

      parts.push(enc.encode('\n'));
      parts.push(enc.encode(this.dashed(W) + '\n'));

      const totalText = 'P' + this.receiptTotal.toFixed(2);

      // Total — bold AND double-height so it stands out the most
      parts.push(new Uint8Array([0x1b, 0x45, 0x01])); // bold ON
      parts.push(new Uint8Array([0x1b, 0x21, 0x10])); // double height
      parts.push(enc.encode(this.row('Total', totalText, W) + '\n'));
      parts.push(new Uint8Array([0x1b, 0x21, 0x00])); // size reset
      parts.push(new Uint8Array([0x1b, 0x45, 0x00])); // bold OFF

      // Cash
      parts.push(enc.encode(this.row('Cash', totalText, W) + '\n'));
      parts.push(enc.encode('\n'));

      // Footer (centered, with proper word-wrapping so we don't split words)
      parts.push(new Uint8Array([0x1b, 0x61, 0x01]));
      parts.push(new Uint8Array([0x1b, 0x45, 0x01]));
      parts.push(enc.encode('THANK YOU FOR YOUR PURCHASE!\n'));
      parts.push(new Uint8Array([0x1b, 0x45, 0x00]));
      this.wrapText('*Please retain this receipt as proof of purchase and to claim your item*', W)
        .forEach(line => parts.push(enc.encode(line + '\n')));
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
    // Wrap an item title with a right-aligned price on the first line.
    // First line  : as much of the (word-wrapped) title as fits, then PRICE.
    // Other lines : the rest of the title, full width, words kept whole.
    // Guarantees that no word is split mid-character.
    itemRow(name, price, w = 32) {
      const firstMaxName = Math.max(1, w - price.length - 1);
      const words = String(name || '').split(/\s+/).filter(Boolean);
      const lines = [];
      let cur = '';
      for (const word of words) {
        const max = lines.length === 0 ? firstMaxName : w;
        if (!cur.length) {
          // Push the word onto the current line; if it overflows on its own,
          // bump to the next line (the next-line cap is the wider w).
          if (word.length <= max) { cur = word; }
          else { lines.push(''); cur = word; }
          continue;
        }
        if (cur.length + 1 + word.length <= max) { cur += ' ' + word; }
        else { lines.push(cur); cur = word; }
      }
      if (cur) lines.push(cur);
      // Compose first line with right-aligned price; rest are plain.
      const out = [];
      out.push(this.row(lines[0] || '', price, w));
      for (let i = 1; i < lines.length; i++) out.push(lines[i]);
      return out;
    },

    // ---------- Bluetooth auto-reconnect on page load ----------
    async autoReconnectBT() {
      if (!navigator.bluetooth || typeof navigator.bluetooth.getDevices !== 'function') return;
      const savedName = localStorage.getItem(BT_LAST_DEVICE_KEY);
      try {
        const devices = await navigator.bluetooth.getDevices();
        if (!devices || devices.length === 0) return;
        const device = savedName
          ? (devices.find(d => d.name === savedName) || devices[0])
          : devices[0];
        if (!device) return;
        this.connectingBT = true;
        btState.notify(`Auto-reconnecting to ${device.name || 'printer'}...`);
        const server = await device.gatt.connect();
        const characteristic = await this.findWritableCharacteristic(server);
        if (!characteristic) { this.connectingBT = false; return; }
        btState.device = device;
        btState.characteristic = characteristic;
        btState.connected = true;
        if (!btState.listenerBound) {
          device.addEventListener('gattserverdisconnected', () => {
            btState.connected = false;
            btState.characteristic = null;
            btState.notify('Bluetooth disconnected — reconnecting...');
            tryReconnectBT();
          });
          btState.listenerBound = true;
        }
        localStorage.setItem(BT_LAST_DEVICE_KEY, device.name || '');
        btState.notify(`BT ready: ${device.name || 'Printer'}`);
        this.notify('Bluetooth printer reconnected', 'success');
      } catch (_) {
        // Silent — user can press Connect manually if auto-reconnect fails
      } finally {
        this.connectingBT = false;
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
      btState.notify('Requesting Bluetooth device...');
      try {
        const device = await this.pickBTDevice();
        btState.notify(`Pairing with ${device.name || 'printer'}...`);
        const server = await device.gatt.connect();
        btState.notify('Discovering printer service...');
        const characteristic = await this.findWritableCharacteristic(server);
        if (!characteristic) throw new Error('No writable characteristic found on this device');

        // Persist into the singleton so the link survives panel re-mounts.
        btState.device = device;
        btState.characteristic = characteristic;
        btState.connected = true;
        btState.notify(`BT ready: ${device.name || 'Printer'}`);
        localStorage.setItem(BT_LAST_DEVICE_KEY, device.name || '');

        // Bind the disconnect handler ONCE per device so we don't double-fire.
        if (!btState.listenerBound) {
          device.addEventListener('gattserverdisconnected', () => {
            btState.connected = false;
            btState.characteristic = null;
            btState.notify('Bluetooth disconnected — reconnecting...');
            // Auto-reconnect: the device reference is still in scope, so we can
            // re-establish GATT without prompting the user.
            tryReconnectBT();
          });
          btState.listenerBound = true;
        }
        this.notify('Bluetooth printer connected', 'success');
      } catch (e) {
        console.error('BT connect error:', e);
        const msg = (e && e.message) ? e.message : String(e);
        btState.notify('BT failed: ' + msg.slice(0, 60));
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
        if (btState.device && btState.device.gatt && btState.device.gatt.connected) {
          try { btState.device.gatt.disconnect(); } catch {}
        }
      } finally {
        btState.device = null;
        btState.characteristic = null;
        btState.connected = false;
        btState.listenerBound = false;
        localStorage.removeItem(BT_LAST_DEVICE_KEY);
        btState.notify(silent ? '' : 'Disconnected');
      }
    },

    async printReceipt() {
      if (!this.hasSale) return;
      const n = Math.min(10, Math.max(1, Number(this.copies) || 1));
      this.copies = n;
      this.isPrinting = true;
      try {
        const data = await this.buildEscPos();
        for (let copy = 1; copy <= n; copy++) {
          this.printerStatus = n > 1 ? `Printing ${copy} of ${n}...` : 'Printing...';
          if (!this.btConnected || !this.btCharacteristic) {
            throw new Error('No Bluetooth printer connected');
          }
          const chunkSize = 180;
          for (let i = 0; i < data.length; i += chunkSize) {
            const slice = data.slice(i, i + chunkSize);
            if (this.btCharacteristic.writeValueWithoutResponse) {
              await this.btCharacteristic.writeValueWithoutResponse(slice);
            } else {
              await this.btCharacteristic.writeValue(slice);
            }
          }
          // Small breathing room between copies so the printer buffer drains.
          if (copy < n) await new Promise(r => setTimeout(r, 350));
        }
        this.printerStatus = n > 1 ? `Printed ${n} copies ✓` : 'Printed ✓';
        this.notify(n > 1 ? `${n} receipts sent to printer` : 'Receipt sent to printer', 'success');
        this.$emit('printed', { item: this.itemName, amount: this.amount, customer: this.customerName, copies: n });
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
