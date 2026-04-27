<template>
  <div class="pos-panel bg-white rounded-3xl shadow-xl border border-teal-100 overflow-hidden">
    <!-- Header -->
    <div class="px-4 sm:px-6 py-4 bg-gradient-to-r from-[#36b37e] to-[#00a884] text-white flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-sm sm:text-base font-extrabold leading-tight">Loyverse POS</h3>
        <p class="text-[11px] sm:text-xs text-white/80 truncate">{{ student ? `Sale for ${student.full_name || student.first_name + ' ' + student.last_name}` : 'No student selected' }}</p>
      </div>
      <!-- Connection chips -->
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
      <button @click="showItemEditor = true" class="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        Items
      </button>
    </div>

    <!-- Connection bar -->
    <div class="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2">
      <button
        @click="connectUSB"
        :disabled="connectingUSB"
        :class="['flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border', usbConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-200 hover:border-[#00a884] hover:text-[#00a884]']"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        {{ usbConnected ? 'USB Connected' : (connectingUSB ? 'Connecting...' : 'Connect USB Printer') }}
      </button>
      <button
        @click="connectBT"
        :disabled="connectingBT"
        :class="['flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border', btConnected ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-500 hover:text-blue-600']"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l5-7-5-7v14zM7 19l5-7-5-7"/></svg>
        {{ btConnected ? 'BT Connected' : (connectingBT ? 'Connecting...' : 'Connect Bluetooth') }}
      </button>
      <button
        v-if="usbConnected || btConnected"
        @click="disconnectAll"
        class="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-100 transition"
      >
        Disconnect
      </button>
      <span v-if="printerStatus" class="ml-auto text-[11px] font-semibold text-gray-500 self-center px-2">{{ printerStatus }}</span>
    </div>

    <!-- Body: catalog + cart -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-0 lg:divide-x divide-gray-100">
      <!-- Catalog -->
      <div class="lg:col-span-3 p-4 sm:p-5">
        <div class="flex items-center gap-2 mb-3">
          <input
            v-model="catalogQuery"
            type="text"
            placeholder="Filter items..."
            class="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none bg-gray-50 focus:bg-white transition"
          />
          <select v-model="catalogCategory" class="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:border-emerald-400 outline-none transition">
            <option value="">All</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div v-if="filteredItems.length === 0" class="py-12 text-center text-gray-400 text-sm">
          <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14l-8-4m8 4v10M4 7v10l8 4"/></svg>
          </div>
          No items yet. Click <span class="font-semibold text-emerald-600">Items</span> to add some.
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          <button
            v-for="item in filteredItems"
            :key="item.id"
            @click="addToCart(item)"
            class="relative group aspect-square rounded-2xl overflow-hidden border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all active:scale-95 flex flex-col"
          >
            <div class="flex-1 flex items-center justify-center text-2xl sm:text-3xl" :style="{ background: item.color || '#f3f4f6' }">
              <span v-if="item.emoji">{{ item.emoji }}</span>
              <span v-else class="text-white/90 font-extrabold text-lg sm:text-xl drop-shadow">{{ initials(item.name) }}</span>
            </div>
            <div class="bg-white px-2 py-1.5 text-left">
              <p class="text-[11px] font-bold text-gray-800 truncate leading-tight">{{ item.name }}</p>
              <p class="text-[11px] text-emerald-600 font-extrabold">₱{{ Number(item.price).toFixed(2) }}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Cart -->
      <div class="lg:col-span-2 bg-gray-50 p-4 sm:p-5 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest">Cart</h4>
          <button v-if="cart.length" @click="clearCart" class="text-[11px] font-bold text-red-500 hover:text-red-700">Clear</button>
        </div>

        <div v-if="cart.length === 0" class="flex-1 flex flex-col items-center justify-center py-8 text-center text-gray-400 text-xs">
          <svg class="w-10 h-10 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          Tap items to add them
        </div>

        <div v-else class="flex-1 space-y-2 overflow-y-auto max-h-[320px] pr-1">
          <div v-for="(line, idx) in cart" :key="line.id + '-' + idx" class="bg-white rounded-2xl p-3 border border-gray-200">
            <div class="flex items-start gap-2">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" :style="{ background: line.color || '#f3f4f6' }">
                <span v-if="line.emoji">{{ line.emoji }}</span>
                <span v-else class="text-white font-bold text-xs">{{ initials(line.name) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-gray-800 truncate">{{ line.name }}</p>
                <p class="text-[11px] text-gray-400">₱{{ Number(line.price).toFixed(2) }} each</p>
              </div>
              <button @click="removeFromCart(idx)" class="text-gray-300 hover:text-red-500 p-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button @click="updateQty(idx, -1)" class="w-6 h-6 rounded-lg bg-white hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold">−</button>
                <span class="w-7 text-center text-xs font-extrabold text-gray-800">{{ line.qty }}</span>
                <button @click="updateQty(idx, 1)" class="w-6 h-6 rounded-lg bg-white hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold">+</button>
              </div>
              <span class="text-sm font-extrabold text-emerald-600">₱{{ (line.price * line.qty).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Totals -->
        <div class="mt-3 pt-3 border-t border-gray-200 space-y-1.5 text-xs">
          <div class="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span class="font-bold">₱{{ subtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center text-gray-600">
            <span class="flex items-center gap-1.5">
              Discount
              <input v-model.number="discount" type="number" min="0" class="w-16 px-1.5 py-0.5 text-[11px] border border-gray-200 rounded-md text-right outline-none focus:border-emerald-400" />
            </span>
            <span class="font-bold text-orange-600">−₱{{ Math.min(discount || 0, subtotal).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center pt-1.5 border-t border-gray-200 text-sm">
            <span class="font-bold text-gray-800">Total</span>
            <span class="font-extrabold text-[#00a884] text-lg">₱{{ total.toFixed(2) }}</span>
          </div>
        </div>

        <div class="flex gap-2 mt-3">
          <button
            @click="printReceipt"
            :disabled="!cart.length || (!usbConnected && !btConnected) || isPrinting"
            class="flex-1 py-2.5 bg-gradient-to-r from-[#36b37e] to-[#00a884] text-white rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200"
          >
            <svg v-if="isPrinting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            {{ isPrinting ? 'Printing...' : 'Print Receipt' }}
          </button>
          <button
            @click="previewReceipt = true"
            :disabled="!cart.length"
            class="px-3 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition disabled:opacity-40"
            title="Preview"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Item editor modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showItemEditor" class="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" @click.self="showItemEditor = false">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div class="px-5 py-4 bg-gradient-to-r from-[#36b37e] to-[#00a884] text-white flex items-center justify-between">
              <h3 class="text-base font-extrabold">Manage Items</h3>
              <button @click="showItemEditor = false" class="p-1 rounded-lg hover:bg-white/15">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="p-5 space-y-4 overflow-y-auto">
              <!-- Add / edit form -->
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <input v-model="form.name" placeholder="Item name" class="sm:col-span-4 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400" />
                <input v-model.number="form.price" type="number" step="0.01" placeholder="Price" class="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400" />
                <input v-model="form.category" placeholder="Category" class="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400" />
                <input v-model="form.emoji" placeholder="Emoji" maxlength="2" class="sm:col-span-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-center outline-none focus:border-emerald-400" />
                <input v-model="form.color" type="color" class="sm:col-span-1 h-10 w-full p-1 border border-gray-200 rounded-xl bg-white" />
                <button @click="saveItem" class="sm:col-span-2 px-3 py-2 bg-[#00a884] text-white rounded-xl text-sm font-bold hover:opacity-90 transition">
                  {{ form.id ? 'Update' : 'Add' }}
                </button>
              </div>

              <!-- Items list -->
              <div class="space-y-2">
                <div v-for="item in items" :key="item.id" class="flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-2xl">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" :style="{ background: item.color || '#f3f4f6' }">
                    <span v-if="item.emoji">{{ item.emoji }}</span>
                    <span v-else class="text-white font-bold text-xs">{{ initials(item.name) }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-gray-800 truncate">{{ item.name }}</p>
                    <p class="text-[11px] text-gray-500">{{ item.category || 'Uncategorized' }} · ₱{{ Number(item.price).toFixed(2) }}</p>
                  </div>
                  <button @click="editItem(item)" class="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold hover:bg-blue-100">Edit</button>
                  <button @click="deleteItem(item.id)" class="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-100">Delete</button>
                </div>
                <div v-if="items.length === 0" class="text-center text-gray-400 text-sm py-6">No items yet. Add your first one above.</div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Receipt preview modal -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="previewReceipt" class="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" @click.self="previewReceipt = false">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
            <div class="px-4 py-3 bg-gray-100 flex items-center justify-between">
              <h3 class="text-sm font-extrabold text-gray-800">Receipt Preview</h3>
              <button @click="previewReceipt = false" class="text-gray-400 hover:text-gray-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <pre class="p-4 text-[11px] font-mono whitespace-pre-wrap text-gray-800 leading-tight">{{ receiptText }}</pre>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
const STORAGE_KEY = 'ssaam_pos_items_v1';

const DEFAULT_ITEMS = [
  { id: 'i1', name: 'Membership Fee', price: 100, category: 'Fees', emoji: '🎟️', color: '#36b37e' },
  { id: 'i2', name: 'Org Shirt', price: 350, category: 'Merch', emoji: '👕', color: '#3b82f6' },
  { id: 'i3', name: 'Lanyard', price: 50, category: 'Merch', emoji: '🪪', color: '#a855f7' },
  { id: 'i4', name: 'Event Ticket', price: 80, category: 'Events', emoji: '🎫', color: '#f59e0b' },
  { id: 'i5', name: 'Snack Pack', price: 35, category: 'Food', emoji: '🍪', color: '#ef4444' },
  { id: 'i6', name: 'Water Bottle', price: 20, category: 'Food', emoji: '💧', color: '#06b6d4' },
];

// Common ESC/POS thermal printer USB vendor IDs (Epson, Star, Citizen, Bixolon, etc.)
const PRINTER_VENDORS = [
  0x04b8, 0x0519, 0x0fe6, 0x1504, 0x1659, 0x0dd4, 0x1a86, 0x067b, 0x154f, 0x0416, 0x0483, 0x28e9
];

// Known BLE thermal printer services (POS58, MTP, GOOJPRT, ZJ, Xprinter, etc.)
const BT_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // generic SPP-over-BLE used by many 58mm/80mm printers
  '0000ff00-0000-1000-8000-00805f9b34fb', // POS58 / Goojprt variants
  '0000fff0-0000-1000-8000-00805f9b34fb', // some Xprinter / ZJ models
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 style modules
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC / Microchip transparent UART
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
      items: [],
      catalogQuery: '',
      catalogCategory: '',
      cart: [],
      discount: 0,
      autoLoadedKey: '',
      form: { id: null, name: '', price: 0, category: '', emoji: '', color: '#36b37e' },
      showItemEditor: false,
      previewReceipt: false,
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
    categories() {
      const set = new Set();
      this.items.forEach(i => i.category && set.add(i.category));
      return Array.from(set);
    },
    filteredItems() {
      const q = this.catalogQuery.trim().toLowerCase();
      return this.items.filter(i => {
        if (this.catalogCategory && i.category !== this.catalogCategory) return false;
        if (q && !i.name.toLowerCase().includes(q)) return false;
        return true;
      });
    },
    subtotal() {
      return this.cart.reduce((s, l) => s + l.price * l.qty, 0);
    },
    total() {
      return Math.max(0, this.subtotal - Math.min(this.discount || 0, this.subtotal));
    },
    receiptText() {
      const w = 32;
      const lines = [];
      const center = (s) => {
        const pad = Math.max(0, Math.floor((w - s.length) / 2));
        return ' '.repeat(pad) + s;
      };
      const row = (l, r) => {
        const space = Math.max(1, w - l.length - r.length);
        return l + ' '.repeat(space) + r;
      };
      lines.push(center('SSAAM'));
      lines.push(center('Student Activities POS'));
      lines.push(center(new Date().toLocaleString()));
      lines.push('-'.repeat(w));
      if (this.student) {
        const name = (this.student.full_name || `${this.student.first_name || ''} ${this.student.last_name || ''}`).trim();
        lines.push('Student: ' + (name || '—').slice(0, w - 9));
        if (this.student.student_id) lines.push('ID:      ' + this.student.student_id);
        lines.push('-'.repeat(w));
      }
      this.cart.forEach(l => {
        lines.push(l.name.slice(0, w));
        lines.push(row(`  ${l.qty} x ${Number(l.price).toFixed(2)}`, (l.price * l.qty).toFixed(2)));
      });
      lines.push('-'.repeat(w));
      lines.push(row('Subtotal', this.subtotal.toFixed(2)));
      if (this.discount > 0) lines.push(row('Discount', '-' + Math.min(this.discount, this.subtotal).toFixed(2)));
      lines.push(row('TOTAL', this.total.toFixed(2)));
      lines.push('-'.repeat(w));
      lines.push(center('Thank you!'));
      lines.push('');
      return lines.join('\n');
    },
  },
  mounted() {
    this.loadItems();
    this.syncActivePayment();
  },
  beforeUnmount() {
    this.disconnectAll(true);
  },
  watch: {
    student() { this.syncActivePayment(); },
    activePayment: { handler() { this.syncActivePayment(); }, deep: true },
    suggestedAmount() { this.syncActivePayment(); },
  },
  methods: {
    initials(name) {
      return (name || '?').split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
    },
    notify(message, type = 'info') {
      window.dispatchEvent(new CustomEvent('app-notification', { detail: { message, type } }));
    },
    loadItems() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.items = JSON.parse(raw);
        } else {
          this.items = [...DEFAULT_ITEMS];
          this.persistItems();
        }
      } catch {
        this.items = [...DEFAULT_ITEMS];
      }
    },
    persistItems() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items)); } catch {}
    },
    saveItem() {
      const name = (this.form.name || '').trim();
      const price = Number(this.form.price);
      if (!name || !(price >= 0)) {
        this.notify('Item needs a name and price', 'warning');
        return;
      }
      const payload = {
        id: this.form.id || ('i' + Date.now().toString(36)),
        name,
        price,
        category: (this.form.category || '').trim(),
        emoji: (this.form.emoji || '').trim(),
        color: this.form.color || '#36b37e',
      };
      const idx = this.items.findIndex(i => i.id === payload.id);
      if (idx === -1) this.items.push(payload);
      else this.items.splice(idx, 1, payload);
      this.persistItems();
      this.form = { id: null, name: '', price: 0, category: '', emoji: '', color: '#36b37e' };
    },
    editItem(item) {
      this.form = { ...item };
    },
    deleteItem(id) {
      this.items = this.items.filter(i => i.id !== id);
      this.persistItems();
    },
    addToCart(item) {
      const existing = this.cart.find(l => l.id === item.id);
      if (existing) existing.qty += 1;
      else this.cart.push({ ...item, qty: 1 });
    },
    updateQty(idx, delta) {
      const line = this.cart[idx];
      if (!line) return;
      line.qty = Math.max(1, line.qty + delta);
    },
    removeFromCart(idx) {
      this.cart.splice(idx, 1);
    },
    clearCart() {
      this.cart = [];
      this.discount = 0;
      this.autoLoadedKey = '';
    },

    // Build a synthetic line item from the active payment campaign and put it
    // in the cart so admins can just hit Print without composing items manually.
    syncActivePayment() {
      if (!this.student || !this.activePayment) return;
      const amount = Number(this.suggestedAmount || this.activePayment.amount_due || 0);
      if (!(amount > 0)) return;
      const key = `${this.student.student_id || this.student._id || ''}|${this.activePayment._id || this.activePayment.title || ''}|${amount}`;
      if (this.autoLoadedKey === key) return; // already synced for this combo

      // Replace any prior auto line, but keep manually-added items intact.
      const manual = this.cart.filter(l => !l._auto);
      const line = {
        _auto: true,
        id: 'auto-' + (this.activePayment._id || 'fee'),
        name: this.activePayment.title || 'Contribution Fee',
        price: amount,
        qty: 1,
        emoji: '🧾',
        color: '#36b37e',
      };
      this.cart = [line, ...manual];
      this.autoLoadedKey = key;
    },

    // ---------- USB printer ----------
    async pickUSBDevice() {
      // Build a wide filter list:
      //  • USB Printer device class (0x07) — matches virtually every receipt printer
      //  • Plus a long list of known thermal-printer vendor IDs as a safety net
      const filters = [
        { classCode: 0x07 },
        ...PRINTER_VENDORS.map(v => ({ vendorId: v })),
      ];
      try {
        return await navigator.usb.requestDevice({ filters });
      } catch (e) {
        // If chooser was empty (no matching device) try once more accepting anything.
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
        // Some printers need a reset to release any stuck OS driver hold.
        try { await device.reset(); } catch (_) { /* not fatal */ }
        if (device.configuration === null) {
          try { await device.selectConfiguration(1); } catch (_) { /* try next anyway */ }
        }
        // Hunt for any bulk OUT endpoint we can claim.
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
              // Likely "Unable to claim interface" — OS driver owns it.
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
      // First try filtering by known printer services so the chooser is short.
      try {
        return await navigator.bluetooth.requestDevice({
          filters: BT_SERVICES.map(s => ({ services: [s] })),
          optionalServices: BT_SERVICES,
        });
      } catch (e) {
        // If user cancelled the chooser, propagate. Otherwise retry with "any device".
        if (e && e.name === 'NotFoundError') {
          // The chooser appeared but user picked nothing OR no device matched.
          // Fall through to a wide-open chooser so they can pick the paired POS58
          // even if it does not advertise a known service.
          return await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: BT_SERVICES,
          });
        }
        throw e;
      }
    },

    async findWritableCharacteristic(server) {
      // Try the known services first (fast path).
      for (const uuid of BT_SERVICES) {
        try {
          const svc = await server.getPrimaryService(uuid);
          const chars = await svc.getCharacteristics();
          const writable = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
          if (writable) return writable;
        } catch (_) { /* service not present, keep trying */ }
      }
      // Fallback: enumerate every primary service and find any writable characteristic.
      try {
        const services = await server.getPrimaryServices();
        for (const svc of services) {
          try {
            const chars = await svc.getCharacteristics();
            const writable = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
            if (writable) return writable;
          } catch (_) { /* skip */ }
        }
      } catch (_) { /* ignore */ }
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
        if (!characteristic) {
          throw new Error('No writable characteristic found on this device');
        }
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
        if (this.usbDevice) {
          try { await this.usbDevice.close(); } catch {}
        }
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

    // ---------- Print ----------
    buildEscPos() {
      const enc = new TextEncoder();
      const parts = [];
      // Init
      parts.push(new Uint8Array([0x1b, 0x40]));
      // Center
      parts.push(new Uint8Array([0x1b, 0x61, 0x01]));
      // Double-size title
      parts.push(new Uint8Array([0x1b, 0x21, 0x30]));
      parts.push(enc.encode('SSAAM\n'));
      parts.push(new Uint8Array([0x1b, 0x21, 0x00]));
      parts.push(enc.encode('Student Activities POS\n'));
      parts.push(enc.encode(new Date().toLocaleString() + '\n'));
      // Left align
      parts.push(new Uint8Array([0x1b, 0x61, 0x00]));
      parts.push(enc.encode('-'.repeat(32) + '\n'));
      if (this.student) {
        const name = (this.student.full_name || `${this.student.first_name || ''} ${this.student.last_name || ''}`).trim();
        if (name) parts.push(enc.encode('Student: ' + name + '\n'));
        if (this.student.student_id) parts.push(enc.encode('ID:      ' + this.student.student_id + '\n'));
        parts.push(enc.encode('-'.repeat(32) + '\n'));
      }
      const row = (l, r) => {
        const space = Math.max(1, 32 - l.length - r.length);
        return l + ' '.repeat(space) + r + '\n';
      };
      this.cart.forEach(l => {
        parts.push(enc.encode(l.name.slice(0, 32) + '\n'));
        parts.push(enc.encode(row(`  ${l.qty} x ${Number(l.price).toFixed(2)}`, (l.price * l.qty).toFixed(2))));
      });
      parts.push(enc.encode('-'.repeat(32) + '\n'));
      parts.push(enc.encode(row('Subtotal', this.subtotal.toFixed(2))));
      if (this.discount > 0) parts.push(enc.encode(row('Discount', '-' + Math.min(this.discount, this.subtotal).toFixed(2))));
      // Bold total
      parts.push(new Uint8Array([0x1b, 0x45, 0x01]));
      parts.push(enc.encode(row('TOTAL', this.total.toFixed(2))));
      parts.push(new Uint8Array([0x1b, 0x45, 0x00]));
      parts.push(enc.encode('-'.repeat(32) + '\n'));
      // Center thank-you
      parts.push(new Uint8Array([0x1b, 0x61, 0x01]));
      parts.push(enc.encode('Thank you!\n\n\n'));
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

    async printReceipt() {
      if (!this.cart.length) return;
      this.isPrinting = true;
      this.printerStatus = 'Printing...';
      try {
        const data = this.buildEscPos();
        if (this.usbConnected && this.usbDevice && this.usbEndpoint != null) {
          await this.usbDevice.transferOut(this.usbEndpoint, data);
        } else if (this.btConnected && this.btCharacteristic) {
          // Send in chunks (BLE MTU ~ 180 bytes safe)
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
        this.$emit('printed', { items: [...this.cart], total: this.total });
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
</style>
