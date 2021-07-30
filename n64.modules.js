function padString(v,len) {
  var t = v.toString();
  while (t.length < len) {
    t = '0' + t;
  }
  return t;
}

function toHex(r, bits) {
  r = Number(r);
  if (r < 0) {
      r = 0xFFFFFFFF + r + 1;
  }

  var t = r.toString(16);

  if (bits) {
    var len = Math.floor(bits / 4); // 4 bits per hex char
    while (t.length < len) {
      t = '0' + t;
    }
  }

  return t;
}

function toString8(v) {
  return '0x' + toHex((v&0xff)>>>0, 8);
}

function toString16(v) {
  return '0x' + toHex((v&0xffff)>>>0, 16);
}

function toString32(v) {
  return '0x' + toHex(v, 32);
}

function toString64(hi, lo) {
  var t = toHex(lo, 32);
  var u = toHex(hi, 32);
  return '0x' + u + t;
}

/**
 * @type {jQuery} The element to write output to.
 */
let outputElement;

/**
 * @type {function(): string} A function to return a prefix for the log line.
 */
let getPrefixFn;

/**
 * Initialise the logger.
 * @param {!jQuery} output The element to append output to.
 * @param {!function(): string} prefix The function to call to generate the
 *     prefix for log lines.
 */
function initialise(output, prefix) {
  outputElement = output;
  getPrefixFn = prefix;
}

/**
 * Clears the log output.
 */
function clear() {
  outputElement.html('');
}

/**
 * Logs a string.
 * @param {string} str
 */
function log(str) {
  outputElement.append(getPrefixFn() + ': ' + str + '<br>');
  outputElement.scrollTop(outputElement[0].scrollHeight);
}

/**
 * Appends an HTML element to the log.
 * @param {jQuery} html
 */
function logHTML(html) {
  outputElement.append(html);
}

/**
 * A device represents a region of memory mapped at a certain address.
 */
class Device {
  /**
   * @param {string} name The name of this device.
   * @param {MemoryRegion|null} mem The memory region that backs this device.
   * @param {number} rangeStart The start of the address space to use.
   * @param {number} rangeEnd The end of the address space to use.
   */
  constructor(name, mem, rangeStart, rangeEnd) {
    this.name       = name;
    this.mem        = mem;
    this.u8         = mem ? mem.u8 : null;  // Cache the underlying Uint8Array.
    this.rangeStart = rangeStart;
    this.rangeEnd   = rangeEnd;
    this.quiet      = false;
  }

  /**
   * Sets the memory region that backs this device.
   * This is primarily used to attach the data for the ROM.
   * @param {MemoryRegion|null} mem The memory region that backs this device.
   */
  setMem(mem) {
    this.mem = mem;
    this.u8  = mem.u8;
  }

  /**
   * Calculate the relative offset of the address for this device.
   * @param {number} address
   * @return {number}
   */
  calcEA(address) {
    return address - this.rangeStart;
  }

  /**
   * Reads data at the specified address. For internal use - ignores errors.
   * @param {number} address
   * @return {number}
   */
  readInternal32(address) {
    var ea = this.calcEA(address);

    // We need to make sure this doesn't throw, so do a bounds check
    if (ea+4 <= this.u8.length) {
      return this.mem.readU32(ea);
    }
    return 0xdddddddd;
  }

  /**
   * Writes data to the specified address. For internal use - ignores errors.
   * @param {number} address
   * @param {number} value
   */
  writeInternal32(address, value) {
    var ea = this.calcEA(address);

    // We need to make sure this doesn't throw, so do a bounds check
    if (ea+4 <= this.u8.length) {
      this.mem.write32(ea, value);
    }
  }

  /**
   * Logs a read at the specified address.
   * @param {number} address
   */
  logRead(address) {
    if (!this.quiet) {
      log('Reading from ' + this.name + ': ' + toString32(address) );
    }
  }

  /**
   * Logs a write to the specified address.
   * @param {number} address
   */
  logWrite(address, value_str) {
    if (!this.quiet) {
      log('Writing to ' + this.name + ': ' + value_str + ' -> [' + toString32(address) + ']' );
    }
  }

  /**
   * Reads unsigned 32 bit data at the specified address.
   * @param {number} address
   * @return {number}
   */
  readU32(address) {
    this.logRead(address);
    var ea = this.calcEA(address);
    return this.mem.readU32(ea);
  }

  /**
   * Reads unsigned 16 bit data at the specified address.
   * @param {number} address
   * @return {number}
   */
  readU16(address) {
    this.logRead(address);
    var ea = this.calcEA(address);
    return this.mem.readU16(ea);
  }

  /**
   * Reads unsigned 8 bit data at the specified address.
   * @param {number} address
   * @return {number}
   */
  readU8(address) {
    this.logRead(address);
    var ea = this.calcEA(address);
    return this.mem.readU8(ea);
  }

  /**
   * Reads signed 32 bit data at the specified address.
   * @param {number} address
   * @return {number}
   */
  readS32(address) {
    this.logRead(address);
    var ea = this.calcEA(address);
    return this.mem.readS32(ea);
  }

  /**
   * Reads signed 16 bit data at the specified address.
   * @param {number} address
   * @return {number}
   */
  readS16(address) {
    this.logRead(address);
    var ea = this.calcEA(address);
    return this.mem.readS16(ea);
  }

  /**
   * Reads signed 8 bit data at the specified address.
   * @param {number} address
   * @return {number}
   */
  readS8(address) {
    this.logRead(address);
    var ea = this.calcEA(address);
    return this.mem.readS8(ea);
  }

  /**
   * Writes 32 bit data to the specified address.
   * @param {number} address
   * @param {number} value
   */
  write32(address, value) {
    this.logWrite(address, toString32(value));
    var ea = this.calcEA(address);
    this.mem.write32(ea, value);
  }

  /**
   * Writes 16 bit data to the specified address.
   * @param {number} address
   * @param {number} value
   */
  write16(address, value) {
    this.logWrite(address, toString16(value));
    var ea = this.calcEA(address);
    this.mem.write16(ea, value);
  }

  /**
   * Writes 8 bit data to the specified address.
   * @param {number} address
   * @param {number} value
   */
  write8(address, value) {
    this.logWrite(address, toString8(value));
    var ea = this.calcEA(address);
    this.mem.write8(ea, value);
  }
}

/**
 * MemoryRegion just wraps an ArrayBuffer and provides some useful accessors.
 */
class MemoryRegion {
  /**
   * @param {!ArrayBuffer} arrayBuffer
   */
  constructor(arrayBuffer) {
    this.arrayBuffer = arrayBuffer;
    this.length      = arrayBuffer.byteLength;
    this.u8          = new Uint8Array(arrayBuffer);
    this.s32         = new Int32Array(arrayBuffer);
  }

  clear() {
    var i;
    for (i = 0; i < this.u8.length; ++i) {
      this.u8[i] = 0;
    }
  }

  /**
   * Read the value at the specified offset.
   * @param {number} offset
   * @return {number}
   */
  readU32(offset) {
    return ((this.u8[offset] << 24) | (this.u8[offset+1] << 16) | (this.u8[offset+2] << 8) | this.u8[offset+3])>>>0;
  }

  /**
   * Read the value at the specified offset.
   * @param {number} offset
   * @return {number}
   */
  readU16(offset) {
    return (this.u8[offset] <<  8) | (this.u8[offset+1]      );
  }

  /**
   * Read the value at the specified offset.
   * @param {number} offset
   * @return {number}
   */
  readU8(offset) {
    return this.u8[offset];
  }

  /**
   * Read the value at the specified offset.
   * @param {number} offset
   * @return {number}
   */
  readS32(offset) {
    return ((this.u8[offset] << 24) | (this.u8[offset+1] << 16) | (this.u8[offset+2] << 8) | this.u8[offset+3]) | 0;
  }

  /**
   * Read the value at the specified offset.
   * @param {number} offset
   * @return {number}
   */
  readS16(offset) {
    return  ((this.u8[offset] << 24) | (this.u8[offset+1] << 16) ) >> 16;
  }

  /**
   * Read the value at the specified offset.
   * @param {number} offset
   * @return {number}
   */
  readS8(offset) {
    return  ((this.u8[offset] << 24) ) >> 24;
  }

  /**
   * Write the value to the specified offset.
   * @param {number} offset
   * @param {number} value
   */
  write32(offset, value) {
    this.u8[offset  ] = value >> 24;
    this.u8[offset+1] = value >> 16;
    this.u8[offset+2] = value >>  8;
    this.u8[offset+3] = value;
  }

  /**
   * Write the value to the specified offset.
   * @param {number} offset
   * @param {number} value
   */
  write16(offset, value) {
    this.u8[offset  ] = value >> 8;
    this.u8[offset+1] = value;
  }

  /**
   * Write the value to the specified offset.
   * @param {number} offset
   * @param {number} value
   */
  write8(offset, value) {
    this.u8[offset] = value;
  }

  /**
   * Clear the specified bits at the specified offset.
   * @param {number} offset
   * @param {number} bits
   * @return {number}
   */
  clearBits32(offset, bits) {
    var value = this.readU32(offset) & ~bits;
    this.write32(offset, value);
    return value;
  }

  /**
   * Set the specified bits at the specified offset.
   * @param {number} offset
   * @param {number} bits
   * @return {number}
   */
  setBits32(offset, bits) {
    var value = this.readU32(offset) | bits;
    this.write32(offset, value);
    return value;
  }

  /**
   * Get the specified bits at the specified offset.
   * @param {number} offset
   * @param {number} bits
   * @return {number}
   */
  getBits32(offset, bits) {
    return this.readU32(offset) & bits;
  }
}

const kEnableDynarec = true;
const kHotFragmentThreshold = 500;

/**
 * The fragment map.
 * @type {!Map<number, !Fragment>}
 */
let fragmentMap = new Map();

/**
 * Hit counts keyed by PC.
 * @type {!Map<number, number>}
 */
let hitCounts = new Map();

/**
 * An array of invalidation events.
 * @type {!Array<{address: number,
 *                length: number,
 *                system: string,
 *                fragmentsRemoved: boolean}>}
 */
let fragmentInvalidationEvents = [];


class Fragment {
  constructor(pc) {
    this.entryPC          = pc;
    this.minPC            = pc;
    this.maxPC            = pc+4;
    this.func             = undefined;
    this.opsCompiled      = 0;
    this.executionCount   = 0;
    this.bailedOut        = false;    // Set if a fragment bailed out.
    this.nextFragments    = [];       // One slot per op

    // State used when compiling
    this.body_code        = '';
    this.needsDelayCheck  = true;

    this.cop1statusKnown = false;
    this.usesCop1        = false;
  }

  invalidate() {
    // reset all but entryPC
    this.minPC            = this.entryPC;
    this.maxPC            = this.entryPC+4;
    this.func             = undefined;
    this.opsCompiled      = 0;
    this.bailedOut        = false;
    this.executionCount   = 0;
    this.nextFragments    = [];

    this.body_code        = '';
    this.needsDelayCheck  = true;

    this.cop1statusKnown  = false;
    this.usesCop1         = false;
  }

  /**
   * Gets the next fragment and caches the results.
   * @param {number} pc The current pc.
   * @param {number} opsExecuted The number of ops executed.
   * @return {?Fragment}
   */
  getNextFragment(pc, opsExecuted) {
    let nextFragment = this.nextFragments[opsExecuted];
    if (!nextFragment || nextFragment.entryPC !== pc) {
      // If not jump to self, look up
      if (pc === this.entryPC) {
        nextFragment = this;
      } else {
        nextFragment = lookupFragment(pc);
      }

      // And cache for next time around.
      this.nextFragments[opsExecuted] = nextFragment;
    }
    return nextFragment;
  }
}

function resetFragments() {
  hitCounts = new Map();
  fragmentMap = new Map();
  fragmentInvalidationEvents = [];
}

/**
 * Returns the fragment map.
 * @return {!Map<number, !Fragment>}
 */
function getFragmentMap() {
  return fragmentMap;
}

/**
 * Looks up the fragment for the given PC.
 * @param {number} pc
 * @return {?Fragment}
 */
function lookupFragment(pc) {
  let fragment = fragmentMap.get(pc);
  if (!fragment) {
    if (!kEnableDynarec) {
      return null;
    }

    // Check if this pc is hot enough yet
    let hc = hitCounts.get(pc) || 0;
    hc++;
    hitCounts.set(pc, hc);

    if (hc < kHotFragmentThreshold) {
      return null;
    }

    fragment = new Fragment(pc);
    fragmentMap.set(pc, fragment);
  }

  // If we failed to complete the fragment for any reason, reset it
  if (!fragment.func) {
    fragment.invalidate();
  }

  return fragment;
}

function consumeFragmentInvalidationEvents() {
  let t = fragmentInvalidationEvents;
  fragmentInvalidationEvents = [];
  return t;
}

/*jshint jquery:true */

(function (n64js) {'use strict';
  /** @type {?jQuery} */
  let $debugContent = null;

  /** @type {?jQuery} */
  let $status = null;

  /** @type {?Array<?jQuery>} */
  let $registers = null;

  /** @type {?jQuery} */
  let $disassembly = null;

  /** @type {?jQuery} */
  let $dynarecContent = null;

  /** @type {?jQuery} */
  let $memoryContent = null;

  /** @type {number} The address to disassemble. */
  let disasmAddress = 0;

  /** @type {number} The number of cycles executed the last time the display was updated. */
  let lastCycles;

  /** @type {number} The program counter the last time the display was updated. */
  let lastPC               = -1;

  /** @type {!Array<!Object>} A list of recent memory accesses. */
  let recentMemoryAccesses = [];

  /** @type {number} The address of the last memory access. */
  let lastMemoryAccessAddress = 0;

  /**
   * When we execute a store instruction, keep track of some details so we can
   * show the value that was written.
   * @type {?Object} The address of the last memory access.
   */
  let lastStore = null;

  /** @type {!Object<number, string>} A map of labels keyed by address. */
  let labelMap = {};

  /** @type {number} How many cycles to execute before updating the debugger. */
  let debugCycles = Math.pow(10,0);

  n64js.getDebugCycles = () => {
    return debugCycles;
  };

  function refreshLabelSelect() {
    let $select = $('#cpu').find('#labels');

    let arr = [];
    for (let i in labelMap) {
      if (labelMap.hasOwnProperty(i)) {
        arr.push(i);
      }
    }
    arr.sort((a, b) => { return labelMap[a].localeCompare(labelMap[b]); });

    $select.html('');

    for (let i = 0; i < arr.length; ++i) {
      let address = arr[i];
      let label   = labelMap[address];
      let $option = $('<option value="' + label + '">' + label + '</option>');
      $option.data('address', address);
      $select.append($option);
    }

    $select.change(function () {
      let contents = $select.find('option:selected').data('address');
      disasmAddress = /** @type {number} */(contents) >>> 0;
      updateDebug();
    });
  }

  function onReset() {
    restoreLabelMap();
  }

  function restoreLabelMap() {
    labelMap = n64js.getLocalStorageItem('debugLabels') || {};
    refreshLabelSelect();
    updateDebug();
  }

  function storeLabelMap() {
    n64js.setLocalStorageItem('debugLabels', labelMap);
  }

  n64js.initialiseDebugger = function () {
    $debugContent   = $('#debug-content');
    $status         = $('#status');
    $registers      = [$('#cpu0-content'), $('#cpu1-content')];
    $disassembly    = $('#disasm');
    $dynarecContent = $('#dynarec-content');
    $memoryContent  = $('#memory-content');

    initialise($('.output'), () => {
      return toString32(n64js.cpu0.pc);
    });

    n64js.addResetCallback(onReset);

    $('#output').find('#clear').click(function () {
      clear();
    });

    $('#cpu-controls').find('#speed').change(function () {
      debugCycles = Math.pow(10, $(this).val() | 0);
      log('Speed is now ' + debugCycles);
    });

    $('#cpu').find('#address').change(function () {
      disasmAddress = parseInt($(this).val(), 16);
      updateDebug();
    });
    refreshLabelSelect();

    $memoryContent.find('input').change(function () {
      lastMemoryAccessAddress = parseInt($(this).val(), 16);
      updateMemoryView();
    });
    updateMemoryView();

    const kEnter    = 13;
    const kPageUp   = 33;
    const kPageDown = 34;
    const kLeft     = 37;
    const kUp       = 38;
    const kRight    = 39;
    const kDown     = 40;
    const kF10      = 121;
    const kF9       = 120;
    const kF8       = 119;

    $('body').keydown(function (event) {
      let consumed = false;
      switch (event.which) {
        case kDown:     consumed = true; disassemblerDown();             break;
        case kUp:       consumed = true; disassemblerUp();               break;
        case kPageDown: consumed = true; disassemblerPageDown();         break;
        case kPageUp:   consumed = true; disassemblerPageUp();           break;
        case kF8:       consumed = true; n64js.toggleRun();              break;
        case kF9:       consumed = true; n64js.toggleDebugDisplayList(); break;
        case kF10:      consumed = true; n64js.step();                   break;
        //default: alert( 'code:' + event.which);
      }
      if (consumed) {
        event.preventDefault();
      }
    });
  };

  function updateMemoryView() {
    let addr = lastMemoryAccessAddress || 0x80000000;
    let $pre = $memoryContent.find('pre');
    $pre.empty().append(makeMemoryTable(addr, 1024));
  }

  function roundDown(x, a) {
    return x & ~(a-1);
  }

  /**
   * Constructs HTML for a table of memory values.
   * @param {number} focusAddress The address to focus on.
   * @param {number} contextBytes The number of bytes of context.
   * @param {number=} bytesPerRow The number of bytes per row. Should be a power of two.
   * @param {Map<number,string>=} highlights Colours to highlight addresses with.
   * @return {!jQuery}
   */
  function makeMemoryTable(focusAddress, contextBytes, bytesPerRow = 64, highlights = null) {
    let s = roundDown(focusAddress, bytesPerRow) - roundDown(contextBytes/2, bytesPerRow);
    let e = s + contextBytes;

    let t = '';
    for (let a = s; a < e; a += bytesPerRow) {
      let r = toHex(a, 32) + ':';

      for (let o = 0; o < bytesPerRow; o += 4) {
        let curAddress = a + o >>> 0;
        let mem = n64js.readMemoryInternal32(curAddress);
        let style = '';
        if (highlights && highlights.has(curAddress)) {
          style = ' style="background-color: ' + highlights.get(curAddress) + '"';
        }
        r += ' <span id="mem-' + toHex(curAddress, 32) + '"' + style + '>' + toHex(mem, 32) + '</span>';
      }

      r += '\n';
      t += r;
    }

    return $('<span>' + t + '</span>');
  }

  // access is {reg,offset,mode}
  function addRecentMemoryAccess(address, mode) {
    let col = (mode === 'store') ? '#faa' : '#ffa';
    if (mode === 'update') {
      col = '#afa';
    }

    let highlights = new Map();
    let alignedAddress = (address & ~3) >>> 0;
    highlights.set(alignedAddress, col);
    return makeMemoryTable(address, 32, 32, highlights);
  }

  function makeLabelColor(address) {
    let i = address >>> 2;  // Lowest bits are always 0
    let hash = (i >>> 16) ^ ((i & 0xffff) * 2803);
    let r = (hash       ) & 0x1f;
    let g = (hash >>>  5) & 0x1f;
    let b = (hash >>> 10) & 0x1f;
    let h = (hash >>> 15) & 0x3;

    r *= 4;
    g *= 4;
    b *= 4;
    switch (h) {
      case 0: r*=2; g*=2; break;
      case 1: g*=2; b*=2; break;
      case 2: b*=2; r*=2; break;
      default: r*=2;g*=2;b*=2; break;
    }

    return '#' + toHex(r, 8) + toHex(g, 8) + toHex(b, 8);
  }

  /**
   * Makes a table of co-processor 0 registers.
   * @param {!Map<string, string>} registerColours Register colour map.
   * @return {!jQuery}
   */
  function makeCop0RegistersTable(registerColours) {
    let cpu0 = n64js.cpu0;
    let $table = $('<table class="register-table"><tbody></tbody></table>');
    let $body = $table.find('tbody');

    const kRegistersPerRow = 2;

    for (let i = 0; i < 32; i+=kRegistersPerRow) {
      let $tr = $('<tr />');
      for (let r = 0; r < kRegistersPerRow; ++r) {
        let name = n64js.cop0gprNames[i+r];
        let $td = $('<td>' + name + '</td><td class="fixed">' + toString64(cpu0.gprHi[i+r], cpu0.gprLo[i+r]) + '</td>');

        if (registerColours.has(name)) {
          $td.attr('bgcolor', registerColours.get(name));
        }
        $tr.append($td);
      }
      $body.append($tr);
    }

    return $table;
  }

  /**
   * Makes a table of co-processor 1 registers.
   * @param {!Map<string, string>} registerColours Register colour map.
   * @return {!jQuery}
   */
  function makeCop1RegistersTable(registerColours) {
    let $table = $('<table class="register-table"><tbody></tbody></table>');
    let $body = $table.find('tbody');
    let cpu1 = n64js.cpu1;

    for (let i = 0; i < 32; ++i) {
      let name = n64js.cop1RegisterNames[i];

      let $td;
      if ((i&1) === 0) {
        $td = $('<td>' + name +
          '</td><td class="fixed fp-w">' + toString32(cpu1.uint32[i]) +
          '</td><td class="fixed fp-s">' + cpu1.float32[i] +
          '</td><td class="fixed fp-d">' + cpu1.float64[i/2] +
          '</td>' );
      } else {
        $td = $('<td>' + name +
          '</td><td class="fixed fp-w">' + toString32(cpu1.uint32[i]) +
          '</td><td class="fixed fp-s">' + cpu1.float32[i] +
          '</td><td>' +
          '</td>' );
      }

      let $tr = $('<tr />');
      $tr.append($td);

      if (registerColours.has(name)) {
        $tr.attr('bgcolor', registerColours.get(name));
      } else if (registerColours.has(name + '-w')) {
        $tr.find('.fp-w').attr('bgcolor', registerColours.get(name + '-w'));
      } else if (registerColours.has(name + '-s')) {
        $tr.find('.fp-s').attr('bgcolor', registerColours.get(name + '-s'));
      } else if (registerColours.has(name + '-d')) {
        $tr.find('.fp-d').attr('bgcolor', registerColours.get(name + '-d'));
      }

      $body.append($tr);
    }

    return $table;
  }

  /**
   * Makes a table showing the status register contents.
   * @return {!jQuery}
   */
  function makeStatusTable() {
    let cpu0 = n64js.cpu0;

    let $table = $('<table class="register-table"><tbody></tbody></table>');
    let $body = $table.find('tbody');

    $body.append('<tr><td>Ops</td><td class="fixed">' + cpu0.opsExecuted + '</td></tr>');
    $body.append('<tr><td>PC</td><td class="fixed">' + toString32(cpu0.pc) + '</td>' +
                     '<td>delayPC</td><td class="fixed">' + toString32(cpu0.delayPC) + '</td></tr>');
    $body.append('<tr><td>EPC</td><td class="fixed">' + toString32(cpu0.control[cpu0.kControlEPC]) + '</td></tr>');
    $body.append('<tr><td>MultHi</td><td class="fixed">' + toString64(cpu0.multHi[1], cpu0.multHi[0]) + '</td>' +
                     '<td>Cause</td><td class="fixed">' + toString32(cpu0.control[cpu0.kControlCause]) + '</td></tr>');
    $body.append('<tr><td>MultLo</td><td class="fixed">' + toString64(cpu0.multLo[1], cpu0.multLo[0]) + '</td>' +
                     '<td>Count</td><td class="fixed">' + toString32(cpu0.control[cpu0.kControlCount]) + '</td></tr>');
    $body.append('<tr><td></td><td class="fixed"></td>' +
                     '<td>Compare</td><td class="fixed">' + toString32(cpu0.control[cpu0.kControlCompare]) + '</td></tr>');

    for (let i = 0; i < cpu0.events.length; ++i) {
      $body.append('<tr><td>Event' + i + '</td><td class="fixed">' + cpu0.events[i].countdown + ', ' + cpu0.events[i].getName() + '</td></tr>');
    }

    $body.append(makeStatusRegisterRow());
    $body.append(makeMipsInterruptsRow());
    return $table;
  }

  function makeStatusRegisterRow() {
    let $tr = $('<tr />');
    $tr.append( '<td>SR</td>' );

    const flagNames = ['IE', 'EXL', 'ERL' ];//, '', '', 'UX', 'SX', 'KX' ];

    let sr = n64js.cpu0.control[n64js.cpu0.kControlSR];

    let $td = $('<td class="fixed" />');
    $td.append(toString32(sr));
    $td.append('&nbsp;');

    let i;
    for (i = flagNames.length-1; i >= 0; --i) {
      if (flagNames[i]) {
        let isSet = (sr & (1<<i)) !== 0;

        let $b = $('<span>' + flagNames[i] + '</span>');
        if (isSet) {
          $b.css('font-weight', 'bold');
        }

        $td.append($b);
        $td.append('&nbsp;');
      }
    }

    $tr.append($td);
    return $tr;
  }

  function makeMipsInterruptsRow() {
    const miIntrNames = ['SP', 'SI', 'AI', 'VI', 'PI', 'DP'];

    let miIntrLive = n64js.miIntrReg();
    let miIntrMask = n64js.miIntrMaskReg();

    let $tr = $('<tr />');
    $tr.append( '<td>MI Intr</td>' );
    let $td = $('<td class="fixed" />');
    let i;
    for (i = 0; i < miIntrNames.length; ++i) {
      let isSet = (miIntrLive & (1<<i)) !== 0;
      let isEnabled = (miIntrMask & (1<<i)) !== 0;

      let $b = $('<span>' + miIntrNames[i] + '</span>');
      if (isSet) {
        $b.css('font-weight', 'bold');
      }
      if (isEnabled) {
        $b.css('background-color', '#AFF4BB');
      }

      $td.append($b);
      $td.append('&nbsp;');
    }
    $tr.append($td);
    return $tr;
  }

  function setLabelText($elem, address) {
    if (labelMap.hasOwnProperty(address)) {
      $elem.append(' (' + labelMap[address] + ')');
    }
  }
  function setLabelColor($elem, address) {
    $elem.css('color', makeLabelColor(address));
  }

  function makeLabelText(address) {
    let t = '';
    if (labelMap.hasOwnProperty(address)) {
      t = labelMap[address];
    }
    while (t.length < 20) {
      t += ' ';
    }
    return t;
  }

  function onLabelClicked(e) {
      let $label = $(e.delegateTarget);
      let address = /** @type {number} */($label.data('address')) >>> 0;
      let existing = labelMap[address] || '';
      let $input = $('<input class="input-mini" value="' + existing + '" />');

      $input.keypress(function (event) {
        if (event.which == 13) {
          let newVal = $input.val();
          if (newVal) {
            labelMap[address] = newVal.toString();
          } else {
            delete labelMap[address];
          }
          storeLabelMap();
          refreshLabelSelect();
          updateDebug();
        }
      });
      $input.blur(function () {
        $label.html(makeLabelText(address));
      });
      $label.empty().append($input);
      $input.focus();
  }

  function onFragmentClicked(e) {
      let $elem = $(e.delegateTarget);
      let frag = $elem.data('fragment');
      log('<pre>' + frag.func.toString() + '</pre>');
  }

  function onClickBreakpoint(e) {
    let $elem = $(e.delegateTarget);
    let address = /** @type {number} */($elem.data('address')) >>> 0;
    n64js.toggleBreakpoint(address);
    updateDebug();
  }

  function updateDebug() {
    // If the pc has changed since the last update, recenter the display (e.g. when we take a branch)
    if (n64js.cpu0.pc !== lastPC) {
      disasmAddress = n64js.cpu0.pc;
      lastPC = n64js.cpu0.pc;
    }

    // Figure out if we've just stepped by a single instruction. Ergh.
    let cpuCount = n64js.cpu0.getCount();
    let isSingleStep = lastCycles === (cpuCount-1);
    lastCycles = cpuCount;

    let fragmentMap = getFragmentMap();
    let disassembly = n64js.disassemble(disasmAddress - 64, disasmAddress + 64);

    let $disGutter = $('<pre/>');
    let $disText   = $('<pre/>');
    let currentInstruction;

    for (let i = 0; i < disassembly.length; ++i) {
      let a = disassembly[i];
      let address = a.instruction.address;
      let isTarget = a.isJumpTarget || labelMap.hasOwnProperty(address);
      let addressStr = (isTarget ? '<span class="dis-address-target">' : '<span class="dis-address">') + toHex(address, 32) + ':</span>';
      let label = '<span class="dis-label">' + makeLabelText(address) + '</span>';
      let t = addressStr + '  ' + toHex(a.instruction.opcode, 32) + '  ' + label + a.disassembly;

      let fragment = fragmentMap.get(address);
      if (fragment) {
        t += '<span class="dis-fragment-link"> frag - ops=' + fragment.opsCompiled + ' hit=' + fragment.executionCount + '</span>';
      }

      let $line = $('<span class="dis-line">' + t + '</span>');
      $line.find('.dis-label')
        .data('address', address)
        .css('color', makeLabelColor(address))
        .click(onLabelClicked);

      if (fragment) {
        $line.find('.dis-fragment-link')
          .data('fragment', fragment)
          .click(onFragmentClicked);
      }

      // Keep track of the current instruction (for register formatting) and highlight.
      if (address === n64js.cpu0.pc) {
        currentInstruction = a.instruction;
        $line.addClass('dis-line-cur');
      }
      if (isTarget) {
        $line.addClass('dis-line-target');

        setLabelColor($line.find('.dis-address-target'), address);
      }

      $disText.append($line);
      $disText.append('<br>');

      let bpText = '&nbsp;';
      if (n64js.isBreakpoint(address)) {
        bpText = '&bull;';
      }
      let $bp = $('<span>' + bpText + '</span>').data('address', address).click(onClickBreakpoint);

      $disGutter.append($bp);
      $disGutter.append('<br>');
    }

    // Links for branches, jumps etc should jump to the target address.
    $disText.find('.dis-address-jump').each(function () {
      let address = parseInt($(this).text(), 16);

      setLabelText($(this), address);
      setLabelColor($(this), address);

      $(this).click(function () {
        disasmAddress = address;
        n64js.refreshDebugger();
      });
    });

    let registerColours = makeRegisterColours(currentInstruction);
    for (let [reg, colour] of registerColours) {
      $disText.find('.dis-reg-' + reg).css('background-color', colour);
    }

    $disassembly.find('.dis-recent-memory').html(makeRecentMemoryAccesses(isSingleStep, currentInstruction));

    $disassembly.find('.dis-gutter').empty().append($disGutter);
    $disassembly.find('.dis-view').empty().append($disText);

    $status.empty().append(makeStatusTable());

    $registers[0].empty().append(makeCop0RegistersTable(registerColours));
    $registers[1].empty().append(makeCop1RegistersTable(registerColours));
  }

  /**
   * Makes a map of colours keyed by register name.
   * @param {?Object} instruction The instruction to produce colours for.
   * @return {!Map<string, string>}
   */
  function makeRegisterColours(instruction) {
    const availColours = [
      '#F4EEAF', // yellow
      '#AFF4BB', // green
      '#F4AFBE'  // blue
    ];

    let registerColours = new Map();
    if (instruction) {
      let nextColIdx = 0;
      for (let i in instruction.srcRegs) {
        if (!registerColours.hasOwnProperty(i)) {
          registerColours.set(i, availColours[nextColIdx++]);
        }
      }
      for (let i in instruction.dstRegs) {
        if (!registerColours.hasOwnProperty(i)) {
          registerColours.set(i, availColours[nextColIdx++]);
        }
      }
    }

    return registerColours;
  }

  function makeRecentMemoryAccesses(isSingleStep, currentInstruction) {
    // Keep a small queue showing recent memory accesses
    if (isSingleStep) {
      // Check if we've just stepped over a previous write op, and update the result
      if (lastStore) {
        if ((lastStore.cycle + 1) === n64js.cpu0.opsExecuted) {
          let updatedElement = addRecentMemoryAccess(lastStore.address, 'update');
          lastStore.element.append(updatedElement);
        }
        lastStore = null;
      }

      if (currentInstruction.memory) {
        let access  = currentInstruction.memory;
        let newAddress = n64js.cpu0.gprLo[access.reg] + access.offset;
        let element = addRecentMemoryAccess(newAddress, access.mode);

        if (access.mode === 'store') {
          lastStore = {
            address: newAddress,
            cycle: n64js.cpu0.opsExecuted,
            element: element,
          };
        }

        recentMemoryAccesses.push({element: element});

        // Nuke anything that happened more than N cycles ago
        //while (recentMemoryAccesses.length > 0 && recentMemoryAccesses[0].cycle+10 < cycle)
        if (recentMemoryAccesses.length > 4) {
          recentMemoryAccesses.splice(0,1);
        }

        lastMemoryAccessAddress = newAddress;
      }
    } else {
      // Clear the recent memory accesses when running.
      recentMemoryAccesses = [];
      lastStore = null;
    }

    let $recent = $('<pre />');
    if (recentMemoryAccesses.length > 0) {
      const fadingColours = ['#bbb', '#999', '#666', '#333'];
      for (let i = 0; i < recentMemoryAccesses.length; ++i) {
        let element = recentMemoryAccesses[i].element;
        element.css('color', fadingColours[i]);
        $recent.append(element);
      }
    }

    return $recent;
  }

  function updateDynarec() {
    let invals = consumeFragmentInvalidationEvents();
    let histogram = new Map();
    let maxBucket = 0;

    // Build a flattened list of all fragments
    let fragmentsList = [];
    for (let [pc, fragment] of getFragmentMap()) {
      let i = fragment.executionCount > 0 ? Math.floor(Math.log10(fragment.executionCount)) : 0;
      histogram.set(i, (histogram.get(i) || 0) + 1);
      fragmentsList.push(fragment);
      maxBucket = Math.max(maxBucket, i);
    }

    fragmentsList.sort((a, b) => {
      return b.opsCompiled * b.executionCount - a.opsCompiled * a.executionCount;
    });

    let $t = $('<div class="container-fluid" />');

    // Histogram showing execution counts
    let t = '';
    t += '<div class="row">';
    t += '<table class="table table-condensed table-nonfluid"><tr><th>Execution Count</th><th>Frequency</th></tr>';
    for (let i = 0; i <= maxBucket; i++) {
      let count = histogram.get(i) || 0;
      let range = '< ' + Math.pow(10, i + 1);
      t += '<tr><td>' + range + '</td><td>' + count + '</td></tr>';
    }
    t += '</table>';
    t += '</div>';
    $t.append(t);

    // Table of hot fragments, and the corresponding js
    t = '';
    t += '<div class="row">';
    t += '  <div class="col-lg-6" id="fragments" />';
    t += '  <div class="col-lg-6" id="fragment-code" />';
    t += '</div>';
    let $fragmentDiv = $(t);

    createHotFragmentsTable($fragmentDiv, fragmentsList);

    $t.append($fragmentDiv);

    // Evictions
    if (invals.length > 0) {
      t = '';
      t += '<div class="row">';
      t += '<div class="col-lg-6">';
      t += '<table class="table table-condensed">';
      t += '<tr><th>Address</th><th>Length</th><th>System</th><th>Fragments Removed</th></tr>';
      for (let i = 0; i < invals.length; ++i) {
        let vals = [
          toString32(invals[i].address),
          invals[i].length,
          invals[i].system,
          invals[i].fragmentsRemoved,
        ];
        t += '<tr><td>' + vals.join('</td><td>') + '</td></tr>';
      }
      t += '</table>';
      t += '</div>';
      t += '</div>';
      $t.append(t);
    }

    $dynarecContent.empty().append($t);
  }

  function createHotFragmentsTable($fragmentDiv, fragmentsList) {
    let $code = $fragmentDiv.find('#fragment-code');
    let $table = $('<table class="table table-condensed" />');
    let columns = ['Address', 'Execution Count', 'Length', 'ExecCount * Length'];

    $table.append('<tr><th>' + columns.join('</th><th>') + '</th></tr>');
    for (let i = 0; i < fragmentsList.length && i < 20; ++i) {
      let fragment = fragmentsList[i];
      let vals = [
        toString32(fragment.entryPC),
        fragment.executionCount,
        fragment.opsCompiled,
        fragment.executionCount * fragment.opsCompiled
      ];
      let $tr = $('<tr><td>' + vals.join('</td><td>') + '</td></tr>');
      initFragmentRow($tr, fragment, $code);
      $table.append($tr);
    }
    $fragmentDiv.find('#fragments').append($table);

    if (fragmentsList.length > 0) {
      $code.append('<pre>' + fragmentsList[0].func.toString() + '</pre>');
    }
  }

  function initFragmentRow($tr, fragment, $code) {
    $tr.click(() => {
      $code.html('<pre>' + fragment.func.toString() + '</pre>');
    });
  }

  function disassemblerDown() {
    disasmAddress += 4;
    n64js.refreshDebugger();
  }

  function disassemblerUp() {
    disasmAddress -= 4;
    n64js.refreshDebugger();
  }

  function disassemblerPageDown() {
    disasmAddress += 64;
    n64js.refreshDebugger();
  }

  function disassemblerPageUp() {
    disasmAddress -= 64;
    n64js.refreshDebugger();
  }

  n64js.refreshDebugger = function () {
    if ($dynarecContent.hasClass('active')) {
      updateDynarec();
    }

    if ($debugContent.hasClass('active')) {
      updateDebug();
    }

    if ($memoryContent.hasClass('active')) {
      updateMemoryView();
    }
  };

}(window.n64js = window.n64js || {}));

(function (n64js) {'use strict';
  function _fd(i)        { return (i>>> 6)&0x1f; }
  function _fs(i)        { return (i>>>11)&0x1f; }
  function _ft(i)        { return (i>>>16)&0x1f; }
  function _copop(i)     { return (i>>>21)&0x1f; }

  function _offset(i)    { return (i     )&0xffff; }
  function _sa(i)        { return (i>>> 6)&0x1f; }
  function _rd(i)        { return (i>>>11)&0x1f; }
  function _rt(i)        { return (i>>>16)&0x1f; }
  function _rs(i)        { return (i>>>21)&0x1f; }
  function _op(i)        { return (i>>>26)&0x3f; }

  function _tlbop(i)     { return i&0x3f; }
  function _cop1_func(i) { return i&0x3f; }
  function _cop1_bc(i)   { return (i>>>16)&0x3; }

  function _target(i)    { return (i     )&0x3ffffff; }
  function _imm(i)       { return (i     )&0xffff; }
  function _imms(i)      { return (_imm(i)<<16)>>16; }   // treat immediate value as signed
  function _base(i)      { return (i>>>21)&0x1f; }

  function _branchAddress(a,i) { return (a+4) + (_imms(i)*4); }
  function _jumpAddress(a,i)   { return (a&0xf0000000) | (_target(i)*4); }

  function makeLabelText(address) {
    var text = toHex( address, 32 );
    return '<span class="dis-address-jump">'+ text + '</span>';
  }

  const gprRegisterNames = [
    'r0', 'at', 'v0', 'v1', 'a0', 'a1', 'a2', 'a3',
    't0', 't1', 't2', 't3', 't4', 't5', 't6', 't7',
    's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7',
    't8', 't9', 'k0', 'k1', 'gp', 'sp', 's8', 'ra'
  ];
  n64js.cop0gprNames = gprRegisterNames;

  const cop0ControlRegisterNames = [
    "Index",       "Rand", "EntryLo0", "EntryLo1", "Context", "PageMask",     "Wired",   "?7",
    "BadVAddr",   "Count",  "EntryHi",  "Compare",      "SR",    "Cause",       "EPC", "PrID",
    "?16",         "?17",   "WatchLo",  "WatchHi",     "?20",      "?21",       "?22",  "?23",
    "?24",         "?25",       "ECC", "CacheErr",   "TagLo",    "TagHi",  "ErrorEPC",  "?31"
  ];
  n64js.cop0ControlRegisterNames = cop0ControlRegisterNames;

  const cop1RegisterNames = [
    'f00', 'f01', 'f02', 'f03', 'f04', 'f05', 'f06', 'f07',
    'f08', 'f09', 'f10', 'f11', 'f12', 'f13', 'f14', 'f15',
    'f16', 'f17', 'f18', 'f19', 'f20', 'f21', 'f22', 'f23',
    'f24', 'f25', 'f26', 'f27', 'f28', 'f29', 'f30', 'f31'
  ];
  n64js.cop1RegisterNames = cop1RegisterNames;

  const cop2RegisterNames = [
    'GR00', 'GR01', 'GR02', 'GR03', 'GR04', 'GR05', 'GR06', 'GR07',
    'GR08', 'GR09', 'GR10', 'GR11', 'GR12', 'GR13', 'GR14', 'GR15',
    'GR16', 'GR17', 'GR18', 'GR19', 'GR20', 'GR21', 'GR22', 'GR23',
    'GR24', 'GR25', 'GR26', 'GR27', 'GR28', 'GR29', 'GR30', 'GR31'
  ];

  /**
   * @constructor
   */
  function Instruction(address, opcode) {
    this.address = address;
    this.opcode  = opcode;
    this.srcRegs = {};
    this.dstRegs = {};
    this.target  = '';
    this.memory  = null;
  }

  function makeRegSpan(t) {
    return '<span class="dis-reg-' + t + '">' + t + '</span>';
  }
  function makeFPRegSpan(t) {
    // We only use the '-' as a valic css identifier, but want to use '.' in the visible text
    var text = t.replace('-', '.');
    return '<span class="dis-reg-' + t + '">' + text + '</span>';
  }

  function getCop1RegisterName(r, fmt) {
    var suffix = fmt ? '-' + fmt : '';
    return cop1RegisterNames[r] + suffix;
  }

  Instruction.prototype = {
    // cop0 regs
    rt_d() { var reg = gprRegisterNames[_rt(this.opcode)]; this.dstRegs[reg] = 1; return makeRegSpan(reg); },
    rd  () { var reg = gprRegisterNames[_rd(this.opcode)]; this.dstRegs[reg] = 1; return makeRegSpan(reg); },
    rt  () { var reg = gprRegisterNames[_rt(this.opcode)]; this.srcRegs[reg] = 1; return makeRegSpan(reg); },
    rs  () { var reg = gprRegisterNames[_rs(this.opcode)]; this.srcRegs[reg] = 1; return makeRegSpan(reg); },

    // dummy operand - just marks ra as being a dest reg
    writesRA()  { this.dstRegs[n64js.cpu0.kRegister_ra] = 1; return ''; },

    // cop1 regs
    ft_d(fmt) { var reg = getCop1RegisterName(_ft(this.opcode), fmt); this.dstRegs[reg] = 1; return makeFPRegSpan(reg); },
    fs_d(fmt) { var reg = getCop1RegisterName(_fs(this.opcode), fmt); this.dstRegs[reg] = 1; return makeFPRegSpan(reg); },
    fd  (fmt) { var reg = getCop1RegisterName(_fd(this.opcode), fmt); this.dstRegs[reg] = 1; return makeFPRegSpan(reg); },
    ft  (fmt) { var reg = getCop1RegisterName(_ft(this.opcode), fmt); this.srcRegs[reg] = 1; return makeFPRegSpan(reg); },
    fs  (fmt) { var reg = getCop1RegisterName(_fs(this.opcode), fmt); this.srcRegs[reg] = 1; return makeFPRegSpan(reg); },

    // cop2 regs
    gt_d() { var reg = cop2RegisterNames[_rt(this.opcode)]; this.dstRegs[reg] = 1; return makeRegSpan(reg); },
    gd  () { var reg = cop2RegisterNames[_rd(this.opcode)]; this.dstRegs[reg] = 1; return makeRegSpan(reg); },
    gt  () { var reg = cop2RegisterNames[_rt(this.opcode)]; this.srcRegs[reg] = 1; return makeRegSpan(reg); },
    gs  () { var reg = cop2RegisterNames[_rs(this.opcode)]; this.srcRegs[reg] = 1; return makeRegSpan(reg); },

    imm() { return '0x' + toHex( _imm(this.opcode), 16 ); },

    branchAddress() { this.target = _branchAddress(this.address,this.opcode); return makeLabelText( this.target ); },
    jumpAddress()   { this.target = _jumpAddress(this.address,this.opcode);   return makeLabelText( this.target ); },

    memaccess(mode) {
      var r   = this.rs();
      var off = this.imm();
      this.memory = {reg:_rs(this.opcode), offset:_imms(this.opcode), mode:mode};
      return '[' + r + '+' + off + ']';
    },
    memload() {
      return this.memaccess('load');
    },
    memstore() {
      return this.memaccess('store');
    }

  };

  const specialTable = [
    i => { if (i.opcode === 0) {
                     return 'NOP';
                     }
                   return 'SLL       ' + i.rd() + ' = ' + i.rt() + ' << '  + _sa(i.opcode); },
    i => { return 'Unk'; },
    i => { return 'SRL       ' + i.rd() + ' = ' + i.rt() + ' >>> ' + _sa(i.opcode); },
    i => { return 'SRA       ' + i.rd() + ' = ' + i.rt() + ' >> '  + _sa(i.opcode); },
    i => { return 'SLLV      ' + i.rd() + ' = ' + i.rt() + ' << '  + i.rs(); },
    i => { return 'Unk'; },
    i => { return 'SRLV      ' + i.rd() + ' = ' + i.rt() + ' >>> ' + i.rs(); },
    i => { return 'SRAV      ' + i.rd() + ' = ' + i.rt() + ' >> '  + i.rs(); },
    i => { return 'JR        ' + i.rs(); },
    i => { return 'JALR      ' + i.rd() + ', ' + i.rs(); },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'SYSCALL   ' + toHex( (i.opcode>>6)&0xfffff, 20 ); },
    i => { return 'BREAK     ' + toHex( (i.opcode>>6)&0xfffff, 20 ); },
    i => { return 'Unk'; },
    i => { return 'SYNC'; },
    i => { return 'MFHI      ' + i.rd() + ' = MultHi'; },
    i => { return 'MTHI      MultHi = ' + i.rs(); },
    i => { return 'MFLO      ' + i.rd() + ' = MultLo'; },
    i => { return 'MTLO      MultLo = ' + i.rs(); },
    i => { return 'DSLLV     ' + i.rd() + ' = ' + i.rt() + ' << '  + i.rs(); },
    i => { return 'Unk'; },
    i => { return 'DSRLV     ' + i.rd() + ' = ' + i.rt() + ' >>> ' + i.rs(); },
    i => { return 'DSRAV     ' + i.rd() + ' = ' + i.rt() + ' >> '  + i.rs(); },
    i => { return 'MULT      ' +                  i.rs() + ' * '   + i.rt(); },
    i => { return 'MULTU     ' +                  i.rs() + ' * '   + i.rt(); },
    i => { return 'DIV       ' +                  i.rs() + ' / '   + i.rt(); },
    i => { return 'DIVU      ' +                  i.rs() + ' / '   + i.rt(); },
    i => { return 'DMULT     ' +                  i.rs() + ' * '   + i.rt(); },
    i => { return 'DMULTU    ' +                  i.rs() + ' * '   + i.rt(); },
    i => { return 'DDIV      ' +                  i.rs() + ' / '   + i.rt(); },
    i => { return 'DDIVU     ' +                  i.rs() + ' / '   + i.rt(); },
    i => { return 'ADD       ' + i.rd() + ' = ' + i.rs() + ' + '   + i.rt(); },
    i => { return 'ADDU      ' + i.rd() + ' = ' + i.rs() + ' + '   + i.rt(); },
    i => { return 'SUB       ' + i.rd() + ' = ' + i.rs() + ' - '   + i.rt(); },
    i => { return 'SUBU      ' + i.rd() + ' = ' + i.rs() + ' - '   + i.rt(); },
    i => { return 'AND       ' + i.rd() + ' = ' + i.rs() + ' & '   + i.rt(); },
    i => { if (_rt(i.opcode) === 0) {
                      if (_rs(i.opcode) === 0) {
                     return 'CLEAR     ' + i.rd() + ' = 0';
                      } else {
                     return 'MOV       ' + i.rd() + ' = ' + i.rs();
                      }
                     }
                   return 'OR        ' + i.rd() + ' = '    + i.rs() + ' | ' + i.rt(); },
    i => { return 'XOR       ' + i.rd() + ' = '    + i.rs() + ' ^ ' + i.rt(); },
    i => { return 'NOR       ' + i.rd() + ' = ~( ' + i.rs() + ' | ' + i.rt() + ' )'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'SLT       ' + i.rd() + ' = ' + i.rs() + ' < ' + i.rt(); },
    i => { return 'SLTU      ' + i.rd() + ' = ' + i.rs() + ' < ' + i.rt(); },
    i => { return 'DADD      ' + i.rd() + ' = ' + i.rs() + ' + ' + i.rt(); },
    i => { return 'DADDU     ' + i.rd() + ' = ' + i.rs() + ' + ' + i.rt(); },
    i => { return 'DSUB      ' + i.rd() + ' = ' + i.rs() + ' - ' + i.rt(); },
    i => { return 'DSUBU     ' + i.rd() + ' = ' + i.rs() + ' - ' + i.rt(); },
    i => { return 'TGE       trap( ' + i.rs() + ' >= ' + i.rt() + ' )'; },
    i => { return 'TGEU      trap( ' + i.rs() + ' >= ' + i.rt() + ' )'; },
    i => { return 'TLT       trap( ' + i.rs() + ' < '  + i.rt() + ' )'; },
    i => { return 'TLTU      trap( ' + i.rs() + ' < '  + i.rt() + ' )'; },
    i => { return 'TEQ       trap( ' + i.rs() + ' == ' + i.rt() + ' )'; },
    i => { return 'Unk'; },
    i => { return 'TNE       trap( ' + i.rs() + ' != ' + i.rt() + ' )'; },
    i => { return 'Unk'; },
    i => { return 'DSLL      ' + i.rd() + ' = ' + i.rt() + ' << '  + _sa(i.opcode); },
    i => { return 'Unk'; },
    i => { return 'DSRL      ' + i.rd() + ' = ' + i.rt() + ' >>> ' + _sa(i.opcode); },
    i => { return 'DSRA      ' + i.rd() + ' = ' + i.rt() + ' >> '  + _sa(i.opcode); },
    i => { return 'DSLL32    ' + i.rd() + ' = ' + i.rt() + ' << (32+'  + _sa(i.opcode) + ')'; },
    i => { return 'Unk'; },
    i => { return 'DSRL32    ' + i.rd() + ' = ' + i.rt() + ' >>> (32+' + _sa(i.opcode) + ')'; },
    i => { return 'DSRA32    ' + i.rd() + ' = ' + i.rt() + ' >> (32+'  + _sa(i.opcode) + ')'; }
  ];
  if (specialTable.length != 64) {
    throw "Oops, didn't build the special table correctly";
  }

  function disassembleSpecial(i) {
    var fn = i.opcode & 0x3f;
    return specialTable[fn](i);
  }

  const cop0Table = [
    i => { return 'MFC0      ' + i.rt() + ' <- ' + cop0ControlRegisterNames[_fs(i.opcode)]; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'MTC0      ' + i.rt() + ' -> ' + cop0ControlRegisterNames[_fs(i.opcode)]; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },

    disassembleTLB,
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; }
  ];
  if (cop0Table.length != 32) {
    throw "Oops, didn't build the cop0 table correctly";
  }
  function disassembleCop0(i) {
    var fmt = (i.opcode>>21) & 0x1f;
    return cop0Table[fmt](i);
  }

  function disassembleBCInstr(i) {

    n64js.assert( ((i.opcode>>>18)&0x7) === 0, "cc bit is not 0" );

    switch (_cop1_bc(i.opcode)) {
      case 0:    return 'BC1F      !c ? --> ' + i.branchAddress();
      case 1:    return 'BC1T      c ? --> '  + i.branchAddress();
      case 2:    return 'BC1FL     !c ? --> ' + i.branchAddress();
      case 3:    return 'BC1TL     c ? --> '  + i.branchAddress();
    }

    return '???';
  }

  function disassembleCop1Instr(i, fmt) {
    var fmt_u = fmt.toUpperCase();

    switch(_cop1_func(i.opcode)) {
      case 0x00:    return 'ADD.' + fmt_u + '     ' + i.fd(fmt) + ' = ' + i.fs(fmt) + ' + ' + i.ft(fmt);
      case 0x01:    return 'SUB.' + fmt_u + '     ' + i.fd(fmt) + ' = ' + i.fs(fmt) + ' - ' + i.ft(fmt);
      case 0x02:    return 'MUL.' + fmt_u + '     ' + i.fd(fmt) + ' = ' + i.fs(fmt) + ' * ' + i.ft(fmt);
      case 0x03:    return 'DIV.' + fmt_u + '     ' + i.fd(fmt) + ' = ' + i.fs(fmt) + ' / ' + i.ft(fmt);
      case 0x04:    return 'SQRT.' + fmt_u + '    ' + i.fd(fmt) + ' = sqrt(' + i.fs(fmt) + ')';
      case 0x05:    return 'ABS.' + fmt_u + '     ' + i.fd(fmt) + ' = abs(' + i.fs(fmt) + ')';
      case 0x06:    return 'MOV.' + fmt_u + '     ' + i.fd(fmt) + ' = ' + i.fs(fmt);
      case 0x07:    return 'NEG.' + fmt_u + '     ' + i.fd(fmt) + ' = -' + i.fs(fmt);
      case 0x08:    return 'ROUND.L.' + fmt_u + ' ' + i.fd('l') + ' = round.l(' + i.fs(fmt) + ')';
      case 0x09:    return 'TRUNC.L.' + fmt_u + ' ' + i.fd('l') + ' = trunc.l(' + i.fs(fmt) + ')';
      case 0x0a:    return 'CEIL.L.' + fmt_u + '  ' + i.fd('l') + ' = ceil.l(' + i.fs(fmt) + ')';
      case 0x0b:    return 'FLOOR.L.' + fmt_u + ' ' + i.fd('l') + ' = floor.l(' + i.fs(fmt) + ')';
      case 0x0c:    return 'ROUND.W.' + fmt_u + ' ' + i.fd('w') + ' = round.w(' + i.fs(fmt) + ')';
      case 0x0d:    return 'TRUNC.W.' + fmt_u + ' ' + i.fd('w') + ' = trunc.w(' + i.fs(fmt) + ')';
      case 0x0e:    return 'CEIL.W.' + fmt_u + '  ' + i.fd('w') + ' = ceil.w(' + i.fs(fmt) + ')';
      case 0x0f:    return 'FLOOR.W.' + fmt_u + ' ' + i.fd('w') + ' = floor.w(' + i.fs(fmt) + ')';

      case 0x20:    return 'CVT.S.' + fmt_u + '   ' + i.fd('s') + ' = (s)' + i.fs(fmt);
      case 0x21:    return 'CVT.D.' + fmt_u + '   ' + i.fd('d') + ' = (d)' + i.fs(fmt);
      case 0x24:    return 'CVT.W.' + fmt_u + '   ' + i.fd('w') + ' = (w)' + i.fs(fmt);
      case 0x25:    return 'CVT.L.' + fmt_u + '   ' + i.fd('l') + ' = (l)' + i.fs(fmt);

      case 0x30:    return 'C.F.' + fmt_u + '     c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x31:    return 'C.UN.' + fmt_u + '    c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x32:    return 'C.EQ.' + fmt_u + '    c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x33:    return 'C.UEQ.' + fmt_u + '   c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x34:    return 'C.OLT.' + fmt_u + '   c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x35:    return 'C.ULT.' + fmt_u + '   c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x36:    return 'C.OLE.' + fmt_u + '   c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x37:    return 'C.ULE.' + fmt_u + '   c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x38:    return 'C.SF.' + fmt_u + '    c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x39:    return 'C.NGLE.' + fmt_u + '  c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x3a:    return 'C.SEQ.' + fmt_u + '   c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x3b:    return 'C.NGL.' + fmt_u + '   c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x3c:    return 'C.LT.' + fmt_u + '    c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x3d:    return 'C.NGE.' + fmt_u + '   c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x3e:    return 'C.LE.' + fmt_u + '    c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
      case 0x3f:    return 'C.NGT.' + fmt_u + '   c = ' + i.fs(fmt) + ' cmp ' + i.ft(fmt);
    }

    return 'Cop1.' + fmt + toHex(_cop1_func(i.opcode),8) + '?';
  }
  function disassembleCop1SInstr(i) {
    return disassembleCop1Instr(i, 's');
  }
  function disassembleCop1DInstr(i) {
    return disassembleCop1Instr(i, 'd');
  }
  function disassembleCop1WInstr(i) {
    return disassembleCop1Instr(i, 'w');
  }
  function disassembleCop1LInstr(i) {
    return disassembleCop1Instr(i, 'l');
  }


  const cop1Table = [
    i => { return 'MFC1      ' + i.rt_d() + ' = ' + i.fs(); },
    i => { return 'DMFC1     ' + i.rt_d() + ' = ' + i.fs(); },
    i => { return 'CFC1      ' + i.rt_d() + ' = CCR' + _rd(i.opcode); },
    i => { return 'Unk'; },
    i => { return 'MTC1      ' + i.fs_d() + ' = ' + i.rt(); },
    i => { return 'DMTC1     ' + i.fs_d() + ' = ' + i.rt(); },
    i => { return 'CTC1      CCR' + _rd(i.opcode) + ' = ' + i.rt(); },
    i => { return 'Unk'; },
    disassembleBCInstr,
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },

    disassembleCop1SInstr,
    disassembleCop1DInstr,
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    disassembleCop1WInstr,
    disassembleCop1LInstr,
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; }
  ];
  if (cop1Table.length != 32) {
    throw "Oops, didn't build the cop1 table correctly";
  }
  function disassembleCop1(i) {
    var fmt = (i.opcode>>21) & 0x1f;
    return cop1Table[fmt](i);
  }


  function disassembleTLB(i) {
    switch(_tlbop(i.opcode)) {
      case 0x01:    return 'TLBR';
      case 0x02:    return 'TLBWI';
      case 0x06:    return 'TLBWR';
      case 0x08:    return 'TLBP';
      case 0x18:    return 'ERET';
    }

    return 'Unk';
  }

  const regImmTable = [
    i => { return 'BLTZ      ' + i.rs() +  ' < 0 --> ' + i.branchAddress(); },
    i => { return 'BGEZ      ' + i.rs() + ' >= 0 --> ' + i.branchAddress(); },
    i => { return 'BLTZL     ' + i.rs() +  ' < 0 --> ' + i.branchAddress(); },
    i => { return 'BGEZL     ' + i.rs() + ' >= 0 --> ' + i.branchAddress(); },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },

    i => { return 'TGEI      ' + i.rs() + ' >= ' + i.rt() + ' --> trap '; },
    i => { return 'TGEIU     ' + i.rs() + ' >= ' + i.rt() + ' --> trap '; },
    i => { return 'TLTI      ' + i.rs() +  ' < ' + i.rt() + ' --> trap '; },
    i => { return 'TLTIU     ' + i.rs() +  ' < ' + i.rt() + ' --> trap '; },
    i => { return 'TEQI      ' + i.rs() + ' == ' + i.rt() + ' --> trap '; },
    i => { return 'Unk'; },
    i => { return 'TNEI      ' + i.rs() + ' != ' + i.rt() + ' --> trap '; },
    i => { return 'Unk'; },

    i => { return 'BLTZAL    ' + i.rs() +  ' < 0 --> ' + i.branchAddress() + i.writesRA(); },
    i => { return 'BGEZAL    ' + i.rs() + ' >= 0 --> ' + i.branchAddress() + i.writesRA(); },
    i => { return 'BLTZALL   ' + i.rs() +  ' < 0 --> ' + i.branchAddress() + i.writesRA(); },
    i => { return 'BGEZALL   ' + i.rs() + ' >= 0 --> ' + i.branchAddress() + i.writesRA(); },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; }
  ];
  if (regImmTable.length != 32) {
    throw "Oops, didn't build the special table correctly";
  }

  function disassembleRegImm(i) {
    var rt = (i.opcode >> 16) & 0x1f;
    return regImmTable[rt](i);
  }

  const simpleTable = [
    disassembleSpecial,
    disassembleRegImm,
    i => { return 'J         --> ' + i.jumpAddress(); },
    i => { return 'JAL       --> ' + i.jumpAddress() + i.writesRA(); },
    i => {
      if (_rs(i.opcode) == _rt(i.opcode)) {
                   return 'B         --> ' + i.branchAddress();
      }
                   return 'BEQ       ' +                     i.rs() + ' == ' + i.rt() + ' --> ' + i.branchAddress(); },
    i => { return 'BNE       ' +                     i.rs() + ' != ' + i.rt() + ' --> ' + i.branchAddress(); },
    i => { return 'BLEZ      ' +                     i.rs() + ' <= 0 --> ' + i.branchAddress(); },
    i => { return 'BGTZ      ' +                     i.rs() + ' > 0 --> '  + i.branchAddress(); },
    i => { return 'ADDI      ' + i.rt_d() + ' = '  + i.rs() + ' + ' + i.imm(); },
    i => { return 'ADDIU     ' + i.rt_d() + ' = '  + i.rs() + ' + ' + i.imm(); },
    i => { return 'SLTI      ' + i.rt_d() + ' = (' + i.rs() + ' < ' + i.imm() + ')'; },
    i => { return 'SLTIU     ' + i.rt_d() + ' = (' + i.rs() + ' < ' + i.imm() + ')'; },
    i => { return 'ANDI      ' + i.rt_d() + ' = '  + i.rs() + ' & ' + i.imm(); },
    i => { return 'ORI       ' + i.rt_d() + ' = '  + i.rs() + ' | ' + i.imm(); },
    i => { return 'XORI      ' + i.rt_d() + ' = '  + i.rs() + ' ^ ' + i.imm(); },
    i => { return 'LUI       ' + i.rt_d() + ' = '  + i.imm() + ' << 16'; },
    disassembleCop0,
    disassembleCop1,
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'BEQL      ' +                    i.rs() + ' == ' + i.rt() + ' --> ' + i.branchAddress(); },
    i => { return 'BNEL      ' +                    i.rs() + ' != ' + i.rt() + ' --> ' + i.branchAddress(); },
    i => { return 'BLEZL     ' +                    i.rs() + ' <= 0 --> ' + i.branchAddress(); },
    i => { return 'BGTZL     ' +                    i.rs() + ' > 0 --> ' + i.branchAddress(); },
    i => { return 'DADDI     ' + i.rt_d() + ' = ' + i.rs() + ' + ' + i.imm(); },
    i => { return 'DADDIU    ' + i.rt_d() + ' = ' + i.rs() + ' + ' + i.imm(); },
    i => { return 'LDL       ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'LDR       ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'LB        ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'LH        ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'LWL       ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'LW        ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'LBU       ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'LHU       ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'LWR       ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'LWU       ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'SB        ' + i.rt()   + ' -> ' + i.memstore(); },
    i => { return 'SH        ' + i.rt()   + ' -> ' + i.memstore(); },
    i => { return 'SWL       ' + i.rt()   + ' -> ' + i.memstore(); },
    i => { return 'SW        ' + i.rt()   + ' -> ' + i.memstore(); },
    i => { return 'SDL       ' + i.rt()   + ' -> ' + i.memstore(); },
    i => { return 'SDR       ' + i.rt()   + ' -> ' + i.memstore(); },
    i => { return 'SWR       ' + i.rt()   + ' -> ' + i.memstore(); },
    i => { return 'CACHE     ' + toHex(_rt(i.opcode),8) + ', ' + i.memaccess(); },
    i => { return 'LL        ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'LWC1      ' + i.ft_d() + ' <- ' + i.memload(); },
    i => { return 'Unk'; },
    i => { return 'Unk'; },
    i => { return 'LLD       ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'LDC1      ' + i.ft_d() + ' <- ' + i.memload(); },
    i => { return 'LDC2      ' + i.gt_d() + ' <- ' + i.memload(); },
    i => { return 'LD        ' + i.rt_d() + ' <- ' + i.memload(); },
    i => { return 'SC        ' + i.rt()   + ' -> ' + i.memstore(); },
    i => { return 'SWC1      ' + i.ft()   + ' -> ' + i.memstore(); },
    i => { return 'BREAKPOINT'; },
    i => { return 'Unk'; },
    i => { return 'SCD       ' + i.rt()   + ' -> ' + i.memstore(); },
    i => { return 'SDC1      ' + i.ft()   + ' -> ' + i.memstore(); },
    i => { return 'SDC2      ' + i.gt()   + ' -> ' + i.memstore(); },
    i => { return 'SD        ' + i.rt()   + ' -> ' + i.memstore(); }
  ];
  if (simpleTable.length != 64) {
    throw "Oops, didn't build the simple table correctly";
  }

  n64js.disassembleOp = function (address, opcode) {
    var i           = new Instruction(address, opcode);
    var o = _op(opcode);
    var disassembly = simpleTable[_op(opcode)](i);

    return {instruction:i, disassembly:disassembly, isJumpTarget:false};
  };

  n64js.disassembleAddress = function (address) {
    var instruction = n64js.getInstruction(address);
    return n64js.disassembleOp(address, instruction);
  };

  n64js.disassemble = function (bpc, epc) {
    var r = [];

    var targets = {};

    for (var i = bpc; i < epc; i += 4) {
        var d = n64js.disassembleAddress(i);
        if (d.instruction.target) {
          targets[d.instruction.target] = 1;
        }

        r.push(d);
    }

    // Flag any instructions that are jump targets
    for (var o = 0; o < r.length; ++o) {
      if (targets.hasOwnProperty(r[o].instruction.address)) {
        r[o].isJumpTarget = true;
      }
    }

    return r;
  };
}(window.n64js = window.n64js || {}));

const RenderMode = {
  AA_EN:               0x0008,
  Z_CMP:               0x0010,
  Z_UPD:               0x0020,
  IM_RD:               0x0040,
  CLR_ON_CVG:          0x0080,
  CVG_DST_CLAMP:       0,
  CVG_DST_WRAP:        0x0100,
  CVG_DST_FULL:        0x0200,
  CVG_DST_SAVE:        0x0300,
  ZMODE_OPA:           0,
  ZMODE_INTER:         0x0400,
  ZMODE_XLU:           0x0800,
  ZMODE_DEC:           0x0c00,
  CVG_X_ALPHA:         0x1000,
  ALPHA_CVG_SEL:       0x2000,
  FORCE_BL:            0x4000,
  TEX_EDGE:            0x0000 /* used to be 0x8000 */
};

function getRenderModeText(data) {
  var t = '';

  if (data & RenderMode.AA_EN)               t += '|AA_EN';
  if (data & RenderMode.Z_CMP)               t += '|Z_CMP';
  if (data & RenderMode.Z_UPD)               t += '|Z_UPD';
  if (data & RenderMode.IM_RD)               t += '|IM_RD';
  if (data & RenderMode.CLR_ON_CVG)          t += '|CLR_ON_CVG';

  var cvg = data & 0x0300;
       if (cvg === RenderMode.CVG_DST_CLAMP) t += '|CVG_DST_CLAMP';
  else if (cvg === RenderMode.CVG_DST_WRAP)  t += '|CVG_DST_WRAP';
  else if (cvg === RenderMode.CVG_DST_FULL)  t += '|CVG_DST_FULL';
  else if (cvg === RenderMode.CVG_DST_SAVE)  t += '|CVG_DST_SAVE';

  var zmode = data & 0x0c00;
       if (zmode === RenderMode.ZMODE_OPA)   t += '|ZMODE_OPA';
  else if (zmode === RenderMode.ZMODE_INTER) t += '|ZMODE_INTER';
  else if (zmode === RenderMode.ZMODE_XLU)   t += '|ZMODE_XLU';
  else if (zmode === RenderMode.ZMODE_DEC)   t += '|ZMODE_DEC';

  if (data & RenderMode.CVG_X_ALPHA)         t += '|CVG_X_ALPHA';
  if (data & RenderMode.ALPHA_CVG_SEL)       t += '|ALPHA_CVG_SEL';
  if (data & RenderMode.FORCE_BL)            t += '|FORCE_BL';

  var c0 = t.length > 0 ? t.substr(1) : '0';

  var blend = data >>> G_MDSFT_BLENDER;

  var c1 = 'GBL_c1(' + blendOpText(blend>>>2) + ') | GBL_c2(' + blendOpText(blend) + ') /*' + toString16(blend) + '*/';

  return c0 + ', ' + c1;
}

// G_SETOTHERMODE_L sft: shift count
const G_MDSFT_ALPHACOMPARE = 0;
const G_MDSFT_ZSRCSEL      = 2;
const G_MDSFT_RENDERMODE   = 3;
const G_MDSFT_BLENDER      = 16;

const G_AC_MASK = 3 << G_MDSFT_ALPHACOMPARE;
const G_ZS_MASK = 1 << G_MDSFT_ZSRCSEL;

function getOtherModeLShiftCountName(value) {
  switch (value) {
    case G_MDSFT_ALPHACOMPARE: return 'G_MDSFT_ALPHACOMPARE';
    case G_MDSFT_ZSRCSEL:      return 'G_MDSFT_ZSRCSEL';
    case G_MDSFT_RENDERMODE:   return 'G_MDSFT_RENDERMODE';
    case G_MDSFT_BLENDER:      return 'G_MDSFT_BLENDER';
  }

  return toString8(value);
}

//G_SETOTHERMODE_H shift count
const G_MDSFT_BLENDMASK   = 0;
const G_MDSFT_ALPHADITHER = 4;
const G_MDSFT_RGBDITHER   = 6;
const G_MDSFT_COMBKEY     = 8;
const G_MDSFT_TEXTCONV    = 9;
const G_MDSFT_TEXTFILT    = 12;
const G_MDSFT_TEXTLUT     = 14;
const G_MDSFT_TEXTLOD     = 16;
const G_MDSFT_TEXTDETAIL  = 17;
const G_MDSFT_TEXTPERSP   = 19;
const G_MDSFT_CYCLETYPE   = 20;
const G_MDSFT_COLORDITHER = 22;
const G_MDSFT_PIPELINE    = 23;

function getOtherModeHShiftCountName(value) {
  switch (value) {
    case G_MDSFT_BLENDMASK:   return 'G_MDSFT_BLENDMASK';
    case G_MDSFT_ALPHADITHER: return 'G_MDSFT_ALPHADITHER';
    case G_MDSFT_RGBDITHER:   return 'G_MDSFT_RGBDITHER';
    case G_MDSFT_COMBKEY:     return 'G_MDSFT_COMBKEY';
    case G_MDSFT_TEXTCONV:    return 'G_MDSFT_TEXTCONV';
    case G_MDSFT_TEXTFILT:    return 'G_MDSFT_TEXTFILT';
    case G_MDSFT_TEXTLUT:     return 'G_MDSFT_TEXTLUT';
    case G_MDSFT_TEXTLOD:     return 'G_MDSFT_TEXTLOD';
    case G_MDSFT_TEXTDETAIL:  return 'G_MDSFT_TEXTDETAIL';
    case G_MDSFT_TEXTPERSP:   return 'G_MDSFT_TEXTPERSP';
    case G_MDSFT_CYCLETYPE:   return 'G_MDSFT_CYCLETYPE';
    case G_MDSFT_COLORDITHER: return 'G_MDSFT_COLORDITHER';
    case G_MDSFT_PIPELINE:    return 'G_MDSFT_PIPELINE';
  }

  return toString8(value);
}

const MoveMemGBI2 = makeEnum({
  G_GBI2_MV_VIEWPORT: 8,
  G_GBI2_MV_LIGHT:    10,
  G_GBI2_MV_POINT:    12,
  G_GBI2_MV_MATRIX:   14,    // NOTE: this is in moveword table
  G_GBI2_MVO_LOOKATX: 0 * 24,
  G_GBI2_MVO_LOOKATY: 1 * 24,
  G_GBI2_MVO_L0:      2 * 24,
  G_GBI2_MVO_L1:      3 * 24,
  G_GBI2_MVO_L2:      4 * 24,
  G_GBI2_MVO_L3:      5 * 24,
  G_GBI2_MVO_L4:      6 * 24,
  G_GBI2_MVO_L5:      7 * 24,
  G_GBI2_MVO_L6:      8 * 24,
  G_GBI2_MVO_L7:      9 * 24,
});

const G_PM_MASK  = 1 << G_MDSFT_PIPELINE;
const G_CYC_MASK = 3 << G_MDSFT_CYCLETYPE;
const G_TP_MASK  = 1 << G_MDSFT_TEXTPERSP;
const G_TD_MASK  = 3 << G_MDSFT_TEXTDETAIL;
const G_TL_MASK  = 1 << G_MDSFT_TEXTLOD;
const G_TT_MASK  = 3 << G_MDSFT_TEXTLUT;
const G_TF_MASK  = 3 << G_MDSFT_TEXTFILT;
const G_TC_MASK  = 7 << G_MDSFT_TEXTCONV;
const G_CK_MASK  = 1 << G_MDSFT_COMBKEY;
const G_CD_MASK  = 3 << G_MDSFT_RGBDITHER;
const G_AD_MASK  = 3 << G_MDSFT_ALPHADITHER;


const G_MTX_PROJECTION = 0x01;

const G_MTX_LOAD       = 0x02;

const G_MTX_PUSH       = 0x04;

const G_DL_PUSH   = 0x00;


const MoveWord = makeEnum({
  G_MW_MATRIX:    0x00,
  G_MW_NUMLIGHT:  0x02,
  G_MW_CLIP:      0x04,
  G_MW_SEGMENT:   0x06,
  G_MW_FOG:       0x08,
  G_MW_LIGHTCOL:  0x0a,
  G_MW_POINTS:    0x0c,
  G_MW_PERSPNORM: 0x0e,
});

const MoveMemGBI1 = makeEnum({
  G_MV_VIEWPORT: 0x80,
  G_MV_LOOKATY:  0x82,
  G_MV_LOOKATX:  0x84,
  G_MV_L0:       0x86,
  G_MV_L1:       0x88,
  G_MV_L2:       0x8a,
  G_MV_L3:       0x8c,
  G_MV_L4:       0x8e,
  G_MV_L5:       0x90,
  G_MV_L6:       0x92,
  G_MV_L7:       0x94,
  G_MV_TXTATT:   0x96,
  G_MV_MATRIX_1: 0x9e,
  G_MV_MATRIX_2: 0x98,
  G_MV_MATRIX_3: 0x9a,
  G_MV_MATRIX_4: 0x9c,
});

const G_MWO_NUMLIGHT       = 0x00;






















































const ModifyVtx = makeEnum({
  G_MWO_POINT_RGBA:        0x10,
  G_MWO_POINT_ST:          0x14,
  G_MWO_POINT_XYSCREEN:    0x18,
  G_MWO_POINT_ZSCREEN:     0x1c,
});

const NumLights = makeEnum({
  //NUMLIGHTS_0: 1,
  NUMLIGHTS_1: 1,
  NUMLIGHTS_2: 2,
  NUMLIGHTS_3: 3,
  NUMLIGHTS_4: 4,
  NUMLIGHTS_5: 5,
  NUMLIGHTS_6: 6,
  NUMLIGHTS_7: 7,
});

const G_TX_LOADTILE   = 7;
const G_TX_RENDERTILE = 0;

function getTileText(tile_idx) {
  var tile_text = tile_idx;
  if (tile_idx === G_TX_LOADTILE)   tile_text = 'G_TX_LOADTILE';
  if (tile_idx === G_TX_RENDERTILE) tile_text = 'G_TX_RENDERTILE';
  return tile_text;
}

const G_TX_WRAP       = 0x0;
const G_TX_MIRROR     = 0x1;
const G_TX_CLAMP      = 0x2;

function getClampMirrorWrapText(flags) {
  switch (flags) {
    case G_TX_WRAP:              return 'G_TX_WRAP';
    case G_TX_MIRROR:            return 'G_TX_MIRROR';
    case G_TX_CLAMP:             return 'G_TX_CLAMP';
    case G_TX_MIRROR|G_TX_CLAMP: return 'G_TX_MIRROR|G_TX_CLAMP';
  }

  return flags;
}

const ScissorMode = makeEnum({
  G_SC_NON_INTERLACE: 0,
  G_SC_ODD_INTERLACE: 3,
  G_SC_EVEN_INTERLACE: 2
});

const GeometryModeGBI1 = {
  G_ZBUFFER:            0x00000001,
  G_TEXTURE_ENABLE:     0x00000002,  /* Microcode use only */
  G_SHADE:              0x00000004,  /* enable Gouraud interp */
  G_SHADING_SMOOTH:     0x00000200,  /* flat or smooth shaded */
  G_CULL_FRONT:         0x00001000,
  G_CULL_BACK:          0x00002000,
  G_CULL_BOTH:          0x00003000,  /* To make code cleaner */
  G_FOG:                0x00010000,
  G_LIGHTING:           0x00020000,
  G_TEXTURE_GEN:        0x00040000,
  G_TEXTURE_GEN_LINEAR: 0x00080000,
  G_LOD:                0x00100000, /* NOT IMPLEMENTED */
};

const GeometryModeGBI2 = {
  G_TEXTURE_ENABLE:     0x2,        /* NB - not implemented as geometry mode flag in GBI2 */
  G_SHADE:              0,

  G_ZBUFFER:            0x00000001,
  G_CULL_BACK:          0x00000200,
  G_CULL_FRONT:         0x00000400,
  G_CULL_BOTH:          0x00000600,  /* To make code cleaner */
  G_FOG:                0x00010000,
  G_LIGHTING:           0x00020000,
  G_TEXTURE_GEN:        0x00040000,
  G_TEXTURE_GEN_LINEAR: 0x00080000,
  G_LOD:                0x00100000,  /* NOT IMPLEMENTED */
  G_SHADING_SMOOTH:     0x00200000,  /* flat or smooth shaded */
};

function getGeometryModeFlagsText(flags, data) {
  var t = '';

  if (data & flags.G_ZBUFFER)               t += '|G_ZBUFFER';
  if (data & flags.G_TEXTURE_ENABLE)        t += '|G_TEXTURE_ENABLE';
  if (data & flags.G_SHADE)                 t += '|G_SHADE';
  if (data & flags.G_SHADING_SMOOTH)        t += '|G_SHADING_SMOOTH';

  var cull = data & flags.G_CULL_BOTH;
       if (cull === flags.G_CULL_FRONT)     t += '|G_CULL_FRONT';
  else if (cull === flags.G_CULL_BACK)      t += '|G_CULL_BACK';
  else if (cull === flags.G_CULL_BOTH)      t += '|G_CULL_BOTH';

  if (data & flags.G_FOG)                   t += '|G_FOG';
  if (data & flags.G_LIGHTING)              t += '|G_LIGHTING';
  if (data & flags.G_TEXTURE_GEN)           t += '|G_TEXTURE_GEN';
  if (data & flags.G_TEXTURE_GEN_LINEAR)    t += '|G_TEXTURE_GEN_LINEAR';
  if (data & flags.G_LOD)                   t += '|G_LOD';

  return t.length > 0 ? t.substr(1) : '0';
}

/**
 * Adds a nameOf function to the provided Object so that we can easily find the
 * name for a given value. e.g.:
 *     var name = gbi.Foo.nameOf(fooValue);
 * @param {!Object<string, number>} values
 * @return {!Object<string, number>}
 */
function makeEnum(values) {
  values.nameOf = (value) => {
    for (var name in values) {
      if (values.hasOwnProperty(name) && values[name] === value) {
        return name;
      }
    }
    return toString32(value);
  };

  return Object.freeze(values);
}

const ImageFormat = makeEnum({
  G_IM_FMT_RGBA:    0,
  G_IM_FMT_YUV:     1,
  G_IM_FMT_CI:      2,
  G_IM_FMT_IA:      3,
  G_IM_FMT_I:       4,
});

const ImageSize = makeEnum({
  G_IM_SIZ_4b:      0,
  G_IM_SIZ_8b:      1,
  G_IM_SIZ_16b:     2,
  G_IM_SIZ_32b:     3,
});

const PipelineMode = makeEnum({
  G_PM_1PRIMITIVE:   1 << G_MDSFT_PIPELINE,
  G_PM_NPRIMITIVE:   0 << G_MDSFT_PIPELINE,
});

const CycleType = makeEnum({
  G_CYC_1CYCLE:     0 << G_MDSFT_CYCLETYPE,
  G_CYC_2CYCLE:     1 << G_MDSFT_CYCLETYPE,
  G_CYC_COPY:       2 << G_MDSFT_CYCLETYPE,
  G_CYC_FILL:       3 << G_MDSFT_CYCLETYPE,
});

const TexturePerspective = makeEnum({
  G_TP_NONE:        0 << G_MDSFT_TEXTPERSP,
  G_TP_PERSP:       1 << G_MDSFT_TEXTPERSP,
});

const TextureDetail = makeEnum({
  G_TD_CLAMP:       0 << G_MDSFT_TEXTDETAIL,
  G_TD_SHARPEN:     1 << G_MDSFT_TEXTDETAIL,
  G_TD_DETAIL:      2 << G_MDSFT_TEXTDETAIL,
});

const TextureLOD = makeEnum({
  G_TL_TILE:        0 << G_MDSFT_TEXTLOD,
  G_TL_LOD:         1 << G_MDSFT_TEXTLOD,
});

const TextureLUT = makeEnum({
  G_TT_NONE:        0 << G_MDSFT_TEXTLUT,
  G_TT_RGBA16:      2 << G_MDSFT_TEXTLUT,
  G_TT_IA16:        3 << G_MDSFT_TEXTLUT,
});

const TextureFilter = makeEnum({
  G_TF_POINT:       0 << G_MDSFT_TEXTFILT,
  G_TF_AVERAGE:     3 << G_MDSFT_TEXTFILT,
  G_TF_BILERP:      2 << G_MDSFT_TEXTFILT,
});

const TextureConvert = makeEnum({
  G_TC_CONV:       0 << G_MDSFT_TEXTCONV,
  G_TC_FILTCONV:   5 << G_MDSFT_TEXTCONV,
  G_TC_FILT:       6 << G_MDSFT_TEXTCONV,
});

const CombineKey = makeEnum({
  G_CK_NONE:        0 << G_MDSFT_COMBKEY,
  G_CK_KEY:         1 << G_MDSFT_COMBKEY,
});

const ColorDither = makeEnum({
  G_CD_MAGICSQ:     0 << G_MDSFT_RGBDITHER,
  G_CD_BAYER:       1 << G_MDSFT_RGBDITHER,
  G_CD_NOISE:       2 << G_MDSFT_RGBDITHER,
  G_CD_DISABLE:     3 << G_MDSFT_RGBDITHER,
});

const AlphaDither = makeEnum({
  G_AD_PATTERN:     0 << G_MDSFT_ALPHADITHER,
  G_AD_NOTPATTERN:  1 << G_MDSFT_ALPHADITHER,
  G_AD_NOISE:       2 << G_MDSFT_ALPHADITHER,
  G_AD_DISABLE:     3 << G_MDSFT_ALPHADITHER,
});

const AlphaCompare = makeEnum({
  G_AC_NONE:          0 << G_MDSFT_ALPHACOMPARE,
  G_AC_THRESHOLD:     1 << G_MDSFT_ALPHACOMPARE,
  G_AC_DITHER:        3 << G_MDSFT_ALPHACOMPARE,
});

const DepthSource = makeEnum({
  G_ZS_PIXEL:         0 << G_MDSFT_ZSRCSEL,
  G_ZS_PRIM:          1 << G_MDSFT_ZSRCSEL,
});

const blendColourSources = [
  'G_BL_CLR_IN',
  'G_BL_CLR_MEM',
  'G_BL_CLR_BL',
  'G_BL_CLR_FOG',
];

const blendSourceFactors = [
  'G_BL_A_IN',
  'G_BL_A_FOG',
  'G_BL_A_SHADE',
  'G_BL_0',
];

const blendDestFactors = [
  'G_BL_1MA',
  'G_BL_A_MEM',
  'G_BL_1',
  'G_BL_0',
];

function blendOpText(v) {
  var m1a = (v>>>12)&0x3;
  var m1b = (v>>> 8)&0x3;
  var m2a = (v>>> 4)&0x3;
  var m2b = (v>>> 0)&0x3;

  return blendColourSources[m1a] + ',' + blendSourceFactors[m1b] + ',' + blendColourSources[m2a] + ',' + blendDestFactors[m2b];
}

class Matrix {
  /**
   * @param {Float32Array=} opt_elems
   */
  constructor(opt_elems){
    this.elems = opt_elems || new Float32Array(16);
  }

  /**
   * @param {!Matrix} other The matrix to multiply with.
   * @return {!Matrix}
   */
  multiply(other) {
    let a = this.elems;
    let b = other.elems;

    let out = new Float32Array(16);
    for (let r = 0; r < 4; ++r) {
      for (let c = 0; c < 4; ++c) {
        out[r*4 + c] += a[r*4 + 0] * b[0*4 + c];
        out[r*4 + c] += a[r*4 + 1] * b[1*4 + c];
        out[r*4 + c] += a[r*4 + 2] * b[2*4 + c];
        out[r*4 + c] += a[r*4 + 3] * b[3*4 + c];
      }
    }

    return new Matrix(out);
  }

  /**
   * Transforms a normal vector.
   * @param {!Vector3} v3in The vector to transform.
   * @param {!Vector3} v3out The output vector.
   */
  transformNormal(v3in, v3out) {
    let a = this.elems;
    let v = v3in.elems;

    let x = v[0];
    let y = v[1];
    let z = v[2];

    v3out.elems[0] = (a[0] * x) + (a[1] * y) + (a[ 2] * z);
    v3out.elems[1] = (a[4] * x) + (a[5] * y) + (a[ 6] * z);
    v3out.elems[2] = (a[8] * x) + (a[9] * y) + (a[10] * z);
  }

  /**
   * Transforms a point vector.
   * @param {!Vector3} v3in The vector to transform.
   * @param {!Vector4} v4out The output vector.
   */
  transformPoint(v3in, v4out) {
    let a = this.elems;
    let v = v3in.elems;

    let x = v[0];
    let y = v[1];
    let z = v[2];

    v4out.elems[0] = (a[ 0] * x) + (a[ 1] * y) + (a[ 2] * z) + a[3];
    v4out.elems[1] = (a[ 4] * x) + (a[ 5] * y) + (a[ 6] * z) + a[7];
    v4out.elems[2] = (a[ 8] * x) + (a[ 9] * y) + (a[10] * z) + a[11];
    v4out.elems[3] = (a[12] * x) + (a[13] * y) + (a[14] * z) + a[15];
  }

  /**
   * Makes an identity matrix.
   * @return {!Matrix}
   */
  static identity() {
    let elems = new Float32Array(16);
    elems[0]  = 1;
    elems[5]  = 1;
    elems[10] = 1;
    elems[15] = 1;
    return new Matrix(elems);
  }

  /**
   * Make an orthographic projection matrix.
   * @param {number} left
   * @param {number} right
   * @param {number} bottom
   * @param {number} top
   * @param {number} znear
   * @param {number} zfar
   * @return {!Matrix}
   */
  static makeOrtho(left, right, bottom, top, znear, zfar) {
      let tx = - (right + left) / (right - left);
      let ty = - (top + bottom) / (top - bottom);
      let tz = - (zfar + znear) / (zfar - znear);

      let elems = new Float32Array(16);

      elems[0]  = 2 / (right - left);
      elems[1]  = 0;
      elems[2]  = 0;
      elems[3]  = 0;

      elems[4]  = 0;
      elems[5]  = 2 / (top - bottom);
      elems[6]  = 0;
      elems[7]  = 0,

      elems[8]  = 0;
      elems[9]  = 0;
      elems[10] = -2 / (zfar - znear);
      elems[11] = 0;

      elems[12] = tx;
      elems[13] = ty;
      elems[14] = tz;
      elems[15] = 1;

      return new Matrix(elems);
  }
}

class Tile {
  constructor() {
    this.format = -1;
    this.size = 0;
    this.line = 0;
    this.tmem = 0;
    this.palette = 0;
    this.cm_t = 0;
    this.mask_t = 0;
    this.shift_t = 0;
    this.cm_s = 0;
    this.mask_s = 0;
    this.shift_s = 0;
    this.uls = 0;
    this.ult = 0;
    this.lrs = 0;
    this.lrt = 0;

    // Last computed hash for this Tile. 0 if invalid/not calculated.
    // Invalidated on any load, settile, settilesize.
    this.hash = 0;
  }

  get left() {
    return this.uls / 4;
  }

  get top() {
    return this.ult / 4;
  }

  get right() {
    return this.lrs / 4;
  }

  get bottom() {
    return this.lrt / 4;
  }

  get width() {
    return getTextureDimension(this.uls, this.lrs, this.mask_s);
  }

  get height() {
    return getTextureDimension(this.ult, this.lrt, this.mask_t);
  }
}

function getTextureDimension(ul, lr, mask) {
  var dim = ((lr - ul) / 4) + 1;
  return mask ? Math.min(1 << mask, dim) : dim;
}

class Vector3 {
  /**
   * @param {Float32Array=} opt_elems
   */
  constructor(opt_elems) {
    this.elems = opt_elems || new Float32Array(3);
  }

  /**
   * Return the dot product.
   * @param {!Vector3} other
   * @return {number}
   */
  dot(other) {
    let t = 0;
    for (let i = 0; i < this.elems.length; ++i)
      t += this.elems[i]*other.elems[i];
    return t;
  }

  /**
   * Return the squared length of the vector.
   * @return {number}
   */
  lengthSqr() {
    return this.dot(this);
  }

  /**
   * Return the length of the vector.
   * @return {number}
   */
  length() {
    return Math.sqrt(this.lengthSqr());
  }

  /**
   * Normalises the vector.
   * @return {!Vector3}
   */
  normaliseInPlace() {
    let len = this.length();
    if (len > 0.0) {
      for (let i = 0; i < this.elems.length; ++i)
        this.elems[i] /= len;
    }
    return this;
  }

  /**
   * Create a vector using the provided array of elements.
   * @param {!Array<number>} elems
   * @return {!Vector3}
   */
  static create(elems) {
    let v = new Vector3();
    v.elems[0] = elems[0];
    v.elems[1] = elems[1];
    v.elems[2] = elems[2];
    return v;
  }
}

class Vector4 {
  /**
   * @param {Float32Array=} opt_elems
   */
  constructor(opt_elems) {
    this.elems = opt_elems || new Float32Array(4);
  }

  /**
   * Return the dot product.
   * @param {!Vector4} other
   * @return {number}
   */
  dot(other) {
    var t = 0;
    for (var i = 0; i < this.elems.length; ++i)
      t += this.elems[i]*other.elems[i];
    return t;
  }

  /**
   * Return the squared length of the vector.
   * @return {number}
   */
  lengthSqr() {
    return this.dot(this);
  }

  /**
   * Return the length of the vector.
   * @return {number}
   */
  length() {
    return Math.sqrt(this.lengthSqr());
  }

  /**
   * Normalises the vector.
   * @return {!Vector4}
   */
  normaliseInPlace() {
    var len = this.length();
    if (len > 0.0) {
      for (var i = 0; i < this.elems.length; ++i)
        this.elems[i] /= len;
    }
    return this;
  }


  /**
   * Create a vector using the provided array of elements.
   * @param {!Array<number>} elems
   * @return {!Vector3}
   */
  static create(elems) {
    var v = new Vector3();
    v.elems[0] = elems[0];
    v.elems[1] = elems[1];
    v.elems[2] = elems[2];
    v.elems[3] = elems[3];
    return v;
  }
}

class ProjectedVertex {
  constructor() {
    this.pos   = new Vector4();
    this.color = 0;
    this.u     = 0;
    this.v     = 0;
    this.set   = false;
  }
}

class TriangleBuffer {
  /**
   * @param {number} maxTris
   */
  constructor(maxTris) {
    this.positions = new Float32Array(maxTris*3*4);
    this.colours = new  Uint32Array(maxTris*3*1);
    this.coords = new Float32Array(maxTris*3*2);
  }

  /**
   * Add a triangle.
   * @param {!ProjectedVertex} v0
   * @param {!ProjectedVertex} v1
   * @param {!ProjectedVertex} v2
   * @param {number} idx
   */
  pushTri(v0, v1, v2, idx) {
    var vtx_pos_idx = idx * 3*4;
    var vtx_col_idx = idx * 3*1;
    var vtx_uv_idx  = idx * 3*2;

    var vp0 = v0.pos.elems;
    var vp1 = v1.pos.elems;
    var vp2 = v2.pos.elems;

    this.positions[vtx_pos_idx+ 0] = vp0[0];
    this.positions[vtx_pos_idx+ 1] = vp0[1];
    this.positions[vtx_pos_idx+ 2] = vp0[2];
    this.positions[vtx_pos_idx+ 3] = vp0[3];
    this.positions[vtx_pos_idx+ 4] = vp1[0];
    this.positions[vtx_pos_idx+ 5] = vp1[1];
    this.positions[vtx_pos_idx+ 6] = vp1[2];
    this.positions[vtx_pos_idx+ 7] = vp1[3];
    this.positions[vtx_pos_idx+ 8] = vp2[0];
    this.positions[vtx_pos_idx+ 9] = vp2[1];
    this.positions[vtx_pos_idx+10] = vp2[2];
    this.positions[vtx_pos_idx+11] = vp2[3];

    this.colours[vtx_col_idx + 0] = v0.color;
    this.colours[vtx_col_idx + 1] = v1.color;
    this.colours[vtx_col_idx + 2] = v2.color;

    this.coords[vtx_uv_idx+ 0] = v0.u;
    this.coords[vtx_uv_idx+ 1] = v0.v;
    this.coords[vtx_uv_idx+ 2] = v1.u;
    this.coords[vtx_uv_idx+ 3] = v1.v;
    this.coords[vtx_uv_idx+ 4] = v2.u;
    this.coords[vtx_uv_idx+ 5] = v2.v;
  }
}

const kOneToEight = [
  0x00, // 0 -> 00 00 00 00
  0xff, // 1 -> 11 11 11 11
];

const kThreeToEight = [
  0x00, // 000 -> 00 00 00 00
  0x24, // 001 -> 00 10 01 00
  0x49, // 010 -> 01 00 10 01
  0x6d, // 011 -> 01 10 11 01
  0x92, // 100 -> 10 01 00 10
  0xb6, // 101 -> 10 11 01 10
  0xdb, // 110 -> 11 01 10 11
  0xff, // 111 -> 11 11 11 11
];

const kFourToEight = [
  0x00, 0x11, 0x22, 0x33,
  0x44, 0x55, 0x66, 0x77,
  0x88, 0x99, 0xaa, 0xbb,
  0xcc, 0xdd, 0xee, 0xff,
];

const kFiveToEight = [
  0x00, // 00000 -> 00000000
  0x08, // 00001 -> 00001000
  0x10, // 00010 -> 00010000
  0x18, // 00011 -> 00011000
  0x21, // 00100 -> 00100001
  0x29, // 00101 -> 00101001
  0x31, // 00110 -> 00110001
  0x39, // 00111 -> 00111001
  0x42, // 01000 -> 01000010
  0x4a, // 01001 -> 01001010
  0x52, // 01010 -> 01010010
  0x5a, // 01011 -> 01011010
  0x63, // 01100 -> 01100011
  0x6b, // 01101 -> 01101011
  0x73, // 01110 -> 01110011
  0x7b, // 01111 -> 01111011

  0x84, // 10000 -> 10000100
  0x8c, // 10001 -> 10001100
  0x94, // 10010 -> 10010100
  0x9c, // 10011 -> 10011100
  0xa5, // 10100 -> 10100101
  0xad, // 10101 -> 10101101
  0xb5, // 10110 -> 10110101
  0xbd, // 10111 -> 10111101
  0xc6, // 11000 -> 11000110
  0xce, // 11001 -> 11001110
  0xd6, // 11010 -> 11010110
  0xde, // 11011 -> 11011110
  0xe7, // 11100 -> 11100111
  0xef, // 11101 -> 11101111
  0xf7, // 11110 -> 11110111
  0xff, // 11111 -> 11111111
];

/**
 * Converts an IA16 pixel to the native RGBA format.
 * @param {number} value An IA16 value
 * @return {number}
 */
function convertIA16Pixel(value) {
  var i = (value >>> 8) & 0xff;
  let a = (value) & 0xff;

  return (i << 24) | (i << 16) | (i << 8) | a;
}

/**
 * Converts an RGBA16 pixel to the native RGBA format.
 * @param {number} value An IA16 value
 * @return {number}
 */
function convertRGBA16Pixel(value) {
  let r = kFiveToEight[(value >>> 11) & 0x1f];
  let g = kFiveToEight[(value >>> 6) & 0x1f];
  let b = kFiveToEight[(value >>> 1) & 0x1f];
  let a = (value & 0x01) ? 255 : 0;

  return (r << 24) | (g << 16) | (b << 8) | a;
}

/**
 * Converts N64 RGBA32 texels to the native RGBA format.
 * @param {!ImageData} dstData
 * @param {!Uint8Array} src
 * @param {!Tile} tile
 */
function convertRGBA32(dstData, src, tile) {
  let dst = dstData.data;
  let dstRowStride = dstData.width * 4; // Might not be the same as width, due to power of 2
  let dstRowOffset = 0;

  let srcRowStride = tile.line << 3;
  let srcRowOffset = tile.tmem << 3;

  // NB! RGBA/32 line needs to be doubled.
  srcRowStride *= 2;

  let rowSwizzle = 0;
  for (let y = 0; y < tile.height; ++y) {
    let srcOffset = srcRowOffset;
    let dstOffset = dstRowOffset;

    for (let x = 0; x < tile.width; ++x) {
      let index = srcOffset ^ rowSwizzle;

      dst[dstOffset + 0] = src[index];
      dst[dstOffset + 1] = src[index + 1];
      dst[dstOffset + 2] = src[index + 2];
      dst[dstOffset + 3] = src[index + 3];

      srcOffset += 4;
      dstOffset += 4;
    }
    srcRowOffset += srcRowStride;
    dstRowOffset += dstRowStride;

    rowSwizzle ^= 0x4; // Alternate lines are word-swapped
  }
}

/**
 * Converts N64 RGBA16 texels to the native RGBA format.
 * @param {!ImageData} dstData
 * @param {!Uint8Array} src
 * @param {!Tile} tile
 */
function convertRGBA16(dstData, src, tile) {
  let dst = dstData.data;
  let dstRowStride = dstData.width * 4; // Might not be the same as width, due to power of 2
  let dstRowOffset = 0;

  let srcRowStride = tile.line << 3;
  let srcRowOffset = tile.tmem << 3;

  let rowSwizzle = 0;
  for (let y = 0; y < tile.height; ++y) {
    let srcOffset = srcRowOffset;
    let dstOffset = dstRowOffset;

    for (let x = 0; x < tile.width; ++x) {
      let index = srcOffset ^ rowSwizzle;
      let srcPixel = (src[index] << 8) | src[index + 1];

      dst[dstOffset + 0] = kFiveToEight[(srcPixel >>> 11) & 0x1f];
      dst[dstOffset + 1] = kFiveToEight[(srcPixel >>> 6) & 0x1f];
      dst[dstOffset + 2] = kFiveToEight[(srcPixel >>> 1) & 0x1f];
      dst[dstOffset + 3] = (srcPixel & 0x01) ? 255 : 0;

      srcOffset += 2;
      dstOffset += 4;
    }
    srcRowOffset += srcRowStride;
    dstRowOffset += dstRowStride;

    rowSwizzle ^= 0x4; // Alternate lines are word-swapped
  }
}

/**
 * Converts N64 IA16 texels to the native RGBA format.
 * @param {!ImageData} dstData
 * @param {!Uint8Array} src
 * @param {!Tile} tile
 */
function convertIA16(dstData, src, tile) {
  let dst = dstData.data;
  let dstRowStride = dstData.width * 4; // Might not be the same as width, due to power of 2
  let dstRowOffset = 0;

  let srcRowStride = tile.line << 3;
  let srcRowOffset = tile.tmem << 3;

  let rowSwizzle = 0;
  for (let y = 0; y < tile.height; ++y) {
    let srcOffset = srcRowOffset;
    let dstOffset = dstRowOffset;

    for (let x = 0; x < tile.width; ++x) {
      let index = srcOffset ^ rowSwizzle;
      let i = src[index];
      let a = src[index + 1];

      dst[dstOffset + 0] = i;
      dst[dstOffset + 1] = i;
      dst[dstOffset + 2] = i;
      dst[dstOffset + 3] = a;

      srcOffset += 2;
      dstOffset += 4;
    }
    srcRowOffset += srcRowStride;
    dstRowOffset += dstRowStride;

    rowSwizzle ^= 0x4; // Alternate lines are word-swapped
  }
}

/**
 * Converts N64 IA8 texels to the native RGBA format.
 * @param {!ImageData} dstData
 * @param {!Uint8Array} src
 * @param {!Tile} tile
 */
function convertIA8(dstData, src, tile) {
  let dst = dstData.data;
  let dstRowStride = dstData.width * 4; // Might not be the same as width, due to power of 2
  let dstRowOffset = 0;

  let srcRowStride = tile.line << 3;
  let srcRowOffset = tile.tmem << 3;

  let rowSwizzle = 0;
  for (let y = 0; y < tile.height; ++y) {
    let srcOffset = srcRowOffset;
    let dstOffset = dstRowOffset;

    for (let x = 0; x < tile.width; ++x) {
      let index = srcOffset ^ rowSwizzle;
      let srcPixel = src[index];

      let i = kFourToEight[(srcPixel >>> 4) & 0xf];
      let a = kFourToEight[srcPixel & 0xf];

      dst[dstOffset + 0] = i;
      dst[dstOffset + 1] = i;
      dst[dstOffset + 2] = i;
      dst[dstOffset + 3] = a;

      srcOffset += 1;
      dstOffset += 4;
    }
    srcRowOffset += srcRowStride;
    dstRowOffset += dstRowStride;

    rowSwizzle ^= 0x4; // Alternate lines are word-swapped
  }
}

/**
 * Converts N64 IA4 texels to the native RGBA format.
 * @param {!ImageData} dstData
 * @param {!Uint8Array} src
 * @param {!Tile} tile
 */
function convertIA4(dstData, src, tile) {
  let dst = dstData.data;
  let dstRowStride = dstData.width * 4; // Might not be the same as width, due to power of 2
  let dstRowOffset = 0;

  let srcRowStride = tile.line << 3;
  let srcRowOffset = tile.tmem << 3;

  let rowSwizzle = 0;

  for (let y = 0; y < tile.height; ++y) {
    let srcOffset = srcRowOffset;
    let dstOffset = dstRowOffset;

    // Process 2 pixels at a time
    for (let x = 0; x + 1 < tile.width; x += 2) {
      let index = srcOffset ^ rowSwizzle;
      let srcPixel = src[index];

      let i0 = kThreeToEight[(srcPixel & 0xe0) >>> 5];
      let a0 = kOneToEight[(srcPixel & 0x10) >>> 4];

      let i1 = kThreeToEight[(srcPixel & 0x0e) >>> 1];
      let a1 = kOneToEight[(srcPixel & 0x01) >>> 0];

      dst[dstOffset + 0] = i0;
      dst[dstOffset + 1] = i0;
      dst[dstOffset + 2] = i0;
      dst[dstOffset + 3] = a0;

      dst[dstOffset + 4] = i1;
      dst[dstOffset + 5] = i1;
      dst[dstOffset + 6] = i1;
      dst[dstOffset + 7] = a1;

      srcOffset += 1;
      dstOffset += 8;
    }

    // Handle trailing pixel, if odd width
    if (tile.width & 1) {
      let index = srcOffset ^ rowSwizzle;
      let srcPixel = src[index];

      let i0 = kThreeToEight[(srcPixel & 0xe0) >>> 5];
      let a0 = kOneToEight[(srcPixel & 0x10) >>> 4];

      dst[dstOffset + 0] = i0;
      dst[dstOffset + 1] = i0;
      dst[dstOffset + 2] = i0;
      dst[dstOffset + 3] = a0;

      srcOffset += 1;
      dstOffset += 4;
    }

    srcRowOffset += srcRowStride;
    dstRowOffset += dstRowStride;

    rowSwizzle ^= 0x4; // Alternate lines are word-swapped
  }
}

/**
 * Converts N64 I8 texels to the native RGBA format.
 * @param {!ImageData} dstData
 * @param {!Uint8Array} src
 * @param {!Tile} tile
 */
function convertI8(dstData, src, tile) {
  let dst = dstData.data;
  let dstRowStride = dstData.width * 4; // Might not be the same as width, due to power of 2
  let dstRowOffset = 0;

  let srcRowStride = tile.line << 3;
  let srcRowOffset = tile.tmem << 3;

  let rowSwizzle = 0;
  for (let y = 0; y < tile.height; ++y) {
    let srcOffset = srcRowOffset;
    let dstOffset = dstRowOffset;

    for (let x = 0; x < tile.width; ++x) {
      let i = src[srcOffset ^ rowSwizzle];

      dst[dstOffset + 0] = i;
      dst[dstOffset + 1] = i;
      dst[dstOffset + 2] = i;
      dst[dstOffset + 3] = i;

      srcOffset += 1;
      dstOffset += 4;
    }
    srcRowOffset += srcRowStride;
    dstRowOffset += dstRowStride;

    rowSwizzle ^= 0x4; // Alternate lines are word-swapped
  }
}

/**
 * Converts N64 I4 texels to the native RGBA format.
 * @param {!ImageData} dstData
 * @param {!Uint8Array} src
 * @param {!Tile} tile
 */
function convertI4(dstData, src, tile) {
  let dst = dstData.data;
  let dstRowStride = dstData.width * 4; // Might not be the same as width, due to power of 2
  let dstRowOffset = 0;

  let srcRowStride = tile.line << 3;
  let srcRowOffset = tile.tmem << 3;

  let rowSwizzle = 0;

  for (let y = 0; y < tile.height; ++y) {
    let srcOffset = srcRowOffset;
    let dstOffset = dstRowOffset;

    // Process 2 pixels at a time
    for (let x = 0; x + 1 < tile.width; x += 2) {
      let srcPixel = src[srcOffset ^ rowSwizzle];
      let i0 = kFourToEight[(srcPixel & 0xf0) >>> 4];
      let i1 = kFourToEight[(srcPixel & 0x0f) >>> 0];

      dst[dstOffset + 0] = i0;
      dst[dstOffset + 1] = i0;
      dst[dstOffset + 2] = i0;
      dst[dstOffset + 3] = i0;

      dst[dstOffset + 4] = i1;
      dst[dstOffset + 5] = i1;
      dst[dstOffset + 6] = i1;
      dst[dstOffset + 7] = i1;

      srcOffset += 1;
      dstOffset += 8;
    }

    // Handle trailing pixel, if odd width
    if (tile.width & 1) {
      let srcPixel = src[srcOffset ^ rowSwizzle];
      let i0 = kFourToEight[(srcPixel & 0xf0) >>> 4];

      dst[dstOffset + 0] = i0;
      dst[dstOffset + 1] = i0;
      dst[dstOffset + 2] = i0;
      dst[dstOffset + 3] = i0;

      srcOffset += 1;
      dstOffset += 4;
    }

    srcRowOffset += srcRowStride;
    dstRowOffset += dstRowStride;

    rowSwizzle ^= 0x4; // Alternate lines are word-swapped
  }
}

/**
 * Converts N64 CI8 texels to the native RGBA format.
 * @param {!ImageData} dstData
 * @param {!Uint8Array} src
 * @param {!Tile} tile
 * @param {number} palAddress Palette address in src.
 * @param {function(number): number} palConv Palette conversion function.
 */
function convertCI8(dstData, src, tile, palAddress, palConv) {
  let dst = dstData.data;
  let dstRowStride = dstData.width * 4; // Might not be the same as width, due to power of 2
  let dstRowOffset = 0;

  let srcRowStride = tile.line << 3;
  let srcRowOffset = tile.tmem << 3;

  let palOffset = palAddress << 3;
  let pal = new Uint32Array(256);

  for (let i = 0; i < 256; ++i) {
    let srcPixel = (src[palOffset + i * 2 + 0] << 8) | src[palOffset + i * 2 + 1];
    pal[i] = palConv(srcPixel);
  }

  let rowSwizzle = 0;
  for (let y = 0; y < tile.height; ++y) {
    let srcOffset = srcRowOffset;
    let dstOffset = dstRowOffset;

    for (let x = 0; x < tile.width; ++x) {
      let srcPixel = pal[src[srcOffset ^ rowSwizzle]];

      dst[dstOffset + 0] = (srcPixel >> 24) & 0xff;
      dst[dstOffset + 1] = (srcPixel >> 16) & 0xff;
      dst[dstOffset + 2] = (srcPixel >> 8) & 0xff;
      dst[dstOffset + 3] = srcPixel & 0xff;

      srcOffset += 1;
      dstOffset += 4;
    }
    srcRowOffset += srcRowStride;
    dstRowOffset += dstRowStride;

    rowSwizzle ^= 0x4; // Alternate lines are word-swapped
  }
}

/**
 * Converts N64 CI4 texels to the native RGBA format.
 * @param {!ImageData} dstData
 * @param {!Uint8Array} src
 * @param {!Tile} tile
 * @param {number} palAddress Palette address in src.
 * @param {function(number): number} palConv Palette conversion function.
 */
function convertCI4(dstData, src, tile, palAddress, palConv) {
  let dst = dstData.data;
  let dstRowStride = dstData.width * 4; // Might not be the same as width, due to power of 2
  let dstRowOffset = 0;

  let srcRowStride = tile.line << 3;
  let srcRowOffset = tile.tmem << 3;

  let palOffset = palAddress << 3;
  let pal = new Uint32Array(16);

  for (let i = 0; i < 16; ++i) {
    let srcPixel = (src[palOffset + i * 2 + 0] << 8) | src[palOffset + i * 2 + 1];
    pal[i] = palConv(srcPixel);
  }

  let rowSwizzle = 0;

  for (let y = 0; y < tile.height; ++y) {
    let srcOffset = srcRowOffset;
    let dstOffset = dstRowOffset;

    // Process 2 pixels at a time
    for (let x = 0; x + 1 < tile.width; x += 2) {
      let srcPixel = src[srcOffset ^ rowSwizzle];
      let c0 = pal[(srcPixel & 0xf0) >>> 4];
      let c1 = pal[(srcPixel & 0x0f) >>> 0];

      dst[dstOffset + 0] = (c0 >> 24) & 0xff;
      dst[dstOffset + 1] = (c0 >> 16) & 0xff;
      dst[dstOffset + 2] = (c0 >> 8) & 0xff;
      dst[dstOffset + 3] = c0 & 0xff;

      dst[dstOffset + 4] = (c1 >> 24) & 0xff;
      dst[dstOffset + 5] = (c1 >> 16) & 0xff;
      dst[dstOffset + 6] = (c1 >> 8) & 0xff;
      dst[dstOffset + 7] = c1 & 0xff;

      srcOffset += 1;
      dstOffset += 8;
    }

    // Handle trailing pixel, if odd width
    if (tile.width & 1) {
      let srcPixel = src[srcOffset ^ rowSwizzle];
      let c0 = pal[(srcPixel & 0xf0) >>> 4];

      dst[dstOffset + 0] = (c0 >> 24) & 0xff;
      dst[dstOffset + 1] = (c0 >> 16) & 0xff;
      dst[dstOffset + 2] = (c0 >> 8) & 0xff;
      dst[dstOffset + 3] = c0 & 0xff;

      srcOffset += 1;
      dstOffset += 4;
    }

    srcRowOffset += srcRowStride;
    dstRowOffset += dstRowStride;

    rowSwizzle ^= 0x4; // Alternate lines are word-swapped
  }
}

/**
 * Converts N64 texels to the native RGBA format.
 * @param {!ImageData} dstData
 * @param {!Uint8Array} tmem
 * @param {!Tile} tile
 */
function convertTexels(dstData, tmem, tile, tlutFormat) {
  // NB: assume RGBA16 for G_TT_NONE
  var convFn = (tlutFormat === TextureLUT.G_TT_IA16) ?
                convertIA16Pixel : convertRGBA16Pixel;

  switch (tile.format) {
    case ImageFormat.G_IM_FMT_RGBA:
      switch (tile.size) {
        case ImageSize.G_IM_SIZ_32b:
          convertRGBA32(dstData, tmem, tile);
          return true;
        case ImageSize.G_IM_SIZ_16b:
          convertRGBA16(dstData, tmem, tile);
          return true;

          // Hack - Extreme-G specifies RGBA/8 RGBA/4 textures, but they're
          // really CI
        case ImageSize.G_IM_SIZ_8b:
          convertCI8(dstData, tmem, tile, 0x100, convFn);
          return true;
        case ImageSize.G_IM_SIZ_4b:
          convertCI4(dstData, tmem, tile, 0x100 + ((tile.palette * 16 * 2) >>> 3), convFn);
          return true;
      }
      break;

    case ImageFormat.G_IM_FMT_IA:
      switch (tile.size) {
        case ImageSize.G_IM_SIZ_16b:
          convertIA16(dstData, tmem, tile);
          return true;
        case ImageSize.G_IM_SIZ_8b:
          convertIA8(dstData, tmem, tile);
          return true;
        case ImageSize.G_IM_SIZ_4b:
          convertIA4(dstData, tmem, tile);
          return true;
      }
      break;

    case ImageFormat.G_IM_FMT_I:
      switch (tile.size) {
        case ImageSize.G_IM_SIZ_8b:
          convertI8(dstData, tmem, tile);
          return true;
        case ImageSize.G_IM_SIZ_4b:
          convertI4(dstData, tmem, tile);
          return true;
      }
      break;

    case ImageFormat.G_IM_FMT_CI:
      switch (tile.size) {
        case ImageSize.G_IM_SIZ_8b:
          convertCI8(dstData, tmem, tile, 0x100, convFn);
          return true;
        case ImageSize.G_IM_SIZ_4b:
          convertCI4(dstData, tmem, tile, 0x100 + ((tile.palette * 16 * 2) >>> 3), convFn);
          return true;
      }
      break;
  }

  return false;
}

/**
 * Whether to log shaders as they're compiled.
 */
const kLogShaders = false;

/**
 * A cache of compiled shaders. The key is generated by stringifying all the
 * state that affects how the shader is generated and concatenating it together.
 * @type {!Map<string, !N64Shader>}
 */
let shaderCache = new Map();

/**
 * The source of the fragment shader to use. We patch in the instructions that
 * we need to emulate the N64 render mode we're emulating.
 * @type {?string}
 */
let fragmentSource = null;

/**
 * The generic vertex shader to use. All N64 shaders use the same vertex shader.
 * @type {?WebGLShader}
 */
let genericVertexShader = null;

const rgbParams32 = [
  'combined.rgb', 'tex0.rgb',
  'tex1.rgb',     'prim.rgb',
  'shade.rgb',    'env.rgb',
  'one.rgb',      'combined.a',
  'tex0.a',       'tex1.a',
  'prim.a',       'shade.a',
  'env.a',        'lod_frac',
  'prim_lod_frac','k5',
  '?           ', '?           ',
  '?           ', '?           ',
  '?           ', '?           ',
  '?           ', '?           ',
  '?           ', '?           ',
  '?           ', '?           ',
  '?           ', '?           ',
  '?           ', 'zero.rgb'
];

const rgbParams16 = [
  'combined.rgb', 'tex0.rgb',
  'tex1.rgb',     'prim.rgb',
  'shade.rgb',    'env.rgb',
  'one.rgb',      'combined.a',
  'tex0.a',       'tex1.a',
  'prim.a',       'shade.a',
  'env.a',        'lod_frac',
  'prim_lod_frac', 'zero.rgb'
];

const rgbParams8 = [
  'combined.rgb', 'tex0.rgb',
  'tex1.rgb',     'prim.rgb',
  'shade.rgb',    'env.rgb',
  'one.rgb',      'zero.rgb'
];

const alphaParams8 = [
  'combined.a', 'tex0.a',
  'tex1.a',     'prim.a',
  'shade.a',    'env.a',
  'one.a',      'zero.a'
];

const kMulInputRGB = [
  'Combined    ', 'Texel0      ',
  'Texel1      ', 'Primitive   ',
  'Shade       ', 'Env         ',
  'KeyScale    ', 'CombinedAlph',
  'Texel0_Alpha', 'Texel1_Alpha',
  'Prim_Alpha  ', 'Shade_Alpha ',
  'Env_Alpha   ', 'LOD_Frac    ',
  'PrimLODFrac ', 'K5          ',
  '0           ', '0           ',
  '0           ', '0           ',
  '0           ', '0           ',
  '0           ', '0           ',
  '0           ', '0           ',
  '0           ', '0           ',
  '0           ', '0           ',
  '0           ', '0           '
];

const kSubAInputRGB = [
  'Combined    ', 'Texel0      ',
  'Texel1      ', 'Primitive   ',
  'Shade       ', 'Env         ',
  '1           ', 'Noise       ',
  '0           ', '0           ',
  '0           ', '0           ',
  '0           ', '0           ',
  '0           ', '0           '
];

const kSubBInputRGB = [
  'Combined    ', 'Texel0      ',
  'Texel1      ', 'Primitive   ',
  'Shade       ', 'Env         ',
  'KeyCenter   ', 'K4          ',
  '0           ', '0           ',
  '0           ', '0           ',
  '0           ', '0           ',
  '0           ', '0           '
];

const kAddInputRGB = [
  'Combined    ', 'Texel0      ',
  'Texel1      ', 'Primitive   ',
  'Shade       ', 'Env         ',
  '1           ', '0           '
];

const kSubInputA = [
  'Combined    ', 'Texel0      ',
  'Texel1      ', 'Primitive   ',
  'Shade       ', 'Env         ',
  'PrimLODFrac ', '0           '
];

const kMulInputA = [
  'Combined    ', 'Texel0      ',
  'Texel1      ', 'Primitive   ',
  'Shade       ', 'Env         ',
  '1           ', '0           '
];

const kAddInputA = [
  'Combined    ', 'Texel0      ',
  'Texel1      ', 'Primitive   ',
  'Shade       ', 'Env         ',
  '1           ', '0           '
];

/**
 * Creates a shader program using the named script elements.
 * @param {!WebGLRenderingContext} gl The rendering context to use.
 * @param {string} vs_name The name of the vertex shader element.
 * @param {string} fs_name The name of the fragment shader element.
 * @return {!WebGLProgram}
 */
function createShaderProgram(gl, vs_name, fs_name) {
  let vertexShader   = getShader(gl, vs_name);
  let fragmentShader = getShader(gl, fs_name);

  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  return program;
}

/**
 * Compiles and returns the shader contained in the named script element.
 * @param {string} id The name of the script element containing the shader.
 * @return {?WebGLShader}
 */
function getShader(gl, id) {
  let script = document.getElementById(id);
  if (!script) {
    return null;
  }
  let source = getScriptNodeSource(script);

  let type;
  if (script.type === 'x-shader/x-fragment') {
    type = gl.FRAGMENT_SHADER;
  } else if (script.type === 'x-shader/x-vertex') {
    type = gl.VERTEX_SHADER;
  } else {
     return null;
  }

  return createShader(gl, source, type);
}

/**
 * Returns the source of a shader script element.
 * @param {!Element} shaderScript The shader script element.
 * @return {string}
 */
function getScriptNodeSource(shaderScript) {
  let source = '';

  let currentChild = shaderScript.firstChild;
  while(currentChild) {
    if (currentChild.nodeType == Node.TEXT_NODE) {
      source += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  return source;
}

/**
 * Creates a WebGL shader.
 * @param {!WebGLRenderingContext} gl The rendering context to use.
 * @param {string} source The shader source.
 * @param {number} type gl.FRAGMENT_SHADER or gl.VERTEX_SHADER
 * @return {?WebGLShader}
 */
function createShader(gl, source, type) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

class N64Shader {
  /**
   * Constructs an N64Shader.
   * @param {!WebGLRenderingContext} gl The rendering context to use.
   * @param {!WebGLProgram} program The program to use.
   */
  constructor(gl, program) {
    this.program = program;

    this.vertexPositionAttribute = gl.getAttribLocation(program,  "aVertexPosition");
    this.vertexColorAttribute    = gl.getAttribLocation(program,  "aVertexColor");
    this.texCoordAttribute       = gl.getAttribLocation(program,  "aTextureCoord");

    this.uSamplerUniform         = gl.getUniformLocation(program, "uSampler");
    this.uPrimColorUniform       = gl.getUniformLocation(program, "uPrimColor");
    this.uEnvColorUniform        = gl.getUniformLocation(program, "uEnvColor");
    this.uTexScaleUniform        = gl.getUniformLocation(program, "uTexScale");
    this.uTexOffsetUniform       = gl.getUniformLocation(program, "uTexOffset");
  }
}

/**
 * Gets or creates a shader given the N64 state.
 * @param {!WebGLRenderingContext} gl The webgl context.
 * @param {number} mux0
 * @param {number} mux1
 * @param {number} cycleType A CycleType value.
 * @param {number} alphaThreshold The current alpha threshold.
 * @return {!N64Shader}
 */
function getOrCreateN64Shader(gl, mux0, mux1, cycleType, alphaThreshold) {
  // Check if this shader already exists. Copy/Fill are fixed-function so ignore mux for these.
  let stateText = (cycleType < CycleType.G_CYC_COPY) ? (mux0.toString(16) + mux1.toString(16) + '_' + cycleType) : cycleType.toString();
  if (alphaThreshold >= 0.0) {
    stateText += alphaThreshold;
  }

  let shader = shaderCache.get(stateText);
  if (shader) {
    return shader;
  }

  if (!genericVertexShader) {
    genericVertexShader = getShader(gl, 'n64-shader-vs');
  }

  if (!fragmentSource) {
    let fragmentScript = document.getElementById('n64-shader-fs');
    if (fragmentScript) {
      fragmentSource = getScriptNodeSource(fragmentScript);
    }
  }

  let aRGB0 = (mux0 >>> 20) & 0x0F;
  let bRGB0 = (mux1 >>> 28) & 0x0F;
  let cRGB0 = (mux0 >>> 15) & 0x1F;
  let dRGB0 = (mux1 >>> 15) & 0x07;

  let aA0   = (mux0 >>> 12) & 0x07;
  let bA0   = (mux1 >>> 12) & 0x07;
  let cA0   = (mux0 >>>  9) & 0x07;
  let dA0   = (mux1 >>>  9) & 0x07;

  let aRGB1 = (mux0 >>>  5) & 0x0F;
  let bRGB1 = (mux1 >>> 24) & 0x0F;
  let cRGB1 = (mux0 >>>  0) & 0x1F;
  let dRGB1 = (mux1 >>>  6) & 0x07;

  let aA1   = (mux1 >>> 21) & 0x07;
  let bA1   = (mux1 >>>  3) & 0x07;
  let cA1   = (mux1 >>> 18) & 0x07;
  let dA1   = (mux1 >>>  0) & 0x07;

  // Generate the instructions for this mode.
  let body;
  if (cycleType === CycleType.G_CYC_FILL) {
    body = 'col = shade;\n';
  } else if (cycleType === CycleType.G_CYC_COPY) {
    body = 'col = tex0;\n';
  } else if (cycleType === CycleType.G_CYC_1CYCLE) {
    body= '';
    body += 'col.rgb = (' + rgbParams16 [aRGB0] + ' - ' + rgbParams16 [bRGB0] + ') * ' + rgbParams32 [cRGB0] + ' + ' + rgbParams8  [dRGB0] + ';\n';
    body += 'col.a = ('   + alphaParams8[  aA0] + ' - ' + alphaParams8[  bA0] + ') * ' + alphaParams8[  cA0] + ' + ' + alphaParams8[  dA0] + ';\n';
  } else {
    body= '';
    body += 'col.rgb = (' + rgbParams16 [aRGB0] + ' - ' + rgbParams16 [bRGB0] + ') * ' + rgbParams32 [cRGB0] + ' + ' + rgbParams8  [dRGB0] + ';\n';
    body += 'col.a = ('   + alphaParams8[  aA0] + ' - ' + alphaParams8[  bA0] + ') * ' + alphaParams8[  cA0] + ' + ' + alphaParams8[  dA0] + ';\n';
    body += 'combined = vec4(col.rgb, col.a);\n';
    body += 'col.rgb = (' + rgbParams16 [aRGB1] + ' - ' + rgbParams16 [bRGB1] + ') * ' + rgbParams32 [cRGB1] + ' + ' + rgbParams8  [dRGB1] + ';\n';
    body += 'col.a = ('   + alphaParams8[  aA1] + ' - ' + alphaParams8[  bA1] + ') * ' + alphaParams8[  cA1] + ' + ' + alphaParams8[  dA1] + ';\n';
  }

  if (alphaThreshold >= 0.0) {
    body += 'if(col.a < ' + alphaThreshold.toFixed(3) + ') discard;\n';
  }

  let shaderSource = fragmentSource.replace('{{body}}', body);

  if (kLogShaders) {
    let decoded = '\n';
    decoded += '\tRGB0 = (' + kSubAInputRGB[aRGB0] + ' - ' + kSubBInputRGB[bRGB0] + ') * ' + kMulInputRGB[cRGB0] + ' + ' + kAddInputRGB[dRGB0] + '\n';
    decoded += '\t  A0 = (' + kSubInputA   [  aA0] + ' - ' + kSubInputA   [  bA0] + ') * ' + kMulInputA  [  cA0] + ' + ' + kAddInputA  [  dA0] + '\n';
    decoded += '\tRGB1 = (' + kSubAInputRGB[aRGB1] + ' - ' + kSubBInputRGB[bRGB1] + ') * ' + kMulInputRGB[cRGB1] + ' + ' + kAddInputRGB[dRGB1] + '\n';
    decoded += '\t  A1 = (' + kSubInputA   [  aA1] + ' - ' + kSubInputA   [  bA1] + ') * ' + kMulInputA  [  cA1] + ' + ' + kAddInputA  [  dA1] + '\n';

    let m = shaderSource.split('\n').join('<br>');
    log('Compiled ' + decoded + '\nto\n' + m);
  }

  let fragmentShader = createShader(gl, shaderSource, gl.FRAGMENT_SHADER);

  let glProgram = gl.createProgram();
  gl.attachShader(glProgram, genericVertexShader);
  gl.attachShader(glProgram, fragmentShader);
  gl.linkProgram(glProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program.');
  }

  shader = new N64Shader(gl, glProgram);
  shaderCache.set(stateText, shader);
  return shader;
}

/**
 * Returns text that describes the specified combiner mode.
 * @param {number} mux0
 * @param {number} mux1
 * @return {string}
 */
function getCombinerText(mux0, mux1) {
  let aRGB0 = (mux0 >>> 20) & 0x0F;
  let bRGB0 = (mux1 >>> 28) & 0x0F;
  let cRGB0 = (mux0 >>> 15) & 0x1F;
  let dRGB0 = (mux1 >>> 15) & 0x07;

  let aA0   = (mux0 >>> 12) & 0x07;
  let bA0   = (mux1 >>> 12) & 0x07;
  let cA0   = (mux0 >>>  9) & 0x07;
  let dA0   = (mux1 >>>  9) & 0x07;

  let aRGB1 = (mux0 >>>  5) & 0x0F;
  let bRGB1 = (mux1 >>> 24) & 0x0F;
  let cRGB1 = (mux0 >>>  0) & 0x1F;
  let dRGB1 = (mux1 >>>  6) & 0x07;

  let aA1   = (mux1 >>> 21) & 0x07;
  let bA1   = (mux1 >>>  3) & 0x07;
  let cA1   = (mux1 >>> 18) & 0x07;
  let dA1   = (mux1 >>>  0) & 0x07;

  let decoded = '';

  decoded += 'RGB0 = (' + kSubAInputRGB[aRGB0] + ' - ' + kSubBInputRGB[bRGB0] + ') * ' + kMulInputRGB[cRGB0] + ' + ' + kAddInputRGB[dRGB0] + '\n';
  decoded += '  A0 = (' + kSubInputA   [  aA0] + ' - ' + kSubInputA   [  bA0] + ') * ' + kMulInputA  [  cA0] + ' + ' + kAddInputA  [  dA0] + '\n';
  decoded += 'RGB1 = (' + kSubAInputRGB[aRGB1] + ' - ' + kSubBInputRGB[bRGB1] + ') * ' + kMulInputRGB[cRGB1] + ' + ' + kAddInputRGB[dRGB1] + '\n';
  decoded += '  A1 = (' + kSubInputA   [  aA1] + ' - ' + kSubInputA   [  bA1] + ') * ' + kMulInputA  [  cA1] + ' + ' + kAddInputA  [  dA1] + '\n';

  return decoded;
}

class Texture {
  constructor(gl, left, top, width, height) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;

    var nativeWidth = nextPow2(width);
    var nativeHeight = nextPow2(height);

    this.nativeWidth = nativeWidth;
    this.nativeHeight = nativeHeight;

    // Create a canvas element to poke data into.
    this.$canvas = $('<canvas width="' + nativeWidth +
                     '" height="' + nativeHeight + '" />',
                     { 'width': nativeWidth, 'height': nativeHeight });
    this.texture = gl.createTexture();
  }

  /**
   * Creates a canvas with a scaled copy of the texture.
   * @param {number} scale
   * @return {!jQuery}
   */
  createScaledCanvas(scale) {
    var w = this.width * scale;
    var h = this.height * scale;
    var $canvas = $('<canvas width="' + w +
                    '" height="' + h +
                    '" style="background-color: black" />',
                    { 'width': w, 'height': h });
    var srcCtx = this.$canvas[0].getContext('2d');
    var dstCtx = $canvas[0].getContext('2d');

    var srcImgData = srcCtx.getImageData(0, 0, this.width, this.height);
    var dstImgData = dstCtx.createImageData(w, h);

    var src = srcImgData.data;
    var dst = dstImgData.data;
    var srcRowStride = srcImgData.width * 4;
    var dstRowStride = dstImgData.width * 4;

    for (let y = 0; y < h; ++y) {
      var srcOffset = srcRowStride * Math.floor(y / scale);
      var dstOffset = dstRowStride * y;

      for (let x = 0; x < w; ++x) {
        var o = srcOffset + Math.floor(x / scale) * 4;
        dst[dstOffset + 0] = src[o + 0];
        dst[dstOffset + 1] = src[o + 1];
        dst[dstOffset + 2] = src[o + 2];
        dst[dstOffset + 3] = src[o + 3];
        dstOffset += 4;
      }
    }

    dstCtx.putImageData(dstImgData, 0, 0);
    return $canvas;
  }
}

function clampTexture(imgData, width, height) {
  let dst = imgData.data;
  // Might not be the same as width, due to power of 2.
  let dstRowStride = imgData.width * 4;

  let y = 0;
  if (width < imgData.width) {
    let dstRowOffset = 0;
    for (; y < height; ++y) {
      let dstOffset = dstRowOffset + ((width - 1) * 4);

      let r = dst[dstOffset + 0];
      let g = dst[dstOffset + 1];
      let b = dst[dstOffset + 2];
      let a = dst[dstOffset + 3];

      dstOffset += 4;

      for (let x = width; x < imgData.width; ++x) {
        dst[dstOffset + 0] = r;
        dst[dstOffset + 1] = g;
        dst[dstOffset + 2] = b;
        dst[dstOffset + 3] = a;
        dstOffset += 4;
      }
      dstRowOffset += dstRowStride;
    }
  }

  if (height < imgData.height) {
    // Repeat the final line
    let dstRowOffset = dstRowStride * height;
    let lastRowOffset = dstRowOffset - dstRowStride;

    for (; y < imgData.height; ++y) {
      for (let i = 0; i < dstRowStride; ++i) {
        dst[dstRowOffset + i] = dst[lastRowOffset + i];
      }
      dstRowOffset += dstRowStride;
    }
  }
}

function nextPow2(x) {
  var y = 1;
  while (y < x) {
    y *= 2;
  }

  return y;
}

/*jshint jquery:true browser:true */

(function(n64js) {
  'use strict';
  var graphics_task_count = 0;
  var texrected = 1;

  var $textureOutput = $('#texture-content');

  var $dlistContent = $('#dlist-content');

  // Initialised in initialiseRenderer
  var $dlistOutput;
  var $dlistState;
  var $dlistScrub;

  var debugDisplayListRequested = false;
  var debugDisplayListRunning = false;
  var debugNumOps = 0;
  var debugBailAfter = -1;
  // The last task that we executed.
  var debugLastTask;
  var debugStateTimeShown = -1;

  // This is updated as we're executing, so that we know which instruction to halt on.
  var debugCurrentOp = 0;

  var textureCache;

  var gl = null;

  var frameBuffer;
  // For roms using display lists
  var frameBufferTexture3D;
  // For roms writing directly to the frame buffer
  var frameBufferTexture2D;

  // n64's display resolution
  var viWidth = 320;
  var viHeight = 240;

  // canvas dimension
  var canvasWidth = 640;
  var canvasHeight = 480;

  const kOffset_type             = 0x00; // u32
  const kOffset_flags            = 0x04; // u32
  const kOffset_ucode_boot       = 0x08; // u64*
  const kOffset_ucode_boot_size  = 0x0c; // u32
  const kOffset_ucode            = 0x10; // u64*
  const kOffset_ucode_size       = 0x14; // u32
  const kOffset_ucode_data       = 0x18; // u64*
  const kOffset_ucode_data_size  = 0x1c; // u32
  const kOffset_dram_stack       = 0x20; // u64*
  const kOffset_dram_stack_size  = 0x24; // u32
  const kOffset_output_buff      = 0x28; // u64*
  const kOffset_output_buff_size = 0x2c; // u64*
  const kOffset_data_ptr         = 0x30; // u64*
  const kOffset_data_size        = 0x34; // u32
  const kOffset_yield_data_ptr   = 0x38; // u64*
  const kOffset_yield_data_size  = 0x3c; // u32

  function updateGeometryModeFromBits(flags) {
    var gm = state.geometryMode;
    var bits = state.geometryModeBits;

    gm.zbuffer          = (bits & flags.G_ZBUFFER) ? 1 : 0;
    gm.texture          = (bits & flags.G_TEXTURE_ENABLE) ? 1 : 0;
    gm.shade            = (bits & flags.G_SHADE) ? 1 : 0;
    gm.shadeSmooth      = (bits & flags.G_SHADING_SMOOTH) ? 1 : 0;
    gm.cullFront        = (bits & flags.G_CULL_FRONT) ? 1 : 0;
    gm.cullBack         = (bits & flags.G_CULL_BACK) ? 1 : 0;
    gm.fog              = (bits & flags.G_FOG) ? 1 : 0;
    gm.lighting         = (bits & flags.G_LIGHTING) ? 1 : 0;
    gm.textureGen       = (bits & flags.G_TEXTURE_GEN) ? 1 : 0;
    gm.textureGenLinear = (bits & flags.G_TEXTURE_GEN_LINEAR) ? 1 : 0;
    gm.lod              = (bits & flags.G_LOD) ? 1 : 0;
  }

  //
  const kUCode_GBI0 = 0;
  const kUCode_GBI1 = 1;
  const kUCode_GBI2 = 2;

  const kUCode_GBI0_WR = 5;
  const kUCode_GBI0_GE = 9;

  const kUcodeStrides = [
    10, // Super Mario 64, Tetrisphere, Demos
    2, // Mario Kart, Star Fox
    2, // Zelda, and newer games
    2, // Yoshi's Story, Pokemon Puzzle League
    2, // Neon Evangelion, Kirby
    5, // Wave Racer USA
    10, // Diddy Kong Racing, Gemini, and Mickey
    2, // Last Legion, Toukon, Toukon 2
    5, // Shadows of the Empire (SOTE)
    10, // Golden Eye
    2, // Conker BFD
    10, // Perfect Dark
  ];

  // Configured:
  var config = {
    vertexStride: 10
  };

  var tmemBuffer = new ArrayBuffer(4096);

  var ram_u8;
  var ram_s32;
  var ram_dv;

  var state = {
    pc: 0,
    dlistStack: [],
    segments: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    tiles: new Array(8),
    lights: new Array(8),
    numLights: 0,
    geometryModeBits: 0, // raw geometry mode, GBI specific
    geometryMode: { // unpacked geometry mode
      zbuffer: 0,
      texture: 0,
      shade: 0,
      shadeSmooth: 0,
      cullFront: 0,
      cullBack: 0,
      fog: 0,
      lighting: 0,
      textureGen: 0,
      textureGenLinear: 0,
      lod: 0
    },
    rdpOtherModeL: 0,
    rdpOtherModeH: 0,

    rdpHalf1: 0,
    rdpHalf2: 0,

    viewport: {
      scale: [160.0, 120.0],
      trans: [160.0, 120.0]
    },

    // matrix stacks
    projection: [],
    modelview: [],

    /**
     * @type {!Array<!ProjectedVertex>}
     */
    projectedVertices: new Array(64),

    scissor: {
      mode: 0,
      x0: 0,
      y0: 0,
      x1: viWidth,
      y1: viHeight
    },

    texture: {
      tile: 0,
      level: 0,
      scaleS: 1.0,
      scaleT: 1.0
    },

    combine: {
      lo: 0,
      hi: 0
    },

    fillColor: 0,
    envColor: 0,
    primColor: 0,
    blendColor: 0,
    fogColor: 0,

    primDepth: 0.0,

    colorImage: {
      format: 0,
      size: 0,
      width: 0,
      address: 0
    },

    textureImage: {
      format: 0,
      size: 0,
      width: 0,
      address: 0
    },

    depthImage: {
      address: 0
    },

    tmemData32: new Int32Array(tmemBuffer),
    tmemData: new Uint8Array(tmemBuffer),

    screenContext2d: null // canvas context
  };

  var n64ToCanvasScale = [1.0, 1.0];
  var n64ToCanvasTranslate = [0.0, 0.0];

  var canvas2dMatrix = Matrix.makeOrtho(0, canvasWidth, canvasHeight, 0, 0, 1);

  function hleHalt(msg) {
    if (!debugDisplayListRunning) {
      n64js.displayWarning(msg);

      // Ensure the CPU emulation stops immediately
      n64js.breakEmulationForDisplayListDebug();

      // Ensure the ui is visible
      showDebugDisplayListUI();

      // We're already executing a display list, so clear the Requested flag, set Running
      debugDisplayListRequested = false;
      debugDisplayListRunning = true;

      // End set up the context
      debugBailAfter = debugCurrentOp;
      debugStateTimeShown = -1;
    }
  }

  const kMaxTris = 64;
  var triangleBuffer = new TriangleBuffer(kMaxTris);

  function convertN64ToCanvas(n64_coords) {
    return [
      Math.round(Math.round(n64_coords[0]) * n64ToCanvasScale[0] + n64ToCanvasTranslate[0]),
      Math.round(Math.round(n64_coords[1]) * n64ToCanvasScale[1] + n64ToCanvasTranslate[1]),
    ];
  }

  function convertN64ToDisplay(n64_coords) {
    var canvas = convertN64ToCanvas(n64_coords);
    return [
      canvas[0] * canvas2dMatrix.elems[0] + canvas2dMatrix.elems[12],
      canvas[1] * canvas2dMatrix.elems[5] + canvas2dMatrix.elems[13],
    ];
  }

  function setCanvasViewport(w, h) {
    canvasWidth = w;
    canvasHeight = h;

    n64ToCanvasScale = [w / viWidth, h / viHeight];
    n64ToCanvasTranslate = [0, 0];

    updateViewport();
  }

  function setN64Viewport(scale, trans) {
    //logger.log('Viewport: scale=' + scale[0] + ',' + scale[1] + ' trans=' + trans[0] + ',' + trans[1] );

    if (scale[0] === state.viewport.scale[0] &&
      scale[1] === state.viewport.scale[1] &&
      trans[0] === state.viewport.trans[0] &&
      trans[1] === state.viewport.trans[1]) {
      return;
    }

    state.viewport.scale = scale;
    state.viewport.trans = trans;
    updateViewport();
  }

  function updateViewport() {
    var n64_min = [
      state.viewport.trans[0] - state.viewport.scale[0],
      state.viewport.trans[1] - state.viewport.scale[1],
    ];
    var n64_max = [
      state.viewport.trans[0] + state.viewport.scale[0],
      state.viewport.trans[1] + state.viewport.scale[1],
    ];

    var canvasMin = convertN64ToCanvas(n64_min);
    var canvasMax = convertN64ToCanvas(n64_max);

    var vp_x = canvasMin[0];
    var vp_y = canvasMin[1];
    var vp_width = canvasMax[0] - canvasMin[0];
    var vp_height = canvasMax[1] - canvasMin[1];

    canvas2dMatrix = Matrix.makeOrtho(canvasMin[0], canvasMax[0], canvasMax[1], canvasMin[1], 0, 1);

    gl.viewport(vp_x, vp_y, vp_width, vp_height);
  }

  function loadMatrix(address) {
    const recip = 1.0 / 65536.0;
    var dv = new DataView(ram_dv.buffer, address);

    var elements = new Float32Array(16);
    for (var i = 0; i < 4; ++i) {
      elements[4 * 0 + i] = (dv.getInt16(i * 8 + 0) << 16 | dv.getUint16(i * 8 + 0 + 32)) * recip;
      elements[4 * 1 + i] = (dv.getInt16(i * 8 + 2) << 16 | dv.getUint16(i * 8 + 2 + 32)) * recip;
      elements[4 * 2 + i] = (dv.getInt16(i * 8 + 4) << 16 | dv.getUint16(i * 8 + 4 + 32)) * recip;
      elements[4 * 3 + i] = (dv.getInt16(i * 8 + 6) << 16 | dv.getUint16(i * 8 + 6 + 32)) * recip;
    }

    return new Matrix(elements);
  }

  function previewViewport(address) {
    var result = '';
    result += 'scale = (' +
        ram_dv.getInt16(address + 0) / 4.0 + ', ' +
        ram_dv.getInt16(address + 2) / 4.0 + ') ';
    result += 'trans = (' +
        ram_dv.getInt16(address + 8) / 4.0 + ', ' +
        ram_dv.getInt16(address + 10) / 4.0 + ') ';
    return result;
  }

  function moveMemViewport(address) {
    var scale = new Array(2);
    var trans = new Array(2);
    scale[0] = ram_dv.getInt16(address + 0) / 4.0;
    scale[1] = ram_dv.getInt16(address + 2) / 4.0;

    trans[0] = ram_dv.getInt16(address + 8) / 4.0;
    trans[1] = ram_dv.getInt16(address + 10) / 4.0;
    setN64Viewport(scale, trans);
  }

  function previewLight(address) {
    var result = '';
    result += 'color = ' + toHex(ram_dv.getUint32(address + 0), 32) + ' ';
    var dir = Vector3.create([
      ram_dv.getInt8(address + 8),
      ram_dv.getInt8(address + 9),
      ram_dv.getInt8(address + 10)
    ]).normaliseInPlace();
    result += 'norm = (' + dir.elems[0] + ', ' + dir.elems[1] + ', ' + dir.elems[2] + ')';
    return result;
  }

  function moveMemLight(light_idx, address) {
    state.lights[light_idx].color = unpackRGBAToColor(ram_dv.getUint32(address + 0));
    state.lights[light_idx].dir = Vector3.create([
      ram_dv.getInt8(address + 8),
      ram_dv.getInt8(address + 9),
      ram_dv.getInt8(address + 10)
    ]).normaliseInPlace();
  }

  function rdpSegmentAddress(addr) {
    var segment = (addr >>> 24) & 0xf;
    return (state.segments[segment] & 0x00ffffff) + (addr & 0x00ffffff);
  }

  function makeRGBFromRGBA16(col) {
    return {
      'r': ((col >>> 11) & 0x1f) / 31.0,
      'g': ((col >>> 6) & 0x1f) / 31.0,
      'b': ((col >>> 1) & 0x1f) / 31.0,
    };
  }

  function makeRGBFromRGBA32(col) {
    return {
      'r': ((col >>> 24) & 0xff) / 255.0,
      'g': ((col >>> 16) & 0xff) / 255.0,
      'b': ((col >>> 8) & 0xff) / 255.0,
    };
  }

  function unpackRGBAToColor(col) {
    return {
      'r': ((col >>> 24) & 0xff) / 255.0,
      'g': ((col >>> 16) & 0xff) / 255.0,
      'b': ((col >>> 8) & 0xff) / 255.0,
      'a': ((col >>> 0) & 0xff) / 255.0,
    };
  }

  function makeColourText(r, g, b, a) {
    var rgb = r + ', ' + g + ', ' + b;
    var rgba = rgb + ', ' + a;

    if ((r < 128 && g < 128) ||
        (g < 128 && b < 128) ||
        (b < 128 && r < 128)) {
      return '<span style="color: white; background-color: rgb(' + rgb + ')">' + rgba + '</span>';
    }
    return '<span style="background-color: rgb(' + rgb + ')">' + rgba + '</span>';
  }

  function makeColorTextRGBA(rgba) {
    var r = (rgba >>> 24) & 0xff;
    var g = (rgba >>> 16) & 0xff;
    var b = (rgba >>> 8) & 0xff;
    var a = (rgba) & 0xff;

    return makeColourText(r, g, b, a);
  }

  function makeColorTextABGR(abgr) {
    var r = abgr & 0xff;
    var g = (abgr >>> 8) & 0xff;
    var b = (abgr >>> 16) & 0xff;
    var a = (abgr >>> 24) & 0xff;

    return makeColourText(r, g, b, a);
  }

  const M_GFXTASK = 1;
  const M_AUDTASK = 2;
  const M_VIDTASK = 3;
  const M_JPGTASK = 4;

  /**
   * @constructor
   */
  function RSPTask(task_dv) {
    this.type = task_dv.getUint32(kOffset_type);
    this.code_base = task_dv.getUint32(kOffset_ucode) & 0x1fffffff;
    this.code_size = task_dv.getUint32(kOffset_ucode_size);
    this.data_base = task_dv.getUint32(kOffset_ucode_data) & 0x1fffffff;
    this.data_size = task_dv.getUint32(kOffset_ucode_data_size);
    this.data_ptr = task_dv.getUint32(kOffset_data_ptr);
  }

  RSPTask.prototype.detectVersionString = function() {
    var r = 'R'.charCodeAt(0);
    var s = 'S'.charCodeAt(0);
    var p = 'P'.charCodeAt(0);

    for (var i = 0; i + 2 < this.data_size; ++i) {
      if (ram_u8[this.data_base + i + 0] === r &&
        ram_u8[this.data_base + i + 1] === s &&
        ram_u8[this.data_base + i + 2] === p) {
        var str = '';
        for (var j = i; j < this.data_size; ++j) {
          var c = ram_u8[this.data_base + j];
          if (c === 0)
            return str;

          str += String.fromCharCode(c);
        }
      }
    }
    return '';
  };

  RSPTask.prototype.computeMicrocodeHash = function() {
    var c = 0;
    for (var i = 0; i < this.code_size; ++i) {
      // Best hash ever!
      c = ((c * 17) + ram_u8[this.code_base + i]) >>> 0;
    }
    return c;
  };


  // task_dv is a DataView object
  n64js.rspProcessTask = function(task_dv) {
    var task = new RSPTask(task_dv);

    switch (task.type) {
      case M_GFXTASK:
        ++graphics_task_count;
        hleGraphics(task);
        n64js.interruptDP();
        break;
      case M_AUDTASK:
        //logger.log('audio task');
        break;
      case M_VIDTASK:
        log('video task');
        break;
      case M_JPGTASK:
        log('jpg task');
        break;

      default:
        log('unknown task');
        break;
    }

    n64js.haltSP();
  };

  function unimplemented(cmd0, cmd1) {
    hleHalt('Unimplemented display list op ' + toString8(cmd0 >>> 24));
  }

  function executeUnknown(cmd0, cmd1) {
    hleHalt('Unknown display list op ' + toString8(cmd0 >>> 24));
    state.pc = 0;
  }

  function executeGBI1_SpNoop(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsSPNoOp();');
    }
  }

  function executeGBI1_Noop(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsDPNoOp();');
    }
  }

  function executeRDPLoadSync(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsDPLoadSync();');
    }
  }

  function executeRDPPipeSync(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsDPPipeSync();');
    }
  }

  function executeRDPTileSync(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsDPTileSync();');
    }
  }

  function executeRDPFullSync(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsDPFullSync();');
    }
  }

  function executeGBI1_DL(cmd0, cmd1, dis) {
    var param = ((cmd0 >>> 16) & 0xff);
    var address = rdpSegmentAddress(cmd1);

    if (dis) {
      var fn = (param === G_DL_PUSH) ? 'gsSPDisplayList' : 'gsSPBranchList';
      dis.text(fn + '(<span class="dl-branch">' + toString32(address) + '</span>);');
    }

    if (param === G_DL_PUSH) {
      state.dlistStack.push({ pc: state.pc });
    }
    state.pc = address;
  }

  function executeGBI1_EndDL(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsSPEndDisplayList();');
    }

    if (state.dlistStack.length > 0) {
      state.pc = state.dlistStack.pop().pc;
    } else {
      state.pc = 0;
    }
  }

  function executeGBI1_BranchZ(cmd0, cmd1) {
    var address = rdpSegmentAddress(state.rdpHalf1);
    // FIXME
    // Just branch all the time for now
    //if (vtxDepth(cmd.vtx) <= cmd.branchzvalue)
    state.pc = address;
  }

  function previewMatrix(matrix) {
    var m = matrix.elems;

    var a = [m[0], m[1], m[2], m[3]];
    var b = [m[4], m[5], m[6], m[7]];
    var c = [m[8], m[9], m[10], m[11]];
    var d = [m[12], m[13], m[14], m[15]];

    return '<div><table class="matrix-table">' +
        '<tr><td>' + a.join('</td><td>') + '</td></tr>' +
        '<tr><td>' + b.join('</td><td>') + '</td></tr>' +
        '<tr><td>' + c.join('</td><td>') + '</td></tr>' +
        '<tr><td>' + d.join('</td><td>') + '</td></tr>' +
        '</table></div>';
  }

  function executeGBI1_Matrix(cmd0, cmd1, dis) {
    var flags = (cmd0 >>> 16) & 0xff;
    var length = (cmd0 >>> 0) & 0xffff;
    var address = rdpSegmentAddress(cmd1);

    var matrix = loadMatrix(address);

    if (dis) {
      var t = '';
      t += (flags & G_MTX_PROJECTION) ? 'G_MTX_PROJECTION' : 'G_MTX_MODELVIEW';
      t += (flags & G_MTX_LOAD) ? '|G_MTX_LOAD' : '|G_MTX_MUL';
      t += (flags & G_MTX_PUSH) ? '|G_MTX_PUSH' : ''; //'|G_MTX_NOPUSH';

      dis.text('gsSPMatrix(' + toString32(address) + ', ' + t + ');');
      dis.tip(previewMatrix(matrix));
    }

    var stack = (flags & G_MTX_PROJECTION) ? state.projection : state.modelview;

    if ((flags & G_MTX_LOAD) == 0) {
      matrix = stack[stack.length - 1].multiply(matrix);
    }

    if (flags & G_MTX_PUSH) {
      stack.push(matrix);
    } else {
      stack[stack.length - 1] = matrix;
    }
  }

  function executeGBI1_PopMatrix(cmd0, cmd1, dis) {
    var flags = (cmd1 >>> 0) & 0xff;

    if (dis) {
      var t = '';
      t += (flags & G_MTX_PROJECTION) ? 'G_MTX_PROJECTION' : 'G_MTX_MODELVIEW';
      dis.text('gsSPPopMatrix(' + t + ');');
    }

    // FIXME: pop is always modelview?
    if (state.modelview.length > 0) {
      state.modelview.pop();
    }
  }

  function previewGBI1_MoveMem(type, length, address, dis) {
    var tip = '';

    for (var i = 0; i < length; ++i) {
      tip += toHex(ram_dv.getUint8(address + i), 8) + ' ';
    }
    tip += '<br>';

    switch (type) {
      case MoveMemGBI1.G_MV_VIEWPORT:
        tip += previewViewport(address);
        break;

      case MoveMemGBI1.G_MV_L0:
      case MoveMemGBI1.G_MV_L1:
      case MoveMemGBI1.G_MV_L2:
      case MoveMemGBI1.G_MV_L3:
      case MoveMemGBI1.G_MV_L4:
      case MoveMemGBI1.G_MV_L5:
      case MoveMemGBI1.G_MV_L6:
      case MoveMemGBI1.G_MV_L7:
        tip += previewLight(address);
        break;
    }

    dis.tip(tip);
  }

  function executeGBI1_MoveMem(cmd0, cmd1, dis) {
    var type = (cmd0 >>> 16) & 0xff;
    var length = (cmd0 >>> 0) & 0xffff;
    var address = rdpSegmentAddress(cmd1);

    if (dis) {
      var address_str = toString32(address);

      var type_str = MoveMemGBI1.nameOf(type);
      var text = 'gsDma1p(G_MOVEMEM, ' + address_str + ', ' + length + ', ' + type_str + ');';

      switch (type) {
        case MoveMemGBI1.G_MV_VIEWPORT:
          if (length === 16)
            text = 'gsSPViewport(' + address_str + ');';
          break;
      }

      dis.text(text);
      previewGBI1_MoveMem(type, length, address, dis);
    }

    switch (type) {
      case MoveMemGBI1.G_MV_VIEWPORT:
        moveMemViewport(address);
        break;

      case MoveMemGBI1.G_MV_L0:
      case MoveMemGBI1.G_MV_L1:
      case MoveMemGBI1.G_MV_L2:
      case MoveMemGBI1.G_MV_L3:
      case MoveMemGBI1.G_MV_L4:
      case MoveMemGBI1.G_MV_L5:
      case MoveMemGBI1.G_MV_L6:
      case MoveMemGBI1.G_MV_L7:
        var light_idx = (type - MoveMemGBI1.G_MV_L0) / 2;
        moveMemLight(light_idx, address);
        break;
    }
  }

  function executeGBI1_MoveWord(cmd0, cmd1, dis) {
    var type = (cmd0) & 0xff;
    var offset = (cmd0 >>> 8) & 0xffff;
    var value = cmd1;

    if (dis) {
      var text = 'gMoveWd(' + MoveWord.nameOf(type) + ', ' + toString16(offset) + ', ' + toString32(value) + ');';

      switch (type) {
        case MoveWord.G_MW_NUMLIGHT:
          if (offset === G_MWO_NUMLIGHT) {
            var v = ((value - 0x80000000) >>> 5) - 1;
            text = 'gsSPNumLights(' + NumLights.nameOf(v) + ');';
          }
          break;
        case MoveWord.G_MW_SEGMENT:
          {
            var v = value === 0 ? '0' : toString32(value);
            text = 'gsSPSegment(' + ((offset >>> 2) & 0xf) + ', ' + v + ');';
          }
          break;
      }
      dis.text(text);
    }

    switch (type) {
      case MoveWord.G_MW_MATRIX:
        unimplemented(cmd0, cmd1);
        break;
      case MoveWord.G_MW_NUMLIGHT:
        state.numLights = ((value - 0x80000000) >>> 5) - 1;
        break;
      case MoveWord.G_MW_CLIP:
        /*unimplemented(cmd0,cmd1);*/ break;
      case MoveWord.G_MW_SEGMENT:
        state.segments[((offset >>> 2) & 0xf)] = value;
        break;
      case MoveWord.G_MW_FOG:
        /*unimplemented(cmd0,cmd1);*/ break;
      case MoveWord.G_MW_LIGHTCOL:
        unimplemented(cmd0, cmd1);
        break;
      case MoveWord.G_MW_POINTS:
        unimplemented(cmd0, cmd1);
        break;
      case MoveWord.G_MW_PERSPNORM:
        /*unimplemented(cmd0,cmd1);*/ break;
      default:
        unimplemented(cmd0, cmd1);
        break;
    }
  }

  const X_NEG = 0x01; //left
  const Y_NEG = 0x02; //bottom
  const Z_NEG = 0x04; //far
  const X_POS = 0x08; //right
  const Y_POS = 0x10; //top
  const Z_POS = 0x20; //near

  function calculateLighting(normal) {
    var num_lights = state.numLights;
    var r = state.lights[num_lights].color.r;
    var g = state.lights[num_lights].color.g;
    var b = state.lights[num_lights].color.b;

    for (var l = 0; l < num_lights; ++l) {
      var light = state.lights[l];
      var d = normal.dot(light.dir);
      if (d > 0.0) {
        r += light.color.r * d;
        g += light.color.g * d;
        b += light.color.b * d;
      }
    }

    r = Math.min(r, 1.0) * 255.0;
    g = Math.min(g, 1.0) * 255.0;
    b = Math.min(b, 1.0) * 255.0;
    let a = 255;

    return (a << 24) | (b << 16) | (g << 8) | r;
  }

  function previewVertexImpl(v0, n, dv, dis) {
    const cols = ['#', 'x', 'y', 'z', '?', 'u', 'v', 'norm', 'rgba'];

    var tip = '';
    tip += '<table class="vertex-table">';
    tip += '<tr><th>' + cols.join('</th><th>') + '</th></tr>\n';

    for (var i = 0; i < n; ++i) {
      var vtx_base = i * 16;
      var v = [
        v0 + i,
        dv.getInt16(vtx_base + 0), // x
        dv.getInt16(vtx_base + 2), // y
        dv.getInt16(vtx_base + 4), // z
        dv.getInt16(vtx_base + 6), // ?
        dv.getInt16(vtx_base + 8), // u
        dv.getInt16(vtx_base + 10), // v
        dv.getInt8(vtx_base + 12) + ',' + dv.getInt8(vtx_base + 13) + ',' + dv.getInt8(vtx_base + 14), // norm
        toString32(dv.getUint32(vtx_base + 12)), // rgba
      ];

      tip += '<tr><td>' + v.join('</td><td>') + '</td></tr>\n';
    }
    tip += '</table>';
    dis.tip(tip);
  }

  function executeVertexImpl(v0, n, address, dis) {
    var light = state.geometryMode.lighting;
    var texgen = state.geometryMode.textureGen;
    var texgenlin = state.geometryMode.textureGenLinear;

    if (address + n * 16 > 0x00800000) {
      // Wetrix causes this. Not sure if it's a cpu emulation bug which is generating bad display lists?
      //     hleHalt('Invalid address');
      return;
    }

    var dv = new DataView(ram_dv.buffer, address);

    if (dis) {
      previewVertexImpl(v0, n, dv, dis);
    }

    if (v0 + n >= 64) { // FIXME or 80 for later GBI
      hleHalt('Too many verts');
      state.pc = 0;
      return;
    }

    var mvmtx = state.modelview[state.modelview.length - 1];
    var pmtx = state.projection[state.projection.length - 1];

    var wvp = pmtx.multiply(mvmtx);

    // Texture coords are provided in 11.5 fixed point format, so divide by 32 here to normalise
    var scale_s = state.texture.scaleS / 32.0;
    var scale_t = state.texture.scaleT / 32.0;

    var xyz = new Vector3();
    var normal = new Vector3();
    var transformedNormal = new Vector3();

    for (var i = 0; i < n; ++i) {
      var vtx_base = i * 16;
      var vertex = state.projectedVertices[v0 + i];

      vertex.set = true;

      xyz.elems[0] = dv.getInt16(vtx_base + 0);
      xyz.elems[1] = dv.getInt16(vtx_base + 2);
      xyz.elems[2] = dv.getInt16(vtx_base + 4);
      //var w = dv.getInt16(vtx_base + 6);
      var u = dv.getInt16(vtx_base + 8);
      var v = dv.getInt16(vtx_base + 10);

      var projected = vertex.pos;
      wvp.transformPoint(xyz, projected);

      //hleHalt(x + ',' + y + ',' + z + '-&gt;' + projected.elems[0] + ',' + projected.elems[1] + ',' + projected.elems[2]);

      // var clip_flags = 0;
      //      if (projected[0] < -projected[3]) clip_flags |= X_POS;
      // else if (projected[0] >  projected[3]) clip_flags |= X_NEG;

      //      if (projected[1] < -projected[3]) clip_flags |= Y_POS;
      // else if (projected[1] >  projected[3]) clip_flags |= Y_NEG;

      //      if (projected[2] < -projected[3]) clip_flags |= Z_POS;
      // else if (projected[2] >  projected[3]) clip_flags |= Z_NEG;
      // state.projectedVertices.clipFlags = clip_flags;

      if (light) {
        normal.elems[0] = dv.getInt8(vtx_base + 12);
        normal.elems[1] = dv.getInt8(vtx_base + 13);
        normal.elems[2] = dv.getInt8(vtx_base + 14);

        // calculate transformed normal
        mvmtx.transformNormal(normal, transformedNormal);
        transformedNormal.normaliseInPlace();

        vertex.color = calculateLighting(transformedNormal);

        if (texgen) {
          // retransform using wvp
          // wvp.transformNormal(normal, transformedNormal);
          // transformedNormal.normaliseInPlace();

          if (texgenlin) {
            vertex.u = 0.5 * (1.0 + transformedNormal.elems[0]);
            vertex.v = 0.5 * (1.0 + transformedNormal.elems[1]); // 1-y?
          } else {
            vertex.u = Math.acos(transformedNormal.elems[0]) / 3.141;
            vertex.v = Math.acos(transformedNormal.elems[1]) / 3.141;
          }
        } else {
          vertex.u = u * scale_s;
          vertex.v = v * scale_t;
        }
      } else {
        vertex.u = u * scale_s;
        vertex.v = v * scale_t;

        var r = dv.getUint8(vtx_base + 12);
        var g = dv.getUint8(vtx_base + 13);
        var b = dv.getUint8(vtx_base + 14);
        var a = dv.getUint8(vtx_base + 15);

        vertex.color = (a << 24) | (b << 16) | (g << 8) | r;
      }

      //var flag = dv.getUint16(vtx_base + 6);
      //var tu = dv.getInt16(vtx_base + 8);
      //var tv = dv.getInt16(vtx_base + 10);
      //var rgba = dv.getInt16(vtx_base + 12);    // nx/ny/nz/a
    }
  }

  function executeGBI1_Sprite2DBase(cmd0, cmd1) { unimplemented(cmd0, cmd1); }

  function executeGBI1_RDPHalf_Cont(cmd0, cmd1) { unimplemented(cmd0, cmd1); }

  function executeGBI1_RDPHalf_2(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsImmp1(G_RDPHALF_2, ' + toString32(cmd1) + ');');
    }
    state.rdpHalf2 = cmd1;
  }

  function executeGBI1_RDPHalf_1(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsImmp1(G_RDPHALF_1, ' + toString32(cmd1) + ');');
    }
    state.rdpHalf1 = cmd1;
  }

  function executeGBI1_ClrGeometryMode(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsSPClearGeometryMode(' +
        getGeometryModeFlagsText(GeometryModeGBI1, cmd1) + ');');
    }
    state.geometryModeBits &= ~cmd1;
    updateGeometryModeFromBits(GeometryModeGBI1);
  }

  function executeGBI1_SetGeometryMode(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsSPSetGeometryMode(' +
        getGeometryModeFlagsText(GeometryModeGBI1, cmd1) + ');');
    }
    state.geometryModeBits |= cmd1;
    updateGeometryModeFromBits(GeometryModeGBI1);
  }

  function disassembleSetOtherModeL(dis, len, shift, data) {
    var dataStr = toString32(data);
    var shiftStr = getOtherModeLShiftCountName(shift);
    var text = 'gsSPSetOtherMode(G_SETOTHERMODE_L, ' + shiftStr + ', ' + len + ', ' + dataStr +
      ');';

    // Override generic text with specific functions if known
    switch (shift) {
      case G_MDSFT_ALPHACOMPARE:
        if (len === 2) {
          text = 'gsDPSetAlphaCompare(' + AlphaCompare.nameOf(data) + ');';
        }
        break;
      case G_MDSFT_ZSRCSEL:
        if (len === 1) {
          text = 'gsDPSetDepthSource(' + DepthSource.nameOf(data) + ');';
        }
        break;
      case G_MDSFT_RENDERMODE:
        if (len === 29) {
          text = 'gsDPSetRenderMode(' + getRenderModeText(data) + ');';
        }
        break;
        //case gbi.G_MDSFT_BLENDER:     break; // set with G_MDSFT_RENDERMODE
    }
    dis.text(text);
  }

  function disassembleSetOtherModeH(dis, len, shift, data) {
    var shiftStr = getOtherModeHShiftCountName(shift);
    var dataStr = toString32(data);
    var text = 'gsSPSetOtherMode(G_SETOTHERMODE_H, ' + shiftStr + ', ' + len + ', ' + dataStr + ');';

    // Override generic text with specific functions if known
    switch (shift) {
      case G_MDSFT_BLENDMASK:
        break;
      case G_MDSFT_ALPHADITHER:
        if (len === 2) {
          text = 'gsDPSetAlphaDither(' + AlphaDither.nameOf(data) + ');';
        }
        break;
      case G_MDSFT_RGBDITHER:
        if (len === 2) {
          text = 'gsDPSetColorDither(' + ColorDither.nameOf(data) + ');';
        }
        break; // NB HW2?
      case G_MDSFT_COMBKEY:
        if (len === 1) {
          text = 'gsDPSetCombineKey(' + CombineKey.nameOf(data) + ');';
        }
        break;
      case G_MDSFT_TEXTCONV:
        if (len === 3) {
          text = 'gsDPSetTextureConvert(' + TextureConvert.nameOf(data) + ');';
        }
        break;
      case G_MDSFT_TEXTFILT:
        if (len === 2) {
          text = 'gsDPSetTextureFilter(' + TextureFilter.nameOf(data) + ');';
        }
        break;
      case G_MDSFT_TEXTLOD:
        if (len === 1) {
          text = 'gsDPSetTextureLOD(' + TextureLOD.nameOf(data) + ');';
        }
        break;
      case G_MDSFT_TEXTLUT:
        if (len === 2) {
          text = 'gsDPSetTextureLUT(' + TextureLUT.nameOf(data) + ');';
        }
        break;
      case G_MDSFT_TEXTDETAIL:
        if (len === 2) {
          text = 'gsDPSetTextureDetail(' + TextureDetail.nameOf(data) + ');';
        }
        break;
      case G_MDSFT_TEXTPERSP:
        if (len === 1) {
          text = 'gsDPSetTexturePersp(' + TexturePerspective.nameOf(data) + ');';
        }
        break;
      case G_MDSFT_CYCLETYPE:
        if (len === 2) {
          text = 'gsDPSetCycleType(' + CycleType.nameOf(data) + ');';
        }
        break;
        //case gbi.G_MDSFT_COLORDITHER: if (len === 1) text = 'gsDPSetColorDither(' + dataStr + ');'; break;  // NB HW1?
      case G_MDSFT_PIPELINE:
        if (len === 1) {
          text = 'gsDPPipelineMode(' + PipelineMode.nameOf(data) + ');';
        }
        break;
    }
    dis.text(text);
  }

  function executeGBI1_SetOtherModeL(cmd0, cmd1, dis) {
    var shift = (cmd0 >>> 8) & 0xff;
    var len = (cmd0 >>> 0) & 0xff;
    var data = cmd1;
    var mask = ((1 << len) - 1) << shift;

    if (dis) {
      disassembleSetOtherModeL(dis, len, shift, data);
    }

    state.rdpOtherModeL = (state.rdpOtherModeL & ~mask) | data;
  }

  function executeGBI1_SetOtherModeH(cmd0, cmd1, dis) {
    var shift = (cmd0 >>> 8) & 0xff;
    var len = (cmd0 >>> 0) & 0xff;
    var data = cmd1;
    var mask = ((1 << len) - 1) << shift;

    if (dis) {
      disassembleSetOtherModeH(dis, len, shift, data);
    }

    state.rdpOtherModeH = (state.rdpOtherModeH & ~mask) | data;
  }

  function calcTextureScale(v) {
    if (v === 0 || v === 0xffff) {
      return 1.0;
    }
    return v / 65536.0;
  }

  function executeGBI1_Texture(cmd0, cmd1, dis) {
    var xparam = (cmd0 >>> 16) & 0xff;
    var level = (cmd0 >>> 11) & 0x3;
    var tileIdx = (cmd0 >>> 8) & 0x7;
    var on = (cmd0 >>> 0) & 0xff;
    var s = calcTextureScale(((cmd1 >>> 16) & 0xffff));
    var t = calcTextureScale(((cmd1 >>> 0) & 0xffff));

    if (dis) {
      var s_text = s.toString();
      var t_text = t.toString();
      var tile_text = getTileText(tileIdx);

      if (xparam !== 0) {
        dis.text('gsSPTextureL(' + s_text + ', ' + t_text + ', ' + level + ', ' + xparam + ', ' +
          tile_text + ', ' + on + ');');
      } else {
        dis.text('gsSPTexture(' + s_text + ', ' + t_text + ', ' + level + ', ' + tile_text + ', ' +
          on + ');');
      }
    }

    state.texture.level = level;
    state.texture.tile = tileIdx;
    state.texture.scaleS = s;
    state.texture.scaleT = t;

    if (on) {
      state.geometryModeBits |= GeometryModeGBI1.G_TEXTURE_ENABLE;
    } else {
      state.geometryModeBits &= ~GeometryModeGBI1.G_TEXTURE_ENABLE;
    }
    updateGeometryModeFromBits(GeometryModeGBI1);
  }

  function executeGBI1_CullDL(cmd0, cmd1) {
    // FIXME: culldl
  }

  function executeGBI1_Tri1(cmd0, cmd1, dis) {
    var kTri1 = cmd0 >>> 24;
    var stride = config.vertexStride;
    var verts = state.projectedVertices;

    var triIdx = 0;

    var pc = state.pc;
    do {
      var flag = (cmd1 >>> 24) & 0xff;
      var v0idx = ((cmd1 >>> 16) & 0xff) / stride;
      var v1idx = ((cmd1 >>> 8) & 0xff) / stride;
      var v2idx = ((cmd1 >>> 0) & 0xff) / stride;

      if (dis) {
        dis.text('gsSP1Triangle(' + v0idx + ', ' + v1idx + ', ' + v2idx + ', ' + flag + ');');
      }

      triangleBuffer.pushTri(verts[v0idx], verts[v1idx], verts[v2idx], triIdx);
      triIdx++;

      cmd0 = ram_dv.getUint32(pc + 0);
      cmd1 = ram_dv.getUint32(pc + 4);
      ++debugCurrentOp;
      pc += 8;

      // NB: process triangles individually when disassembling
    } while ((cmd0 >>> 24) === kTri1 && triIdx < kMaxTris && !dis);

    state.pc = pc - 8;
    --debugCurrentOp;

    flushTris(triIdx * 3);
  }

  function executeTri4_GBI0(cmd0, cmd1, dis) {
    var kTri4 = cmd0 >>> 24;
    var stride = config.vertexStride;
    var verts = state.projectedVertices;

    var triIdx = 0;

    var pc = state.pc;
    do {
      var v09_idx = ((cmd0 >>> 12) & 0xf);
      var v06_idx = ((cmd0 >>> 8) & 0xf);
      var v03_idx = ((cmd0 >>> 4) & 0xf);
      var v00_idx = ((cmd0 >>> 0) & 0xf);
      var v11_idx = ((cmd1 >>> 28) & 0xf);
      var v10_idx = ((cmd1 >>> 24) & 0xf);
      var v08_idx = ((cmd1 >>> 20) & 0xf);
      var v07_idx = ((cmd1 >>> 16) & 0xf);
      var v05_idx = ((cmd1 >>> 12) & 0xf);
      var v04_idx = ((cmd1 >>> 8) & 0xf);
      var v02_idx = ((cmd1 >>> 4) & 0xf);
      var v01_idx = ((cmd1 >>> 0) & 0xf);

      if (dis) {
        dis.text('gsSP1Triangle4(' +
          v00_idx + ',' + v01_idx + ',' + v02_idx + ', ' +
          v03_idx + ',' + v04_idx + ',' + v05_idx + ', ' +
          v06_idx + ',' + v07_idx + ',' + v08_idx + ', ' +
          v09_idx + ',' + v10_idx + ',' + v11_idx + ');');
      }

      if (v00_idx !== v01_idx) {
        triangleBuffer.pushTri(verts[v00_idx], verts[v01_idx], verts[v02_idx], triIdx);
        triIdx++;
      }
      if (v03_idx !== v04_idx) {
        triangleBuffer.pushTri(verts[v03_idx], verts[v04_idx], verts[v05_idx], triIdx);
        triIdx++;
      }
      if (v06_idx !== v07_idx) {
        triangleBuffer.pushTri(verts[v06_idx], verts[v07_idx], verts[v08_idx], triIdx);
        triIdx++;
      }
      if (v09_idx !== v10_idx) {
        triangleBuffer.pushTri(verts[v09_idx], verts[v10_idx], verts[v11_idx], triIdx);
        triIdx++;
      }

      cmd0 = ram_dv.getUint32(pc + 0);
      cmd1 = ram_dv.getUint32(pc + 4);
      ++debugCurrentOp;
      pc += 8;
      // NB: process triangles individually when disassembling
    } while ((cmd0 >>> 24) === kTri4 && triIdx < kMaxTris && !dis);

    state.pc = pc - 8;
    --debugCurrentOp;

    flushTris(triIdx * 3);
  }

  function executeGBI1_Tri2(cmd0, cmd1, dis) {
    var kTri2 = cmd0 >>> 24;
    var stride = config.vertexStride;
    var verts = state.projectedVertices;

    var triIdx = 0;

    var pc = state.pc;
    do {
      var v0idx = ((cmd0 >>> 16) & 0xff) / stride;
      var v1idx = ((cmd0 >>> 8) & 0xff) / stride;
      var v2idx = ((cmd0 >>> 0) & 0xff) / stride;
      var v3idx = ((cmd1 >>> 16) & 0xff) / stride;
      var v4idx = ((cmd1 >>> 8) & 0xff) / stride;
      var v5idx = ((cmd1 >>> 0) & 0xff) / stride;

      if (dis) {
        dis.text('gsSP1Triangle2(' + v0idx + ',' + v1idx + ',' + v2idx + ', ' +
          v3idx + ',' + v4idx + ',' + v5idx + ');');
      }

      triangleBuffer.pushTri(verts[v0idx], verts[v1idx], verts[v2idx], triIdx);
      triIdx++;
      triangleBuffer.pushTri(verts[v3idx], verts[v4idx], verts[v5idx], triIdx);
      triIdx++;

      cmd0 = ram_dv.getUint32(pc + 0);
      cmd1 = ram_dv.getUint32(pc + 4);
      ++debugCurrentOp;
      pc += 8;
      // NB: process triangles individually when disassembling
    } while ((cmd0 >>> 24) === kTri2 && triIdx < kMaxTris && !dis);

    state.pc = pc - 8;
    --debugCurrentOp;

    flushTris(triIdx * 3);
  }

  function executeGBI1_Line3D(cmd0, cmd1, dis) {
    var kLine3D = cmd0 >>> 24;
    var stride = config.vertexStride;
    var verts = state.projectedVertices;

    var triIdx = 0;

    var pc = state.pc;
    do {
      var v3idx = ((cmd1 >>> 24) & 0xff) / stride;
      var v0idx = ((cmd1 >>> 16) & 0xff) / stride;
      var v1idx = ((cmd1 >>> 8) & 0xff) / stride;
      var v2idx = ((cmd1 >>> 0) & 0xff) / stride;

      if (dis) {
        dis.text('gsSPLine3D(' + v0idx + ', ' + v1idx + ', ' + v2idx + ', ' + v3idx + ');');
      }

      triangleBuffer.pushTri(verts[v0idx], verts[v1idx], verts[v2idx], triIdx);
      triIdx++;
      triangleBuffer.pushTri(verts[v2idx], verts[v3idx], verts[v0idx], triIdx);
      triIdx++;

      cmd0 = ram_dv.getUint32(pc + 0);
      cmd1 = ram_dv.getUint32(pc + 4);
      ++debugCurrentOp;
      pc += 8;
      // NB: process triangles individually when disassembling
    } while ((cmd0 >>> 24) === kLine3D && triIdx + 1 < kMaxTris && !dis);

    state.pc = pc - 8;
    --debugCurrentOp;

    flushTris(triIdx * 3);
  }

  function executeSetKeyGB(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsDPSetKeyGB(???);');
    }
  }

  function executeSetKeyR(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsDPSetKeyR(???);');
    }
  }

  function executeSetConvert(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsDPSetConvert(???);');
    }
  }

  function executeSetScissor(cmd0, cmd1, dis) {
    var x0 = ((cmd0 >>> 12) & 0xfff) / 4.0;
    var y0 = ((cmd0 >>> 0) & 0xfff) / 4.0;
    var x1 = ((cmd1 >>> 12) & 0xfff) / 4.0;
    var y1 = ((cmd1 >>> 0) & 0xfff) / 4.0;
    var mode = (cmd1 >>> 24) & 0x2;

    if (dis) {
      dis.text('gsDPSetScissor(' + ScissorMode.nameOf(mode) + ', ' + x0 + ', ' + y0 +
        ', ' + x1 + ', ' + y1 + ');');
    }

    state.scissor.x0 = x0;
    state.scissor.y0 = y0;
    state.scissor.x1 = x1;
    state.scissor.y1 = y1;
    state.scissor.mode = mode;

    // FIXME: actually set this
  }

  function executeSetPrimDepth(cmd0, cmd1, dis) {
    var z = (cmd1 >>> 16) & 0xffff;
    var dz = (cmd1) & 0xffff;
    if (dis) {
      dis.text('gsDPSetPrimDepth(' + z + ',' + dz + ');');
    }

    // FIXME
  }

  function executeSetRDPOtherMode(cmd0, cmd1) { unimplemented(cmd0, cmd1); }

  function calcTextureAddress(uls, ult, address, width, size) {
    return state.textureImage.address +
        (ult * ((state.textureImage.width << size) >>> 1)) +
        ((uls << size) >>> 1);
  }

  // tmem/ram should be Int32Array
  function copyLineQwords(tmem, tmem_offset, ram, ram_offset, qwords) {
    for (let i = 0; i < qwords; ++i) {
      tmem[tmem_offset + 0] = ram[ram_offset + 0];
      tmem[tmem_offset + 1] = ram[ram_offset + 1];
      tmem_offset += 2;
      ram_offset += 2;
    }
  }
  // tmem/ram should be Int32Array
  function copyLineQwordsSwap(tmem, tmem_offset, ram, ram_offset, qwords) {
    if (tmem_offset & 1) { hleHalt("oops, tmem isn't qword aligned"); }

    for (let i = 0; i < qwords; ++i) {
      tmem[(tmem_offset + 0) ^ 0x1] = ram[ram_offset + 0];
      tmem[(tmem_offset + 1) ^ 0x1] = ram[ram_offset + 1];
      tmem_offset += 2;
      ram_offset += 2;
    }
  }

  function invalidateTileHashes() {
    for (let i = 0; i < 8; ++i) {
      state.tiles[i].hash = 0;
    }
  }

  function executeLoadBlock(cmd0, cmd1, dis) {
    var uls = (cmd0 >>> 12) & 0xfff;
    var ult = (cmd0 >>> 0) & 0xfff;
    var tileIdx = (cmd1 >>> 24) & 0x7;
    var lrs = (cmd1 >>> 12) & 0xfff;
    var dxt = (cmd1 >>> 0) & 0xfff;

    if (dis) {
      var tt = getTileText(tileIdx);
      dis.text('gsDPLoadBlock(' + tt + ', ' + uls + ', ' + ult + ', ' + lrs + ', ' + dxt + ');');
    }

    // Docs reckon these are ignored for all loadBlocks
    if (uls !== 0) { hleHalt('Unexpected non-zero uls in load block'); }
    if (ult !== 0) { hleHalt('Unexpected non-zero ult in load block'); }

    var tile = state.tiles[tileIdx];
    var ram_address = calcTextureAddress(uls, ult,
                                         state.textureImage.address,
                                         state.textureImage.width,
                                         state.textureImage.size);

    var bytes = ((lrs + 1) << state.textureImage.size) >>> 1;
    var qwords = (bytes + 7) >>> 3;

    var tmem_data = state.tmemData32;

    // Offsets in 32 bit words.
    var ram_offset = ram_address >>> 2;
    var tmem_offset = (tile.tmem << 3) >>> 2;

    // Slight fast path for dxt == 0
    if (dxt === 0) {
      copyLineQwords(tmem_data, tmem_offset, ram_s32, ram_offset, qwords);
    } else {
      var qwords_per_line = Math.ceil(2048 / dxt);
      var row_swizzle = 0;
      for (let i = 0; i < qwords;) {
        var qwords_to_copy = Math.min(qwords - i, qwords_per_line);

        if (row_swizzle) {
          copyLineQwordsSwap(tmem_data, tmem_offset, ram_s32, ram_offset, qwords_to_copy);
        } else {
          copyLineQwords(tmem_data, tmem_offset, ram_s32, ram_offset, qwords_to_copy);
        }

        i += qwords_to_copy;

        // 2 words per quadword copied
        tmem_offset += qwords_to_copy * 2;
        ram_offset += qwords_to_copy * 2;

        // All odd lines are swapped
        row_swizzle ^= 0x1;
      }
    }
    invalidateTileHashes();
  }

  function copyLine(tmem, tmem_offset, ram, ram_offset, bytes) {
    for (let x = 0; x < bytes; ++x) {
      tmem[tmem_offset + x] = ram[ram_offset + x];
    }
  }

  function copyLineSwap(tmem, tmem_offset, ram, ram_offset, bytes) {
    for (let x = 0; x < bytes; ++x) {
      tmem[(tmem_offset + x) ^ 0x4] = ram[(ram_offset + x)];
    }
  }

  function executeLoadTile(cmd0, cmd1, dis) {
    var uls = (cmd0 >>> 12) & 0xfff;
    var ult = (cmd0 >>> 0) & 0xfff;
    var tileIdx = (cmd1 >>> 24) & 0x7;
    var lrs = (cmd1 >>> 12) & 0xfff;
    var lrt = (cmd1 >>> 0) & 0xfff;

    if (dis) {
      var tt = getTileText(tileIdx);
      dis.text('gsDPLoadTile(' + tt + ', ' +
          (uls / 4) + ', ' + (ult / 4) + ', ' +
          (lrs / 4) + ', ' + (lrt / 4) + '); ' +
          '// ' +
          '(' + (uls / 4) + ',' + (ult / 4) + '), (' +
          ((lrs / 4) + 1) + ',' + ((lrt / 4) + 1) + ')');
    }

    var tile = state.tiles[tileIdx];
    var ram_address = calcTextureAddress(uls >>> 2, ult >>> 2,
                                         state.textureImage.address,
                                         state.textureImage.width,
                                         state.textureImage.size);
    var pitch = (state.textureImage.width << state.textureImage.size) >>> 1;

    var h = ((lrt - ult) >>> 2) + 1;
    var w = ((lrs - uls) >>> 2) + 1;
    var bytes = ((h * w) << state.textureImage.size) >>> 1;
    var qwords = (bytes + 7) >>> 3;

    if (qwords > 512)
      qwords = 512;

    // loadTile pads rows to 8 bytes.
    var tmem_data = state.tmemData;
    var tmem_offset = tile.tmem << 3;

    var ram_offset = ram_address;

    var bytes_per_line = (w << state.textureImage.size) >>> 1;
    var bytes_per_tmem_line = tile.line << 3;

    if (state.textureImage.size == ImageSize.G_IM_SIZ_32b) {
      bytes_per_tmem_line = bytes_per_tmem_line * 2;
    }
    // if (bytes_per_tmem_line < roundUpMultiple8(bytes_per_line)) {
    //   hleHalt('line is shorter than texel count');
    // }

    var x, y;
    for (y = 0; y < h; ++y) {
      if (y & 1) {
        copyLineSwap(tmem_data, tmem_offset, ram_u8, ram_offset, bytes_per_tmem_line);
      } else {
        copyLine(tmem_data, tmem_offset, ram_u8, ram_offset, bytes_per_tmem_line);
      }

      // Pad lines to a quadword
      for (x = bytes_per_line; x < bytes_per_tmem_line; ++x) {
        tmem_data[tmem_offset + x] = 0;
      }

      tmem_offset += bytes_per_tmem_line;
      ram_offset += pitch;
    }

    invalidateTileHashes();
  }

  function executeLoadTLut(cmd0, cmd1, dis) {
    var tileIdx = (cmd1 >>> 24) & 0x7;
    var count = (cmd1 >>> 14) & 0x3ff;

    // NB, in Daedalus, we interpret this similarly to a loadtile command,
    // but in other places it's defined as a simple count parameter.
    var uls = (cmd0 >>> 12) & 0xfff;
    var ult = (cmd0 >>> 0) & 0xfff;
    var lrs = (cmd1 >>> 12) & 0xfff;
    var lrt = (cmd1 >>> 0) & 0xfff;

    if (dis) {
      var tt = getTileText(tileIdx);
      dis.text('gsDPLoadTLUTCmd(' + tt + ', ' + count + '); //' +
        uls + ', ' + ult + ', ' + lrs + ', ' + lrt);
    }

    // Tlut fmt is sometimes wrong (in 007) and is set after tlut load, but
    // before tile load. Format is always 16bpp - RGBA16 or IA16:
    // var address = calcTextureAddress(uls >>> 2, ult >>> 2,
    //                                  state.textureImage.address,
    //                                  åstate.textureImage.width,
    //                                  åstate.textureImage.size);
    var ram_offset = calcTextureAddress(uls >>> 2, ult >>> 2,
                                        state.textureImage.address,
                                        state.textureImage.width,
                                        ImageSize.G_IM_SIZ_16b);
    var pitch = (state.textureImage.width << ImageSize.G_IM_SIZ_16b) >>> 1;

    var tile = state.tiles[tileIdx];
    var texels = ((lrs - uls) >>> 2) + 1;
    var bytes = texels * 2;

    var tmem_offset = tile.tmem << 3;

    copyLine(state.tmemData, tmem_offset, ram_u8, ram_offset, bytes);

    invalidateTileHashes();
  }

  function executeSetTile(cmd0, cmd1, dis) {
    var format = (cmd0 >>> 21) & 0x7;
    var size = (cmd0 >>> 19) & 0x3;
    //var pad0 = (cmd0 >>> 18) & 0x1;
    var line = (cmd0 >>> 9) & 0x1ff;
    var tmem = (cmd0 >>> 0) & 0x1ff;

    //var pad1 = (cmd1 >>> 27) & 0x1f;
    var tileIdx = (cmd1 >>> 24) & 0x7;
    var palette = (cmd1 >>> 20) & 0xf;

    var cm_t = (cmd1 >>> 18) & 0x3;
    var mask_t = (cmd1 >>> 14) & 0xf;
    var shift_t = (cmd1 >>> 10) & 0xf;

    var cm_s = (cmd1 >>> 8) & 0x3;
    var mask_s = (cmd1 >>> 4) & 0xf;
    var shift_s = (cmd1 >>> 0) & 0xf;

    if (dis) {
      var cm_s_text = getClampMirrorWrapText(cm_s);
      var cm_t_text = getClampMirrorWrapText(cm_t);

      dis.text('gsDPSetTile(' +
        ImageFormat.nameOf(format) + ', ' +
        ImageSize.nameOf(size) + ', ' +
        line + ', ' + tmem + ', ' + getTileText(tileIdx) + ', ' +
        palette + ', ' +
        cm_t_text + ', ' + mask_t + ', ' + shift_t + ', ' +
        cm_s_text + ', ' + mask_s + ', ' + shift_s + ');');
    }

    var tile = state.tiles[tileIdx];
    tile.format = format;
    tile.size = size;
    tile.line = line;
    tile.tmem = tmem;
    tile.palette = palette;
    tile.cm_t = cm_t;
    tile.mask_t = mask_t;
    tile.shift_t = shift_t;
    tile.cm_s = cm_s;
    tile.mask_s = mask_s;
    tile.shift_s = shift_s;
    tile.hash = 0;
  }

  function executeSetTileSize(cmd0, cmd1, dis) {
    var uls = (cmd0 >>> 12) & 0xfff;
    var ult = (cmd0 >>> 0) & 0xfff;
    var tileIdx = (cmd1 >>> 24) & 0x7;
    var lrs = (cmd1 >>> 12) & 0xfff;
    var lrt = (cmd1 >>> 0) & 0xfff;

    if (dis) {
      var tt = getTileText(tileIdx);
      dis.text('gsDPSetTileSize(' + tt + ', ' +
        uls + ', ' + ult + ', ' +
        lrs + ', ' + lrt + '); // ' +
        '(' + (uls / 4) + ',' + (ult / 4) + '), ' +
        '(' + ((lrs / 4) + 1) + ',' + ((lrt / 4) + 1) + ')');
    }

    var tile = state.tiles[tileIdx];
    tile.uls = uls;
    tile.ult = ult;
    tile.lrs = lrs;
    tile.lrt = lrt;
    tile.hash = 0;
  }

  function executeFillRect(cmd0, cmd1, dis) {
    // NB: fraction is ignored
    var x0 = ((cmd1 >>> 12) & 0xfff) >>> 2;
    var y0 = ((cmd1 >>> 0) & 0xfff) >>> 2;
    var x1 = ((cmd0 >>> 12) & 0xfff) >>> 2;
    var y1 = ((cmd0 >>> 0) & 0xfff) >>> 2;

    if (dis) {
      dis.text('gsDPFillRectangle(' + x0 + ', ' + y0 + ', ' + x1 + ', ' + y1 + ');');
    }

    if (state.depthImage.address == state.colorImage.address) {
      gl.clearDepth(1.0);
      gl.depthMask(true);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      return;
    }

    var cycle_type = getCycleType();

    var color = { r: 0, g: 0, b: 0, a: 0 };

    if (cycle_type === CycleType.G_CYC_FILL) {
      x1 += 1;
      y1 += 1;

      if (state.colorImage.size === ImageSize.G_IM_SIZ_16b) {
        color = makeRGBFromRGBA16(state.fillColor & 0xffff);
      } else {
        color = makeRGBFromRGBA32(state.fillColor);
      }

      // Clear whole screen in one?
      if (viWidth === (x1 - x0) && viHeight === (y1 - y0)) {
        gl.clearColor(color.r, color.g, color.b, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }
    } else if (cycle_type === CycleType.G_CYC_COPY) {
      x1 += 1;
      y1 += 1;
    }
    //color.r = Math.random();
    color.a = 1.0;
    fillRect(x0, y0, x1, y1, color);
  }

  function executeTexRect(cmd0, cmd1, dis) {
    if (!texrected) {
      n64js.emitRunningTime('texrect');
      texrected = true;
    }

    // The following 2 commands contain additional info
    // TODO: check op code matches what we expect?
    var pc = state.pc;
    var cmd2 = ram_dv.getUint32(state.pc + 4);
    var cmd3 = ram_dv.getUint32(state.pc + 12);
    state.pc += 16;

    var xh = ((cmd0 >>> 12) & 0xfff) / 4.0;
    var yh = ((cmd0 >>> 0) & 0xfff) / 4.0;
    var tileIdx = (cmd1 >>> 24) & 0x7;
    var xl = ((cmd1 >>> 12) & 0xfff) / 4.0;
    var yl = ((cmd1 >>> 0) & 0xfff) / 4.0;
    var s0 = ((cmd2 >>> 16) & 0xffff) / 32.0;
    var t0 = ((cmd2 >>> 0) & 0xffff) / 32.0;
    // NB - signed value
    var dsdx = ((cmd3 | 0) >> 16) / 1024.0;
    var dtdy = ((cmd3 << 16) >> 16) / 1024.0;

    if (dis) {
      var tt = getTileText(tileIdx);
      dis.text('gsSPTextureRectangle(' +
        xl + ',' + yl + ',' + xh + ',' + yh + ',' +
        tt + ',' + s0 + ',' + t0 + ',' + dsdx + ',' + dtdy + ');');
    }

    var cycle_type = getCycleType();

    // In copy mode 4 pixels are copied at once.
    if (cycle_type === CycleType.G_CYC_COPY) {
      dsdx *= 0.25;
    }

    // In Fill/Copy mode the coordinates are inclusive (i.e. add 1.0f to the w/h)
    if (cycle_type === CycleType.G_CYC_COPY ||
      cycle_type === CycleType.G_CYC_FILL) {
      xh += 1.0;
      yh += 1.0;
    }

    var s1 = s0 + dsdx * (xh - xl);
    var t1 = t0 + dtdy * (yh - yl);

    texRect(tileIdx, xl, yl, xh, yh, s0, t0, s1, t1, false);
  }

  function executeTexRectFlip(cmd0, cmd1) {
    // The following 2 commands contain additional info
    // TODO: check op code matches what we expect?
    var pc = state.pc;
    var cmd2 = ram_dv.getUint32(state.pc + 4);
    var cmd3 = ram_dv.getUint32(state.pc + 12);
    state.pc += 16;

    var xh = ((cmd0 >>> 12) & 0xfff) / 4.0;
    var yh = ((cmd0 >>> 0) & 0xfff) / 4.0;
    var tileIdx = (cmd1 >>> 24) & 0x7;
    var xl = ((cmd1 >>> 12) & 0xfff) / 4.0;
    var yl = ((cmd1 >>> 0) & 0xfff) / 4.0;
    var s0 = ((cmd2 >>> 16) & 0xffff) / 32.0;
    var t0 = ((cmd2 >>> 0) & 0xffff) / 32.0;
    // NB - signed value
    var dsdx = ((cmd3 | 0) >> 16) / 1024.0;
    var dtdy = ((cmd3 << 16) >> 16) / 1024.0;

    var cycle_type = getCycleType();

    // In copy mode 4 pixels are copied at once.
    if (cycle_type === CycleType.G_CYC_COPY) {
      dsdx *= 0.25;
    }

    // In Fill/Copy mode the coordinates are inclusive (i.e. add 1.0f to the w/h)
    if (cycle_type === CycleType.G_CYC_COPY ||
      cycle_type === CycleType.G_CYC_FILL) {
      xh += 1.0;
      yh += 1.0;
    }

    // NB x/y are flipped
    var s1 = s0 + dsdx * (yh - yl);
    var t1 = t0 + dtdy * (xh - xl);

    texRect(tileIdx, xl, yl, xh, yh, s0, t0, s1, t1, true);
  }


  function executeSetFillColor(cmd0, cmd1, dis) {
    if (dis) {
      // Can be 16 or 32 bit
      dis.text('gsDPSetFillColor(' + makeColorTextRGBA(cmd1) + ');');
    }
    state.fillColor = cmd1;
  }

  function executeSetFogColor(cmd0, cmd1, dis) {
    if (dis) {
      var r = (cmd1 >>> 24) & 0xff;
      var g = (cmd1 >>> 16) & 0xff;
      var b = (cmd1 >>> 8) & 0xff;
      var a = (cmd1 >>> 0) & 0xff;

      dis.text('gsDPSetFogColor(' + makeColorTextRGBA(cmd1) + ');');
    }
    state.fogColor = cmd1;
  }

  function executeSetBlendColor(cmd0, cmd1, dis) {
    if (dis) {
      var r = (cmd1 >>> 24) & 0xff;
      var g = (cmd1 >>> 16) & 0xff;
      var b = (cmd1 >>> 8) & 0xff;
      var a = (cmd1 >>> 0) & 0xff;

      dis.text('gsDPSetBlendColor(' + makeColorTextRGBA(cmd1) + ');');
    }
    state.blendColor = cmd1;
  }

  function executeSetPrimColor(cmd0, cmd1, dis) {
    if (dis) {
      var m = (cmd0 >>> 8) & 0xff;
      var l = (cmd0 >>> 0) & 0xff;
      var r = (cmd1 >>> 24) & 0xff;
      var g = (cmd1 >>> 16) & 0xff;
      var b = (cmd1 >>> 8) & 0xff;
      var a = (cmd1 >>> 0) & 0xff;

      dis.text('gsDPSetPrimColor(' + m + ', ' + l + ', ' + makeColorTextRGBA(cmd1) + ');');
    }
    // minlevel, primlevel ignored!
    state.primColor = cmd1;
  }

  function executeSetEnvColor(cmd0, cmd1, dis) {
    if (dis) {
      var r = (cmd1 >>> 24) & 0xff;
      var g = (cmd1 >>> 16) & 0xff;
      var b = (cmd1 >>> 8) & 0xff;
      var a = (cmd1 >>> 0) & 0xff;

      dis.text('gsDPSetEnvColor(' + makeColorTextRGBA(cmd1) + ');');
    }
    state.envColor = cmd1;
  }

  function executeSetCombine(cmd0, cmd1, dis) {

    if (dis) {
      var mux0 = cmd0 & 0x00ffffff;
      var mux1 = cmd1;
      var decoded = getCombinerText(mux0, mux1);

      dis.text('gsDPSetCombine(' + toString32(mux0) + ', ' + toString32(mux1) + ');' + '\n' +
        decoded);
    }

    state.combine.hi = cmd0 & 0x00ffffff;
    state.combine.lo = cmd1;
  }

  function executeSetTImg(cmd0, cmd1, dis) {
    var format = (cmd0 >>> 21) & 0x7;
    var size = (cmd0 >>> 19) & 0x3;
    var width = ((cmd0 >>> 0) & 0xfff) + 1;
    var address = rdpSegmentAddress(cmd1);

    if (dis) {
      dis.text('gsDPSetTextureImage(' + ImageFormat.nameOf(format) + ', ' +
        ImageSize.nameOf(size) + ', ' + width + ', ' + toString32(address) + ');');
    }

    state.textureImage = {
      format: format,
      size: size,
      width: width,
      address: address
    };
  }

  function executeSetZImg(cmd0, cmd1, dis) {
    var address = rdpSegmentAddress(cmd1);

    if (dis) {
      dis.text('gsDPSetDepthImage(' + toString32(address) + ');');
    }

    state.depthImage.address = address;
  }

  function executeSetCImg(cmd0, cmd1, dis) {
    var format = (cmd0 >>> 21) & 0x7;
    var size = (cmd0 >>> 19) & 0x3;
    var width = ((cmd0 >>> 0) & 0xfff) + 1;
    var address = rdpSegmentAddress(cmd1);

    if (dis) {
      dis.text('gsDPSetColorImage(' +
        ImageFormat.nameOf(format) + ', ' +
        ImageSize.nameOf(size) + ', ' +
        width + ', ' + toString32(address) + ');');
    }

    state.colorImage = {
      format: format,
      size: size,
      width: width,
      address: address
    };
  }

  function executeGBI0_Vertex(cmd0, cmd1, dis) {
    var n = ((cmd0 >>> 20) & 0xf) + 1;
    var v0 = (cmd0 >>> 16) & 0xf;
    //var length = (cmd0 >>>  0) & 0xffff;
    var address = rdpSegmentAddress(cmd1);

    if (dis) {
      dis.text('gsSPVertex(' + toString32(address) + ', ' + n + ', ' + v0 + ');');
    }

    executeVertexImpl(v0, n, address, dis);
  }

  function executeVertex_GBI0_WR(cmd0, cmd1, dis) {
    var n = ((cmd0 >>> 9) & 0x7f);
    var v0 = ((cmd0 >>> 16) & 0xff) / 5;
    //var length = (cmd0 >>> 0) & 0x1ff;
    var address = rdpSegmentAddress(cmd1);

    if (dis) {
      dis.text('gsSPVertex(' + toString32(address) + ', ' + n + ', ' + v0 + ');');
    }

    executeVertexImpl(v0, n, address, dis);
  }

  function executeGBI1_Vertex(cmd0, cmd1, dis) {
    var v0 = ((cmd0 >>> 16) & 0xff) / config.vertexStride;
    var n = ((cmd0 >>> 10) & 0x3f);
    //var length = (cmd0 >>>  0) & 0x3ff;
    var address = rdpSegmentAddress(cmd1);

    if (dis) {
      dis.text('gsSPVertex(' + toString32(address) + ', ' + n + ', ' + v0 + ');');
    }

    executeVertexImpl(v0, n, address, dis);
  }

  function executeGBI1_ModifyVtx(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsSPModifyVertex(???);');
    }

    // FIXME!
  }

  function getAlphaCompareType() {
    return state.rdpOtherModeL & G_AC_MASK;
  }

  function getCoverageTimesAlpha() {
    // fragment coverage (0) or alpha (1)?
    return (state.rdpOtherModeL & RenderMode.CVG_X_ALPHA) !== 0;
  }

  function getAlphaCoverageSelect() {
    // use fragment coverage * fragment alpha
    return (state.rdpOtherModeL & RenderMode.ALPHA_CVG_SEL) !== 0;
  }

  function getCycleType() {
    return state.rdpOtherModeH & G_CYC_MASK;
  }

  function getTextureFilterType() {
    return state.rdpOtherModeH & G_TF_MASK;
  }

  function getTextureLUTType() {
    return state.rdpOtherModeH & G_TT_MASK;
  }

  function logGLCall(functionName, args) {
    console.log("gl." + functionName + "(" +
      WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
  }

  function initWebGL(canvas) {
    if (gl) {
      return;
    }

    try {
      // Try to grab the standard context. If it fails, fallback to experimental.
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

      //gl = WebGLDebugUtils.makeDebugContext(gl, undefined, logGLCall);
    } catch (e) {}

    // If we don't have a GL context, give up now
    if (!gl) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
    }
  }

  var fillShaderProgram;
  var fill_vertexPositionAttribute;
  var fill_uPMatrix;
  var fill_uFillColor;

  var blitShaderProgram;
  var blit_vertexPositionAttribute;
  var blit_texCoordAttribute;
  var blit_uSampler;

  var rectVerticesBuffer;
  var n64PositionsBuffer;
  var n64ColorsBuffer;
  var n64UVBuffer;

  const kBlendModeOpaque = 0;
  const kBlendModeAlphaTrans = 1;
  const kBlendModeFade = 2;

  function setProgramState(positions, colours, coords, texture, tex_gen_enabled) {
    // fragment coverage (0) or alpha (1)?
    var cvg_x_alpha = getCoverageTimesAlpha();
    // use fragment coverage * fragment alpha
    var alpha_cvg_sel = getAlphaCoverageSelect();

    var cycle_type = getCycleType();
    if (cycle_type < CycleType.G_CYC_COPY) {
      var blend_mode = state.rdpOtherModeL >> G_MDSFT_BLENDER;
      var active_blend_mode = (cycle_type === CycleType.G_CYC_2CYCLE ? blend_mode : (
        blend_mode >>> 2)) & 0x3333;
      var mode = kBlendModeOpaque;

      switch (active_blend_mode) {
        case 0x0000: //G_BL_CLR_IN,G_BL_A_IN,G_BL_CLR_IN,G_BL_1MA
          mode = kBlendModeOpaque;
          break;
        case 0x0010: //G_BL_CLR_IN,G_BL_A_IN,G_BL_CLR_MEM,G_BL_1MA
        case 0x0011: //G_BL_CLR_IN,G_BL_A_IN,G_BL_CLR_MEM,G_BL_A_MEM
          // These modes either do a weighted sum of coverage (or coverage and alpha) or a plain alpha blend
          if (!alpha_cvg_sel || cvg_x_alpha) // If alpha_cvg_sel is 0, or if we're multiplying by fragment alpha, then we have alpha to blend with
            mode = kBlendModeAlphaTrans;
          break;

        case 0x0110: //G_BL_CLR_IN,G_BL_A_FOG,G_BL_CLR_MEM,G_BL_1MA, alpha_cvg_sel:false cvg_x_alpha:false
          // FIXME: this needs to blend the input colour with the fog alpha, but we don't compute this yet.
          mode = kBlendModeOpaque;
          break;

        case 0x0302: //G_BL_CLR_IN,G_BL_0,G_BL_CLR_IN,G_BL_1
          // This blend mode doesn't use the alpha value
          mode = kBlendModeOpaque;
          break;
        case 0x0310: //G_BL_CLR_IN,G_BL_0,G_BL_CLR_MEM,G_BL_1MA, alpha_cvg_sel:false cvg_x_alpha:false
          mode = kBlendModeFade;
          break;

        default:
          log(toString16(active_blend_mode) + ' : ' + blendOpText(active_blend_mode) +
            ', alpha_cvg_sel:' + alpha_cvg_sel + ', cvg_x_alpha:' + cvg_x_alpha);
          mode = kBlendModeOpaque;
          break;
      }

      if (mode == kBlendModeAlphaTrans) {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendEquation(gl.FUNC_ADD);
        gl.enable(gl.BLEND);
      } else if (mode == kBlendModeFade) {
        gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendEquation(gl.FUNC_ADD);
        gl.enable(gl.BLEND);
      } else {
        gl.disable(gl.BLEND);
      }
    } else {
      // No blending in copy/fill modes, although we do alpha thresholding below
      gl.disable(gl.BLEND);
    }

    var alpha_threshold = -1.0;

    if ((getAlphaCompareType() === AlphaCompare.G_AC_THRESHOLD)) {
      // If using cvg, then there's no alpha value to work with
      if (!alpha_cvg_sel) {
        alpha_threshold = ((state.blendColor >>> 0) & 0xff) / 255.0;
      }
      // } else if (cvg_x_alpha) {
      // Going over 0x70 brakes OOT, but going lesser than that makes lines on games visible...ex: Paper Mario.
      // Also going over 0x30 breaks the birds in Tarzan :(. Need to find a better way to leverage this.
      // sceGuAlphaFunc(GU_GREATER, 0x70, 0xff);
      // sceGuEnable(GU_ALPHA_TEST);
    }

    var shader = getCurrentN64Shader(cycle_type, alpha_threshold);
    gl.useProgram(shader.program);

    // aVertexPosition
    gl.enableVertexAttribArray(shader.vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, n64PositionsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.vertexAttribPointer(shader.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);

    // aVertexColor
    gl.enableVertexAttribArray(shader.vertexColorAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, n64ColorsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colours, gl.STATIC_DRAW);
    gl.vertexAttribPointer(shader.vertexColorAttribute, 4, gl.UNSIGNED_BYTE, true, 0, 0);

    // aTextureCoord
    gl.enableVertexAttribArray(shader.texCoordAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, n64UVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, coords, gl.STATIC_DRAW);
    gl.vertexAttribPointer(shader.texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    // uSampler
    if (texture) {
      var uv_offset_u = texture.left;
      var uv_offset_v = texture.top;
      var uv_scale_u = 1.0 / texture.nativeWidth;
      var uv_scale_v = 1.0 / texture.nativeHeight;

      // Horrible hack for wetrix. For some reason uvs come out 2x what they
      // should be. Current guess is that it's getting G_TX_CLAMP with a shift
      // of 0 which is causing this
      if (texture.width === 56 && texture.height === 29) {
        uv_scale_u *= 0.5;
        uv_scale_v *= 0.5;
      }

      // When texture coordinates are generated, they're already correctly
      // scaled. Maybe they should be generated in this coord space?
      if (tex_gen_enabled) {
        uv_scale_u = 1;
        uv_scale_v = 1;
        uv_offset_u = 0;
        uv_offset_v = 0;
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture.texture);
      gl.uniform1i(shader.uSamplerUniform, 0);

      gl.uniform2f(shader.uTexScaleUniform, uv_scale_u, uv_scale_v);
      gl.uniform2f(shader.uTexOffsetUniform, uv_offset_u, uv_offset_v);

      if (getTextureFilterType() == TextureFilter.G_TF_POINT) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      }
    }

    gl.uniform4f(shader.uPrimColorUniform,
      ((state.primColor >>> 24) & 0xff) / 255.0,
      ((state.primColor >>> 16) & 0xff) / 255.0,
      ((state.primColor >>> 8) & 0xff) / 255.0,
      ((state.primColor >>> 0) & 0xff) / 255.0);
    gl.uniform4f(shader.uEnvColorUniform,
      ((state.envColor >>> 24) & 0xff) / 255.0,
      ((state.envColor >>> 16) & 0xff) / 255.0,
      ((state.envColor >>> 8) & 0xff) / 255.0,
      ((state.envColor >>> 0) & 0xff) / 255.0);
  }

  function flushTris(num_tris) {
    var cycle_type = getCycleType();
    var texture;
    var tex_gen_enabled = false;

    if (state.geometryMode.texture) {
      texture = lookupTexture(state.texture.tile);
      tex_gen_enabled = state.geometryMode.lighting &&
        state.geometryMode.textureGen;
    }

    setProgramState(triangleBuffer.positions,
      triangleBuffer.colours,
      triangleBuffer.coords,
      texture,
      tex_gen_enabled);

    initDepth();

    // texture filter

    if (state.geometryMode.cullFront || state.geometryMode.cullBack) {
      gl.enable(gl.CULL_FACE);
      var mode = (state.geometryMode.cullFront) ? gl.FRONT : gl.BACK;
      gl.cullFace(mode);
    } else {
      gl.disable(gl.CULL_FACE);
    }

    gl.drawArrays(gl.TRIANGLES, 0, num_tris);
    //gl.drawArrays(gl.LINE_STRIP, 0, num_tris);
  }

  function fillRect(x0, y0, x1, y1, color) {
    // multiply by state.viewport.trans/scale
    var screen0 = convertN64ToCanvas([x0, y0]);
    var screen1 = convertN64ToCanvas([x1, y1]);

    var vertices = [
      screen1[0], screen1[1], 0.0,
      screen0[0], screen1[1], 0.0,
      screen1[0], screen0[1], 0.0,
      screen0[0], screen0[1], 0.0
    ];

    gl.useProgram(fillShaderProgram);

    // aVertexPosition
    gl.enableVertexAttribArray(fill_vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, rectVerticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(fill_vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // uPMatrix
    gl.uniformMatrix4fv(fill_uPMatrix, false, canvas2dMatrix.elems);

    // uFillColor
    gl.uniform4f(fill_uFillColor, color.r, color.g, color.b, color.a);

    // Disable depth testing
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.depthMask(false);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function texRect(tileIdx, x0, y0, x1, y1, s0, t0, s1, t1, flip) {
    // TODO: check scissor
    var texture = lookupTexture(tileIdx);

    // multiply by state.viewport.trans/scale
    var screen0 = convertN64ToDisplay([x0, y0]);
    var screen1 = convertN64ToDisplay([x1, y1]);
    var depth_source_prim = (state.rdpOtherModeL & DepthSource.G_ZS_PRIM) !== 0;
    var depth = depth_source_prim ? state.primDepth : 0.0;

    var vertices = [
      screen0[0], screen0[1], depth, 1.0,
      screen1[0], screen0[1], depth, 1.0,
      screen0[0], screen1[1], depth, 1.0,
      screen1[0], screen1[1], depth, 1.0
    ];

    var uvs;

    if (flip) {
      uvs = [
        s0, t0,
        s0, t1,
        s1, t0,
        s1, t1,
      ];
    } else {
      uvs = [
        s0, t0,
        s1, t0,
        s0, t1,
        s1, t1,
      ];
    }

    var colours = [0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff];

    setProgramState(new Float32Array(vertices),
                    new Uint32Array(colours),
                    new Float32Array(uvs), texture, false /*tex_gen_enabled*/ );

    gl.disable(gl.CULL_FACE);

    var depth_enabled = depth_source_prim ? true : false;
    if (depth_enabled) {
      initDepth();
    } else {
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function copyBackBufferToFrontBuffer(texture) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    var vertices = [
      -1.0, -1.0, 0.0, 1.0,
      1.0, -1.0, 0.0, 1.0,
      -1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 1.0
    ];

    var uvs = [
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0
    ];

    gl.useProgram(blitShaderProgram);

    // aVertexPosition
    gl.enableVertexAttribArray(blit_vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, n64PositionsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(blit_vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);

    // aTextureCoord
    gl.enableVertexAttribArray(blit_texCoordAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, n64UVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    gl.vertexAttribPointer(blit_texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    // uSampler
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(blit_uSampler, 0);

    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function initDepth() {

    // Fixes Zfighting issues we have on the PSP.
    //if (gRDPOtherMode.zmode == 3) ...

    // Disable depth testing
    var zgeom_mode = (state.geometryMode.zbuffer) !== 0;
    var zcmp_rendermode = (state.rdpOtherModeL & RenderMode.Z_CMP) !== 0;
    var zupd_rendermode = (state.rdpOtherModeL & RenderMode.Z_UPD) !== 0;

    if ((zgeom_mode && zcmp_rendermode) || zupd_rendermode) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }

    gl.depthMask(zupd_rendermode);
  }

  // A lot of functions are common between all ucodes
  // TOOD(hulkholden): Make this a Map?
  const ucode_common = {
    0xe4: executeTexRect,
    0xe5: executeTexRectFlip,
    0xe6: executeRDPLoadSync,
    0xe7: executeRDPPipeSync,
    0xe8: executeRDPTileSync,
    0xe9: executeRDPFullSync,
    0xea: executeSetKeyGB,
    0xeb: executeSetKeyR,
    0xec: executeSetConvert,
    0xed: executeSetScissor,
    0xee: executeSetPrimDepth,
    0xef: executeSetRDPOtherMode,
    0xf0: executeLoadTLut,
    0xf2: executeSetTileSize,
    0xf3: executeLoadBlock,
    0xf4: executeLoadTile,
    0xf5: executeSetTile,
    0xf6: executeFillRect,
    0xf7: executeSetFillColor,
    0xf8: executeSetFogColor,
    0xf9: executeSetBlendColor,
    0xfa: executeSetPrimColor,
    0xfb: executeSetEnvColor,
    0xfc: executeSetCombine,
    0xfd: executeSetTImg,
    0xfe: executeSetZImg,
    0xff: executeSetCImg
  };

  const ucode_gbi0 = {
    0x00: executeGBI1_SpNoop,
    0x01: executeGBI1_Matrix,
    0x03: executeGBI1_MoveMem,
    0x04: executeGBI0_Vertex,
    0x06: executeGBI1_DL,
    0x09: executeGBI1_Sprite2DBase,

    0xb0: executeGBI1_BranchZ, // GBI1 only?
    0xb1: executeGBI1_Tri2, // GBI1 only?
    0xb2: executeGBI1_RDPHalf_Cont,
    0xb3: executeGBI1_RDPHalf_2,
    0xb4: executeGBI1_RDPHalf_1,
    0xb5: executeGBI1_Line3D,
    0xb6: executeGBI1_ClrGeometryMode,
    0xb7: executeGBI1_SetGeometryMode,
    0xb8: executeGBI1_EndDL,
    0xb9: executeGBI1_SetOtherModeL,
    0xba: executeGBI1_SetOtherModeH,
    0xbb: executeGBI1_Texture,
    0xbc: executeGBI1_MoveWord,
    0xbd: executeGBI1_PopMatrix,
    0xbe: executeGBI1_CullDL,
    0xbf: executeGBI1_Tri1,
    0xc0: executeGBI1_Noop
  };

  const ucode_gbi1 = {
    0x00: executeGBI1_SpNoop,
    0x01: executeGBI1_Matrix,
    0x03: executeGBI1_MoveMem,
    0x04: executeGBI1_Vertex,
    0x06: executeGBI1_DL,
    0x09: executeGBI1_Sprite2DBase,

    0xb0: executeGBI1_BranchZ,
    0xb1: executeGBI1_Tri2,
    0xb2: executeGBI1_ModifyVtx,
    0xb3: executeGBI1_RDPHalf_2,
    0xb4: executeGBI1_RDPHalf_1,
    0xb5: executeGBI1_Line3D,
    0xb6: executeGBI1_ClrGeometryMode,
    0xb7: executeGBI1_SetGeometryMode,
    0xb8: executeGBI1_EndDL,
    0xb9: executeGBI1_SetOtherModeL,
    0xba: executeGBI1_SetOtherModeH,
    0xbb: executeGBI1_Texture,
    0xbc: executeGBI1_MoveWord,
    0xbd: executeGBI1_PopMatrix,
    0xbe: executeGBI1_CullDL,
    0xbf: executeGBI1_Tri1,
    0xc0: executeGBI1_Noop
  };

  const ucode_gbi2 = {
    0x00: executeGBI2_Noop,
    0x01: executeGBI2_Vertex,
    0x02: executeGBI2_ModifyVtx,
    0x03: executeGBI2_CullDL,
    0x04: executeGBI2_BranchZ,
    0x05: executeGBI2_Tri1,
    0x06: executeGBI2_Tri2,
    0x07: executeGBI2_Quad,
    0x08: executeGBI2_Line3D,

    // 0xd3: executeGBI2_Special1,
    // 0xd4: executeGBI2_Special2,
    // 0xd5: executeGBI2_Special3,
    0xd6: executeGBI2_DmaIo,
    0xd7: executeGBI2_Texture,
    0xd8: executeGBI2_PopMatrix,
    0xd9: executeGBI2_GeometryMode,
    0xda: executeGBI2_Matrix,
    0xdb: executeGBI2_MoveWord,
    0xdc: executeGBI2_MoveMem,
    0xdd: executeGBI2_LoadUcode,
    0xde: executeGBI2_DL,
    0xdf: executeGBI2_EndDL,

    0xe0: executeGBI2_SpNoop,
    0xe1: executeGBI2_RDPHalf_1,
    0xe2: executeGBI2_SetOtherModeL,
    0xe3: executeGBI2_SetOtherModeH,

    0xf1: executeGBI2_RDPHalf_2
  };

  function executeGBI2_Noop(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsDPNoOp();');
    }
  }

  function executeGBI2_Vertex(cmd0, cmd1, dis) {
    var vend = ((cmd0) & 0xff) >> 1;
    var n = (cmd0 >>> 12) & 0xff;
    var v0 = vend - n;
    var address = rdpSegmentAddress(cmd1);

    if (dis) {
      dis.text('gsSPVertex(' + toString32(address) + ', ' + n + ', ' + v0 + ');');
    }

    executeVertexImpl(v0, n, address, dis);
  }

  function executeGBI2_ModifyVtx(cmd0, cmd1, dis) {
    var vtx = (cmd0 >>> 1) & 0x7fff;
    var offset = (cmd0 >>> 16) & 0xff;
    var value = cmd1;

    if (dis) {
      dis.text('gsSPModifyVertex(' + vtx + ',' +
        ModifyVtx.nameOf(offset) + ',' +
        toString32(value) + ');');
    }

    // Cures crash after swinging in Mario Golf
    if (vtx >= state.projectedVertices.length) {
      hleHalt('crazy vertex index');
      return;
    }

    var vertex = state.projectedVertices[vtx];

    switch (offset) {
      case ModifyVtx.G_MWO_POINT_RGBA:
        hleHalt('unhandled modifyVtx');
        break;

      case ModifyVtx.G_MWO_POINT_ST:
        // u/v are signed
        var u = (value >> 16);
        var v = ((value & 0xffff) << 16) >> 16;
        vertex.set = true;
        vertex.u = u * state.texture.scaleS / 32.0;
        vertex.v = v * state.texture.scaleT / 32.0;
        break;

      case ModifyVtx.G_MWO_POINT_XYSCREEN:
        hleHalt('unhandled modifyVtx');
        break;

      case ModifyVtx.G_MWO_POINT_ZSCREEN:
        hleHalt('unhandled modifyVtx');
        break;

      default:
        hleHalt('unhandled modifyVtx');
        break;
    }
  }

  function executeGBI2_CullDL(cmd0, cmd1, dis) {}

  function executeGBI2_BranchZ(cmd0, cmd1, dis) {}

  function executeGBI2_Tri1(cmd0, cmd1, dis) {
    var kTri1 = cmd0 >>> 24;
    var stride = config.vertexStride;
    var verts = state.projectedVertices;

    var triIdx = 0;

    var pc = state.pc;
    do {
      var flag = (cmd1 >>> 24) & 0xff;
      var v0idx = (cmd0 >>> 17) & 0x7f;
      var v1idx = (cmd0 >>> 9) & 0x7f;
      var v2idx = (cmd0 >>> 1) & 0x7f;

      if (dis) {
        dis.text('gsSP1Triangle(' + v0idx + ', ' + v1idx + ', ' + v2idx + ', ' + flag + ');');
      }

      triangleBuffer.pushTri(verts[v0idx], verts[v1idx], verts[v2idx], triIdx);
      triIdx++;

      cmd0 = ram_dv.getUint32(pc + 0);
      cmd1 = ram_dv.getUint32(pc + 4);
      ++debugCurrentOp;
      pc += 8;

      // NB: process triangles individually when disassembling
    } while ((cmd0 >>> 24) === kTri1 && triIdx < kMaxTris && !dis);

    state.pc = pc - 8;
    --debugCurrentOp;

    flushTris(triIdx * 3);
  }

  function executeGBI2_Tri2(cmd0, cmd1, dis) {
    var kTri2 = cmd0 >>> 24;
    var stride = config.vertexStride;
    var verts = state.projectedVertices;

    var triIdx = 0;

    var pc = state.pc;
    do {
      var v0idx = (cmd1 >>> 1) & 0x7f;
      var v1idx = (cmd1 >>> 9) & 0x7f;
      var v2idx = (cmd1 >>> 17) & 0x7f;
      var v3idx = (cmd0 >>> 1) & 0x7f;
      var v4idx = (cmd0 >>> 9) & 0x7f;
      var v5idx = (cmd0 >>> 17) & 0x7f;

      if (dis) {
        dis.text('gsSP1Triangle2(' + v0idx + ',' + v1idx + ',' + v2idx + ', ' +
          v3idx + ',' + v4idx + ',' + v5idx + ');');
      }

      triangleBuffer.pushTri(verts[v0idx], verts[v1idx], verts[v2idx], triIdx);
      triIdx++;
      triangleBuffer.pushTri(verts[v3idx], verts[v4idx], verts[v5idx], triIdx);
      triIdx++;

      cmd0 = ram_dv.getUint32(pc + 0);
      cmd1 = ram_dv.getUint32(pc + 4);
      ++debugCurrentOp;
      pc += 8;
      // NB: process triangles individually when disassembling
    } while ((cmd0 >>> 24) === kTri2 && triIdx < kMaxTris && !dis);

    state.pc = pc - 8;
    --debugCurrentOp;

    flushTris(triIdx * 3);
  }

  function executeGBI2_Quad(cmd0, cmd1, dis) {}

  function executeGBI2_Line3D(cmd0, cmd1, dis) {}

  function executeGBI2_DmaIo(cmd0, cmd1, dis) {}

  function executeGBI2_Texture(cmd0, cmd1, dis) {
    var xparam = (cmd0 >>> 16) & 0xff;
    var level = (cmd0 >>> 11) & 0x3;
    var tileIdx = (cmd0 >>> 8) & 0x7;
    var on = (cmd0 >>> 1) & 0x01; // NB: uses bit 1
    var s = calcTextureScale(((cmd1 >>> 16) & 0xffff));
    var t = calcTextureScale(((cmd1 >>> 0) & 0xffff));

    if (dis) {
      var s_text = s.toString();
      var t_text = t.toString();
      var tt = getTileText(tileIdx);

      if (xparam !== 0) {
        dis.text('gsSPTextureL(' +
          s_text + ', ' + t_text + ', ' +
          level + ', ' + xparam + ', ' + tt + ', ' + on + ');');
      } else {
        dis.text('gsSPTexture(' +
          s_text + ', ' + t_text + ', ' +
          level + ', ' + tt + ', ' + on + ');');
      }
    }

    state.texture.level = level;
    state.texture.tile = tileIdx;
    state.texture.scaleS = s;
    state.texture.scaleT = t;

    if (on) {
      state.geometryModeBits |= GeometryModeGBI2.G_TEXTURE_ENABLE;
    } else {
      state.geometryModeBits &= ~GeometryModeGBI2.G_TEXTURE_ENABLE;
    }
    updateGeometryModeFromBits(GeometryModeGBI2);
  }

  function executeGBI2_GeometryMode(cmd0, cmd1, dis) {
    var arg0 = cmd0 & 0x00ffffff;
    var arg1 = cmd1;

    if (dis) {
      dis.text('gsSPGeometryMode(~(' +
        getGeometryModeFlagsText(GeometryModeGBI2, ~arg0) + '),' +
        getGeometryModeFlagsText(GeometryModeGBI2, arg1) + ');');
    }

    state.geometryModeBits &= arg0;
    state.geometryModeBits |= arg1;
    updateGeometryModeFromBits(GeometryModeGBI2);
  }

  function executeGBI2_Matrix(cmd0, cmd1, dis) {
    var address = rdpSegmentAddress(cmd1);
    var push = ((cmd0) & 0x1) === 0;
    var replace = (cmd0 >>> 1) & 0x1;
    var projection = (cmd0 >>> 2) & 0x1;

    var matrix = loadMatrix(address);

    if (dis) {
      var t = '';
      t += projection ? 'G_MTX_PROJECTION' : 'G_MTX_MODELVIEW';
      t += replace ? '|G_MTX_LOAD' : '|G_MTX_MUL';
      t += push ? '|G_MTX_PUSH' : ''; //'|G_MTX_NOPUSH';

      dis.text('gsSPMatrix(' + toString32(address) + ', ' + t + ');');
      dis.tip(previewMatrix(matrix));
    }

    var stack = projection ? state.projection : state.modelview;

    if (!replace) {
      matrix = stack[stack.length - 1].multiply(matrix);
    }

    if (push) {
      stack.push(matrix);
    } else {
      stack[stack.length - 1] = matrix;
    }
  }

  function executeGBI2_PopMatrix(cmd0, cmd1, dis) {
    // FIXME: not sure what bit this is
    //var projection =  ??;
    var projection = 0;

    if (dis) {
      var t = '';
      t += projection ? 'G_MTX_PROJECTION' : 'G_MTX_MODELVIEW';
      dis.text('gsSPPopMatrix(' + t + ');');
    }

    var stack = projection ? state.projection : state.modelview;
    if (stack.length > 0) {
      stack.pop();
    }
  }

  function executeGBI2_MoveWord(cmd0, cmd1, dis) {
    var type = (cmd0 >>> 16) & 0xff;
    var offset = (cmd0) & 0xffff;
    var value = cmd1;

    if (dis) {
      var text = 'gMoveWd(' + MoveWord.nameOf(type) + ', ' +
        toString16(offset) + ', ' + toString32(value) + ');';

      switch (type) {
        case MoveWord.G_MW_NUMLIGHT:
          var v = Math.floor(value / 24);
          text = 'gsSPNumLights(' + NumLights.nameOf(v) + ');';
          break;
        case MoveWord.G_MW_SEGMENT:
          {
            var v = value === 0 ? '0' : toString32(value);
            text = 'gsSPSegment(' + ((offset >>> 2) & 0xf) + ', ' + v + ');';
          }
          break;
      }
      dis.text(text);
    }

    switch (type) {
      // case gbi.MoveWord.G_MW_MATRIX:  unimplemented(cmd0,cmd1); break;
      case MoveWord.G_MW_NUMLIGHT:
        state.numLights = Math.floor(value / 24);
        break;
      case MoveWord.G_MW_CLIP:
        /*unimplemented(cmd0,cmd1);*/ break;
      case MoveWord.G_MW_SEGMENT:
        state.segments[((offset >>> 2) & 0xf)] = value;
        break;
      case MoveWord.G_MW_FOG:
        /*unimplemented(cmd0,cmd1);*/ break;
      case MoveWord.G_MW_LIGHTCOL:
        /*unimplemented(cmd0,cmd1);*/ break;
        // case gbi.MoveWord.G_MW_POINTS:    unimplemented(cmd0,cmd1); break;
      case MoveWord.G_MW_PERSPNORM:
        /*unimplemented(cmd0,cmd1);*/ break;
      default:
        unimplemented(cmd0, cmd1);
        break;
    }
  }

  function previewGBI2_MoveMem(type, length, address, dis) {
    var tip = '';
    for (var i = 0; i < length; ++i) {
      tip += toHex(ram_dv.getUint8(address + i), 8) + ' ';
    }
    tip += '<br>';

    switch (type) {
      // TODO(hulkholden): MoveMemGBI2?
      case MoveMemGBI1.G_MV_VIEWPORT:
        tip += previewViewport(address);
        break;

      case MoveMemGBI1.G_MV_L0:
      case MoveMemGBI1.G_MV_L1:
      case MoveMemGBI1.G_MV_L2:
      case MoveMemGBI1.G_MV_L3:
      case MoveMemGBI1.G_MV_L4:
      case MoveMemGBI1.G_MV_L5:
      case MoveMemGBI1.G_MV_L6:
      case MoveMemGBI1.G_MV_L7:
        tip += previewLight(address);
        break;
    }

    dis.tip(tip);
  }

  function executeGBI2_MoveMem(cmd0, cmd1, dis) {
    var type = cmd0 & 0xfe;
    //var length = (cmd0>>> 8) & 0xffff;
    var address = rdpSegmentAddress(cmd1);
    var length = 0; // FIXME

    if (dis) {
      var address_str = toString32(address);

      var type_str = MoveMemGBI2.nameOf(type);
      var text = 'gsDma1p(G_MOVEMEM, ' + address_str + ', ' + length + ', ' + type_str + ');';

      switch (type) {
        case MoveMemGBI2.G_GBI2_MV_VIEWPORT:
          text = 'gsSPViewport(' + address_str + ');';
          break;
        case MoveMemGBI2.G_GBI2_MV_LIGHT:
          var offset2 = (cmd0 >>> 5) & 0x3fff;
          switch (offset2) {
            case 0x00:
            case 0x18:
              // lookat?
              break;
            default:
              //
              var light_idx = Math.floor((offset2 - 0x30) / 0x18);
              text += ' // (light ' + light_idx + ')';
              break;
          }
          break;
      }

      dis.text(text);
      length = 32; // FIXME: Just show some data
      previewGBI2_MoveMem(type, length, address, dis);
    }

    switch (type) {
      case MoveMemGBI2.G_GBI2_MV_VIEWPORT:
        moveMemViewport(address);
        break;
      case MoveMemGBI2.G_GBI2_MV_LIGHT:
        var offset2 = (cmd0 >>> 5) & 0x3fff;
        switch (offset2) {
          case 0x00:
          case 0x18:
            // lookat?
            break;
          default:
            var light_idx = Math.floor((offset2 - 0x30) / 0x18);
            moveMemLight(light_idx, address);
            break;
        }
        break;

      default:
        hleHalt('unknown movemen: ' + type.toString(16));
    }
  }

  function executeGBI2_LoadUcode(cmd0, cmd1, dis) {}

  function executeGBI2_DL(cmd0, cmd1, dis) {
    var param = (cmd0 >>> 16) & 0xff;
    var address = rdpSegmentAddress(cmd1);

    if (dis) {
      var fn = (param === G_DL_PUSH) ? 'gsSPDisplayList' : 'gsSPBranchList';
      dis.text(fn + '(<span class="dl-branch">' + toString32(address) + '</span>);');
    }

    if (param === G_DL_PUSH) {
      state.dlistStack.push({ pc: state.pc });
    }
    state.pc = address;
  }

  function executeGBI2_EndDL(cmd0, cmd1, dis) {
    if (dis) {
      dis.text('gsSPEndDisplayList();');
    }

    if (state.dlistStack.length > 0) {
      state.pc = state.dlistStack.pop().pc;
    } else {
      state.pc = 0;
    }
  }

  function executeGBI2_SetOtherModeL(cmd0, cmd1, dis) {
    var shift = (cmd0 >>> 8) & 0xff;
    var len = (cmd0 >>> 0) & 0xff;
    var data = cmd1;
    var mask = (0x80000000 >> len) >>> shift; // NB: only difference to GBI1 is how the mask is constructed

    if (dis) {
      disassembleSetOtherModeL(dis, len, shift, data);
    }

    state.rdpOtherModeL = (state.rdpOtherModeL & ~mask) | data;
  }

  function executeGBI2_SetOtherModeH(cmd0, cmd1, dis) {
    var shift = (cmd0 >>> 8) & 0xff;
    var len = (cmd0 >>> 0) & 0xff;
    var data = cmd1;
    var mask = (0x80000000 >> len) >>> shift; // NB: only difference to GBI1 is how the mask is constructed

    if (dis) {
      disassembleSetOtherModeH(dis, len, shift, data);
    }

    state.rdpOtherModeH = (state.rdpOtherModeH & ~mask) | data;
  }

  function executeGBI2_SpNoop(cmd0, cmd1, dis) {}

  function executeGBI2_RDPHalf_1(cmd0, cmd1, dis) {}

  function executeGBI2_RDPHalf_2(cmd0, cmd1, dis) {}

  // var ucode_sprite2d = {
  //   0xbe: executeSprite2dScaleFlip,
  //   0xbd: executeSprite2dDraw
  // };

  // var ucode_dkr = {
  //   0x05:  executeDMATri,
  //   0x07:  executeGBI1_DLInMem,
  // };

  function buildUCodeTables(ucode) {
    var ucode_table = ucode_gbi0;

    switch (ucode) {
      case kUCode_GBI0:
      case kUCode_GBI0_WR:
      case kUCode_GBI0_GE:
        ucode_table = ucode_gbi0;
        break;
      case kUCode_GBI1:
        ucode_table = ucode_gbi1;
        break;
      case kUCode_GBI2:
        ucode_table = ucode_gbi2;
    }

    // Build a copy of the table as an array
    var table = [];
    for (var i = 0; i < 256; ++i) {
      var fn = executeUnknown;
      if (ucode_table.hasOwnProperty(i)) {
        fn = ucode_table[i];
      } else if (ucode_common.hasOwnProperty(i)) {
        fn = ucode_common[i];
      }
      table.push(fn);
    }

    // Patch in specific overrides
    switch (ucode) {
      case kUCode_GBI0_WR:
        table[0x04] = executeVertex_GBI0_WR;
        break;
      case kUCode_GBI0_GE:
        table[0xb1] = executeTri4_GBI0;
        table[0xb2] = executeGBI1_SpNoop; // FIXME
        table[0xb4] = executeGBI1_SpNoop; // FIXME - DLParser_RDPHalf1_GoldenEye;
        break;
    }

    return table;
  }

  var last_ucode_str = '';
  var num_display_lists_since_present = 0;

  n64js.presentBackBuffer = function(ram, origin) {
    var texture;

    n64js.onPresent();

    // NB: if no display lists executed, interpret framebuffer as bytes
    if (num_display_lists_since_present === 0) {
      //logger.log('new origin: ' + toString32(origin) + ' but no display lists rendered to skipping');

      origin = (origin & 0x7ffffffe) | 0; // NB: clear top bit (make address physical). Clear bottom bit (sometimes odd valued addresses are passed through)

      var width = 320;
      var height = 240;
      var pixels = new Uint16Array(width * height); // TODO: should cache this, but at some point we'll need to deal with variable framebuffer size, so do this later.

      var srcOffset = 0;

      for (var y = 0; y < height; ++y) {
        var dstRowOffset = (height - 1 - y) * width;
        var dstOffset = dstRowOffset;

        for (var x = 0; x < width; ++x) {
          // NB: or 1 to ensure we have alpha
          pixels[dstOffset] =
            (ram[origin + srcOffset] << 8) |
            ram[origin + srcOffset + 1] |
            1;
          dstOffset += 1;
          srcOffset += 2;
        }
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, frameBufferTexture2D);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_SHORT_5_5_5_1,
        pixels);
      texture = frameBufferTexture2D;
    } else {
      texture = frameBufferTexture3D;
    }

    copyBackBufferToFrontBuffer(texture);
    num_display_lists_since_present = 0;
  };

  function setViScales() {
    var width = n64js.viWidth();

    var scale_x = (n64js.viXScale() & 0xFFF) / 1024.0;
    var scale_y = (n64js.viYScale() & 0xFFF) / 2048.0;

    var h_start_reg = n64js.viHStart();
    var hstart = h_start_reg >> 16;
    var hend = h_start_reg & 0xffff;

    var v_start_reg = n64js.viVStart();
    var vstart = v_start_reg >> 16;
    var vend = v_start_reg & 0xffff;

    // Sometimes h_start_reg can be zero.. ex PD, Lode Runner, Cyber Tiger
    if (hend === hstart) {
      hend = (width / scale_x) | 0;
    }

    viWidth = (hend - hstart) * scale_x;
    viHeight = (vend - vstart) * scale_y * 1.0126582;

    // XXX Need to check PAL games.
    //if (g_ROM.TvType != OS_TV_NTSC) sRatio = 9/11.0f;

    //This corrects height in various games ex : Megaman 64, CyberTiger
    if (width > 0x300) {
      viHeight *= 2.0;
    }
  }

  /**
   * @constructor
   */
  function Disassembler() {
    this.$currentDis = $('<pre></pre>');
    this.$span = undefined;
    this.numOps = 0;
  }

  Disassembler.prototype.begin = function(pc, cmd0, cmd1, depth) {
    var indent = (new Array(depth)).join('    ');
    var pc_str = ' '; //' [' + toHex(pc,32) + '] '

    this.$span = $('<span class="hle-instr" id="I' + this.numOps + '" />');
    this.$span.append(padString(this.numOps, 5) + pc_str + toHex(cmd0, 32) + toHex(cmd1, 32) +
      ' ' + indent);
    this.$currentDis.append(this.$span);
  };

  Disassembler.prototype.text = function(t) {
    this.$span.append(t);
  };

  Disassembler.prototype.tip = function(t) {
    var $d = $('<div class="dl-tip">' + t + '</div>');
    $d.hide();
    this.$span.append($d);
  };

  Disassembler.prototype.end = function() {
    this.$span.append('<br>');
    this.numOps++;
  };

  Disassembler.prototype.finalise = function() {
    $dlistOutput.html(this.$currentDis);
    this.$currentDis.find('.dl-tip').parent().click(function() {
      $(this).find('.dl-tip').toggle();
    });
    // this.$currentDis.find('.dl-branch').click(function () {
    // });
  };

  n64js.debugDisplayListRequested = function() {
    return debugDisplayListRequested;
  };
  n64js.debugDisplayListRunning = function() {
    return debugDisplayListRunning;
  };

  function buildStateTab() {
    var $table = $('<table class="table table-condensed" style="width: auto;"></table>');
    var $tr = $('<tr />');

    for (let i in state.geometryMode) {
      if (state.geometryMode.hasOwnProperty(i)) {
        var $td = $('<td>' + i + '</td>');
        if (state.geometryMode[i]) {
          $td.css('background-color', '#AFF4BB');
        }
        $tr.append($td);
      }
    }

    $table.append($tr);
    return $table;
  }

  function buildRDPTab() {
    var l = state.rdpOtherModeL;
    var h = state.rdpOtherModeH;
    const vals = new Map([
      //var G_MDSFT_BLENDMASK = 0;
      ['alphaCompare', AlphaCompare.nameOf(l & G_AC_MASK)],
      ['depthSource', DepthSource.nameOf(l & G_ZS_MASK)],
      ['renderMode', getRenderModeText(l)],
      ['alphaDither', AlphaDither.nameOf(h & G_AD_MASK)],
      ['colorDither', ColorDither.nameOf(h & G_CD_MASK)],
      ['combineKey', CombineKey.nameOf(h & G_CK_MASK)],
      ['textureConvert', TextureConvert.nameOf(h & G_TC_MASK)],
      ['textureFilter', TextureFilter.nameOf(h & G_TF_MASK)],
      ['textureLUT', TextureLUT.nameOf(h & G_TT_MASK)],
      ['textureLOD', TextureLOD.nameOf(h & G_TL_MASK)],
      ['texturePersp', TexturePerspective.nameOf(h & G_TP_MASK)],
      ['textureDetail', TextureDetail.nameOf(h & G_TD_MASK)],
      ['cycleType', CycleType.nameOf(h & G_CYC_MASK)],
      ['pipelineMode', PipelineMode.nameOf(h & G_PM_MASK)],
    ]);

    var $table = $('<table class="table table-condensed" style="width: auto;"></table>');
    for (let [name, value] of vals) {
      let $tr = $('<tr><td>' + name + '</td><td>' + value + '</td></tr>');
      $table.append($tr);
    }
    return $table;
  }

  function buildColorsTable() {
    const colors = [
      'fillColor',
      'envColor',
      'primColor',
      'blendColor',
      'fogColor',
    ];

    var $table = $('<table class="table table-condensed" style="width: auto;"></table>');
    for (let color of colors) {
      let row = $('<tr><td>' + color + '</td><td>' + makeColorTextRGBA(state[color]) +
        '</td></tr>');
      $table.append(row);
    }
    return $table;
  }

  function buildCombinerTab() {
    var $p = $('<pre class="combine"></pre>');
    $p.append(CycleType.nameOf(getCycleType()) + '\n');
    $p.append(buildColorsTable());
    $p.append(getCombinerText(state.combine.hi, state.combine.lo));
    return $p;
  }

  function buildTexture(tileIdx) {
    var texture = lookupTexture(tileIdx);
    if (texture) {
      const kScale = 8;
      return texture.createScaledCanvas(kScale);
    }
  }

  function buildTexturesTab() {
    var $d = $('<div />');
    $d.append(buildTilesTable());
    for (let i = 0; i < 8; ++i) {
      let $t = buildTexture(i);
      if ($t) {
        $d.append($t);
      }
    }
    return $d;
  }

  function buildTilesTable() {
    const tile_fields = [
      'tile #',
      'format',
      'size',
      'line',
      'tmem',
      'palette',
      'cm_s',
      'mask_s',
      'shift_s',
      'cm_t',
      'mask_t',
      'shift_t',
      'left',
      'top',
      'right',
      'bottom'
    ];

    var $table = $('<table class="table table-condensed" style="width: auto"></table>');
    var $tr = $('<tr><th>' + tile_fields.join('</th><th>') + '</th></tr>');
    $table.append($tr);

    for (let i = 0; i < state.tiles.length; ++i) {
      var tile = state.tiles[i];

      // Ignore any tiles that haven't been set up.
      if (tile.format === -1) {
        continue;
      }

      var vals = [];
      vals.push(i);
      vals.push(ImageFormat.nameOf(tile.format));
      vals.push(ImageSize.nameOf(tile.size));
      vals.push(tile.line);
      vals.push(tile.tmem);
      vals.push(tile.palette);
      vals.push(getClampMirrorWrapText(tile.cm_s));
      vals.push(tile.mask_s);
      vals.push(tile.shift_s);
      vals.push(getClampMirrorWrapText(tile.cm_t));
      vals.push(tile.mask_t);
      vals.push(tile.shift_t);
      vals.push(tile.left);
      vals.push(tile.top);
      vals.push(tile.right);
      vals.push(tile.bottom);

      $tr = $('<tr><td>' + vals.join('</td><td>') + '</td></tr>');
      $table.append($tr);
    }

    return $table;
  }

  function buildVerticesTab() {
    const vtx_fields = [
      'vtx #',
      'x',
      'y',
      'z',
      'px',
      'py',
      'pz',
      'pw',
      'color',
      'u',
      'v'
    ];

    var $table = $('<table class="table table-condensed" style="width: auto"></table>');
    var $tr = $('<tr><th>' + vtx_fields.join('</th><th>') + '</th></tr>');
    $table.append($tr);

    for (let i = 0; i < state.projectedVertices.length; ++i) {
      var vtx = state.projectedVertices[i];
      if (!vtx.set) {
        continue;
      }

      var x = vtx.pos.elems[0] / vtx.pos.elems[3];
      var y = vtx.pos.elems[1] / vtx.pos.elems[3];
      var z = vtx.pos.elems[2] / vtx.pos.elems[3];

      var vals = [];
      vals.push(i);
      vals.push(x.toFixed(3));
      vals.push(y.toFixed(3));
      vals.push(z.toFixed(3));
      vals.push(vtx.pos.elems[0].toFixed(3));
      vals.push(vtx.pos.elems[1].toFixed(3));
      vals.push(vtx.pos.elems[2].toFixed(3));
      vals.push(vtx.pos.elems[3].toFixed(3));
      vals.push(makeColorTextABGR(vtx.color));
      vals.push(vtx.u.toFixed(3));
      vals.push(vtx.v.toFixed(3));

      $tr = $('<tr><td>' + vals.join('</td><td>') + '</td></tr>');
      $table.append($tr);
    }

    return $table;
  }

  function updateStateUI() {
    $dlistState.find('#dl-geometrymode-content').html(buildStateTab());
    $dlistState.find('#dl-vertices-content').html(buildVerticesTab());
    $dlistState.find('#dl-textures-content').html(buildTexturesTab());
    $dlistState.find('#dl-combiner-content').html(buildCombinerTab());
    $dlistState.find('#dl-rdp-content').html(buildRDPTab());
  }

  function showDebugDisplayListUI() {
    $('.debug').show();
    $('#dlist-tab').tab('show');
  }

  function hideDebugDisplayListUI() {
    $('.debug').hide();
  }

  n64js.toggleDebugDisplayList = function() {
    if (debugDisplayListRunning) {
      hideDebugDisplayListUI();
      debugBailAfter = -1;
      debugDisplayListRunning = false;
      n64js.toggleRun();
    } else {
      showDebugDisplayListUI();
      debugDisplayListRequested = true;
    }
  };

  // This is acalled repeatedly so that we can update the ui.
  // We can return false if we don't render anything, but it's useful to keep re-rendering so that we can plot a framerate graph
  n64js.debugDisplayList = function() {
    if (debugStateTimeShown == -1) {
      // Build some disassembly for this display list
      var disassembler = new Disassembler();
      processDList(debugLastTask, disassembler, -1);
      disassembler.finalise();

      // Update the scrubber based on the new length of disassembly
      debugNumOps = disassembler.numOps > 0 ? (disassembler.numOps - 1) : 0;
      setScrubRange(debugNumOps);

      // If debugBailAfter hasn't been set (e.g. by hleHalt), stop at the end of the list
      var time_to_show = (debugBailAfter == -1) ? debugNumOps : debugBailAfter;
      setScrubTime(time_to_show);
    }

    // Replay the last display list using the captured task/ram
    processDList(debugLastTask, null, debugBailAfter);

    // Only update the state display when needed, otherwise it's impossible to
    // debug the dom in Chrome
    if (debugStateTimeShown !== debugBailAfter) {
      updateStateUI();
      debugStateTimeShown = debugBailAfter;
    }

    return true;
  };

  function hleGraphics(task) {
    // Bodgily track these parameters so that we can call again with the same params.
    debugLastTask = task;

    // Force the cpu to stop at the point that we render the display list.
    if (debugDisplayListRequested) {
      debugDisplayListRequested = false;

      // Finally, break execution so we can keep replaying the display list
      // before any other state changes.
      n64js.breakEmulationForDisplayListDebug();

      debugStateTimeShown = -1;
      debugDisplayListRunning = true;
    }

    processDList(task, null, -1);
  }

  function processDList(task, disassembler, bail_after) {
    // Update a counter to tell the video code that we've rendered something since the last vbl.
    ++num_display_lists_since_present;
    if (!gl) {
      return;
    }

    var str = task.detectVersionString();
    var ucode = kUCode_GBI0;

    //RSP Gfx ucode F3DEX.NoN fifo 2.08 Yoshitaka Yasumoto 1999 Nintendo

    // FIXME: lots of work here
    if (str.indexOf('F3DEX') >= 0 ||
      str.indexOf('F3DLP') >= 0 ||
      str.indexOf('F3DLX') >= 0) {
      ucode = kUCode_GBI1;

      if (str.indexOf('2.') >= 0) {
        ucode = kUCode_GBI2;
      }

    } else {
      var val = task.computeMicrocodeHash();
      switch (val) {
        case 0x00000000:
          ucode = kUCode_GBI0;
          log('ucode is empty?');
          break;
        case 0xd73a12c4:
          ucode = kUCode_GBI0;
          break; // Fish demo
        case 0xf4c3491b:
          ucode = kUCode_GBI0;
          break; // Super Mario 64
        case 0x313f038b:
          ucode = kUCode_GBI0;
          break; // PilotWings
        case 0x64cc729d:
          ucode = kUCode_GBI0_WR;
          break; // Wave Race
        case 0x23f92542:
          ucode = kUCode_GBI0_GE;
          break; // Goldeneye
        default:
          hleHalt('Unknown GBI hash ' + toString32(val));
          break;
      }
    }

    if (str !== last_ucode_str) {
      log('GFX: ' + graphics_task_count + ' - ' + str + ' = ucode ' + ucode);
    }
    last_ucode_str = str;

    var ram = n64js.getRamDataView();

    resetState(ucode, ram, task.data_ptr);
    var ucode_table = buildUCodeTables(ucode);

    // Render everything to the back buffer. This prevents horrible flickering
    // if due to webgl clearing our context between updates.
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    setViScales();

    var canvas = document.getElementById('display');
    setCanvasViewport(canvas.clientWidth, canvas.clientHeight);

    var pc, cmd0, cmd1;

    if (disassembler) {
      debugCurrentOp = 0;

      while (state.pc !== 0) {
        pc = state.pc;
        cmd0 = ram.getUint32(pc + 0);
        cmd1 = ram.getUint32(pc + 4);
        state.pc += 8;

        disassembler.begin(pc, cmd0, cmd1, state.dlistStack.length);
        ucode_table[cmd0 >>> 24](cmd0, cmd1, disassembler);
        disassembler.end();
        debugCurrentOp++;
      }
    } else {
      // Vanilla loop, no disassembler to worry about
      debugCurrentOp = 0;
      while (state.pc !== 0) {
        pc = state.pc;
        cmd0 = ram.getUint32(pc + 0);
        cmd1 = ram.getUint32(pc + 4);
        state.pc += 8;

        ucode_table[cmd0 >>> 24](cmd0, cmd1);

        if (bail_after > -1 && debugCurrentOp >= bail_after) {
          break;
        }
        debugCurrentOp++;
      }
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function resetState(ucode, ram, pc) {
    config.vertexStride = kUcodeStrides[ucode];

    ram_u8 = n64js.getRamU8Array();
    ram_s32 = n64js.getRamS32Array();
    ram_dv = ram; // FIXME: remove DataView
    state.rdpOtherModeL = 0x00500001;
    state.rdpOtherModeH = 0x00000000;

    state.projection = [Matrix.identity()];
    state.modelview = [Matrix.identity()];

    state.geometryModeBits = 0;
    state.geometryMode.zbuffer = 0;
    state.geometryMode.texture = 0;
    state.geometryMode.shade = 0;
    state.geometryMode.shadeSmooth = 0;
    state.geometryMode.cullFront = 0;
    state.geometryMode.cullBack = 0;
    state.geometryMode.fog = 0;
    state.geometryMode.lighting = 0;
    state.geometryMode.textureGen = 0;
    state.geometryMode.textureGenLinear = 0;
    state.geometryMode.lod = 0;

    state.pc = pc;
    state.dlistStack = [];
    for (let i = 0; i < state.segments.length; ++i) {
      state.segments[i] = 0;
    }

    for (let i = 0; i < state.tiles.length; ++i) {
      state.tiles[i] = new Tile();
    }

    state.numLights = 0;
    for (let i = 0; i < state.lights.length; ++i) {
      state.lights[i] = { color: { r: 0, g: 0, b: 0, a: 0 }, dir: Vector3.create([1, 0, 0]) };
    }

    for (let i = 0; i < state.projectedVertices.length; ++i) {
      state.projectedVertices[i] = new ProjectedVertex();
    }
  }

  function setScrubText(x, max) {
    $dlistScrub.find('.scrub-text').html('uCode op ' + x + '/' + max + '.');
  }

  function setScrubRange(max) {
    $dlistScrub.find('input').attr({
      min: 0,
      max: max,
      value: max
    });
    setScrubText(max, max);
  }

  function setScrubTime(t) {
    debugBailAfter = t;
    setScrubText(debugBailAfter, debugNumOps);

    var $instr = $dlistOutput.find('#I' + debugBailAfter);

    $dlistOutput.scrollTop($dlistOutput.scrollTop() + $instr.position().top -
      $dlistOutput.height() / 2 + $instr.height() / 2);

    $dlistOutput.find('.hle-instr').removeAttr('style');
    $instr.css('background-color', 'rgb(255,255,204)');
  }

  function initDebugUI() {
    var $dlistControls = $dlistContent.find('#controls');

    debugBailAfter = -1;
    debugNumOps = 0;

    $dlistControls.find('#rwd').click(function() {
      if (debugDisplayListRunning && debugBailAfter > 0) {
        setScrubTime(debugBailAfter - 1);
      }
    });
    $dlistControls.find('#fwd').click(function() {
      if (debugDisplayListRunning && debugBailAfter < debugNumOps) {
        setScrubTime(debugBailAfter + 1);
      }
    });
    $dlistControls.find('#stop').click(function() {
      n64js.toggleDebugDisplayList();
    });

    $dlistScrub = $dlistControls.find('.scrub');
    $dlistScrub.find('input').change(function() {
      setScrubTime($(this).val() | 0);
    });
    setScrubRange(0);

    $dlistState = $dlistContent.find('.hle-state');

    $dlistOutput = $('<div class="hle-disasm"></div>');
    $('#adjacent-debug').empty().append($dlistOutput);
  }

  //
  // Called when the canvas is created to get the ball rolling.
  // Figuratively, that is. There's nothing moving in this demo.
  //
  n64js.initialiseRenderer = function($canvas) {
    initDebugUI();

    var canvas = $canvas[0];
    initWebGL(canvas); // Initialize the GL context

    // Only continue if WebGL is available and working
    if (gl) {
      frameBufferTexture2D = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, frameBufferTexture2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // We call texImage2D to initialise frameBufferTexture2D when it's used

      frameBuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
      frameBuffer.width = 640;
      frameBuffer.height = 480;

      frameBufferTexture3D = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, frameBufferTexture3D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, frameBuffer.width, frameBuffer.height, 0, gl.RGBA,
        gl.UNSIGNED_BYTE, null);

      var renderbuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, frameBuffer.width,
        frameBuffer.height);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        frameBufferTexture3D, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER,
        renderbuffer);

      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // Clear to black, fully opaque
      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      // Clear everything
      gl.clearDepth(1.0);

      // Enable depth testing
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);

      // Near things obscure far things
      gl.depthFunc(gl.LEQUAL);

      fillShaderProgram = createShaderProgram(gl, "fill-shader-vs", "fill-shader-fs");
      fill_vertexPositionAttribute = gl.getAttribLocation(fillShaderProgram, "aVertexPosition");
      fill_uPMatrix = gl.getUniformLocation(fillShaderProgram, "uPMatrix");
      fill_uFillColor = gl.getUniformLocation(fillShaderProgram, "uFillColor");

      blitShaderProgram = createShaderProgram(gl, "blit-shader-vs", "blit-shader-fs");
      blit_vertexPositionAttribute = gl.getAttribLocation(blitShaderProgram, "aVertexPosition");
      blit_texCoordAttribute = gl.getAttribLocation(blitShaderProgram, "aTextureCoord");
      blit_uSampler = gl.getUniformLocation(blitShaderProgram, "uSampler");

      rectVerticesBuffer = gl.createBuffer();
      n64PositionsBuffer = gl.createBuffer();
      n64ColorsBuffer = gl.createBuffer();
      n64UVBuffer = gl.createBuffer();

      setCanvasViewport(canvas.clientWidth, canvas.clientHeight);
    }
  };

  n64js.resetRenderer = function() {
    textureCache = {};
    $textureOutput.html('');
    ram_u8 = n64js.getRamU8Array();
    ram_s32 = n64js.getRamS32Array();
    ram_dv = n64js.getRamDataView();
  };

  function getCurrentN64Shader(cycle_type, alpha_threshold) {
    var mux0 = state.combine.hi;
    var mux1 = state.combine.lo;

    return getOrCreateN64Shader(gl, mux0, mux1, cycle_type, alpha_threshold);
  }

  function hashTmem(tmem32, offset, len, hash) {
    let i = offset >> 2;
    let e = (offset + len) >> 2;
    while (i < e) {
      hash = ((hash * 17) + tmem32[i]) >>> 0;
      ++i;
    }
    return hash;
  }

  function calculateTmemCrc(tile) {
    if (tile.hash) {
      return tile.hash;
    }

    //var width = tile.width;
    var height = tile.height;

    var src = state.tmemData32;
    var tmem_offset = tile.tmem << 3;
    var bytes_per_line = tile.line << 3;

    // NB! RGBA/32 line needs to be doubled.
    if (tile.format == ImageFormat.G_IM_FMT_RGBA &&
      tile.size == ImageSize.G_IM_SIZ_32b) {
      bytes_per_line *= 2;
    }

    // TODO: not sure what happens when width != tile.line. Maybe we should hash rows separately?

    var len = height * bytes_per_line;

    var hash = hashTmem(src, tmem_offset, len, 0);

    // For palettised textures, check the palette entries too
    if (tile.format === ImageFormat.G_IM_FMT_CI ||
      tile.format === ImageFormat.G_IM_FMT_RGBA) { // NB RGBA check is for extreme-g, which specifies RGBA/4 and RGBA/8 instead of CI/4 and CI/8

      if (tile.size === ImageSize.G_IM_SIZ_8b) {
        hash = hashTmem(src, 0x100 << 3, 256 * 2, hash);
      } else if (tile.size === ImageSize.G_IM_SIZ_4b) {
        hash = hashTmem(src, (0x100 << 3) + (tile.palette * 16 * 2), 16 * 2, hash);
      }
    }

    tile.hash = hash;
    return hash;
  }

  /**
   * Looks up the texture defined at the specified tile index.
   * @param {number} tileIdx
   * @return {?Texture}
   */
  function lookupTexture(tileIdx) {
    var tile = state.tiles[tileIdx];
    var tmem_address = tile.tmem;

    // Skip empty tiles - this is primarily for the debug ui.
    if (tile.line === 0) {
      return null;
    }

    // FIXME: we can cache this if tile/tmem state hasn't changed since the last draw call.
    var hash = calculateTmemCrc(tile);

    // Check if the texture is already cached.
    // FIXME: we also need to check other properties (mirror, clamp etc), and recreate every frame (or when underlying data changes)
    var cache_id = toString32(hash) + tile.lrs + '-' + tile.lrt;

    var texture;
    if (textureCache.hasOwnProperty(cache_id)) {
      texture = textureCache[cache_id];
    } else {
      texture = decodeTexture(tile, getTextureLUTType());
      textureCache[cache_id] = texture;
    }

    return texture;
  }

  /**
   * Decodes the texture defined by the specified tile.
   * @param {!Tile} tile
   * @param {number} tlutFormat
   * @return {?Texture}
   */
  function decodeTexture(tile, tlutFormat) {
    var texture = new Texture(gl, tile.left, tile.top, tile.width, tile.height);
    if (!texture.$canvas[0].getContext) {
      return null;
    }

    $textureOutput.append(
      ImageFormat.nameOf(tile.format) + ', ' +
      ImageSize.nameOf(tile.size) + ',' +
      tile.width + 'x' + tile.height + ', ' +
      '<br>');

    var ctx = texture.$canvas[0].getContext('2d');
    var imgData = ctx.createImageData(texture.nativeWidth, texture.nativeHeight);

    var handled = convertTexels(imgData, state.tmemData, tile, tlutFormat);
    if (handled) {
      clampTexture(imgData, tile.width, tile.height);

      ctx.putImageData(imgData, 0, 0);

      $textureOutput.append(texture.$canvas);
      $textureOutput.append('<br>');
    } else {
      var msg = ImageFormat.nameOf(tile.format) + '/' +
          ImageSize.nameOf(tile.size) + ' is unhandled';
      $textureOutput.append(msg);
      // FIXME: fill with placeholder texture
      hleHalt(msg);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.$canvas[0]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

    var clampS = tile.cm_s === G_TX_CLAMP || (tile.mask_s === 0);
    var clampT = tile.cm_t === G_TX_CLAMP || (tile.mask_t === 0);
    var mirrorS = tile.cm_s === G_TX_MIRROR;
    var mirrorT = tile.cm_t === G_TX_MIRROR;

    var mode_s = clampS ? gl.CLAMP_TO_EDGE : (mirrorS ? gl.MIRRORED_REPEAT : gl.REPEAT);
    var mode_t = clampT ? gl.CLAMP_TO_EDGE : (mirrorT ? gl.MIRRORED_REPEAT : gl.REPEAT);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mode_s);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mode_t);

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }
}(window.n64js = window.n64js || {}));

// TODO(hulkholden): Share this somewhere.
const FPCSR_C = 0x00800000;
const k1Shift32 = 4294967296.0;

class CPU1 {
  constructor() {
    this.control = new Uint32Array(32);

    this.mem     = new ArrayBuffer(32 * 4);   // 32 32-bit regs
    this.float32 = new Float32Array(this.mem);
    this.float64 = new Float64Array(this.mem);
    this.int32   = new Int32Array(this.mem);
    this.uint32  = new Uint32Array(this.mem);
  }

  reset() {
    for (var i = 0; i < 32; ++i) {
      this.control[i] = 0;
      this.int32[i]   = 0;
    }

    this.control[0] = 0x00000511;
  }

  /**
   * Set the condition control bit.
   * @param {boolean} enable
   */
  setCondition(enable) {
    if (enable) {
      this.control[31] |=  FPCSR_C;
    } else {
      this.control[31] &= ~FPCSR_C;
    }
  }

  /**
   * @param {number} i The register index.
   * @param {number} lo The low 32 bits to store.
   * @param {number} hi The high 32 bits to store.
   */
  store_64(i, lo, hi) {
    this.int32[i+0] = lo;
    this.int32[i+1] = hi;
  }

  /**
   * @param {number} i The register index.
   * @param {number} value The value to store.
   */
  store_float_as_long(i, value) {
    this.int32[i  ] = value & 0xffffffff;
    this.int32[i+1] = Math.floor(value / k1Shift32);
  }

  /**
   * @param {number} i The register index.
   * @param {number} value The value to store.
   */
  store_f64(i, value) {
    this.float64[i>>1] = value;
  }

  /**
   * @param {number} i The register index.
   * @return {number}
   */
  load_f64(i) {
    return this.float64[i>>1];
  }

  /**
   * @param {number} i The register index.
   * @return {number}
   */
  load_s64_as_double(i) {
    return (this.int32[i+1] * k1Shift32) + this.int32[i];
  }
}

/*jshint jquery:true, devel:true */

(function (n64js) {'use strict';
  const toString32$$1 = toString32;

  const kDebugTLB = 0;
  const kDebugDynarec = 0;

  var accurateCountUpdating = false;
  const COUNTER_INCREMENT_PER_OP = 1;

  const k1Shift32 = 4294967296.0;

  const UT_VEC          = 0x80000000;
  const XUT_VEC         = 0x80000080;
  const ECC_VEC         = 0x80000100;
  const E_VEC           = 0x80000180;

  const SR_IE           = 0x00000001;
  const SR_EXL          = 0x00000002;
  const SR_ERL          = 0x00000004;
  const SR_KSU_KER      = 0x00000000;
  const SR_KSU_SUP      = 0x00000008;
  const SR_KSU_USR      = 0x00000010;
  const SR_KSU_MASK     = 0x00000018;
  const SR_UX           = 0x00000020;
  const SR_SX           = 0x00000040;
  const SR_KX           = 0x00000080;

  const SR_IBIT1        = 0x00000100;
  const SR_IBIT2        = 0x00000200;
  const SR_IBIT3        = 0x00000400;
  const SR_IBIT4        = 0x00000800;
  const SR_IBIT5        = 0x00001000;
  const SR_IBIT6        = 0x00002000;
  const SR_IBIT7        = 0x00004000;
  const SR_IBIT8        = 0x00008000;

  const SR_IMASK0       = 0x0000ff00;
  const SR_IMASK1       = 0x0000fe00;
  const SR_IMASK2       = 0x0000fc00;
  const SR_IMASK3       = 0x0000f800;
  const SR_IMASK4       = 0x0000f000;
  const SR_IMASK5       = 0x0000e000;
  const SR_IMASK6       = 0x0000c000;
  const SR_IMASK7       = 0x00008000;
  const SR_IMASK8       = 0x00000000;
  const SR_IMASK        = 0x0000ff00;

  const SR_DE           = 0x00010000;
  const SR_CE           = 0x00020000;
  const SR_CH           = 0x00040000;
  const SR_SR           = 0x00100000;
  const SR_TS           = 0x00200000;
  const SR_BEV          = 0x00400000;
  const SR_ITS          = 0x01000000;
  const SR_RE           = 0x02000000;
  const SR_FR           = 0x04000000;
  const SR_RP           = 0x08000000;
  const SR_CU0          = 0x10000000;
  const SR_CU1          = 0x20000000;
  const SR_CU2          = 0x40000000;
  const SR_CU3          = 0x80000000;

  const SR_CUMASK       = 0xf0000000;

  const CAUSE_BD_BIT    = 31;           // NB: Closure Compiler doesn't like 32 bit constants.
  const CAUSE_BD        = 0x80000000;
  const CAUSE_CEMASK    = 0x30000000;
  const CAUSE_CESHIFT   = 28;

  const CAUSE_SW1       = 0x00000100;
  const CAUSE_SW2       = 0x00000200;
  const CAUSE_IP3       = 0x00000400;
  const CAUSE_IP4       = 0x00000800;
  const CAUSE_IP5       = 0x00001000;
  const CAUSE_IP6       = 0x00002000;
  const CAUSE_IP7       = 0x00004000;
  const CAUSE_IP8       = 0x00008000;

  const CAUSE_IPMASK    = 0x0000FF00;

  const CAUSE_IPSHIFT   = 8;

  const CAUSE_EXCMASK   = 0x0000007C;

  const CAUSE_EXCSHIFT  = 2;

  const EXC_INT         = 0;
  const EXC_MOD         = 4;
  const EXC_RMISS       = 8;
  const EXC_WMISS       = 12;
  const EXC_RADE        = 16;
  const EXC_WADE        = 20;
  const EXC_IBE         = 24;
  const EXC_DBE         = 28;
  const EXC_SYSCALL     = 32;
  const EXC_BREAK       = 36;
  const EXC_II          = 40;
  const EXC_CPU         = 44;
  const EXC_OV          = 48;
  const EXC_TRAP        = 52;
  const EXC_VCEI        = 56;
  const EXC_FPE         = 60;
  const EXC_WATCH       = 92;
  const EXC_VCED        = 124;


  const FPCSR_RM_RN     = 0x00000000;
  const FPCSR_RM_RZ     = 0x00000001;
  const FPCSR_RM_RP     = 0x00000002;
  const FPCSR_RM_RM     = 0x00000003;
  const FPCSR_FI        = 0x00000004;
  const FPCSR_FU        = 0x00000008;
  const FPCSR_FO        = 0x00000010;
  const FPCSR_FZ        = 0x00000020;
  const FPCSR_FV        = 0x00000040;
  const FPCSR_EI        = 0x00000080;
  const FPCSR_EU        = 0x00000100;
  const FPCSR_EO        = 0x00000200;
  const FPCSR_EZ        = 0x00000400;
  const FPCSR_EV        = 0x00000800;
  const FPCSR_CI        = 0x00001000;
  const FPCSR_CU        = 0x00002000;
  const FPCSR_CO        = 0x00004000;
  const FPCSR_CZ        = 0x00008000;
  const FPCSR_CV        = 0x00010000;
  const FPCSR_CE        = 0x00020000;
  const FPCSR_C         = 0x00800000;
  const FPCSR_FS        = 0x01000000;

  const FPCSR_RM_MASK   = 0x00000003;


  const TLBHI_VPN2MASK    = 0xffffe000;
  const TLBHI_VPN2MASK_NEG= 0x00001fff;
  const TLBHI_VPN2SHIFT   = 13;
  const TLBHI_PIDMASK     = 0xff;
  const TLBHI_PIDSHIFT    = 0;
  const TLBHI_NPID        = 255;

  const TLBLO_PFNMASK     = 0x3fffffc0;
  const TLBLO_PFNSHIFT    = 6;
  const TLBLO_CACHMASK    = 0x38;
  const TLBLO_CACHSHIFT   = 3;
  const TLBLO_UNCACHED    = 0x10;
  const TLBLO_NONCOHRNT   = 0x18;
  const TLBLO_EXLWR       = 0x28;
  const TLBLO_D           = 0x4;
  const TLBLO_V           = 0x2;
  const TLBLO_G           = 0x1;

  const TLBINX_PROBE      = 0x80000000;
  const TLBINX_INXMASK    = 0x3f;
  const TLBINX_INXSHIFT   = 0;

  const TLBRAND_RANDMASK  = 0x3f;
  const TLBRAND_RANDSHIFT = 0;

  const TLBWIRED_WIREDMASK  = 0x3f;

  const TLBCTXT_BASEMASK  = 0xff800000;
  const TLBCTXT_BASESHIFT = 23;
  const TLBCTXT_BASEBITS  = 9;

  const TLBCTXT_VPNMASK   = 0x7ffff0;
  const TLBCTXT_VPNSHIFT  = 4;

  const TLBPGMASK_4K      = 0x00000000;
  const TLBPGMASK_16K     = 0x00006000;
  const TLBPGMASK_64K     = 0x0001e000;
  const TLBPGMASK_256K    = 0x0007e000;
  const TLBPGMASK_1M      = 0x001fe000;
  const TLBPGMASK_4M      = 0x007fe000;
  const TLBPGMASK_16M     = 0x01ffe000;


  const kStuffToDoHalt            = 1<<0;
  const kStuffToDoCheckInterrupts = 1<<1;
  const kStuffToDoBreakout        = 1<<2;

  const kVIIntrCycles = 62500;

  const kEventVbl          = 0;
  const kEventCompare      = 1;
  const kEventRunForCycles = 2;

  n64js.getHi32 = function (v) {
    // >>32 just seems to no-op? Argh.
    return Math.floor( v / k1Shift32 );
  };

  /**
   * @constructor
   */
  function TLBEntry() {
    this.pagemask = 0;
    this.hi       = 0;
    this.pfne     = 0;
    this.pfno     = 0;
    this.mask     = 0;
    this.global   = 0;
  }

  TLBEntry.prototype.update = function(index, pagemask, hi, entrylo0, entrylo1) {
    if (kDebugTLB) {
      log('TLB update: index=' + index +
          ', pagemask=' + toString32(pagemask) +
          ', entryhi='  + toString32(hi) +
          ', entrylo0=' + toString32(entrylo0) +
          ', entrylo1=' + toString32(entrylo1)
        );

      switch (pagemask) {
        case TLBPGMASK_4K:      log('       4k Pagesize');      break;
        case TLBPGMASK_16K:     log('       16k Pagesize');     break;
        case TLBPGMASK_64K:     log('       64k Pagesize');     break;
        case TLBPGMASK_256K:    log('       256k Pagesize');    break;
        case TLBPGMASK_1M:      log('       1M Pagesize');      break;
        case TLBPGMASK_4M:      log('       4M Pagesize');      break;
        case TLBPGMASK_16M:     log('       16M Pagesize');     break;
        default:                log('       Unknown Pagesize'); break;
      }
    }

    this.pagemask = pagemask;
    this.hi       = hi;
    this.pfne     = entrylo0;
    this.pfno     = entrylo1;

    this.global   = (entrylo0 & entrylo1 & TLBLO_G);

    this.mask     = pagemask | TLBHI_VPN2MASK_NEG;
    this.mask2    = this.mask>>>1;
    this.vpnmask  = (~this.mask)>>>0;
    this.vpn2mask = this.vpnmask>>>1;

    this.addrcheck = (hi & this.vpnmask)>>>0;

    this.pfnehi = (this.pfne << TLBLO_PFNSHIFT) & this.vpn2mask;
    this.pfnohi = (this.pfno << TLBLO_PFNSHIFT) & this.vpn2mask;

    switch (this.pagemask) {
      case TLBPGMASK_4K:      this.checkbit = 0x00001000; break;
      case TLBPGMASK_16K:     this.checkbit = 0x00004000; break;
      case TLBPGMASK_64K:     this.checkbit = 0x00010000; break;
      case TLBPGMASK_256K:    this.checkbit = 0x00040000; break;
      case TLBPGMASK_1M:      this.checkbit = 0x00100000; break;
      case TLBPGMASK_4M:      this.checkbit = 0x00400000; break;
      case TLBPGMASK_16M:     this.checkbit = 0x01000000; break;
      default: // shouldn't happen!
                              this.checkbit = 0;          break;
      }
  };

  /**
   * @constructor
   */
  function CPU0() {
    this.opsExecuted    = 0;            // Approximate...

    this.ram            = undefined;    // bound to in reset n64js.getRamU8Array();

    this.gprLoMem       = new ArrayBuffer(32*4);
    this.gprHiMem       = new ArrayBuffer(32*4);

    this.gprLoBytes     = new Uint8Array(this.gprLoMem);    // Used to help form addresses without causing deopts or generating HeapNumbers.

    this.gprLo          = new Uint32Array(this.gprLoMem);
    this.gprHi          = new Uint32Array(this.gprHiMem);
    this.gprLo_signed   = new Int32Array(this.gprLoMem);
    this.gprHi_signed   = new Int32Array(this.gprHiMem);

    this.controlMem     = new ArrayBuffer(32*4);
    this.control        = new Uint32Array(this.controlMem);
    this.control_signed = new Int32Array(this.controlMem);

    this.pc             = 0;
    this.delayPC        = 0;
    this.nextPC         = 0;      // Set to the next expected PC before an op executes. Ops can update this to change control flow without branch delay (e.g. likely branches, ERET)
    this.branchTarget   = 0;      // Set to indicate a branch has been taken. Sets the delayPC for the subsequent op.

    this.stuffToDo      = 0;     // used to flag r4300 to cease execution

    this.events         = [];

    this.multHiMem      = new ArrayBuffer(2*4);
    this.multLoMem      = new ArrayBuffer(2*4);
    this.multHi         = new Uint32Array(this.multHiMem);
    this.multLo         = new Uint32Array(this.multLoMem);
    this.multHi_signed  = new Int32Array(this.multHiMem);
    this.multLo_signed  = new Int32Array(this.multLoMem);

    this.tlbEntries = [];
    for (var i = 0; i < 32; ++i) {
      this.tlbEntries.push(new TLBEntry());
    }

    // General purpose register constants
    this.kRegister_r0 = 0x00;
    this.kRegister_at = 0x01;
    this.kRegister_v0 = 0x02;
    this.kRegister_v1 = 0x03;
    this.kRegister_a0 = 0x04;
    this.kRegister_a1 = 0x05;
    this.kRegister_a2 = 0x06;
    this.kRegister_a3 = 0x07;
    this.kRegister_t0 = 0x08;
    this.kRegister_t1 = 0x09;
    this.kRegister_t2 = 0x0a;
    this.kRegister_t3 = 0x0b;
    this.kRegister_t4 = 0x0c;
    this.kRegister_t5 = 0x0d;
    this.kRegister_t6 = 0x0e;
    this.kRegister_t7 = 0x0f;
    this.kRegister_s0 = 0x10;
    this.kRegister_s1 = 0x11;
    this.kRegister_s2 = 0x12;
    this.kRegister_s3 = 0x13;
    this.kRegister_s4 = 0x14;
    this.kRegister_s5 = 0x15;
    this.kRegister_s6 = 0x16;
    this.kRegister_s7 = 0x17;
    this.kRegister_t8 = 0x18;
    this.kRegister_t9 = 0x19;
    this.kRegister_k0 = 0x1a;
    this.kRegister_k1 = 0x1b;
    this.kRegister_gp = 0x1c;
    this.kRegister_sp = 0x1d;
    this.kRegister_s8 = 0x1e;
    this.kRegister_ra = 0x1f;

    // Control register constants
    this.kControlIndex     = 0;
    this.kControlRand      = 1;
    this.kControlEntryLo0  = 2;
    this.kControlEntryLo1  = 3;
    this.kControlContext   = 4;
    this.kControlPageMask  = 5;
    this.kControlWired     = 6;
    //...
    this.kControlBadVAddr  = 8;
    this.kControlCount     = 9;
    this.kControlEntryHi   = 10;
    this.kControlCompare   = 11;
    this.kControlSR        = 12;
    this.kControlCause     = 13;
    this.kControlEPC       = 14;
    this.kControlPRId      = 15;
    this.kControlConfig    = 16;
    this.kControlLLAddr    = 17;
    this.kControlWatchLo   = 18;
    this.kControlWatchHi   = 19;
    //...
    this.kControlECC       = 26;
    this.kControlCacheErr  = 27;
    this.kControlTagLo     = 28;
    this.kControlTagHi     = 29;
    this.kControlErrorEPC  = 30;
  }

  CPU0.prototype.getCount = function() {
    return this.control[this.kControlCount];
  };

  CPU0.prototype.getGPR_s64 = function (r) {
    return (this.gprHi_signed[r] * k1Shift32) + this.gprLo[r];
  };

  CPU0.prototype.getGPR_u64 = function (r) {
    return (this.gprHi[r] * k1Shift32) + this.gprLo[r];
  };

  CPU0.prototype.setGPR_s64 = function (r, v) {
    this.gprHi_signed[r] = Math.floor( v / k1Shift32 );
    this.gprLo_signed[r] = v;
  };

  CPU0.prototype.reset = function () {
    var i;

    resetFragments();

    this.ram = n64js.getRamU8Array();

    for (i = 0; i < 32; ++i) {
      this.gprLo[i]   = 0;
      this.gprHi[i]   = 0;
      this.control[i] = 0;
    }
    for (i = 0; i < 32; ++i) {
      this.tlbEntries[i].update(i, 0, 0x80000000, 0, 0);
    }

    this.pc           = 0;
    this.delayPC      = 0;
    this.nextPC       = 0;
    this.branchTarget = 0;

    this.stuffToDo    = 0;

    this.events       = [];

    this.multLo[0]    = this.multLo[1] = 0;
    this.multHi[0]    = this.multHi[1] = 0;

    this.control[this.kControlRand]   = 32-1;
    this.control[this.kControlSR]     = 0x70400004;
    this.control[this.kControlConfig] = 0x0006e463;

    this.addEvent(kEventVbl, kVIIntrCycles);
  };

  CPU0.prototype.breakExecution = function () {
    this.stuffToDo |= kStuffToDoHalt;
  };

  CPU0.prototype.speedHack = function () {
    var next_instruction = n64js.readMemoryInternal32(this.pc + 4);
    if (next_instruction === 0) {
      if (this.events.length > 0) {

        // Ignore the kEventRunForCycles event
        var run_countdown = 0;
        if (this.events[0].type === kEventRunForCycles && this.events.length > 1) {
          run_countdown += this.events[0].countdown;
          this.events.splice(0,1);
        }

        var to_skip = run_countdown + this.events[0].countdown - 1;

        //logger.log('speedhack: skipping ' + to_skip + ' cycles');

        this.control[this.kControlCount] += to_skip;
        this.events[0].countdown = 1;

        // Re-add the kEventRunForCycles event
        if (run_countdown) {
          this.addEvent(kEventRunForCycles, run_countdown);
        }
      } else {
        log('no events');
      }
    } else {
      //logger.log('next instruction does something');
    }
  };

  CPU0.prototype.updateCause3 = function () {
    if (n64js.miInterruptsUnmasked()) {
      this.control[this.kControlCause] |= CAUSE_IP3;

      if (this.checkForUnmaskedInterrupts()) {
        this.stuffToDo |= kStuffToDoCheckInterrupts;
      }
    } else {
      this.control[this.kControlCause] &= ~CAUSE_IP3;
    }

    checkCauseIP3Consistent();
  };

  CPU0.prototype.setSR = function (value) {
    var old_value = this.control[this.kControlSR];
    if ((old_value & SR_FR) !== (value & SR_FR)) {
      log('Changing FPU to ' + ((value & SR_FR) ? '64bit' : '32bit' ));
    }

    this.control[this.kControlSR] = value;

    setCop1Enable( (value & SR_CU1) !== 0 );

    if (this.checkForUnmaskedInterrupts()) {
      this.stuffToDo |= kStuffToDoCheckInterrupts;
    }
  };

  CPU0.prototype.checkForUnmaskedInterrupts = function () {
    var sr = this.control[this.kControlSR];

    // Ensure ERL/EXL are clear and IE is set
    if ((sr & (SR_EXL | SR_ERL | SR_IE)) === SR_IE) {

      // Check if interrupts are actually pending, and wanted
      var cause = this.control[this.kControlCause];

      if ((sr & cause & CAUSE_IPMASK) !== 0) {
        return true;
      }
    }

    return false;
  };

  CPU0.prototype.throwTLBException = function (address, exc_code, vec) {
    this.control[this.kControlBadVAddr] = address;

    this.control[this.kControlContext] &= 0xff800000;
    this.control[this.kControlContext] |= ((address >>> 13) << 4);

    this.control[this.kControlEntryHi] &= 0x00001fff;
    this.control[this.kControlEntryHi] |= (address & 0xfffffe000);

    // XXXX check we're not inside exception handler before snuffing CAUSE reg?
    this.setException( CAUSE_EXCMASK, exc_code );
    this.nextPC = vec;
  };

  CPU0.prototype.throwTLBReadMiss  = function (address) { this.throwTLBException(address, EXC_RMISS, UT_VEC); };
  CPU0.prototype.throwTLBWriteMiss = function (address) { this.throwTLBException(address, EXC_WMISS, UT_VEC); };

  CPU0.prototype.throwTLBReadInvalid  = function (address) { this.throwTLBException(address, EXC_RMISS, E_VEC); };
  CPU0.prototype.throwTLBWriteInvalid = function (address) { this.throwTLBException(address, EXC_WMISS, E_VEC); };

  CPU0.prototype.throwCop1Unusable = function () {
    // XXXX check we're not inside exception handler before snuffing CAUSE reg?
    this.setException( CAUSE_EXCMASK|CAUSE_CEMASK, EXC_CPU | 0x10000000 );
    this.nextPC = E_VEC;
  };

  CPU0.prototype.handleInterrupt = function () {
    if (this.checkForUnmaskedInterrupts()) {
        this.setException( CAUSE_EXCMASK, EXC_INT );
        // this is handled outside of the main dispatch loop, so need to update pc directly
        this.pc      = E_VEC;
        this.delayPC = 0;

    } else {
      n64js.assert(false, "Was expecting an unmasked interrupt - something wrong with kStuffToDoCheckInterrupts?");
    }
  };

  CPU0.prototype.setException = function (mask, exception) {
    this.control[this.kControlCause] &= ~mask;
    this.control[this.kControlCause] |= exception;
    this.control[this.kControlSR]  |= SR_EXL;
    this.control[this.kControlEPC]  = this.pc;

    var bd_mask = (1<<CAUSE_BD_BIT);
    if (this.delayPC) {
      this.control[this.kControlCause] |= bd_mask;
      this.control[this.kControlEPC]   -= 4;
    } else {
      this.control[this.kControlCause] &= ~bd_mask;
    }
  };

  CPU0.prototype.setCompare = function (value) {
    this.control[this.kControlCause] &= ~CAUSE_IP8;
    if (value === this.control[this.kControlCompare]) {
      // just clear the IP8 flag
    } else {
      if (value !== 0) {
        var count = this.control[this.kControlCount];
        if (value > count) {
          var delta = value - count;

          this.removeEventsOfType(kEventCompare);
          this.addEvent(kEventCompare, delta);
        } else {
          n64js.warn('setCompare underflow - was' + toString32(count) + ', setting to ' + value);
        }
      }
    }
    this.control[this.kControlCompare] = value;
  };

  /**
   * @constructor
   */
  function SystemEvent(type, countdown) {
    this.type = type;
    this.countdown = countdown;
  }

  SystemEvent.prototype.getName = function () {
    switch(this.type) {
      case kEventVbl:           return 'Vbl';
      case kEventCompare:       return 'Compare';
      case kEventRunForCycles:  return 'Run';
    }

    return '?';
  };

  CPU0.prototype.addEvent = function(type, countdown) {
    n64js.assert( countdown >0, "Countdown is invalid" );
    for (var i = 0; i < this.events.length; ++i) {
      var event = this.events[i];
      if (countdown <= event.countdown) {
        event.countdown -= countdown;

        this.events.splice(i, 0, new SystemEvent(type, countdown));
        return;
      }

      countdown -= event.countdown;
    }

    this.events.push(new SystemEvent(type, countdown));
  };


  CPU0.prototype.removeEventsOfType = function (type) {
    var count = 0;
    for (var i = 0; i < this.events.length; ++i) {
      count += this.events[i].countdown;

      if (this.events[i].type == type) {
        // Add this countdown on to the subsequent event
        if ((i+1) < this.events.length) {
          this.events[i+1].countdown += this.events[i].countdown;
        }
        this.events.splice(i, 1);
        return count;
      }
    }

    // Not found.
    return -1;
  };

  CPU0.prototype.hasEvent = function(type) {
    for (var i = 0; i < this.events.length; ++i) {
      if (this.events[i].type == type) {
        return true;
      }
    }
    return false;
  };

  CPU0.prototype.getRandom = function () {
    var wired = this.control[this.kControlWired] & 0x1f;
    var random = Math.floor(Math.random() * (32-wired)) + wired;

    var sync = n64js.getSyncFlow();
    if (sync) {
      random = sync.reflect32(random);
    }

    n64js.assert(random >= wired && random <= 31, "Ooops - random should be in range " + wired + "..31, but got " + random);
    return random;
  };

  CPU0.prototype.setTLB = function (cpu, index) {
    var pagemask = cpu.control[cpu.kControlPageMask];
    var entryhi  = cpu.control[cpu.kControlEntryHi];
    var entrylo1 = cpu.control[cpu.kControlEntryLo1];
    var entrylo0 = cpu.control[cpu.kControlEntryLo0];

    cpu.tlbEntries[index].update(index, pagemask, entryhi, entrylo0, entrylo1);
  };

  CPU0.prototype.tlbWriteIndex = function () {
    this.setTLB(this, this.control[this.kControlIndex] & 0x1f);
  };

  CPU0.prototype.tlbWriteRandom = function () {
    this.setTLB(this, this.getRandom());
  };

  CPU0.prototype.tlbRead = function () {
    var index = this.control[this.kControlIndex] & 0x1f;
    var tlb   = this.tlbEntries[index];

    this.control[this.kControlPageMask] = tlb.mask;
    this.control[this.kControlEntryHi ] = tlb.hi;
    this.control[this.kControlEntryLo0] = tlb.pfne | tlb.global;
    this.control[this.kControlEntryLo1] = tlb.pfno | tlb.global;

    if (kDebugTLB) {
      log('TLB Read Index ' + toString8(index) + '.');
      log('  PageMask: ' + toString32(this.control[this.kControlPageMask]));
      log('  EntryHi:  ' + toString32(this.control[this.kControlEntryHi]));
      log('  EntryLo0: ' + toString32(this.control[this.kControlEntryLo0]));
      log('  EntryLo1: ' + toString32(this.control[this.kControlEntryLo1]));
    }
  };


  CPU0.prototype.tlbProbe = function () {
    var entryhi      = this.control[this.kControlEntryHi];
    var entryhi_vpn2 = entryhi & TLBHI_VPN2MASK;
    var entryhi_pid  = entryhi & TLBHI_PIDMASK;

    for (var i = 0; i < 32; ++i) {
      var tlb = this.tlbEntries[i];
      if (   (tlb.hi & TLBHI_VPN2MASK) === entryhi_vpn2) {
        if (((tlb.hi & TLBHI_PIDMASK)  === entryhi_pid) ||
             tlb.global) {
          if (kDebugTLB) {
            log('TLB Probe. EntryHi:' + toString32(entryhi) + '. Found matching TLB entry - ' + toString8(i));
          }
          this.control[this.kControlIndex] = i;
          return;
        }
      }
    }

    if (kDebugTLB) {
      log('TLB Probe. EntryHi:' + toString32(entryhi) + ". Didn't find matching entry");
    }
    this.control[this.kControlIndex] = TLBINX_PROBE;
  };

  CPU0.prototype.tlbFindEntry = function (address) {
    for(var count = 0; count < 32; ++count) {
      // NB should put mru cache here
      var i = count;

      var tlb = this.tlbEntries[i];

      if ((address & tlb.vpnmask) === tlb.addrcheck) {
        if (!tlb.global) {
          var ehi = this.control[this.kControlEntryHi];
          if ((tlb.hi & TLBHI_PIDMASK) !== (ehi & TLBHI_PIDMASK) ) {
            // Entries ASID must match
            continue;
          }
        }

        return tlb;
      }
    }

    return null;
  };


  CPU0.prototype.translateReadInternal = function (address) {
    var tlb = this.tlbFindEntry(address);
    if (tlb) {
        var valid;
        var physical_addr;
        if (address & tlb.checkbit) {
          valid         = (tlb.pfno & TLBLO_V) !== 0;
          physical_addr = tlb.pfnohi | (address & tlb.mask2);
        } else {
          valid         = (tlb.pfne & TLBLO_V) !== 0;
          physical_addr = tlb.pfnehi | (address & tlb.mask2);
        }

        if (valid)
          return physical_addr;
        return 0;
    }
    return 0;
  };

  /**
   * @constructor
   */
  function TLBException(address) {
    this.address = address;
  }

  CPU0.prototype.translateRead = function (address) {
    var tlb = this.tlbFindEntry(address);
    if (tlb) {
        var valid;
        var physical_addr;
        if (address & tlb.checkbit) {
          valid         = (tlb.pfno & TLBLO_V) !== 0;
          physical_addr = tlb.pfnohi | (address & tlb.mask2);
        } else {
          valid         = (tlb.pfne & TLBLO_V) !== 0;
          physical_addr = tlb.pfnehi | (address & tlb.mask2);
        }

        if (valid)
          return physical_addr;

        this.throwTLBReadInvalid(address);
        throw new TLBException(address);
    }

    this.throwTLBReadMiss(address);
    throw new TLBException(address);
  };

  CPU0.prototype.translateWrite = function (address) {
    var tlb = this.tlbFindEntry(address);
    if (tlb) {
        var valid;
        var physical_addr;
        if (address & tlb.checkbit) {
          valid         = (tlb.pfno & TLBLO_V) !== 0;
          physical_addr = tlb.pfnohi | (address & tlb.mask2);
        } else {
          valid         = (tlb.pfne & TLBLO_V) !== 0;
          physical_addr = tlb.pfnehi | (address & tlb.mask2);
        }

        if (valid)
          return physical_addr;

        this.throwTLBWriteInvalid(address);
        throw new TLBException(address);
    }

    this.throwTLBWriteMiss(address);
    throw new TLBException(address);
  };

  // Expose the cpu state
  var cpu0 = new CPU0();
  var cpu1 = new CPU1();
  n64js.cpu0 = cpu0;
  n64js.cpu1 = cpu1;


  function     fd(i) { return (i>>> 6)&0x1f; }
  function     fs(i) { return (i>>>11)&0x1f; }
  function     ft(i) { return (i>>>16)&0x1f; }
  function  copop(i) { return (i>>>21)&0x1f; }

  function offset(i) { return ((i&0xffff)<<16)>>16; }
  function     sa(i) { return (i>>> 6)&0x1f; }
  function     rd(i) { return (i>>>11)&0x1f; }
  function     rt(i) { return (i>>>16)&0x1f; }
  function     rs(i) { return (i>>>21)&0x1f; }
  function     op(i) { return (i>>>26)&0x1f; }

  function tlbop(i)     { return i&0x3f; }
  function cop1_func(i) { return i&0x3f; }
  function cop1_bc(i)   { return (i>>>16)&0x3; }

  function target(i) { return (i     )&0x3ffffff; }
  function    imm(i) { return (i     )&0xffff; }
  function   imms(i) { return ((i&0xffff)<<16)>>16; }   // treat immediate value as signed
  function   base(i) { return (i>>>21)&0x1f; }

  function memaddr(i) {
      return cpu0.gprLo[base(i)] + imms(i);
  }

  function branchAddress(pc,i) { return ((pc+4) + (offset(i)*4))>>>0; }
  //function branchAddress(pc,i) { return (((pc>>>2)+1) + offset(i))<<2; }  // NB: convoluted calculation to avoid >>>0 (deopt)
  function   jumpAddress(pc,i) { return ((pc&0xf0000000) | (target(i)*4))>>>0; }

  function performBranch(new_pc) {
    //if (new_pc < 0) {
    //  logger.log('Oops, branching to negative address: ' + new_pc);
    //  throw 'Oops, branching to negative address: ' + new_pc;
    //}
    cpu0.branchTarget = new_pc;
  }

  function setSignExtend(r,v) {
    cpu0.gprLo[r] = v;
    cpu0.gprHi_signed[r] = v >> 31;
  }

  function setZeroExtend(r, v) {
    cpu0.gprLo[r] = v;
    cpu0.gprHi_signed[r] = 0;
  }

  function setHiLoSignExtend(arr, v) {
    arr[0] = v;
    arr[1] = v >> 31;
  }
  function setHiLoZeroExtend(arr, v) {
    arr[0] = v;
    arr[1] = 0;
  }

  function genSrcRegLo(i) {
    if (i === 0)
      return '0';
    return 'rlo[' + i + ']';
  }
  function genSrcRegHi(i) {
    if (i === 0)
      return '0';
    return 'rhi[' + i + ']';
  }

  //
  // Memory access routines.
  //

  // These are out of line so that the >>>0 doesn't cause a shift-i deopt in the body of the calling function
  function lwu_slow(addr)       { return n64js.readMemoryU32(addr>>>0); }
  function lhu_slow(addr)       { return n64js.readMemoryU16(addr>>>0); }
  function lbu_slow(addr)       { return n64js.readMemoryU8( addr>>>0); }

  function lw_slow(addr)        { return n64js.readMemoryS32(addr>>>0); }
  function lh_slow(addr)        { return n64js.readMemoryS16(addr>>>0); }
  function lb_slow(addr)        { return n64js.readMemoryS8( addr>>>0); }

  function sw_slow(addr, value) { n64js.writeMemory32(addr>>>0, value); }
  function sh_slow(addr, value) { n64js.writeMemory16(addr>>>0, value); }
  function sb_slow(addr, value) { n64js.writeMemory8( addr>>>0, value); }


  n64js.load_u8 = (ram, addr) => {
    if (addr < -2139095040) {
      var phys = (addr + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
      return ram[phys];
    }
    return lbu_slow(addr);
  };

  n64js.load_s8 = (ram, addr) => {
    if (addr < -2139095040) {
      var phys = (addr + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
      return (ram[phys] << 24) >> 24;
    }
    return lb_slow(addr);
  };

  n64js.load_u16 = (ram, addr) => {
    if (addr < -2139095040) {
      var phys = (addr + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
      return (ram[phys] << 8) | ram[phys+1];
    }
    return lhu_slow(addr);
  };

  n64js.load_s16 = (ram, addr) => {
    if (addr < -2139095040) {
      var phys = (addr + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
      return ((ram[phys] << 24) | (ram[phys+1] << 16)) >> 16;
    }
    return lh_slow(addr);
  };

  n64js.load_u32 = (ram, addr) => {
    if (addr < -2139095040) {
      var phys = (addr + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
      return ((ram[phys] << 24) | (ram[phys+1] << 16) | (ram[phys+2] << 8) | ram[phys+3]) >>> 0;
    }
    return lwu_slow(addr);
  };

  n64js.load_s32 = (ram, addr) => {
    if (addr < -2139095040) {
      var phys = (addr + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
      return ((ram[phys] << 24) | (ram[phys+1] << 16) | (ram[phys+2] << 8) | ram[phys+3]) | 0;
    }
    return lw_slow(addr);
  };

  n64js.store_8 = (ram, addr, value) => {
    if (addr < -2139095040) {
      var phys = (addr + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
      ram[phys] = value;
    } else {
      sb_slow(addr, value);
    }
  };

  n64js.store_16 = (ram, addr, value) => {
    if (addr < -2139095040) {
      var phys = (addr + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
      ram[phys  ] = value >> 8;
      ram[phys+1] = value;
    } else {
      sh_slow(addr, value);
    }
  };

  n64js.store_32 = (ram, addr, value) => {
    if (addr < -2139095040) {
      var phys = (addr + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
      ram[phys+0] = value >> 24;
      ram[phys+1] = value >> 16;
      ram[phys+2] = value >>  8;
      ram[phys+3] = value;
    } else {
      sw_slow(addr, value);
    }
  };

  n64js.store_64 = (ram, addr, value_lo, value_hi) => {
    if (addr < -2139095040) {
      var phys = (addr + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
      ram[phys+0] = value_hi >> 24;
      ram[phys+1] = value_hi >> 16;
      ram[phys+2] = value_hi >>  8;
      ram[phys+3] = value_hi;
      ram[phys+4] = value_lo >> 24;
      ram[phys+5] = value_lo >> 16;
      ram[phys+6] = value_lo >>  8;
      ram[phys+7] = value_lo;
    } else {
      sw_slow(addr,     value_hi);
      sw_slow(addr + 4, value_lo);
    }
  };


  function unimplemented(pc,i) {
    var r = n64js.disassembleOp(pc,i);
    var e = 'Unimplemented op ' + toString32(i) + ' : ' + r.disassembly;
    log(e);
    throw e;
  }

  function executeUnknown(i) {
    throw 'Unknown op: ' + toString32(cpu0.pc) + ', ' + toString32(i);
  }

  /**
   * @constructor
   */
  function BreakpointException() {
  }

  function executeBreakpoint(i) {
    // NB: throw here so that we don't execute the op.
    throw new BreakpointException();
  }

  function generateShiftImmediate(ctx, op) {
    // Handle NOP for SLL
    if (ctx.instruction === 0)
      return generateNOPBoilerplate('/*NOP*/', ctx);

    var d     = ctx.instr_rd();
    var t     = ctx.instr_rt();
    var shift = ctx.instr_sa();

    var impl = '';
    impl += 'var result = ' + genSrcRegLo(t) + ' ' + op + ' ' + shift + ';\n';
    impl += 'rlo[' + d + '] = result;\n';
    impl += 'rhi[' + d + '] = result >> 31;\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function generateSLL(ctx) { return generateShiftImmediate(ctx, '<<'); }
  function executeSLL(i) {
    // NOP
    if (i === 0)
      return;

    var d     = rd(i);
    var t     = rt(i);
    var shift = sa(i);

    var result = cpu0.gprLo_signed[t] << shift;
    cpu0.gprLo_signed[d] = result;
    cpu0.gprHi_signed[d] = result >> 31;    // sign extend
  }


  function generateSRL(ctx) { return generateShiftImmediate(ctx, '>>>'); }
  function executeSRL(i) {
    var d     = rd(i);
    var t     = rt(i);
    var shift = sa(i);

    var result = cpu0.gprLo_signed[t] >>> shift;
    cpu0.gprLo_signed[d] = result;
    cpu0.gprHi_signed[d] = result >> 31;    // sign extend
  }


  function generateSRA(ctx) { return generateShiftImmediate(ctx, '>>'); }
  function executeSRA(i) {
    var d     = rd(i);
    var t     = rt(i);
    var shift = sa(i);

    var result = cpu0.gprLo_signed[t] >> shift;
    cpu0.gprLo_signed[d] = result;
    cpu0.gprHi_signed[d] = result >> 31;    // sign extend
  }


  function generateShiftVariable(ctx, op) {
    var d = ctx.instr_rd();
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();

    var impl = '';
    impl += 'var result = ' + genSrcRegLo(t) + ' ' + op + ' (' + genSrcRegLo(s) + ' & 0x1f);\n';
    impl += 'rlo[' + d + '] = result;\n';
    impl += 'rhi[' + d + '] = result >> 31;\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function generateSLLV(ctx) { return generateShiftVariable(ctx, '<<'); }
  function executeSLLV(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);

    var result = cpu0.gprLo_signed[t] << (cpu0.gprLo_signed[s] & 0x1f);
    cpu0.gprLo_signed[d] = result;
    cpu0.gprHi_signed[d] = result >> 31;    // sign extend
  }


  function generateSRLV(ctx) { return generateShiftVariable(ctx, '>>>'); }
  function executeSRLV(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);

    var result = cpu0.gprLo_signed[t] >>> (cpu0.gprLo_signed[s] & 0x1f);
    cpu0.gprLo_signed[d] = result;
    cpu0.gprHi_signed[d] = result >> 31;    // sign extend
  }


  function generateSRAV(ctx) { return generateShiftVariable(ctx, '>>'); }
  function executeSRAV(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);

    var result = cpu0.gprLo_signed[t] >> (cpu0.gprLo_signed[s] & 0x1f);
    cpu0.gprLo_signed[d] = result;
    cpu0.gprHi_signed[d] = result >> 31;    // sign extend
  }

  function executeDSLLV(i) {
    var d = rd(i);
    var t = rt(i);
    var s = rs(i);

    var shift = cpu0.gprLo[s] & 0x3f;

    var lo = cpu0.gprLo[t];
    var hi = cpu0.gprHi[t];

    if (shift < 32) {
      var nshift = 32-shift;

      cpu0.gprLo[d] = (lo<<shift);
      cpu0.gprHi[d] = (hi<<shift) | (lo>>>nshift);
    } else {
      cpu0.gprLo_signed[d] = 0;
      cpu0.gprHi_signed[d] = lo << (shift - 32);
    }
  }

  function executeDSRLV(i) {
    var d = rd(i);
    var t = rt(i);
    var s = rs(i);

    var shift = cpu0.gprLo[s] & 0x3f;

    var lo = cpu0.gprLo[t];
    var hi = cpu0.gprHi[t];

    if (shift < 32) {
      var nshift = 32-shift;

      cpu0.gprLo[d] = (lo>>>shift) | (hi<<nshift);
      cpu0.gprHi[d] = (hi>>>shift);
    } else {
      cpu0.gprLo[d] = hi >>> (shift - 32);
      cpu0.gprHi_signed[d] = 0;
    }
  }

  function executeDSRAV(i) {
    var d = rd(i);
    var t = rt(i);
    var s = rs(i);

    var shift = cpu0.gprLo[s] & 0x3f;

    var lo = cpu0.gprLo[t];
    var hi = cpu0.gprHi_signed[t];

    if (shift < 32) {
      var nshift = 32-shift;

      cpu0.gprLo[d] = (lo>>>shift) | (hi<<nshift);
      cpu0.gprHi[d] = (hi>>shift);
    } else {
      var olo = hi >> (shift - 32);
      cpu0.gprLo_signed[d] = olo;
      cpu0.gprHi_signed[d] = olo >> 31;
    }
  }

  function executeDSLL(i) {
    var d     = rd(i);
    var t     = rt(i);
    var shift = sa(i);
    var nshift = 32-shift;

    var lo = cpu0.gprLo[t];
    var hi = cpu0.gprHi[t];

    cpu0.gprLo[d] = (lo<<shift);
    cpu0.gprHi[d] = (hi<<shift) | (lo>>>nshift);
  }
  function executeDSLL32(i) {
    var d = rd(i);
    cpu0.gprLo_signed[d] = 0;
    cpu0.gprHi_signed[d] = cpu0.gprLo[rt(i)] << sa(i);
  }

  function executeDSRL(i) {
    var d     = rd(i);
    var t     = rt(i);
    var shift = sa(i);
    var nshift = 32-shift;

    var lo = cpu0.gprLo[t];
    var hi = cpu0.gprHi[t];

    cpu0.gprLo[d] = (lo>>>shift) | (hi<<nshift);
    cpu0.gprHi[d] = (hi>>>shift);
  }
  function executeDSRL32(i) {
    var d = rd(i);
    cpu0.gprLo[d] = cpu0.gprHi[rt(i)] >>> sa(i);
    cpu0.gprHi_signed[d] = 0;
  }

  function executeDSRA(i) {
    var d     = rd(i);
    var t     = rt(i);
    var shift = sa(i);
    var nshift = 32-shift;

    var lo = cpu0.gprLo[t];
    var hi = cpu0.gprHi_signed[t];

    cpu0.gprLo[d] = (lo>>>shift) | (hi<<nshift);
    cpu0.gprHi[d] = (hi>>shift);
  }
  function executeDSRA32(i) {
    var d   = rd(i);
    var olo = cpu0.gprHi_signed[rt(i)] >> sa(i);
    cpu0.gprLo_signed[d] = olo;
    cpu0.gprHi_signed[d] = olo >> 31;
  }


  function executeSYSCALL(i)    { unimplemented(cpu0.pc,i); }
  function executeBREAK(i)      { unimplemented(cpu0.pc,i); }
  function executeSYNC(i)       { unimplemented(cpu0.pc,i); }


  function generateMFHI(ctx) {
    var d = ctx.instr_rd();
    var impl = '';
    impl += 'rlo[' + d + '] = c.multHi_signed[0];\n';
    impl += 'rhi[' + d + '] = c.multHi_signed[1];\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }
  function executeMFHI(i) {
    var d = rd(i);

    cpu0.gprLo_signed[d] = cpu0.multHi_signed[0];
    cpu0.gprHi_signed[d] = cpu0.multHi_signed[1];
  }

  function generateMFLO(ctx) {
    var d = ctx.instr_rd();
    var impl = '';
    impl += 'rlo[' + d + '] = c.multLo_signed[0];\n';
    impl += 'rhi[' + d + '] = c.multLo_signed[1];\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }
  function executeMFLO(i) {
    var d = rd(i);
    cpu0.gprLo_signed[d] = cpu0.multLo_signed[0];
    cpu0.gprHi_signed[d] = cpu0.multLo_signed[1];
  }

  function generateMTHI(ctx) {
    var s = ctx.instr_rs();
    var impl = '';
    impl += 'c.multHi_signed[0] = rlo[' + s + '];\n';
    impl += 'c.multHi_signed[1] = rhi[' + s + '];\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }
  function executeMTHI(i) {
    var s = rs(i);
    cpu0.multHi_signed[0] = cpu0.gprLo_signed[s];
    cpu0.multHi_signed[1] = cpu0.gprHi_signed[s];
  }

  function generateMTLO(ctx) {
    var s = ctx.instr_rs();
    var impl = '';
    impl += 'c.multLo_signed[0] = rlo[' + s + '];\n';
    impl += 'c.multLo_signed[1] = rhi[' + s + '];\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }
  function executeMTLO(i)  {
    var s = rs(i);
    cpu0.multLo_signed[0] = cpu0.gprLo_signed[s];
    cpu0.multLo_signed[1] = cpu0.gprHi_signed[s];
  }

  function generateMULT(ctx) {
    var d = ctx.instr_rd();
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();

    var impl = '';
    impl += 'var result = ' + genSrcRegLo(s) + ' * ' + genSrcRegLo(t) + ';\n';
    impl += 'var result_lo = result & 0xffffffff;\n';
    impl += 'var result_hi = n64js.getHi32(result);\n';
    impl += 'c.multLo[0] = result_lo;\n';
    impl += 'c.multLo[1] = result_lo >> 31;\n';
    impl += 'c.multHi[0] = result_hi;\n';
    impl += 'c.multHi[1] = result_hi >> 31;\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }
  function executeMULT(i) {
    var result = cpu0.gprLo_signed[rs(i)] * cpu0.gprLo_signed[rt(i)];

    var lo = result & 0xffffffff;
    var hi = n64js.getHi32(result);

    cpu0.multLo[0] = lo;
    cpu0.multLo[1] = lo >> 31;
    cpu0.multHi[0] = hi;
    cpu0.multHi[1] = hi >> 31;
  }

  function generateMULTU(ctx) {
    var d = ctx.instr_rd();
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();

    var impl = '';
    impl += 'var result = c.gprLo[' + s + '] * c.gprLo[' + t + '];\n';
    impl += 'var result_lo = result & 0xffffffff;\n';
    impl += 'var result_hi = n64js.getHi32(result);\n';
    impl += 'c.multLo[0] = result_lo;\n';
    impl += 'c.multLo[1] = result_lo >> 31;\n';
    impl += 'c.multHi[0] = result_hi;\n';
    impl += 'c.multHi[1] = result_hi >> 31;\n';
    return generateTrivialOpBoilerplate(impl,  ctx);
  }
  function executeMULTU(i) {
    var result = cpu0.gprLo[rs(i)] * cpu0.gprLo[rt(i)];

    var lo = result & 0xffffffff;
    var hi = n64js.getHi32(result);

    cpu0.multLo[0] = lo;
    cpu0.multLo[1] = lo >> 31;
    cpu0.multHi[0] = hi;
    cpu0.multHi[1] = hi >> 31;
  }

  function executeDMULT(i) {
    var result = cpu0.getGPR_s64(rs(i)) * cpu0.getGPR_s64(rt(i));
    cpu0.multLo[0] = result & 0xffffffff;
    cpu0.multLo[1] = n64js.getHi32(result);
    cpu0.multHi_signed[0] = 0;
    cpu0.multHi_signed[1] = 0;
  }

  function executeDMULTU(i) {
    var result = cpu0.getGPR_u64(rs(i)) * cpu0.getGPR_u64(rt(i));
    cpu0.multLo[0] = result & 0xffffffff;
    cpu0.multLo[1] = n64js.getHi32(result);
    cpu0.multHi_signed[0] = 0;
    cpu0.multHi_signed[1] = 0;
  }

  function executeDIV(i) {
    var dividend = cpu0.gprLo_signed[rs(i)];
    var divisor  = cpu0.gprLo_signed[rt(i)];
    if (divisor) {
      setHiLoSignExtend( cpu0.multLo, Math.floor(dividend / divisor) );
      setHiLoSignExtend( cpu0.multHi, dividend % divisor );
    }
  }
  function executeDIVU(i) {
    var dividend = cpu0.gprLo[rs(i)];
    var divisor  = cpu0.gprLo[rt(i)];
    if (divisor) {
      setHiLoSignExtend( cpu0.multLo, Math.floor(dividend / divisor) );
      setHiLoSignExtend( cpu0.multHi, dividend % divisor );
    }
  }

  function executeDDIV(i) {
    var s = rs(i);
    var t = rt(i);

    if ((cpu0.gprHi[s] + (cpu0.gprLo[s] >>> 31) +
         cpu0.gprHi[t] + (cpu0.gprLo[t] >>> 31)) !== 0) {
      // FIXME: seems ok if dividend/divisor fit in mantissa of double...
      var dividend = cpu0.getGPR_s64(s);
      var divisor  = cpu0.getGPR_s64(t);
      if (divisor) {
        setHiLoZeroExtend( cpu0.multLo, Math.floor(dividend / divisor) );
        setHiLoZeroExtend( cpu0.multHi, dividend % divisor );
      }
    } else {
      var dividend = cpu0.gprLo_signed[s];
      var divisor  = cpu0.gprLo_signed[t];
      if (divisor) {
        setHiLoSignExtend( cpu0.multLo, Math.floor(dividend / divisor) );
        setHiLoSignExtend( cpu0.multHi, dividend % divisor );
      }
    }
  }
  function executeDDIVU(i) {
    var s = rs(i);
    var t = rt(i);

    if ((cpu0.gprHi[s] | cpu0.gprHi[t]) !== 0) {
      // FIXME: seems ok if dividend/divisor fit in mantissa of double...
      var dividend = cpu0.getGPR_u64(s);
      var divisor  = cpu0.getGPR_u64(t);
      if (divisor) {
        setHiLoZeroExtend( cpu0.multLo, Math.floor(dividend / divisor) );
        setHiLoZeroExtend( cpu0.multHi, dividend % divisor );
      }
    } else {
      var dividend = cpu0.gprLo[s];
      var divisor  = cpu0.gprLo[t];
      if (divisor) {
        setHiLoZeroExtend( cpu0.multLo, Math.floor(dividend / divisor) );
        setHiLoZeroExtend( cpu0.multHi, dividend % divisor );
      }
    }
  }

  function  generateTrivialArithmetic(ctx, op) {
    var d = ctx.instr_rd();
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();
    var impl = '';
    impl += 'var result = ' + genSrcRegLo(s) + ' ' + op + ' ' + genSrcRegLo(t) + ';\n';
    impl += 'rlo[' + d + '] = result;\n';
    impl += 'rhi[' + d + '] = result >> 31;\n';
    return generateTrivialOpBoilerplate(impl,  ctx);
  }

  function  generateTrivialLogical(ctx, op) {
    var d = ctx.instr_rd();
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();
    var impl = '';
    impl += 'rlo[' + d + '] = ' + genSrcRegLo(s) + ' ' + op + ' ' + genSrcRegLo(t) + ';\n';
    impl += 'rhi[' + d + '] = ' + genSrcRegHi(s) + ' ' + op + ' ' + genSrcRegHi(t) + ';\n';
    return generateTrivialOpBoilerplate(impl,  ctx);
  }

  function generateADD(ctx) { return generateTrivialArithmetic(ctx, '+'); }
  function executeADD(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);
    var result = cpu0.gprLo_signed[s] + cpu0.gprLo_signed[t];
    cpu0.gprLo_signed[d] = result;
    cpu0.gprHi_signed[d] = result >> 31;
  }

  function generateADDU(ctx) { return generateTrivialArithmetic(ctx, '+'); }
  function executeADDU(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);
    var result = cpu0.gprLo_signed[s] + cpu0.gprLo_signed[t];
    cpu0.gprLo_signed[d] = result;
    cpu0.gprHi_signed[d] = result >> 31;
  }

  function generateSUB(ctx) { return generateTrivialArithmetic(ctx, '-'); }
  function executeSUB(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);
    var result = cpu0.gprLo_signed[s] - cpu0.gprLo_signed[t];
    cpu0.gprLo_signed[d] = result;
    cpu0.gprHi_signed[d] = result >> 31;
  }

  function generateSUBU(ctx) { return generateTrivialArithmetic(ctx, '-'); }
  function executeSUBU(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);
    var result = cpu0.gprLo_signed[s] - cpu0.gprLo_signed[t];
    cpu0.gprLo_signed[d] = result;
    cpu0.gprHi_signed[d] = result >> 31;
  }

  function generateAND(ctx) { return generateTrivialLogical(ctx, '&'); }
  function executeAND(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);
    cpu0.gprHi_signed[d] = cpu0.gprHi_signed[s] & cpu0.gprHi_signed[t];
    cpu0.gprLo_signed[d] = cpu0.gprLo_signed[s] & cpu0.gprLo_signed[t];
  }

  function generateOR(ctx) {
    var d = ctx.instr_rd();
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();

    // OR is used to implement CLEAR and MOV
    if (t === 0) {
      var impl = '';
      impl += 'rlo[' + d + '] = ' + genSrcRegLo(s) + ';\n';
      impl += 'rhi[' + d + '] = ' + genSrcRegHi(s) + ';\n';

      return generateTrivialOpBoilerplate(impl,  ctx);
    }
    return generateTrivialLogical(ctx, '|');
  }

  function executeOR(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);
    cpu0.gprHi_signed[d] = cpu0.gprHi_signed[s] | cpu0.gprHi_signed[t];
    cpu0.gprLo_signed[d] = cpu0.gprLo_signed[s] | cpu0.gprLo_signed[t];
  }

  function generateXOR(ctx) { return generateTrivialLogical(ctx, '^'); }
  function executeXOR(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);
    cpu0.gprHi_signed[d] = cpu0.gprHi_signed[s] ^ cpu0.gprHi_signed[t];
    cpu0.gprLo_signed[d] = cpu0.gprLo_signed[s] ^ cpu0.gprLo_signed[t];
  }

  function  generateNOR(ctx) {
    var d = ctx.instr_rd();
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();
    var impl = '';
    impl += 'rhi[' + d + '] = ~(' + genSrcRegHi(s) + ' | ' + genSrcRegHi(t) + ');\n';
    impl += 'rlo[' + d + '] = ~(' + genSrcRegLo(s) + ' | ' + genSrcRegLo(t) + ');\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function  executeNOR(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);
    cpu0.gprHi_signed[d] = ~(cpu0.gprHi_signed[s] | cpu0.gprHi_signed[t]);
    cpu0.gprLo_signed[d] = ~(cpu0.gprLo_signed[s] | cpu0.gprLo_signed[t]);
  }

  function generateSLT(ctx) {
    var d = ctx.instr_rd();
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();
    var impl = '';

    impl += 'var r = 0;\n';
    impl += 'if (' + genSrcRegHi(s) + ' < ' + genSrcRegHi(t) + ') {\n';
    impl += '  r = 1;\n';
    impl += '} else if (' + genSrcRegHi(s) + ' === ' + genSrcRegHi(t) + ') {\n';
    impl += '  r = (c.gprLo[' + s + '] < c.gprLo[' + t + ']) ? 1 : 0;\n';
    impl += '}\n';
    impl += 'rlo[' + d + '] = r;\n';
    impl += 'rhi[' + d + '] = 0;\n';

    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function executeSLT(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);
    var r = 0;
    if (cpu0.gprHi_signed[s] < cpu0.gprHi_signed[t]) {
      r = 1;
    } else if (cpu0.gprHi_signed[s] === cpu0.gprHi_signed[t]) {
      r = (cpu0.gprLo[s] < cpu0.gprLo[t]) ? 1 : 0;
    }
    cpu0.gprLo_signed[d] = r;
    cpu0.gprHi_signed[d] = 0;
  }

  function generateSLTU(ctx) {
    var d = ctx.instr_rd();
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();
    var impl = '';

    impl += 'var r = 0;\n';
    impl += 'if (c.gprHi[' + s + '] < c.gprHi[' + t + '] ||\n';
    impl += '    (' + genSrcRegHi(s) + ' === ' + genSrcRegHi(t) + ' && c.gprLo[' + s + '] < c.gprLo[' + t + '])) {\n';
    impl += '  r = 1;\n';
    impl += '}\n';
    impl += 'rlo[' + d + '] = r;\n';
    impl += 'rhi[' + d + '] = 0;\n';

    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function executeSLTU(i) {
    var d = rd(i);
    var s = rs(i);
    var t = rt(i);
    var r = 0;
    if (cpu0.gprHi[s] < cpu0.gprHi[t] ||
        (cpu0.gprHi_signed[s] === cpu0.gprHi_signed[t] && cpu0.gprLo[s] < cpu0.gprLo[t])) { // NB signed cmps avoid deopts
      r = 1;
    }
    cpu0.gprLo_signed[d] = r;
    cpu0.gprHi_signed[d] = 0;
  }

  function executeDADD(i) {
    cpu0.setGPR_s64(rd(i), cpu0.getGPR_s64(rs(i)) + cpu0.getGPR_s64(rt(i)));
    // NB: identical to DADDU, but should throw exception on overflow
  }
  function executeDADDU(i) {
    cpu0.setGPR_s64(rd(i), cpu0.getGPR_s64(rs(i)) + cpu0.getGPR_s64(rt(i)));
  }

  function executeDSUB(i) {
    cpu0.setGPR_s64(rd(i), cpu0.getGPR_s64(rs(i)) - cpu0.getGPR_s64(rt(i)));
    // NB: identical to DSUBU, but should throw exception on overflow
  }
  function executeDSUBU(i) {
    cpu0.setGPR_s64(rd(i), cpu0.getGPR_s64(rs(i)) - cpu0.getGPR_s64(rt(i)));
  }

  function executeTGE(i)        { unimplemented(cpu0.pc,i); }
  function executeTGEU(i)       { unimplemented(cpu0.pc,i); }
  function executeTLT(i)        { unimplemented(cpu0.pc,i); }
  function executeTLTU(i)       { unimplemented(cpu0.pc,i); }
  function executeTEQ(i)        { unimplemented(cpu0.pc,i); }
  function executeTNE(i)        { unimplemented(cpu0.pc,i); }

  function executeMFC0(i) {
    var control_reg = fs(i);

    // Check consistency
    if (control_reg === cpu0.kControlCause) {
      checkCauseIP3Consistent();
    }

    if (control_reg === cpu0.kControlRand) {
      setZeroExtend( rt(i), cpu0.getRandom() );
    } else {
      setZeroExtend( rt(i), cpu0.control[control_reg] );
    }
  }

  function generateMTC0(ctx) {
    var s = ctx.instr_fs();
    if (s === cpu0.kControlSR) {
      ctx.fragment.cop1statusKnown = false;
    }

    var impl = '';
    impl += 'n64js.executeMTC0(' + toString32(ctx.instruction) + ');\n';
    return generateGenericOpBoilerplate(impl, ctx);
  }

  function executeMTC0(i) {
    var control_reg = fs(i);
    var new_value   = cpu0.gprLo[rt(i)];

    switch (control_reg) {
      case cpu0.kControlContext:
        log('Setting Context register to ' + toString32(new_value) );
        cpu0.control[cpu0.kControlContext] = new_value;
        break;

      case cpu0.kControlWired:
        log('Setting Wired register to ' + toString32(new_value) );
        // Set to top limit on write to wired
        cpu0.control[cpu0.kControlRand]  = 31;
        cpu0.control[cpu0.kControlWired] = new_value;
        break;

      case cpu0.kControlRand:
      case cpu0.kControlBadVAddr:
      case cpu0.kControlPRId:
      case cpu0.kControlCacheErr:
        // All these registers are read-only
        log('Attempted write to read-only cpu0 control register. ' + toString32(new_value) + ' --> ' + n64js.cop0ControlRegisterNames[control_reg] );
        break;

      case cpu0.kControlCause:
        log('Setting cause register to ' + toString32(new_value) );
        n64js.check(new_value === 0, 'Should only write 0 to Cause register.');
        cpu0.control[cpu0.kControlCause] &= ~0x300;
        cpu0.control[cpu0.kControlCause] |= (new_value & 0x300);
        break;

      case cpu0.kControlSR:
        cpu0.setSR(new_value);
        break;
      case cpu0.kControlCount:
        cpu0.control[cpu0.kControlCount] = new_value;
        break;
      case cpu0.kControlCompare:
        cpu0.setCompare(new_value);
        break;

      case cpu0.kControlEPC:
      case cpu0.kControlEntryHi:
      case cpu0.kControlEntryLo0:
      case cpu0.kControlEntryLo1:
      case cpu0.kControlIndex:
      case cpu0.kControlPageMask:
      case cpu0.kControlTagLo:
      case cpu0.kControlTagHi:
        cpu0.control[control_reg] = new_value;
        break;

      default:
        cpu0.control[control_reg] = new_value;
        log('Write to cpu0 control register. ' + toString32(new_value) + ' --> ' + n64js.cop0ControlRegisterNames[control_reg] );
        break;
    }
  }

  function executeTLB(i) {
     switch(tlbop(i)) {
       case 0x01:    cpu0.tlbRead();        return;
       case 0x02:    cpu0.tlbWriteIndex();  return;
       case 0x06:    cpu0.tlbWriteRandom(); return;
       case 0x08:    cpu0.tlbProbe();       return;
       case 0x18:    executeERET(i);        return;
     }
     executeUnknown(i);
  }

  function executeERET(i) {
    if (cpu0.control[cpu0.kControlSR] & SR_ERL) {
      cpu0.nextPC = cpu0.control[cpu0.kControlErrorEPC];
      cpu0.control[cpu0.kControlSR] &= ~SR_ERL;
      log('ERET from error trap - ' + cpu0.nextPC);
    } else {
      cpu0.nextPC = cpu0.control[cpu0.kControlEPC];
      cpu0.control[cpu0.kControlSR] &= ~SR_EXL;
      //logger.log('ERET from interrupt/exception ' + cpu0.nextPC);
    }
  }

  function executeTGEI(i)       { unimplemented(cpu0.pc,i); }
  function executeTGEIU(i)      { unimplemented(cpu0.pc,i); }
  function executeTLTI(i)       { unimplemented(cpu0.pc,i); }
  function executeTLTIU(i)      { unimplemented(cpu0.pc,i); }
  function executeTEQI(i)       { unimplemented(cpu0.pc,i); }
  function executeTNEI(i)       { unimplemented(cpu0.pc,i); }

  // Jump
  function generateJ(ctx) {
    var addr = jumpAddress(ctx.pc, ctx.instruction);
    var impl = 'c.delayPC = ' + toString32(addr) + ';\n';
    return generateBranchOpBoilerplate(impl, ctx, false);
  }
  function executeJ(i) {
    performBranch( jumpAddress(cpu0.pc,i) );
  }


  function generateJAL(ctx) {
    var addr  = jumpAddress(ctx.pc, ctx.instruction);
    var ra    = ctx.pc + 8;
    var ra_hi = (ra & 0x80000000) ? -1 : 0;
    var impl  = '';
    impl += 'c.delayPC = ' + toString32(addr) + ';\n';
    impl += 'rlo[' + cpu0.kRegister_ra + '] = ' + toString32(ra) + ';\n';
    impl += 'rhi[' + cpu0.kRegister_ra + '] = ' + ra_hi + ';\n';
    return generateBranchOpBoilerplate(impl, ctx, false);
  }
  function executeJAL(i) {
    setSignExtend(cpu0.kRegister_ra, cpu0.pc + 8);
    performBranch( jumpAddress(cpu0.pc,i) );
  }


  function generateJALR(ctx) {
    var s    = ctx.instr_rs();
    var d    = ctx.instr_rd();

    var ra    = ctx.pc + 8;
    var ra_hi = (ra & 0x80000000) ? -1 : 0;
    var impl  = '';
    impl += 'c.delayPC = c.gprLo[' + s + '];\n';  // NB needs to be unsigned
    impl += 'rlo[' + d + '] = ' + toString32(ra) + ';\n';
    impl += 'rhi[' + d + '] = ' + ra_hi + ';\n';
    return generateBranchOpBoilerplate(impl, ctx, false);
  }
  function executeJALR(i) {
    var new_pc = cpu0.gprLo[rs(i)];
    setSignExtend(rd(i), cpu0.pc + 8);
    performBranch( new_pc );
  }


  function generateJR(ctx) {
    var impl = 'c.delayPC = c.gprLo[' + ctx.instr_rs() + '];\n'; // NB needs to be unsigned
    return generateBranchOpBoilerplate(impl, ctx, false);
   }
   function executeJR(i) {
    performBranch( cpu0.gprLo[rs(i)] );
  }

  function generateBEQ(ctx) {
    var s    = ctx.instr_rs();
    var t    = ctx.instr_rt();
    var off  = ctx.instr_offset();
    var addr = branchAddress(ctx.pc, ctx.instruction);

    var impl = '';

    if (s === t) {
      if (off === -1) {
        impl += 'c.speedHack();\n';
        ctx.bailOut = true;
      }
      impl += 'c.delayPC = ' + toString32(addr) + ';\n';
   } else {
      impl += 'if (' + genSrcRegHi(s) + ' === ' + genSrcRegHi(t) + ' &&\n';
      impl += '    ' + genSrcRegLo(s) + ' === ' + genSrcRegLo(t) + ' ) {\n';
      if (off === -1) {
        impl += '  c.speedHack();\n';
        ctx.bailOut = true;
      }
      impl += '  c.delayPC = ' + toString32(addr) + ';\n';
      impl += '}\n';
    }

    return generateBranchOpBoilerplate(impl, ctx, false);
  }

  function executeBEQ(i) {
    var s = rs(i);
    var t = rt(i);
    if (cpu0.gprHi_signed[s] === cpu0.gprHi_signed[t] &&
        cpu0.gprLo_signed[s] === cpu0.gprLo_signed[t] ) {
      if (offset(i) === -1 )
        cpu0.speedHack();
      performBranch( branchAddress(cpu0.pc,i) );
    }
  }

  function generateBEQL(ctx) {
    var s    = ctx.instr_rs();
    var t    = ctx.instr_rt();
    var off  = ctx.instr_offset();
    var addr = branchAddress(ctx.pc, ctx.instruction);

    var impl = '';

    impl += 'if (' + genSrcRegHi(s) + ' === ' + genSrcRegHi(t) + ' &&\n';
    impl += '    ' + genSrcRegLo(s) + ' === ' + genSrcRegLo(t) + ' ) {\n';
    impl += '  c.delayPC = ' + toString32(addr) + ';\n';
    impl += '} else {\n';
    impl += '  c.nextPC += 4;\n';
    impl += '}\n';

    return generateBranchOpBoilerplate(impl, ctx, true /* might_adjust_next_pc*/);
  }

  function executeBEQL(i) {
    var s = rs(i);
    var t = rt(i);
    if (cpu0.gprHi_signed[s] === cpu0.gprHi_signed[t] &&
        cpu0.gprLo_signed[s] === cpu0.gprLo_signed[t] ) {
      performBranch( branchAddress(cpu0.pc,i) );
    } else {
      cpu0.nextPC += 4;   // skip the next instruction
    }
  }

  function generateBNE(ctx) {
    var s    = ctx.instr_rs();
    var t    = ctx.instr_rt();
    var off  = ctx.instr_offset();
    var addr = branchAddress(ctx.pc, ctx.instruction);

    var impl = '';

    impl += 'if (' + genSrcRegHi(s) + ' !== ' + genSrcRegHi(t) + ' ||\n';
    impl += '    ' + genSrcRegLo(s) + ' !== ' + genSrcRegLo(t) + ' ) {\n';
    if (off === -1) {
      impl += '  c.speedHack();\n';
      ctx.bailOut = true;
    }
    impl += '  c.delayPC = ' + toString32(addr) + ';\n';
    impl += '}\n';

    return generateBranchOpBoilerplate(impl, ctx, false);
  }

  function executeBNE(i) {
    var s = rs(i);
    var t = rt(i);
    if (cpu0.gprHi_signed[s] !== cpu0.gprHi_signed[t] ||
        cpu0.gprLo_signed[s] !== cpu0.gprLo_signed[t] ) {      // NB: if imms(i) == -1 then this is a branch to self/busywait
      performBranch( branchAddress(cpu0.pc,i) );
    }
  }


  function generateBNEL(ctx) {
    var s    = ctx.instr_rs();
    var t    = ctx.instr_rt();
    var off  = ctx.instr_offset();
    var addr = branchAddress(ctx.pc, ctx.instruction);

    var impl = '';

    impl += 'if (' + genSrcRegHi(s) + ' !== ' + genSrcRegHi(t) + ' ||\n';
    impl += '    ' + genSrcRegLo(s) + ' !== ' + genSrcRegLo(t) + ' ) {\n';
    impl += '  c.delayPC = ' + toString32(addr) + ';\n';
    impl += '} else {\n';
    impl += '  c.nextPC += 4;\n';
    impl += '}\n';

    return generateBranchOpBoilerplate(impl, ctx, true /* might_adjust_next_pc*/);
  }

  function executeBNEL(i) {
    var s = rs(i);
    var t = rt(i);
    if (cpu0.gprHi_signed[s] !== cpu0.gprHi_signed[t] ||
        cpu0.gprLo_signed[s] !== cpu0.gprLo_signed[t] ) {
      performBranch( branchAddress(cpu0.pc,i) );
    } else {
      cpu0.nextPC += 4;   // skip the next instruction
    }
  }

  // Branch Less Than or Equal To Zero
  function generateBLEZ(ctx) {
    var s    = ctx.instr_rs();
    var addr = branchAddress(ctx.pc, ctx.instruction);

    var impl = '';
    impl += 'if ( ' + genSrcRegHi(s) + ' < 0 ||\n';
    impl += '    (' + genSrcRegHi(s) + ' === 0 && ' + genSrcRegLo(s) + ' === 0) ) {\n';
    impl += '  c.delayPC = ' + toString32(addr) + ';\n';
    impl += '}\n';

    return generateBranchOpBoilerplate(impl, ctx, false);
  }

  function executeBLEZ(i) {
    var s = rs(i);
    if ( cpu0.gprHi_signed[s] < 0 ||
        (cpu0.gprHi_signed[s] === 0 && cpu0.gprLo_signed[s] === 0) ) {
      performBranch( branchAddress(cpu0.pc,i) );
    }
  }

  function executeBLEZL(i) {
    var s = rs(i);
    // NB: if rs == r0 then this branch is always taken
    if ( cpu0.gprHi_signed[s] < 0 ||
        (cpu0.gprHi_signed[s] === 0 && cpu0.gprLo_signed[s] === 0) ) {
      performBranch( branchAddress(cpu0.pc,i) );
    } else {
      cpu0.nextPC += 4;   // skip the next instruction
    }
  }

  // Branch Greater Than Zero
  function generateBGTZ(ctx) {
    var s    = ctx.instr_rs();
    var addr = branchAddress(ctx.pc, ctx.instruction);

    var impl = '';
    impl += 'if ( ' + genSrcRegHi(s) + ' >= 0 &&\n';
    impl += '    (' + genSrcRegHi(s) + ' !== 0 || ' + genSrcRegLo(s) + ' !== 0) ) {\n';
    impl += '  c.delayPC = ' + toString32(addr) + ';\n';
    impl += '}\n';

    return generateBranchOpBoilerplate(impl, ctx, false);
  }

  function executeBGTZ(i) {
    var s = rs(i);
    if ( cpu0.gprHi_signed[s] >= 0 &&
        (cpu0.gprHi_signed[s] !== 0 || cpu0.gprLo_signed[s] !== 0) ) {
      performBranch( branchAddress(cpu0.pc,i) );
    }
  }

  function executeBGTZL(i) {
    var s = rs(i);
    if ( cpu0.gprHi_signed[s] >= 0 &&
        (cpu0.gprHi_signed[s] !== 0 || cpu0.gprLo_signed[s] !== 0) ) {
      performBranch( branchAddress(cpu0.pc,i) );
    } else {
      cpu0.nextPC += 4;   // skip the next instruction
    }
  }

  // Branch Less Than Zero
  function generateBLTZ(ctx) {
    var s    = ctx.instr_rs();
    var addr = branchAddress(ctx.pc, ctx.instruction);

    var impl = '';
    impl += 'if (' + genSrcRegHi(s) + ' < 0) {\n';
    impl += '  c.delayPC = ' + toString32(addr) + ';\n';
    impl += '}\n';

    return generateBranchOpBoilerplate(impl, ctx, false);
  }

  function executeBLTZ(i) {
    if (cpu0.gprHi_signed[rs(i)] < 0) {
      performBranch( branchAddress(cpu0.pc,i) );
    }
  }

  function generateBLTZL(ctx) {
    var s    = ctx.instr_rs();
    var addr = branchAddress(ctx.pc, ctx.instruction);

    var impl = '';
    impl += 'if (' + genSrcRegHi(s) + ' < 0) {\n';
    impl += '  c.delayPC = ' + toString32(addr) + ';\n';
    impl += '} else {\n';
    impl += '  c.nextPC += 4;\n';
    impl += '}\n';

    return generateBranchOpBoilerplate(impl, ctx, true /* might_adjust_next_pc*/);
  }

  function executeBLTZL(i) {
    if (cpu0.gprHi_signed[rs(i)] < 0) {
      performBranch( branchAddress(cpu0.pc,i) );
    } else {
      cpu0.nextPC += 4;   // skip the next instruction
    }
  }

  function executeBLTZAL(i) {
    setSignExtend(cpu0.kRegister_ra, cpu0.pc + 8);
    if (cpu0.gprHi_signed[rs(i)] < 0) {
      performBranch( branchAddress(cpu0.pc,i) );
    }
  }

  function executeBLTZALL(i) {
    setSignExtend(cpu0.kRegister_ra, cpu0.pc + 8);
    if (cpu0.gprHi_signed[rs(i)] < 0) {
      performBranch( branchAddress(cpu0.pc,i) );
    } else {
      cpu0.nextPC += 4;   // skip the next instruction
    }
  }

  // Branch Greater Than Zero
  function generateBGEZ(ctx) {
    var s    = ctx.instr_rs();
    var addr = branchAddress(ctx.pc, ctx.instruction);

    var impl = '';
    impl += 'if (' + genSrcRegHi(s) + ' >= 0) {\n';
    impl += '  c.delayPC = ' + toString32(addr) + ';\n';
    impl += '}\n';

    return generateBranchOpBoilerplate(impl, ctx, false);
  }

  function executeBGEZ(i) {
    if (cpu0.gprHi_signed[rs(i)] >= 0) {
      performBranch( branchAddress(cpu0.pc,i) );
    }
  }

  function generateBGEZL(ctx) {
    var s    = ctx.instr_rs();
    var addr = branchAddress(ctx.pc, ctx.instruction);

    var impl = '';
    impl += 'if (' + genSrcRegHi(s) + ' >= 0) {\n';
    impl += '  c.delayPC = ' + toString32(addr) + ';\n';
    impl += '} else {\n';
    impl += '  c.nextPC += 4;\n';
    impl += '}\n';

    return generateBranchOpBoilerplate(impl, ctx, true /* might_adjust_next_pc*/);
  }

  function executeBGEZL(i) {
    if (cpu0.gprHi_signed[rs(i)] >= 0) {
      performBranch( branchAddress(cpu0.pc,i) );
    } else {
      cpu0.nextPC += 4;   // skip the next instruction
    }
  }

  function executeBGEZAL(i) {
    setSignExtend(cpu0.kRegister_ra, cpu0.pc + 8);
    if (cpu0.gprHi_signed[rs(i)] >= 0) {
      performBranch( branchAddress(cpu0.pc,i) );
    }
  }

  function executeBGEZALL(i) {
    setSignExtend(cpu0.kRegister_ra, cpu0.pc + 8);
    if (cpu0.gprHi_signed[rs(i)] >= 0) {
      performBranch( branchAddress(cpu0.pc,i) );
    } else {
      cpu0.nextPC += 4;   // skip the next instruction
    }
  }

  function generateADDI(ctx) {
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();
    var impl = '';
    impl += 'var result = ' + genSrcRegLo(s) + ' + ' + imms(ctx.instruction) + ';\n';
    impl += 'rlo[' + t + '] = result;\n';
    impl += 'rhi[' + t + '] = result >> 31;\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function executeADDI(i) {
    var s         = rs(i);
    var t         = rt(i);
    var result    = cpu0.gprLo_signed[s] + imms(i);
    cpu0.gprLo_signed[t] = result;
    cpu0.gprHi_signed[t] = result >> 31;
  }

  function generateADDIU(ctx) {
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();
    var impl = '';
    impl += 'var result = ' + genSrcRegLo(s) + ' + ' + imms(ctx.instruction) + ';\n';
    impl += 'rlo[' + t + '] = result;\n';
    impl += 'rhi[' + t + '] = result >> 31;\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function executeADDIU(i) {
    var s         = rs(i);
    var t         = rt(i);
    var result    = cpu0.gprLo_signed[s] + imms(i);
    cpu0.gprLo_signed[t] = result;
    cpu0.gprHi_signed[t] = result >> 31;
  }

  function executeDADDI(i) {
    cpu0.setGPR_s64(rt(i), cpu0.getGPR_s64(rs(i)) + imms(i));
  }

  function executeDADDIU(i) {
    cpu0.setGPR_s64(rt(i), cpu0.getGPR_s64(rs(i)) + imms(i));
  }

  function generateSLTI(ctx) {
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();

    var immediate    = imms(ctx.instruction);
    var imm_hi       = immediate >> 31;
    var imm_unsigned = immediate >>> 0;

    var impl = '';
    impl += 'if (' + genSrcRegHi(s) + ' === ' + imm_hi + ') {\n';
    impl += '  rlo[' + t + '] = (c.gprLo[' + s  +'] < ' + imm_unsigned + ') ? 1 : 0;\n';
    impl += '} else {\n';
    impl += '  rlo[' + t + '] = (' + genSrcRegHi(s) + ' < ' + imm_hi + ') ? 1 : 0;\n';
    impl += '}\n';
    impl += 'rhi[' + t + '] = 0;\n';

    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function executeSLTI(i) {
    var s         = rs(i);
    var t         = rt(i);

    var immediate = imms(i);
    var imm_hi    = immediate >> 31;
    var s_hi      = cpu0.gprHi_signed[s];

    if (s_hi === imm_hi) {
      cpu0.gprLo_signed[t] = (cpu0.gprLo[s] < (immediate>>>0)) ? 1 : 0;    // NB signed compare
    } else {
      cpu0.gprLo_signed[t] = (s_hi < imm_hi) ? 1 : 0;
    }
    cpu0.gprHi_signed[t] = 0;
  }

  function generateSLTIU(ctx) {
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();

    var immediate    = imms(ctx.instruction);
    var imm_hi       = immediate >> 31;
    var imm_unsigned = immediate >>> 0;

    var impl = '';
    impl += 'if (' + genSrcRegHi(s) + ' === ' + imm_hi + ') {\n';
    impl += '  rlo[' + t + '] = (c.gprLo[' + s  +'] < ' + imm_unsigned + ') ? 1 : 0;\n';
    impl += '} else {\n';
    impl += '  rlo[' + t + '] = ((' + genSrcRegHi(s) + '>>>0) < (' + (imm_hi>>>0) + ')) ? 1 : 0;\n';
    impl += '}\n';
    impl += 'rhi[' + t + '] = 0;\n';

    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function executeSLTIU(i) {
    var s         = rs(i);
    var t         = rt(i);

    // NB: immediate value is still sign-extended, but treated as unsigned
    var immediate = imms(i);
    var imm_hi    = immediate >> 31;
    var s_hi      = cpu0.gprHi_signed[s];

    if (s_hi === imm_hi) {
      cpu0.gprLo[t] = (cpu0.gprLo[s] < (immediate>>>0)) ? 1 : 0;
    } else {
      cpu0.gprLo[t] = ((s_hi>>>0) < (imm_hi>>>0)) ? 1 : 0;
    }
    cpu0.gprHi[t] = 0;

  }

  function generateANDI(ctx) {
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();
    var impl = '';
    impl += 'rlo[' + t + '] = ' + genSrcRegLo(s) + ' & ' + imm(ctx.instruction) + ';\n';
    impl += 'rhi[' + t + '] = 0;\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function executeANDI(i) {
    var s = rs(i);
    var t = rt(i);
    cpu0.gprLo_signed[t] = cpu0.gprLo_signed[s] & imm(i);
    cpu0.gprHi_signed[t] = 0;    // always 0, as sign extended immediate value is always 0
  }

  function generateORI(ctx) {
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();
    var impl = '';
    impl += 'rlo[' + t + '] = ' + genSrcRegLo(s) + ' | ' + imm(ctx.instruction) + ';\n';
    if (s !== t)
      impl += 'rhi[' + t + '] = ' + genSrcRegHi(s) + ';\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function executeORI(i) {
    var s = rs(i);
    var t = rt(i);
    cpu0.gprLo_signed[t] = cpu0.gprLo_signed[s] | imm(i);
    cpu0.gprHi_signed[t] = cpu0.gprHi_signed[s];
  }

  function generateXORI(ctx) {
    var s = ctx.instr_rs();
    var t = ctx.instr_rt();
    var impl = '';
    impl += 'rlo[' + t + '] = ' + genSrcRegLo(s) + ' ^ ' + imm(ctx.instruction) + ';\n';
    if (s !== t)
      impl += 'rhi[' + t + '] = ' + genSrcRegHi(s) + ';\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function executeXORI(i) {
    // High 32 bits are always unchanged, as sign extended immediate value is always 0
    var s = rs(i);
    var t = rt(i);
    cpu0.gprLo_signed[t] = cpu0.gprLo_signed[s] ^ imm(i);
    cpu0.gprHi_signed[t] = cpu0.gprHi_signed[s];
  }

  function generateLUI(ctx) {
    var t = ctx.instr_rt();
    var value_lo = imms(ctx.instruction) << 16;
    var value_hi = (value_lo < 0) ? -1 : 0;

    var impl = '';
    impl += 'rlo[' + t +'] = ' + value_lo + ';\n';
    impl += 'rhi[' + t +'] = ' + value_hi + ';\n';
    return generateTrivialOpBoilerplate(impl, ctx);
  }

  function executeLUI(i) {
    var t = rt(i);
    var value = imms(i) << 16;
    cpu0.gprLo_signed[t] = value;
    cpu0.gprHi_signed[t] = value >> 31;
  }

  function generateLB(ctx) {
    var t = ctx.instr_rt();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    var impl = '';
    impl += 'var value = n64js.load_s8(ram, ' + genSrcRegLo(b) + ' + ' + o + ');\n';
    impl += 'rlo[' + t + '] = value;\n';
    impl += 'rhi[' + t + '] = value >> 31;\n';

    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  function executeLB(i) {
    var t = rt(i);
    var b = base(i);
    var o = imms(i);

    var value = n64js.load_s8(cpu0.ram, cpu0.gprLo_signed[b] + o);
    cpu0.gprLo_signed[t] = value;
    cpu0.gprHi_signed[t] = value >> 31;
  }

  function generateLBU(ctx) {
    var t = ctx.instr_rt();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    var impl = '';
    impl += 'rlo[' + t + '] = n64js.load_u8(ram, ' + genSrcRegLo(b) + ' + ' + o + ');\n';
    impl += 'rhi[' + t + '] = 0;\n';

    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  function executeLBU(i) {
    var t = rt(i);
    var b = base(i);
    var o = imms(i);

    cpu0.gprLo_signed[t] = n64js.load_u8(cpu0.ram, cpu0.gprLo_signed[b] + o);
    cpu0.gprHi_signed[t] = 0;
  }

  function generateLH(ctx) {
    var t = ctx.instr_rt();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    var impl = '';
    impl += 'var value = n64js.load_s16(ram, ' + genSrcRegLo(b) + ' + ' + o + ');\n';
    impl += 'rlo[' + t + '] = value;\n';
    impl += 'rhi[' + t + '] = value >> 31;\n';

    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  function executeLH(i) {
    var t = rt(i);
    var b = base(i);
    var o = imms(i);

    var value = n64js.load_s16(cpu0.ram, cpu0.gprLo_signed[b] + o);
    cpu0.gprLo_signed[t] = value;
    cpu0.gprHi_signed[t] = value >> 31;
  }

  function generateLHU(ctx) {
    var t = ctx.instr_rt();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    var impl = '';
    impl += 'rlo[' + t + '] = n64js.load_u16(ram, ' + genSrcRegLo(b) + ' + ' + o + ');\n';
    impl += 'rhi[' + t + '] = 0;\n';

    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  function executeLHU(i) {
    var t = rt(i);
    var b = base(i);
    var o = imms(i);

    cpu0.gprLo_signed[t] = n64js.load_u16(cpu0.ram, cpu0.gprLo_signed[b] + o);
    cpu0.gprHi_signed[t] = 0;
  }

  function generateLW(ctx) {
    var t = ctx.instr_rt();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();
    // SF2049 requires this, apparently
    if (t === 0)
      return generateNOPBoilerplate('/*load to r0!*/', ctx);

    var impl = '';
    impl += 'var value = n64js.load_s32(ram, ' + genSrcRegLo(b) + ' + ' + o + ');\n';
    impl += 'rlo[' + t + '] = value;\n';
    impl += 'rhi[' + t + '] = value >> 31;\n';

    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  function executeLW(i) {
    var t = rt(i);
    var b = base(i);
    var o = imms(i);

    // SF2049 requires this, apparently
    if (t === 0)
      return;

    var value = n64js.load_s32(cpu0.ram, cpu0.gprLo_signed[b] + o);
    cpu0.gprLo_signed[t] = value;
    cpu0.gprHi_signed[t] = value >> 31;
  }

  function generateLWU(ctx) {
    var t = ctx.instr_rt();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    var impl = '';
    impl += 'rlo[' + t + '] = n64js.load_u32(ram, ' + genSrcRegLo(b) + ' + ' + o + ');\n';
    impl += 'rhi[' + t + '] = 0;\n';

    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  function executeLWU(i) {
    var t = rt(i);
    var b = base(i);
    var o = imms(i);

    cpu0.gprLo_signed[t] = n64js.load_u32(cpu0.ram, cpu0.gprLo_signed[b] + o);
    cpu0.gprHi_signed[t] = 0;
  }

  function generateLD(ctx) {
    var t = ctx.instr_rt();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    var impl = '';
    impl += 'var addr = ' + genSrcRegLo(b) + ' + ' + o + ';\n';
    impl += 'if (addr < -2139095040) {\n';
    impl += '  var phys = (addr + 0x80000000) | 0;\n';
    impl += '  rhi[' + t + '] = ((ram[phys  ] << 24) | (ram[phys+1] << 16) | (ram[phys+2] << 8) | ram[phys+3]);\n';
    impl += '  rlo[' + t + '] = ((ram[phys+4] << 24) | (ram[phys+5] << 16) | (ram[phys+6] << 8) | ram[phys+7]);\n';
    impl += '} else {\n';
    impl += '  rhi[' + t + '] = lw_slow(addr);\n';
    impl += '  rlo[' + t + '] = lw_slow(addr + 4);\n';
    impl += '}\n';
    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  function executeLD(i) {
    var t = rt(i);
    var b = base(i);
    var o = imms(i);

    var addr = cpu0.gprLo_signed[b] + o;
    if (addr < -2139095040) {
      var phys = (addr + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
      var ram = cpu0.ram;
      cpu0.gprHi_signed[t] = ((ram[phys  ] << 24) | (ram[phys+1] << 16) | (ram[phys+2] << 8) | ram[phys+3]) | 0;
      cpu0.gprLo_signed[t] = ((ram[phys+4] << 24) | (ram[phys+5] << 16) | (ram[phys+6] << 8) | ram[phys+7]) | 0;
    } else {
      cpu0.gprHi_signed[t] = lw_slow(addr);
      cpu0.gprLo_signed[t] = lw_slow(addr + 4);
    }
  }

  function generateLWC1(ctx) {
    var t = ctx.instr_ft();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    ctx.fragment.usesCop1 = true;

    var impl = 'cpu1.int32[' + t + '] = n64js.load_s32(ram, ' + genSrcRegLo(b) + ' + ' + o + ');\n';
    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  // FIXME: needs to check Cop1Enabled - thanks Salvy!
  function executeLWC1(i) {
    var t = ft(i);
    var b = base(i);
    var o = imms(i);

    cpu1.int32[t] = n64js.load_s32(cpu0.ram, cpu0.gprLo_signed[b] + o);
  }

  function generateLDC1(ctx){
    var t = ctx.instr_ft();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    ctx.fragment.usesCop1 = true;

    var impl = '';
    impl += 'var value_lo;\n';
    impl += 'var value_hi;\n';
    impl += 'var addr = ' + genSrcRegLo(b) + ' + ' + o + ';\n';
    impl += 'if (addr < -2139095040) {\n';
    impl += '  var phys = (addr + 0x80000000) | 0;\n';
    impl += '  value_hi = ((ram[phys  ] << 24) | (ram[phys+1] << 16) | (ram[phys+2] << 8) | ram[phys+3]) | 0;\n'; // FIXME: |0 needed?
    impl += '  value_lo = ((ram[phys+4] << 24) | (ram[phys+5] << 16) | (ram[phys+6] << 8) | ram[phys+7]) | 0;\n';
    impl += '} else {\n';
    impl += '  value_hi = lw_slow(addr);\n';
    impl += '  value_lo = lw_slow(addr + 4);\n';
    impl += '}\n';
    impl += 'cpu1.store_64(' + t + ', value_lo, value_hi);\n';

    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  // FIXME: needs to check Cop1Enabled - thanks Salvy!
  function executeLDC1(i) {
    var t = ft(i);
    var b = base(i);
    var o = imms(i);

    var addr = cpu0.gprLo_signed[b] + o;
    var value_lo;
    var value_hi;
    if (addr < -2139095040) {
      var phys = (addr + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
      var ram = cpu0.ram;
      value_hi = ((ram[phys  ] << 24) | (ram[phys+1] << 16) | (ram[phys+2] << 8) | ram[phys+3]) | 0;
      value_lo = ((ram[phys+4] << 24) | (ram[phys+5] << 16) | (ram[phys+6] << 8) | ram[phys+7]) | 0;
    } else {
      value_hi = lw_slow(addr);
      value_lo = lw_slow(addr + 4);
    }

    cpu1.store_64( t, value_lo, value_hi );
  }

  function executeLDC2(i)       { unimplemented(cpu0.pc,i); }

  function executeLWL(i) {
    var address         = memaddr(i)>>>0;
    var address_aligned = (address & ~3)>>>0;
    var memory          = n64js.readMemoryU32(address_aligned);
    var reg             = cpu0.gprLo[rt(i)];

    var value;
    switch(address % 4) {
      case 0:       value = memory;                              break;
      case 1:       value = (reg & 0x000000ff) | (memory <<  8); break;
      case 2:       value = (reg & 0x0000ffff) | (memory << 16); break;
      default:      value = (reg & 0x00ffffff) | (memory << 24); break;
    }

    setSignExtend( rt(i), value );
  }

  function executeLWR(i) {
    var address         = memaddr(i)>>>0;
    var address_aligned = (address & ~3)>>>0;
    var memory          = n64js.readMemoryU32(address_aligned);
    var reg             = cpu0.gprLo[rt(i)];

    var value;
    switch(address % 4) {
      case 0:       value = (reg & 0xffffff00) | (memory >>> 24); break;
      case 1:       value = (reg & 0xffff0000) | (memory >>> 16); break;
      case 2:       value = (reg & 0xff000000) | (memory >>>  8); break;
      default:      value = memory;                               break;
    }

    setSignExtend( rt(i), value );
  }

  function executeLDL(i)        { unimplemented(cpu0.pc,i); }
  function executeLDR(i)        { unimplemented(cpu0.pc,i); }

  function generateSB(ctx) {
    var t = ctx.instr_rt();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    var impl = '';
    impl += 'n64js.store_8(ram, ' + genSrcRegLo(b) + ' + ' + o + ', ' + genSrcRegLo(t) + ');\n';
    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  function executeSB(i) {
    var t = rt(i);
    var b = base(i);
    var o = imms(i);

    n64js.store_8(cpu0.ram, cpu0.gprLo_signed[b] + o, cpu0.gprLo_signed[t] /*& 0xff*/);
  }

  function generateSH(ctx) {
    var t = ctx.instr_rt();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    var impl = '';
    impl += 'n64js.store_16(ram, ' + genSrcRegLo(b) + ' + ' + o + ', ' + genSrcRegLo(t) + ');\n';
    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  function executeSH(i) {
    var t = rt(i);
    var b = base(i);
    var o = imms(i);

    n64js.store_16(cpu0.ram, cpu0.gprLo_signed[b] + o, cpu0.gprLo_signed[t] /*& 0xffff*/);
  }

  function generateSW(ctx) {
    var t = ctx.instr_rt();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    var impl = '';
    impl += 'n64js.store_32(ram, ' + genSrcRegLo(b) + ' + ' + o + ', ' + genSrcRegLo(t) + ');\n';
    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  function executeSW(i) {
    var t = rt(i);
    var b = base(i);
    var o = imms(i);

    n64js.store_32(cpu0.ram, cpu0.gprLo_signed[b] + o, cpu0.gprLo_signed[t]);
  }

  function generateSD(ctx) {
    var t = ctx.instr_rt();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    var impl = '';
    impl += 'var addr = ' + genSrcRegLo(b) + ' + ' + o + ';\n';
    impl += 'n64js.store_64(ram, addr,     ' + genSrcRegLo(t) + ',' + genSrcRegHi(t) + ');\n';

    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  function executeSD(i) {
    var t = rt(i);
    var b = base(i);
    var o = imms(i);

    var addr = cpu0.gprLo_signed[b] + o;
    n64js.store_64(cpu0.ram, addr, cpu0.gprLo_signed[t], cpu0.gprHi_signed[t]);
  }

  function generateSWC1(ctx) {
    var t = ctx.instr_ft();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    ctx.fragment.usesCop1 = true;

    // FIXME: can avoid cpuStuffToDo if we're writing to ram
    var impl = '';
    impl += 'n64js.store_32(ram, ' + genSrcRegLo(b) + ' + ' + o + ', cpu1.int32[' + t + ']);\n';
    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  // FIXME: needs to check Cop1Enabled - thanks Salvy!
  function executeSWC1(i) {
    var t = ft(i);
    var b = base(i);
    var o = imms(i);

    n64js.store_32(cpu0.ram, cpu0.gprLo_signed[b] + o, cpu1.int32[t]);
  }

  function generateSDC1(ctx) {
    var t = ctx.instr_ft();
    var b = ctx.instr_base();
    var o = ctx.instr_imms();

    var hi = t+1;

    ctx.fragment.usesCop1 = true;

    // FIXME: can avoid cpuStuffToDo if we're writing to ram
    var impl = '';
    impl += 'var addr = ' + genSrcRegLo(b) + ' + ' + o + ';\n';
    impl += 'n64js.store_64(ram, addr, cpu1.int32[' + t + '], cpu1.int32[' + hi + ']);\n';
    return generateMemoryAccessBoilerplate(impl, ctx);
  }

  // FIXME: needs to check Cop1Enabled - thanks Salvy!
  function executeSDC1(i) {
    var t = ft(i);
    var b = base(i);
    var o = imms(i);

    // FIXME: this can do a single check that the address is in ram
    var addr = cpu0.gprLo_signed[b] + o;
    n64js.store_64(cpu0.ram, addr, cpu1.int32[t], cpu1.int32[t+1]);
  }

  function executeSDC2(i)       { unimplemented(cpu0.pc,i); }

  function executeSWL(i) {
    var address         = memaddr(i);
    var address_aligned = (address & ~3)>>>0;
    var memory          = n64js.readMemoryU32(address_aligned);
    var reg             = cpu0.gprLo[rt(i)];

    var value;
    switch(address % 4) {
      case 0:       value = reg;                                  break;
      case 1:       value = (memory & 0xff000000) | (reg >>>  8); break;
      case 2:       value = (memory & 0xffff0000) | (reg >>> 16); break;
      default:      value = (memory & 0xffffff00) | (reg >>> 24); break;
    }

    n64js.writeMemory32( address_aligned, value );
  }

  function executeSWR(i) {
    var address         = memaddr(i);
    var address_aligned = (address & ~3)>>>0;
    var memory          = n64js.readMemoryU32(address_aligned);
    var reg             = cpu0.gprLo[rt(i)];

    var value;
    switch(address % 4) {
      case 0:       value = (memory & 0x00ffffff) | (reg << 24); break;
      case 1:       value = (memory & 0x0000ffff) | (reg << 16); break;
      case 2:       value = (memory & 0x000000ff) | (reg <<  8); break;
      default:      value = reg;                                 break;
    }

    n64js.writeMemory32( address_aligned, value );
  }

  function executeSDL(i)        { unimplemented(cpu0.pc,i); }
  function executeSDR(i)        { unimplemented(cpu0.pc,i); }

  function generateCACHE(ctx) {
    var b        = ctx.instr_base();
    var o        = ctx.instr_imms();
    var cache_op = ctx.instr_rt();
    var cache    = (cache_op      ) & 0x3;
    var action   = (cache_op >>> 2) & 0x7;

    if(cache === 0 && (action === 0 || action === 4)) {
      var impl = '';
      impl += 'var addr = ' + genSrcRegLo(b) + ' + ' + o + ';\n';
      impl += "n64js.invalidateICacheEntry(addr);\n";
      return generateTrivialOpBoilerplate(impl, ctx);
    } else {
      return generateNOPBoilerplate('/*ignored CACHE*/', ctx);
    }
  }

  function executeCACHE(i) {
    var cache_op = rt(i);
    var cache    = (cache_op      ) & 0x3;
    var action   = (cache_op >>> 2) & 0x7;

    if(cache === 0 && (action === 0 || action === 4)) {
      // NB: only bother generating address if we handle the instruction - memaddr deopts like crazy
      var address  = memaddr(i);
      n64js.invalidateICacheEntry(address);
    }
  }

  function executeLL(i)         { unimplemented(cpu0.pc,i); }
  function executeLLD(i)        { unimplemented(cpu0.pc,i); }
  function executeSC(i)         { unimplemented(cpu0.pc,i); }
  function executeSCD(i)        { unimplemented(cpu0.pc,i); }

  function generateMFC1Stub(ctx) {
    var t = ctx.instr_rt();
    var s = ctx.instr_fs();

    ctx.fragment.usesCop1 = true;
    ctx.isTrivial         = true;

    var impl = '';
    impl += 'var result = cpu1.int32[' + s + '];\n';
    impl += 'rlo[' + t + '] = result;\n';
    impl += 'rhi[' + t + '] = result >> 31;\n';
    return impl;
  }

  function executeMFC1(i) {
    var t = rt(i);
    var s = fs(i);
    var result = cpu1.int32[s];
    cpu0.gprLo_signed[t] = result;
    cpu0.gprHi_signed[t] = result >> 31;
  }

  function generateDMFC1Stub(ctx) {
    var t = ctx.instr_rt();
    var s = ctx.instr_fs();
    var hi = s+1;

    ctx.fragment.usesCop1 = true;
    ctx.isTrivial         = true;

    var impl = '';
    impl += 'rlo[' + t + '] = cpu1.int32[' + s  + '];\n';
    impl += 'rhi[' + t + '] = cpu1.int32[' + hi + '];\n';
    return impl;
  }

  function executeDMFC1(i) {
    var t = rt(i);
    var s = fs(i);
    cpu0.gprLo_signed[t] = cpu1.int32[s];
    cpu0.gprHi_signed[t] = cpu1.int32[s+1];
  }

  function generateMTC1Stub(ctx) {
    var s = ctx.instr_fs();
    var t = ctx.instr_rt();

    ctx.fragment.usesCop1 = true;
    ctx.isTrivial         = true;

    return 'cpu1.int32[' + s + '] = rlo[' + t + '];\n';
  }

  function executeMTC1(i) {
    cpu1.int32[fs(i)] = cpu0.gprLo_signed[rt(i)];
  }

  function generateDMTC1Stub(ctx) {
    var s = ctx.instr_fs();
    var t = ctx.instr_rt();
    var hi = s+1;

    ctx.fragment.usesCop1 = true;
    ctx.isTrivial         = true;

    var impl = '';
    impl += 'cpu1.int32[' + s  + '] = rlo[' + t + '];\n';
    impl += 'cpu1.int32[' + hi + '] = rhi[' + t + '];\n';
    return impl;
  }

  function executeDMTC1(i) {
    var s = fs(i);
    var t = rt(i);

    cpu1.int32[s+0] = cpu0.gprLo_signed[t];
    cpu1.int32[s+1] = cpu0.gprHi_signed[t];
  }

  function generateCFC1Stub(ctx) {
    var s = ctx.instr_fs();
    var t = ctx.instr_rt();

    ctx.fragment.usesCop1 = true;
    ctx.isTrivial         = true;

    var impl = '';

    switch(s) {
      case 0:
      case 31:
        impl += 'var value = cpu1.control[' + s + '];\n';
        impl += 'rlo[' + t + '] = value;\n';
        impl += 'rhi[' + t + '] = value >> 31;\n';
        return impl;
    }

    return '/*CFC1 invalid reg*/\n';
  }

  function executeCFC1(i) {
    var s = fs(i);
    var t = rt(i);

    switch(s) {
      case 0:
      case 31:
        var value = cpu1.control[s];
        cpu0.gprLo_signed[t] = value;
        cpu0.gprHi_signed[t] = value >> 31;
        break;
    }
  }

  function generateCTC1Stub(ctx) {
    var s = ctx.instr_fs();
    var t = ctx.instr_rt();

    ctx.fragment.usesCop1 = true;
    ctx.isTrivial         = true;

    if (s === 31) {
      return 'cpu1.control[' + s + '] = rlo[' + t + '];\n';
    }

    return '/*CTC1 invalid reg*/\n';
  }

  function executeCTC1(i) {
    var s = fs(i);
    var t = rt(i);

    if (s === 31) {
      var v = cpu0.gprLo[t];

      // switch (v & FPCSR_RM_MASK) {
      // case FPCSR_RM_RN:     logger.log('cop1 - setting round near');  break;
      // case FPCSR_RM_RZ:     logger.log('cop1 - setting round zero');  break;
      // case FPCSR_RM_RP:     logger.log('cop1 - setting round ceil');  break;
      // case FPCSR_RM_RM:     logger.log('cop1 - setting round floor'); break;
      // }

      cpu1.control[s] = v;
    }
  }

  function generateBCInstrStub(ctx) {
    var i = ctx.instruction;
    n64js.assert( ((i>>>18)&0x7) === 0, "cc bit is not 0" );

    var condition = (i&0x10000) !== 0;
    var likely    = (i&0x20000) !== 0;
    var target    = branchAddress(ctx.pc, i);

    ctx.fragment.usesCop1 = true;
    ctx.isTrivial         = false; // NB: not trivial - branches!

    var impl = '';
    var test = condition ? '!==' : '===';
    impl += 'if ((cpu1.control[31] & FPCSR_C) ' + test + ' 0) {\n';
    impl += '  c.branchTarget = ' + toString32(target) + ';\n';
    if (likely) {
      impl += '} else {\n';
      impl += '  c.nextPC += 4;\n';
    }
    impl += '}\n';

    return impl;
  }

  function executeBCInstr(i) {
    n64js.assert( ((i>>>18)&0x7) === 0, "cc bit is not 0" );

    var condition = (i&0x10000) !== 0;
    var likely    = (i&0x20000) !== 0;
    var cc        = (cpu1.control[31] & FPCSR_C) !== 0;

    if (cc === condition) {
      performBranch( branchAddress(cpu0.pc, i) );
    } else {
      if (likely) {
        cpu0.nextPC += 4;   // skip the next instruction
      }
    }
  }

  n64js.trunc = function (x) {
    if (x < 0)
      return Math.ceil(x);
    else
      return Math.floor(x);
  };

  n64js.convert = function (x) {
    switch(cpu1.control[31] & FPCSR_RM_MASK) {
      case FPCSR_RM_RN:     return  Math.round(x);
      case FPCSR_RM_RZ:     return n64js.trunc(x);
      case FPCSR_RM_RP:     return  Math.ceil(x);
      case FPCSR_RM_RM:     return  Math.floor(x);
    }

    n64js.assert('unknown rounding mode');
  };

  function generateFloatCompare(op) {
    var impl = '';
    impl += 'var cc = false;\n';
    impl += 'if (isNaN(fs+ft)) {\n';
    if (op&0x8) {
      impl += '  n64js.halt("should raise Invalid Operation here.");\n';
    }
    if (op&0x1) {
      impl += '  cc = true;\n';
    }
    impl += '} else {\n';
    if (op&0x4) {
      impl += '  cc |= fs < ft;\n';
    }
    if (op&0x2) {
      impl += '  cc |= fs == ft;\n';
    }
    impl += '}\n';
    impl += 'if (cc) { cpu1.control[31] |= FPCSR_C; } else { cpu1.control[31] &= ~FPCSR_C; }\n';
    return impl;
  }

  function handleFloatCompare(op, fs, ft) {
      var c = false;
      if (isNaN(fs+ft)) {
        if (op&0x8) {
          n64js.halt('Should raise Invalid Operation here.');
        }
        if (op&0x1) c = true;
      } else {
        if (op&0x4) c |= fs <  ft;
        if (op&0x2) c |= fs == ft;
        // unordered is false here
      }
      cpu1.setCondition(c);
  }

  function generateSInstrStub(ctx) {
    var s = ctx.instr_fs();
    var t = ctx.instr_ft();
    var d = ctx.instr_fd();

    ctx.fragment.usesCop1 = true;
    ctx.isTrivial         = true;

    var op = cop1_func(ctx.instruction);

    if (op < 0x30) {
      switch(op) {
        case 0x00:    return 'cpu1.float32[' + d + '] = cpu1.float32[' + s + '] + cpu1.float32[' + t + '];\n';
        case 0x01:    return 'cpu1.float32[' + d + '] = cpu1.float32[' + s + '] - cpu1.float32[' + t + '];\n';
        case 0x02:    return 'cpu1.float32[' + d + '] = cpu1.float32[' + s + '] * cpu1.float32[' + t + '];\n';
        case 0x03:    return 'cpu1.float32[' + d + '] = cpu1.float32[' + s + '] / cpu1.float32[' + t + '];\n';
        case 0x04:    return 'cpu1.float32[' + d + '] = Math.sqrt( cpu1.float32[' + s + '] );\n';
        case 0x05:    return 'cpu1.float32[' + d + '] = Math.abs(  cpu1.float32[' + s + '] );\n';
        case 0x06:    return 'cpu1.float32[' + d + '] =  cpu1.float32[' + s + '];\n';
        case 0x07:    return 'cpu1.float32[' + d + '] = -cpu1.float32[' + s + '];\n';
        case 0x08:    /* 'ROUND.L.'*/     return 'cpu1.store_float_as_long(' + d + ',  Math.round( cpu1.float32[' + s + ']));\n';
        case 0x09:    /* 'TRUNC.L.'*/     return 'cpu1.store_float_as_long(' + d + ', n64js.trunc( cpu1.float32[' + s + ']));\n';
        case 0x0a:    /* 'CEIL.L.'*/      return 'cpu1.store_float_as_long(' + d + ',  Math.ceil(  cpu1.float32[' + s + ']));\n';
        case 0x0b:    /* 'FLOOR.L.'*/     return 'cpu1.store_float_as_long(' + d + ',  Math.floor( cpu1.float32[' + s + ']));\n';
        case 0x0c:    /* 'ROUND.W.'*/     return 'cpu1.int32[' + d + '] =  Math.round( cpu1.float32[' + s + '] );\n';  // TODO: check this
        case 0x0d:    /* 'TRUNC.W.'*/     return 'cpu1.int32[' + d + '] = n64js.trunc( cpu1.float32[' + s + '] );\n';
        case 0x0e:    /* 'CEIL.W.'*/      return 'cpu1.int32[' + d + '] =  Math.ceil(  cpu1.float32[' + s + '] );\n';
        case 0x0f:    /* 'FLOOR.W.'*/     return 'cpu1.int32[' + d + '] =  Math.floor( cpu1.float32[' + s + '] );\n';
        case 0x20:    /* 'CVT.S' */       break;
        case 0x21:    /* 'CVT.D' */       return 'cpu1.store_f64( ' + d + ', cpu1.float32[' + s + '] );\n';
        case 0x24:    /* 'CVT.W' */       return 'cpu1.int32[' + d + '] = n64js.convert( cpu1.float32[' + s + '] );\n';
        case 0x25:    /* 'CVT.L' */       break;
      }

      return 'unimplemented(' + toString32(ctx.pc) + ',' + toString32(ctx.instruction) + ');\n';
    }

    // It's a compare instruction
    var impl = '';
    impl += 'var fs = cpu1.float32[' + s + '];\n';
    impl += 'var ft = cpu1.float32[' + t + '];\n';
    impl += generateFloatCompare(op);
    return impl;
  }

  function executeSInstr(i) {
    var s = fs(i);
    var t = ft(i);
    var d = fd(i);

    var op = cop1_func(i);

    if (op < 0x30) {
      switch(op) {
        case 0x00:    cpu1.float32[d] = cpu1.float32[s] + cpu1.float32[t]; return;
        case 0x01:    cpu1.float32[d] = cpu1.float32[s] - cpu1.float32[t]; return;
        case 0x02:    cpu1.float32[d] = cpu1.float32[s] * cpu1.float32[t]; return;
        case 0x03:    cpu1.float32[d] = cpu1.float32[s] / cpu1.float32[t]; return;
        case 0x04:    cpu1.float32[d] = Math.sqrt( cpu1.float32[s] ); return;
        case 0x05:    cpu1.float32[d] = Math.abs(  cpu1.float32[s] ); return;
        case 0x06:    cpu1.float32[d] =  cpu1.float32[s]; return;
        case 0x07:    cpu1.float32[d] = -cpu1.float32[s]; return;
        case 0x08:    /* 'ROUND.L.'*/     cpu1.store_float_as_long(d,  Math.round( cpu1.float32[s] )); return;
        case 0x09:    /* 'TRUNC.L.'*/     cpu1.store_float_as_long(d, n64js.trunc( cpu1.float32[s] )); return;
        case 0x0a:    /* 'CEIL.L.'*/      cpu1.store_float_as_long(d,  Math.ceil(  cpu1.float32[s] )); return;
        case 0x0b:    /* 'FLOOR.L.'*/     cpu1.store_float_as_long(d,  Math.floor( cpu1.float32[s] )); return;
        case 0x0c:    /* 'ROUND.W.'*/     cpu1.int32[d] =  Math.round( cpu1.float32[s] )|0; return;  // TODO: check this
        case 0x0d:    /* 'TRUNC.W.'*/     cpu1.int32[d] = n64js.trunc( cpu1.float32[s] )|0; return;
        case 0x0e:    /* 'CEIL.W.'*/      cpu1.int32[d] =  Math.ceil(  cpu1.float32[s] )|0; return;
        case 0x0f:    /* 'FLOOR.W.'*/     cpu1.int32[d] =  Math.floor( cpu1.float32[s] )|0; return;

        case 0x20:    /* 'CVT.S' */       unimplemented(cpu0.pc,i); return;
        case 0x21:    /* 'CVT.D' */       cpu1.store_f64( d, cpu1.float32[s] ); return;
        case 0x24:    /* 'CVT.W' */       cpu1.int32[d] = n64js.convert( cpu1.float32[s] )|0; return;
        case 0x25:    /* 'CVT.L' */       unimplemented(cpu0.pc,i); return;
      }
      unimplemented(cpu0.pc,i);
    } else {
      var _s = cpu1.float32[s];
      var _t = cpu1.float32[t];
      handleFloatCompare(op, _s, _t);
    }
  }

  function generateDInstrStub(ctx) {
    var s = ctx.instr_fs();
    var t = ctx.instr_ft();
    var d = ctx.instr_fd();

    ctx.fragment.usesCop1 = true;
    ctx.isTrivial         = true;

    var op = cop1_func(ctx.instruction);

    if (op < 0x30) {
      switch(op) {
        case 0x00:    return 'cpu1.store_f64( ' + d + ', cpu1.load_f64( ' + s + ' ) + cpu1.load_f64( ' + t + ' ) );\n';
        case 0x01:    return 'cpu1.store_f64( ' + d + ', cpu1.load_f64( ' + s + ' ) - cpu1.load_f64( ' + t + ' ) );\n';
        case 0x02:    return 'cpu1.store_f64( ' + d + ', cpu1.load_f64( ' + s + ' ) * cpu1.load_f64( ' + t + ' ) );\n';
        case 0x03:    return 'cpu1.store_f64( ' + d + ', cpu1.load_f64( ' + s + ' ) / cpu1.load_f64( ' + t + ' ) );\n';
        case 0x04:    return 'cpu1.store_f64( ' + d + ', Math.sqrt( cpu1.load_f64( ' + s + ' ) ) );\n';
        case 0x05:    return 'cpu1.store_f64( ' + d + ', Math.abs(  cpu1.load_f64( ' + s + ' ) ) );\n';
        case 0x06:    return 'cpu1.store_f64( ' + d + ',  cpu1.load_f64( ' + s + ' ) );\n';
        case 0x07:    return 'cpu1.store_f64( ' + d + ', -cpu1.load_f64( ' + s + ' )  );\n';
        case 0x08:    /* 'ROUND.L.'*/     return 'cpu1.store_float_as_long(' + d + ',  Math.round( cpu1.load_f64( ' + s + ' )));\n';
        case 0x09:    /* 'TRUNC.L.'*/     return 'cpu1.store_float_as_long(' + d + ', n64js.trunc( cpu1.load_f64( ' + s + ' )));\n';
        case 0x0a:    /* 'CEIL.L.'*/      return 'cpu1.store_float_as_long(' + d + ',  Math.ceil(  cpu1.load_f64( ' + s + ' )));\n';
        case 0x0b:    /* 'FLOOR.L.'*/     return 'cpu1.store_float_as_long(' + d + ',  Math.floor( cpu1.load_f64( ' + s + ' )));\n';
        case 0x0c:    /* 'ROUND.W.'*/     return 'cpu1.int32[' + d + '] =  Math.round( cpu1.load_f64( ' + s + ' ) ) | 0;\n';  // TODO: check this
        case 0x0d:    /* 'TRUNC.W.'*/     return 'cpu1.int32[' + d + '] = n64js.trunc( cpu1.load_f64( ' + s + ' ) ) | 0;\n';
        case 0x0e:    /* 'CEIL.W.'*/      return 'cpu1.int32[' + d + '] =  Math.ceil(  cpu1.load_f64( ' + s + ' ) ) | 0;\n';
        case 0x0f:    /* 'FLOOR.W.'*/     return 'cpu1.int32[' + d + '] =  Math.floor( cpu1.load_f64( ' + s + ' ) ) | 0;\n';
        case 0x20:    /* 'CVT.S' */       return 'cpu1.float32[' + d + '] = cpu1.load_f64( ' + s + ' );\n';
        case 0x21:    /* 'CVT.D' */       break;
        case 0x24:    /* 'CVT.W' */       return 'cpu1.int32[' + d + '] = n64js.convert( cpu1.load_f64( ' + s + ' ) ) | 0;\n';
        case 0x25:    /* 'CVT.L' */       break;
      }
      return 'unimplemented(' + toString32(ctx.pc) + ',' + toString32(ctx.instruction) + ');\n';
    }

    // It's a compare instruction
    var impl = '';
    impl += 'var fs = cpu1.load_f64(' + s + ');\n';
    impl += 'var ft = cpu1.load_f64(' + t + ');\n';
    impl += generateFloatCompare(op);
    return impl;
  }

  function executeDInstr(i) {
    var s = fs(i);
    var t = ft(i);
    var d = fd(i);

    var op = cop1_func(i);

    if (op < 0x30) {
      switch(op) {
        case 0x00:    cpu1.store_f64( d, cpu1.load_f64( s ) + cpu1.load_f64( t ) ); return;
        case 0x01:    cpu1.store_f64( d, cpu1.load_f64( s ) - cpu1.load_f64( t ) ); return;
        case 0x02:    cpu1.store_f64( d, cpu1.load_f64( s ) * cpu1.load_f64( t ) ); return;
        case 0x03:    cpu1.store_f64( d, cpu1.load_f64( s ) / cpu1.load_f64( t ) ); return;
        case 0x04:    cpu1.store_f64( d, Math.sqrt( cpu1.load_f64( s ) ) ); return;
        case 0x05:    cpu1.store_f64( d, Math.abs(  cpu1.load_f64( s ) ) ); return;
        case 0x06:    cpu1.store_f64( d,  cpu1.load_f64( s ) ); return;
        case 0x07:    cpu1.store_f64( d, -cpu1.load_f64( s )  ); return;
        case 0x08:    /* 'ROUND.L.'*/     cpu1.store_float_as_long(d,  Math.round( cpu1.load_f64( s ) )); return;
        case 0x09:    /* 'TRUNC.L.'*/     cpu1.store_float_as_long(d, n64js.trunc( cpu1.load_f64( s ) )); return;
        case 0x0a:    /* 'CEIL.L.'*/      cpu1.store_float_as_long(d,  Math.ceil(  cpu1.load_f64( s ) )); return;
        case 0x0b:    /* 'FLOOR.L.'*/     cpu1.store_float_as_long(d,  Math.floor( cpu1.load_f64( s ) )); return;
        case 0x0c:    /* 'ROUND.W.'*/     cpu1.int32[d] =  Math.round( cpu1.load_f64( s ) ) | 0; return;  // TODO: check this
        case 0x0d:    /* 'TRUNC.W.'*/     cpu1.int32[d] = n64js.trunc( cpu1.load_f64( s ) ) | 0; return;
        case 0x0e:    /* 'CEIL.W.'*/      cpu1.int32[d] =  Math.ceil(  cpu1.load_f64( s ) ) | 0; return;
        case 0x0f:    /* 'FLOOR.W.'*/     cpu1.int32[d] =  Math.floor( cpu1.load_f64( s ) ) | 0; return;

        case 0x20:    /* 'CVT.S' */       cpu1.float32[d] = cpu1.load_f64( s ); return;
        case 0x21:    /* 'CVT.D' */       unimplemented(cpu0.pc,i); return;
        case 0x24:    /* 'CVT.W' */       cpu1.int32[d] = n64js.convert( cpu1.load_f64( s ) ) | 0; return;
        case 0x25:    /* 'CVT.L' */       unimplemented(cpu0.pc,i); return;
      }
      unimplemented(cpu0.pc,i);
    } else {
      var _s = cpu1.load_f64( s );
      var _t = cpu1.load_f64( t );
      handleFloatCompare(op, _s, _t);
    }
  }

  function generateWInstrStub(ctx) {
    var s = ctx.instr_fs();
    var d = ctx.instr_fd();

    ctx.fragment.usesCop1 = true;
    ctx.isTrivial         = true;
    switch(cop1_func(ctx.instruction)) {
      case 0x20:    /* 'CVT.S' */       return 'cpu1.float32[' + d + '] = cpu1.int32[' + s + '];\n';
      case 0x21:    /* 'CVT.D' */       return 'cpu1.store_f64(' + d + ', cpu1.int32[' + s + ']);\n';
    }
    return 'unimplemented(' + toString32(ctx.pc) + ',' + toString32(ctx.instruction) + ');\n';
  }

  function executeWInstr(i) {
    var s = fs(i);
    var d = fd(i);

    switch(cop1_func(i)) {
      case 0x20:    cpu1.float32[d] = cpu1.int32[s];  return;
      case 0x21:    cpu1.store_f64(d, cpu1.int32[s]); return;
    }
    unimplemented(cpu0.pc,i);
  }

  function generateLInstrStub(ctx) {
    var s = ctx.instr_fs();
    var d = ctx.instr_fd();

    ctx.fragment.usesCop1 = true;
    ctx.isTrivial         = true;
    switch(cop1_func(ctx.instruction)) {
      case 0x20:    /* 'CVT.S' */       return 'cpu1.float32[' + d + '] = cpu1.load_s64_as_double(' + s + ');\n';
      case 0x21:    /* 'CVT.D' */       return 'cpu1.store_f64(' + d + ', cpu1.load_s64_as_double(' + s + ') );\n';
    }
    return 'unimplemented(' + toString32(ctx.pc) + ',' + toString32(ctx.instruction) + ');\n';
  }

  function executeLInstr(i) {
    var s = fs(i);
    var d = fd(i);

    switch(cop1_func(i)) {
      case 0x20:    /* 'CVT.S' */ cpu1.float32[d] = cpu1.load_s64_as_double(s); return;
      case 0x21:    /* 'CVT.D' */ cpu1.store_f64(d, cpu1.load_s64_as_double(s)); return;
    }
    unimplemented(cpu0.pc,i);
  }

  var specialTable = [
    executeSLL,           executeUnknown,       executeSRL,         executeSRA,
    executeSLLV,          executeUnknown,       executeSRLV,        executeSRAV,
    executeJR,            executeJALR,          executeUnknown,     executeUnknown,
    executeSYSCALL,       executeBREAK,         executeUnknown,     executeSYNC,
    executeMFHI,          executeMTHI,          executeMFLO,        executeMTLO,
    executeDSLLV,         executeUnknown,       executeDSRLV,       executeDSRAV,
    executeMULT,          executeMULTU,         executeDIV,         executeDIVU,
    executeDMULT,         executeDMULTU,        executeDDIV,        executeDDIVU,
    executeADD,           executeADDU,          executeSUB,         executeSUBU,
    executeAND,           executeOR,            executeXOR,         executeNOR,
    executeUnknown,       executeUnknown,       executeSLT,         executeSLTU,
    executeDADD,          executeDADDU,         executeDSUB,        executeDSUBU,
    executeTGE,           executeTGEU,          executeTLT,         executeTLTU,
    executeTEQ,           executeUnknown,       executeTNE,         executeUnknown,
    executeDSLL,          executeUnknown,       executeDSRL,        executeDSRA,
    executeDSLL32,        executeUnknown,       executeDSRL32,      executeDSRA32
  ];
  if (specialTable.length != 64) {
    throw "Oops, didn't build the special table correctly";
  }
  n64js.executeUnknown = executeUnknown;

  function executeSpecial(i) {
    var fn = i & 0x3f;
    specialTable[fn](i);
  }

  var cop0Table = [
    executeMFC0,          executeUnknown,       executeUnknown,     executeUnknown,
    executeMTC0,          executeUnknown,       executeUnknown,     executeUnknown,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown,
    executeTLB,           executeUnknown,       executeUnknown,     executeUnknown,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown
  ];
  if (cop0Table.length != 32) {
    throw "Oops, didn't build the cop0 table correctly";
  }


  var cop0TableGen = [
    'executeMFC0',          'executeUnknown',       'executeUnknown',     'executeUnknown',
    generateMTC0,           'executeUnknown',       'executeUnknown',     'executeUnknown',
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown',
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown',
    'executeTLB',           'executeUnknown',       'executeUnknown',     'executeUnknown',
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown',
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown',
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown'
  ];
  if (cop0TableGen.length != 32) {
    throw "Oops, didn't build the cop0 table correctly";
  }

  // Expose all the functions that we don't yet generate
  n64js.executeMFC0 = executeMFC0;
  n64js.executeMTC0 = executeMTC0;  // There's a generateMTC0, but it calls through to the interpreter
  n64js.executeTLB  = executeTLB;


  function executeCop0(i) {
    var fmt = (i >>> 21) & 0x1f;
    cop0Table[fmt](i);
  }

  var cop1Table = [
    executeMFC1,          executeDMFC1,         executeCFC1,        executeUnknown,
    executeMTC1,          executeDMTC1,         executeCTC1,        executeUnknown,
    executeBCInstr,       executeUnknown,       executeUnknown,     executeUnknown,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown,
    executeSInstr,        executeDInstr,        executeUnknown,     executeUnknown,
    executeWInstr,        executeLInstr,        executeUnknown,     executeUnknown,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown
  ];
  if (cop1Table.length != 32) {
    throw "Oops, didn't build the cop1 table correctly";
  }

  var cop1TableGen = [
    generateMFC1Stub,       generateDMFC1Stub,      generateCFC1Stub,     'executeUnknown',
    generateMTC1Stub,       generateDMTC1Stub,      generateCTC1Stub,     'executeUnknown',
    generateBCInstrStub,    'executeUnknown',       'executeUnknown',     'executeUnknown',
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown',
    generateSInstrStub,     generateDInstrStub,     'executeUnknown',     'executeUnknown',
    generateWInstrStub,     generateLInstrStub,     'executeUnknown',     'executeUnknown',
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown',
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown'
  ];
  if (cop1TableGen.length != 32) {
    throw "Oops, didn't build the cop1 gen table correctly";
  }

  function generateCop1(ctx) {
    var fmt = (ctx.instruction >>> 21) & 0x1f;
    var fn = cop1TableGen[fmt];

    var op_impl;
    if (typeof fn === 'string') {
      //logger.log(fn);
      op_impl = 'n64js.' + fn + '(' + toString32(ctx.instruction) + ');\n';
    } else {
      op_impl = fn(ctx);
    }

    var impl = '';

    ctx.fragment.usesCop1 = true;

    if (ctx.fragment.cop1statusKnown) {
      // Assert that cop1 is enabled
      impl += ctx.genAssert('(c.control[12] & SR_CU1) !== 0', 'cop1 should be enabled');
      impl += op_impl;

    } else {
      impl += 'if( (c.control[12] & SR_CU1) === 0 ) {\n';
      impl += '  executeCop1_disabled(' + toString32(ctx.instruction) + ');\n';
      impl += '} else {\n';
      impl += '  ' + op_impl;
      impl += '}\n';

      ctx.isTrivial = false;    // Not trivial!
      ctx.fragment.cop1statusKnown = true;
      return generateGenericOpBoilerplate(impl, ctx);   // Ensure we generate full boilerplate here, even for trivial ops
    }

    if (ctx.isTrivial) {
     return generateTrivialOpBoilerplate(impl, ctx);
    }
    return generateGenericOpBoilerplate(impl, ctx);
  }

  function executeCop1(i) {
    //n64js.assert( (cpu0.control[cpu0.kControlSR] & SR_CU1) !== 0, "SR_CU1 in inconsistent state" );

    var fmt = (i >>> 21) & 0x1f;
    cop1Table[fmt](i);
  }
  function executeCop1_disabled(i) {
    log('Thread accessing cop1 for first time, throwing cop1 unusable exception');

    n64js.assert( (cpu0.control[cpu0.kControlSR] & SR_CU1) === 0, "SR_CU1 in inconsistent state" );

    cpu0.throwCop1Unusable();
  }

  function setCop1Enable(enable) {
    simpleTable[0x11] = enable ? executeCop1 : executeCop1_disabled;
  }

  var regImmTable = [
    executeBLTZ,          executeBGEZ,          executeBLTZL,       executeBGEZL,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown,
    executeTGEI,          executeTGEIU,         executeTLTI,        executeTLTIU,
    executeTEQI,          executeUnknown,       executeTNEI,        executeUnknown,
    executeBLTZAL,        executeBGEZAL,        executeBLTZALL,     executeBGEZALL,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown
  ];
  if (regImmTable.length != 32) {
    throw "Oops, didn't build the regimm table correctly";
  }

  function executeRegImm(i) {
    var rt = (i >>> 16) & 0x1f;
    return regImmTable[rt](i);
  }

  var simpleTable = [
    executeSpecial,       executeRegImm,        executeJ,           executeJAL,
    executeBEQ,           executeBNE,           executeBLEZ,        executeBGTZ,
    executeADDI,          executeADDIU,         executeSLTI,        executeSLTIU,
    executeANDI,          executeORI,           executeXORI,        executeLUI,
    executeCop0,          executeCop1_disabled, executeUnknown,     executeUnknown,
    executeBEQL,          executeBNEL,          executeBLEZL,       executeBGTZL,
    executeDADDI,         executeDADDIU,        executeLDL,         executeLDR,
    executeUnknown,       executeUnknown,       executeUnknown,     executeUnknown,
    executeLB,            executeLH,            executeLWL,         executeLW,
    executeLBU,           executeLHU,           executeLWR,         executeLWU,
    executeSB,            executeSH,            executeSWL,         executeSW,
    executeSDL,           executeSDR,           executeSWR,         executeCACHE,
    executeLL,            executeLWC1,          executeUnknown,     executeUnknown,
    executeLLD,           executeLDC1,          executeLDC2,        executeLD,
    executeSC,            executeSWC1,          executeBreakpoint,  executeUnknown,
    executeSCD,           executeSDC1,          executeSDC2,        executeSD
  ];
  if (simpleTable.length != 64) {
    throw "Oops, didn't build the simple table correctly";
  }

  function executeOp(i) {
    var opcode = (i >>> 26) & 0x3f;
    return simpleTable[opcode](i);
  }

  var specialTableGen = [
    generateSLL,            'executeUnknown',       generateSRL,          generateSRA,
    generateSLLV,           'executeUnknown',       generateSRLV,         generateSRAV,
    generateJR,             generateJALR,           'executeUnknown',     'executeUnknown',
    'executeSYSCALL',       'executeBREAK',         'executeUnknown',     'executeSYNC',
    generateMFHI,           generateMTHI,           generateMFLO,         generateMTLO,
    'executeDSLLV',         'executeUnknown',       'executeDSRLV',       'executeDSRAV',
    generateMULT,           generateMULTU,          'executeDIV',         'executeDIVU',
    'executeDMULT',         'executeDMULTU',        'executeDDIV',        'executeDDIVU',
    generateADD,            generateADDU,           generateSUB,          generateSUBU,
    generateAND,            generateOR,             generateXOR,          generateNOR,
    'executeUnknown',       'executeUnknown',       generateSLT,          generateSLTU,
    'executeDADD',          'executeDADDU',         'executeDSUB',        'executeDSUBU',
    'executeTGE',           'executeTGEU',          'executeTLT',         'executeTLTU',
    'executeTEQ',           'executeUnknown',       'executeTNE',         'executeUnknown',
    'executeDSLL',          'executeUnknown',       'executeDSRL',        'executeDSRA',
    'executeDSLL32',        'executeUnknown',       'executeDSRL32',      'executeDSRA32'
  ];
  if (specialTableGen.length != 64) {
    throw "Oops, didn't build the special gen table correctly";
  }

  // Expose all the functions that we don't yet generate
  n64js.executeSYSCALL = executeSYSCALL;
  n64js.executeBREAK   = executeBREAK;
  n64js.executeSYNC    = executeSYNC;
  n64js.executeDSLLV   = executeDSLLV;
  n64js.executeDSRLV   = executeDSRLV;
  n64js.executeDSRAV   = executeDSRAV;
  n64js.executeDIV     = executeDIV;
  n64js.executeDIVU    = executeDIVU;
  n64js.executeDMULT   = executeDMULT;
  n64js.executeDMULTU  = executeDMULTU;
  n64js.executeDDIV    = executeDDIV;
  n64js.executeDDIVU   = executeDDIVU;
  n64js.executeDADD    = executeDADD;
  n64js.executeDADDU   = executeDADDU;
  n64js.executeDSUB    = executeDSUB;
  n64js.executeDSUBU   = executeDSUBU;
  n64js.executeTGE     = executeTGE;
  n64js.executeTGEU    = executeTGEU;
  n64js.executeTLT     = executeTLT;
  n64js.executeTLTU    = executeTLTU;
  n64js.executeTEQ     = executeTEQ;
  n64js.executeTNE     = executeTNE;
  n64js.executeDSLL    = executeDSLL;
  n64js.executeDSRL    = executeDSRL;
  n64js.executeDSRA    = executeDSRA;
  n64js.executeDSLL32  = executeDSLL32;
  n64js.executeDSRL32  = executeDSRL32;
  n64js.executeDSRA32  = executeDSRA32;

  var regImmTableGen = [
    generateBLTZ,           generateBGEZ,           generateBLTZL,        generateBGEZL,
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown',
    'executeTGEI',          'executeTGEIU',         'executeTLTI',        'executeTLTIU',
    'executeTEQI',          'executeUnknown',       'executeTNEI',        'executeUnknown',
    'executeBLTZAL',        'executeBGEZAL',        'executeBLTZALL',     'executeBGEZALL',
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown',
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown',
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown'
  ];
  if (regImmTableGen.length != 32) {
    throw "Oops, didn't build the regimm gen table correctly";
  }

  // Expose all the functions that we don't yet generate
  n64js.executeTGEI    = executeTGEI;
  n64js.executeTGEIU   = executeTGEIU;
  n64js.executeTLTI    = executeTLTI;
  n64js.executeTLTIU   = executeTLTIU;
  n64js.executeTEQI    = executeTEQI;
  n64js.executeTNEI    = executeTNEI;
  n64js.executeBLTZAL  = executeBLTZAL;
  n64js.executeBGEZAL  = executeBGEZAL;
  n64js.executeBLTZALL = executeBLTZALL;
  n64js.executeBGEZALL = executeBGEZALL;

  var simpleTableGen = [
    generateSpecial,        generateRegImm,         generateJ,            generateJAL,
    generateBEQ,            generateBNE,            generateBLEZ,         generateBGTZ,
    generateADDI,           generateADDIU,          generateSLTI,         generateSLTIU,
    generateANDI,           generateORI,            generateXORI,         generateLUI,
    generateCop0,           generateCop1,           'executeUnknown',     'executeUnknown',
    generateBEQL,           generateBNEL,           'executeBLEZL',       'executeBGTZL',
    'executeDADDI',         'executeDADDIU',        'executeLDL',         'executeLDR',
    'executeUnknown',       'executeUnknown',       'executeUnknown',     'executeUnknown',
    generateLB,             generateLH,             'executeLWL',         generateLW,
    generateLBU,            generateLHU,            'executeLWR',         generateLWU,
    generateSB,             generateSH,             'executeSWL',         generateSW,
    'executeSDL',           'executeSDR',           'executeSWR',         generateCACHE,
    'executeLL',            generateLWC1,           'executeUnknown',     'executeUnknown',
    'executeLLD',           generateLDC1,           'executeLDC2',        generateLD,
    'executeSC',            generateSWC1,           'executeUnknown',     'executeUnknown',
    'executeSCD',           generateSDC1,           'executeSDC2',        generateSD
  ];
  if (simpleTableGen.length != 64) {
    throw "Oops, didn't build the simple gen table correctly";
  }
  // Expose all the functions that we don't yet generate
  n64js.executeBLEZL   = executeBLEZL;
  n64js.executeBGTZL   = executeBGTZL;
  n64js.executeDADDI   = executeDADDI;
  n64js.executeDADDIU  = executeDADDIU;
  n64js.executeLDL     = executeLDL;
  n64js.executeLDR     = executeLDR;
  n64js.executeLWL     = executeLWL;
  n64js.executeLWR     = executeLWR;
  n64js.executeSWL     = executeSWL;
  n64js.executeSDL     = executeSDL;
  n64js.executeSDR     = executeSDR;
  n64js.executeSWR     = executeSWR;
  n64js.executeLL      = executeLL;
  n64js.executeLLD     = executeLLD;
  n64js.executeLDC2    = executeLDC2;
  n64js.executeSC      = executeSC;
  n64js.executeSCD     = executeSCD;
  n64js.executeSDC2    = executeSDC2;


  /**
   * @constructor
   */
  function FragmentContext() {
    this.fragment    = undefined;
    this.pc          = 0;
    this.instruction = 0;
    this.post_pc     = 0;
    this.bailOut     = false;       // Set this if the op does something to manipulate event timers.

    this.needsDelayCheck = true;    // Set on entry to generate handler. If set, must check for delayPC when updating the pc.
    this.isTrivial       = false;   // Set by the code generation handler if the op is considered trivial.
    this.delayedPCUpdate = 0;       // Trivial ops can try to delay setting the pc so that back-to-back trivial ops can emit them entirely.
    this.dump            = false;   // Display this op when finished.
  }

  FragmentContext.prototype.genAssert = function (test, msg) {
    if (kDebugDynarec) {
      return 'n64js.assert(' + test + ', "' + msg + '");\n';
    }
    return '';
  };

  FragmentContext.prototype.newFragment = function () {
    this.delayedPCUpdate = 0;
  };

  FragmentContext.prototype.set = function (fragment, pc, instruction, post_pc) {
    this.fragment    = fragment;
    this.pc          = pc;
    this.instruction = instruction;
    this.post_pc     = post_pc;
    this.bailOut     = false;

    this.needsDelayCheck = true;
    this.isTrivial       = false;

    this.dump        = false;

    // Persist this between ops
    //this.delayedPCUpdate = 0;
  };

  FragmentContext.prototype.instr_rs     = function () { return rs(this.instruction); };
  FragmentContext.prototype.instr_rt     = function () { return rt(this.instruction); };
  FragmentContext.prototype.instr_rd     = function () { return rd(this.instruction); };
  FragmentContext.prototype.instr_sa     = function () { return sa(this.instruction); };

  FragmentContext.prototype.instr_fs     = function () { return fs(this.instruction); };
  FragmentContext.prototype.instr_ft     = function () { return ft(this.instruction); };
  FragmentContext.prototype.instr_fd     = function () { return fd(this.instruction); };

  FragmentContext.prototype.instr_base   = function () { return base(this.instruction); };
  FragmentContext.prototype.instr_offset = function () { return offset(this.instruction); };
  FragmentContext.prototype.instr_imms   = function () { return imms(this.instruction); };

  function checkCauseIP3Consistent() {
    var mi_interrupt_set = n64js.miInterruptsUnmasked();
    var cause_int_3_set  = (cpu0.control[cpu0.kControlCause] & CAUSE_IP3) !== 0;
    n64js.assert(mi_interrupt_set === cause_int_3_set, 'CAUSE_IP3 inconsistent with MI_INTR_REG');
  }

  function mix(a,b,c)
  {
    a -= b; a -= c; a ^= (c>>>13);
    b -= c; b -= a; b ^= (a<<8);
    c -= a; c -= b; c ^= (b>>>13);
    a -= b; a -= c; a ^= (c>>>12);
    b -= c; b -= a; b ^= (a<<16);
    c -= a; c -= b; c ^= (b>>>5);
    a -= b; a -= c; a ^= (c>>>3);
    b -= c; b -= a; b ^= (a<<10);
    c -= a; c -= b; c ^= (b>>>15);

    return a;
  }

  function checkSyncState(sync, pc) {
    var i;

    if (!sync.sync32(pc, 'pc'))
      return false;

    // var next_vbl = 0;
    // for (i = 0; i < cpu0.events.length; ++i) {
    //   var event = cpu0.events[i];
    //   next_vbl += event.countdown;
    //   if (event.type === kEventVbl) {
    //     next_vbl = next_vbl*2+1;
    //     break;
    //   } else if (event.type == kEventCompare) {
    //     next_vbl = next_vbl*2;
    //     break;
    //   }
    // }

    // if (!sync.sync32(next_vbl, 'event'))
    //   return false;

    {
      var a = 0;
      for (i = 0; i < 32; ++i) {
        a = mix(a,cpu0.gprLo[i], 0);
      }
      a = a>>>0;

      if (!sync.sync32(a, 'regs'))
        return false;
    }

    // if(0) {
    //   if (!sync.sync32(cpu0.multLo[0], 'multlo'))
    //     return false;
    //   if (!sync.sync32(cpu0.multHi[0], 'multhi'))
    //     return false;
    // }

    // if(0) {
    //   if (!sync.sync32(cpu0.control[cpu0.kControlCount], 'count'))
    //     return false;
    //   if (!sync.sync32(cpu0.control[cpu0.kControlCompare], 'compare'))
    //     return false;
    // }

    return true;
  }

  function handleTLBException() {
    cpu0.pc      = cpu0.nextPC;
    cpu0.delayPC = cpu0.branchTarget;
    cpu0.control_signed[cpu0.kControlCount] += COUNTER_INCREMENT_PER_OP;

    var evt = cpu0.events[0];
    evt.countdown -= COUNTER_INCREMENT_PER_OP;
    if (evt.countdown <= 0) {
      handleCounter();
    }
  }

  function handleCounter() {

    while (cpu0.events.length > 0 && cpu0.events[0].countdown <= 0) {
      var evt = cpu0.events[0];
      cpu0.events.splice(0, 1);

      // if it's our cycles event then just bail
      if (evt.type === kEventRunForCycles) {
        cpu0.stuffToDo |= kStuffToDoBreakout;
      } else if (evt.type === kEventCompare) {
        cpu0.control[cpu0.kControlCause] |= CAUSE_IP8;
        if (cpu0.checkForUnmaskedInterrupts()) {
          cpu0.stuffToDo |= kStuffToDoCheckInterrupts;
        }
      } else if (evt.type === kEventVbl) {
        // FIXME: this should be based on VI_V_SYNC_REG
        cpu0.addEvent(kEventVbl, kVIIntrCycles);

        n64js.verticalBlank();
        cpu0.stuffToDo |= kStuffToDoBreakout;
      } else {
        n64js.halt('unhandled event!');
      }
    }
  }

  n64js.singleStep = function () {
    var restore_breakpoint_address = 0;
    if (n64js.isBreakpoint(cpu0.pc)) {
      restore_breakpoint_address = cpu0.pc;
      n64js.toggleBreakpoint(restore_breakpoint_address);
    }

    n64js.run(1);

    if (restore_breakpoint_address) {
      n64js.toggleBreakpoint(restore_breakpoint_address);
    }
  };

  n64js.run = function (cycles) {

    cpu0.stuffToDo &= ~kStuffToDoHalt;

    checkCauseIP3Consistent();
    n64js.checkSIStatusConsistent();

    cpu0.addEvent(kEventRunForCycles, cycles);

    while (cpu0.hasEvent(kEventRunForCycles)) {

      try {

        // NB: the bulk of run() is implemented as a separate function.
        // v8 won't optimise code with try/catch blocks, so structuring the code in this way allows runImpl to be optimised.
        runImpl();
        break;

      } catch (e) {

        if (e instanceof TLBException) {
          // If we hit a TLB exception we apply the nextPC (which should have been set to an exception vector) and continue looping.
          handleTLBException();
        } else if (e instanceof BreakpointException) {
          n64js.stopForBreakpoint();
        } else {
          // Other exceptions are bad news, so display an error and bail out.
          n64js.halt('Exception :' + e);
          break;
        }
      }
    }

    // Clean up any kEventRunForCycles events before we bail out
    var cycles_remaining = cpu0.removeEventsOfType(kEventRunForCycles);

    // If the event no longer exists, assume we've executed all the cycles
    if (cycles_remaining < 0) {
      cycles_remaining = 0;
    }
    if (cycles_remaining < cycles) {
      cpu0.opsExecuted += cycles - cycles_remaining;
    }
  };

  function executeFragment(fragment, c, ram, events) {
    var evt = events[0];
    if (evt.countdown >= fragment.opsCompiled*COUNTER_INCREMENT_PER_OP) {
      fragment.executionCount++;
      var ops_executed = fragment.func(c, c.gprLo_signed, c.gprHi_signed, ram);   // Absolute value is number of ops executed.

      // refresh latest event - may have changed
      evt = events[0];
      evt.countdown -= ops_executed * COUNTER_INCREMENT_PER_OP;

      if (!accurateCountUpdating) {
        c.control_signed[c.kControlCount] += ops_executed * COUNTER_INCREMENT_PER_OP;
      }

      //n64js.assert(fragment.bailedOut || evt.countdown >= 0, "Executed too many ops. Possibly didn't bail out of trace when new event was set up?");
      if (evt.countdown <= 0) {
        handleCounter();
      }

      // If stuffToDo is set, we'll break on the next loop

      var next_fragment = fragment.nextFragments[ops_executed];
      if (!next_fragment || next_fragment.entryPC !== c.pc) {
        next_fragment = fragment.getNextFragment(c.pc, ops_executed);
      }
      fragment = next_fragment;

    } else {
      // We're close to another event: drop to the interpreter
      fragment = null;
    }

    return fragment;
  }

  // We need just one of these - declare at global scope to avoid generating garbage
  var fragmentContext = new FragmentContext(); // NB: first pc is entry_pc, cpu0.pc is post_pc by this point

  function addOpToFragment(fragment, entry_pc, instruction, c) {
    if (fragment.opsCompiled === 0) {
      fragmentContext.newFragment();
    }
    fragment.opsCompiled++;
    updateFragment(fragment, entry_pc);

    fragmentContext.set(fragment, entry_pc, instruction, c.pc); // NB: first pc is entry_pc, c.pc is post_pc by this point
    generateCodeForOp(fragmentContext);

    // Break out of the trace as soon as we branch, or  too many ops, or last op generated an interrupt (stuffToDo set)
    var long_fragment = fragment.opsCompiled > 8;
    if ((long_fragment && c.pc !== entry_pc+4) || fragment.opsCompiled >= 250 || c.stuffToDo) {

      // Check if the last op has a delayed pc update, and do it now.
      if (fragmentContext.delayedPCUpdate !== 0) {
          fragment.body_code += 'c.pc = ' + toString32(fragmentContext.delayedPCUpdate) + ';\n';
          fragmentContext.delayedPCUpdate = 0;
      }

      fragment.body_code += 'return ' + fragment.opsCompiled + ';\n';    // Return the number of ops exected

      var sync = n64js.getSyncFlow();
      if (sync) {
        fragment.body_code = 'var sync = n64js.getSyncFlow();\n' + fragment.body_code;
      }

      if (fragment.usesCop1) {
        var cpu1_shizzle = '';
        cpu1_shizzle += 'var cpu1 = n64js.cpu1;\n';
        cpu1_shizzle += 'var SR_CU1 = ' + toString32(SR_CU1) + ';\n';
        cpu1_shizzle += 'var FPCSR_C = ' + toString32(FPCSR_C) + ';\n';
        fragment.body_code = cpu1_shizzle + '\n\n' + fragment.body_code;
      }

      var code = 'return function fragment_' + toString32(fragment.entryPC) + '_' + fragment.opsCompiled + '(c, rlo, rhi, ram) {\n' + fragment.body_code + '}\n';

      // Clear these strings to reduce garbage
      fragment.body_code ='';

      fragment.func = new Function(code)();
      fragment.nextFragments = [];
      for (var i = 0; i < fragment.opsCompiled; i++) {
        fragment.nextFragments.push(undefined);
      }
      fragment = lookupFragment(c.pc);
    }

    return fragment;
  }

  function runImpl() {
    //var sync = n64js.getSyncFlow();
    var c      = cpu0;
    var events = c.events;
    var ram    = c.ram;

    var fragment;
    var evt;

    while (c.hasEvent(kEventRunForCycles)) {

      fragment = lookupFragment(c.pc);
      //fragment = null;

      while (!c.stuffToDo) {

        if (fragment && fragment.func) {
          fragment = executeFragment(fragment, c, ram, events);
        } else {

          // if (sync) {
          //   if (!checkSyncState(sync, cpu0.pc)) {
          //     n64js.halt('sync error');
          //     break;
          //   }
          // }

          var pc = c.pc;   // take a copy of this, so we can refer to it later

          // NB: set nextPC before the call to readMemoryS32. If this throws an exception, we need nextPC to be set up correctly.
          if (c.delayPC) { c.nextPC = c.delayPC; } else { c.nextPC = c.pc + 4; }

          // NB: load instruction using normal memory access routines - this means that we throw a tlb miss/refill approptiately
          //var instruction = n64js.load_s32(ram, pc);
          var instruction;
          if (pc < -2139095040) {
            var phys = (pc + 0x80000000) | 0;  // NB: or with zero ensures we return an SMI if possible.
            instruction = ((ram[phys] << 24) | (ram[phys+1] << 16) | (ram[phys+2] << 8) | ram[phys+3]) | 0;
          } else {
            instruction = lw_slow(pc);
          }

          c.branchTarget = 0;
          executeOp(instruction);
          c.pc      = c.nextPC;
          c.delayPC = c.branchTarget;
          c.control_signed[c.kControlCount] += COUNTER_INCREMENT_PER_OP;
          //checkCauseIP3Consistent();
          //n64js.checkSIStatusConsistent();

          evt = events[0];
          evt.countdown -= COUNTER_INCREMENT_PER_OP;
          if (evt.countdown <= 0) {
            handleCounter();
          }

          // If we have a fragment, we're assembling code as we go
          if (fragment) {
            fragment = addOpToFragment(fragment, pc, instruction, c);
          } else {
            // If there's no current fragment and we branch backwards, this is possibly a new loop
            if (c.pc < pc) {
              fragment = lookupFragment(c.pc);
            }
          }
        }
      }

      c.stuffToDo &= ~kStuffToDoBreakout;

      if (c.stuffToDo & kStuffToDoCheckInterrupts) {
        c.stuffToDo &= ~kStuffToDoCheckInterrupts;
        c.handleInterrupt();
      } else if (c.stuffToDo & kStuffToDoHalt) {
        break;
      } else if (c.stuffToDo) {
        n64js.warn("Don't know how to handle this event!");
        break;
      }
    }
  }

  /**
   * @constructor
   */
  function FragmentMapWho() {
    var i;

    this.kNumEntries = 16*1024;

    this.entries = [];
    for (i = 0; i < this.kNumEntries; ++i) {
      this.entries.push({});
    }
  }

  FragmentMapWho.prototype.addressToCacheLine = function (address) {
    return Math.floor(address >>> 5);
  };

  FragmentMapWho.prototype.addressToCacheLineRoundUp = function (address) {
    return Math.floor((address+31) >>> 5);
  };

  FragmentMapWho.prototype.add = function (pc, fragment) {
    var cache_line_idx = this.addressToCacheLine(pc);
    var entry_idx      = cache_line_idx % this.entries.length;
    var entry          = this.entries[entry_idx];
    entry[fragment.entryPC] = fragment;
  };

  FragmentMapWho.prototype.invalidateEntry = function (address) {
    var cache_line_idx = this.addressToCacheLine(address),
        entry_idx      = cache_line_idx % this.entries.length,
        entry          = this.entries[entry_idx],
        removed        = 0;

    var i, fragment;


    for (i in entry) {
      if (entry.hasOwnProperty(i)) {
        fragment = entry[i];

        if (fragment.minPC <= address && fragment.maxPC > address) {
          fragment.invalidate();
          delete entry[i];
          removed++;
        }
      }
    }

    if (removed) {
      log('Fragment cache removed ' + removed + ' entries.');
    }

     //fragmentInvalidationEvents.push({'address': address, 'length': 0x20, 'system': 'CACHE', 'fragmentsRemoved': removed});
  };

  FragmentMapWho.prototype.invalidateRange = function (address, length) {
    var minaddr   = address,
        maxaddr   = address + length,
        minpage   = this.addressToCacheLine(minaddr),
        maxpage   = this.addressToCacheLineRoundUp(maxaddr),
        entries   = this.entries,
        removed   = 0;

    var cache_line_idx, entry_idx, entry, i, fragment;

    for (cache_line_idx = minpage; cache_line_idx <= maxpage; ++cache_line_idx) {
      entry_idx = cache_line_idx % entries.length;
      entry     = entries[entry_idx];

      for (i in entry) {
        if (entry.hasOwnProperty(i)) {
          fragment = entry[i];

          if (fragment.minPC <= maxaddr && fragment.maxPC > minaddr) {
            fragment.invalidate();
            delete entry[i];
            removed++;
          }
        }
      }
    }

    if (removed) {
      log('Fragment cache removed ' + removed + ' entries.');
    }

     //fragmentInvalidationEvents.push({'address': address, 'length': length, 'system': system, 'fragmentsRemoved': removed});
  };

  var invals = 0;

  // Invalidate a single cache line
  n64js.invalidateICacheEntry = function (address) {
      //logger.log('cache flush ' + format.toString32(address));

     ++invals;
     if ((invals%10000) === 0) {
      log(invals + ' invals');
     }

     fragmentMapWho.invalidateEntry(address);
  };

  // This isn't called right now. We
  n64js.invalidateICacheRange = function (address, length, system) {
      //logger.log('cache flush ' + format.toString32(address) + ' ' + format.toString32(length));
      // FIXME: check for overlapping ranges

     // NB: not sure PI events are useful right now.
     if (system==='PI') {
      return;
     }

     fragmentMapWho.invalidateRange(address, length);
  };

  var fragmentMapWho = new FragmentMapWho();

  function updateFragment(fragment, pc) {
    fragment.minPC = Math.min(fragment.minPC, pc);
    fragment.maxPC = Math.max(fragment.maxPC, pc+4);

    fragmentMapWho.add(pc, fragment);
  }

  function checkEqual(a,b,m) {
    if (a !== b) {
      var msg = toString32(a) + ' !== ' + toString32(b) + ' : ' + m;
      console.assert(false, msg);
      n64js.halt(msg);
      return false;
    }
    return true;
  }

  n64js.checkSyncState = checkSyncState;    // Needs to be callable from dynarec

  function generateCodeForOp(ctx) {

    ctx.needsDelayCheck = ctx.fragment.needsDelayCheck;
    ctx.isTrivial       = false;

    var fn_code = generateOp(ctx);

    if (ctx.dump) {
      console.log(fn_code);
    }

    // if (fn_code.indexOf('execute') >= 0 && fn_code.indexOf('executeCop1_disabled') < 0 ) {
    //   console.log('slow' + fn_code);
    // }

    // If the last op tried to delay updating the pc, see if it needs updating now.
    if (!ctx.isTrivial && ctx.delayedPCUpdate !== 0) {
        ctx.fragment.body_code += '/*applying delayed pc*/\nc.pc = ' + toString32(ctx.delayedPCUpdate) + ';\n';
        ctx.delayedPCUpdate = 0;
    }

    ctx.fragment.needsDelayCheck = ctx.needsDelayCheck;

    //code += 'if (!checkEqual( n64js.readMemoryU32(cpu0.pc), ' + format.toString32(instruction) + ', "unexpected instruction (need to flush icache?)")) { return false; }\n';

    ctx.fragment.bailedOut |= ctx.bailOut;

    var sync = n64js.getSyncFlow();
    if (sync) {
      fn_code = 'if (!n64js.checkSyncState(sync, ' + toString32(ctx.pc) + ')) { return ' + ctx.fragment.opsCompiled + '; }\n' + fn_code;
    }

    ctx.fragment.body_code += fn_code + '\n';
  }

  function generateOp(ctx) {
    var opcode = (ctx.instruction >>> 26) & 0x3f;
    var fn = simpleTableGen[opcode];
    return generateOpHelper(fn, ctx);
  }

  function generateSpecial(ctx) {
    var special_fn = ctx.instruction & 0x3f;
    var fn = specialTableGen[special_fn];
    return generateOpHelper(fn, ctx);
  }

  function generateRegImm(ctx) {
    var rt = (ctx.instruction >>> 16) & 0x1f;
    var fn = regImmTableGen[rt];
    return generateOpHelper(fn, ctx);
  }

  function generateCop0(ctx) {
    var fmt = (ctx.instruction >>> 21) & 0x1f;
    var fn = cop0TableGen[fmt];
    return generateOpHelper(fn,ctx);
  }

  // This takes a fn - either a string (in which case we generate some unoptimised boilerplate) or a function (which we call recursively)
  function generateOpHelper(fn,ctx) {
    // fn can be a handler function, in which case defer to that.
    if (typeof fn === 'string') {
      //logger.log(fn);
      return generateGenericOpBoilerplate('n64js.' + fn + '(' + toString32(ctx.instruction) + ');\n', ctx);
    } else {
      return fn(ctx);
    }
  }

  function generateGenericOpBoilerplate(fn,ctx) {
    var code = '';
    code += ctx.genAssert('c.pc === ' + toString32(ctx.pc), 'pc mismatch');

    if (ctx.needsDelayCheck) {
      // NB: delayPC not cleared here - it's always overwritten with branchTarget below.
      code += 'if (c.delayPC) { c.nextPC = c.delayPC; } else { c.nextPC = ' + toString32(ctx.pc+4) +'; }\n';
    } else {
      code += ctx.genAssert('c.delayPC === 0', 'delay pc should be zero');
      code += 'c.nextPC = ' + toString32(ctx.pc+4) + ';\n';
    }
    code += 'c.branchTarget = 0;\n';

    code += fn;

    code += 'c.pc = c.nextPC;\n';
    code += 'c.delayPC = c.branchTarget;\n';

    // We don't know if the generic op set delayPC, so assume the worst
    ctx.needsDelayCheck = true;

    if (accurateCountUpdating) {
      code += 'c.control_signed[9] += 1;\n';
    }

    // If bailOut is set, always return immediately
    if (ctx.bailOut) {
      code += 'return ' + ctx.fragment.opsCompiled + ';\n';
    } else {
      code += 'if (c.stuffToDo) { return ' + ctx.fragment.opsCompiled + '; }\n';
      code += 'if (c.pc !== ' + toString32(ctx.post_pc) + ') { return ' + ctx.fragment.opsCompiled + '; }\n';
    }

    return code;
  }

  // Standard code for manipulating the pc
  function generateStandardPCUpdate(fn, ctx, might_adjust_next_pc) {
    var code = '';
    code += ctx.genAssert('c.pc === ' + toString32(ctx.pc), 'pc mismatch');

    if (ctx.needsDelayCheck) {
      // We should probably assert on this - two branch instructions back-to-back is weird, but the flag could just be set because of a generic op
      code += 'if (c.delayPC) { c.nextPC = c.delayPC; c.delayPC = 0; } else { c.nextPC = ' + toString32(ctx.pc+4) +'; }\n';
      code += fn;
      code += 'c.pc = c.nextPC;\n';
    } else if (might_adjust_next_pc) {
      // If the branch op might manipulate nextPC, we need to ensure that it's set to the correct value
      code += ctx.genAssert('c.delayPC === 0', 'delay pc should be zero');
      code += 'c.nextPC = ' + toString32(ctx.pc+4) + ';\n';
      code += fn;
      code += 'c.pc = c.nextPC;\n';
    } else {
      code += ctx.genAssert('c.delayPC === 0', 'delay pc should be zero');
      code += fn;
      code += 'c.pc = ' + toString32(ctx.pc+4) + ';\n';
    }

    return code;
  }

  // Memory access does not adjust branchTarget, but nextPC may be adjusted if they cause an exception.
  function generateMemoryAccessBoilerplate(fn,ctx) {
    var code = '';

    var might_adjust_next_pc = true;
    code += generateStandardPCUpdate(fn, ctx, might_adjust_next_pc);

    // Memory instructions never cause a branch delay
    code += ctx.genAssert('c.delayPC === 0', 'delay pc should be zero');
    ctx.needsDelayCheck = false;

    if (accurateCountUpdating) {
      code += 'c.control_signed[9] += 1;\n';
    }

    // If bailOut is set, always return immediately
    n64js.assert(!ctx.bailOut, "Not expecting bailOut to be set for memory access");
    code += 'if (c.stuffToDo) { return ' + ctx.fragment.opsCompiled + '; }\n';
    code += 'if (c.pc !== ' + toString32(ctx.post_pc) + ') { return ' + ctx.fragment.opsCompiled + '; }\n';
    return code;
  }

  // Branch ops explicitly manipulate nextPC rather than branchTarget. They also guarnatee that stuffToDo is not set.
  // might_adjust_next_pc is typically used by branch likely instructions.
  function generateBranchOpBoilerplate(fn,ctx, might_adjust_next_pc) {
    var code = '';

    // We only need to check for off-trace branches
    var need_pc_test = ctx.needsDelayCheck || might_adjust_next_pc || ctx.post_pc !== ctx.pc+4;

    code += generateStandardPCUpdate(fn, ctx, might_adjust_next_pc);

    // Branch instructions can always set a branch delay
    ctx.needsDelayCheck = true;

    if (accurateCountUpdating) {
      code += 'c.control_signed[9] += 1;\n';
    }

    code += ctx.genAssert('c.stuffToDo === 0', 'stuffToDo should be zero');

    // If bailOut is set, always return immediately
    if (ctx.bailOut) {
      code += 'return ' + ctx.fragment.opsCompiled + ';\n';
    } else {
      if (need_pc_test) {
        code += 'if (c.pc !== ' + toString32(ctx.post_pc) + ') { return ' + ctx.fragment.opsCompiled + '; }\n';
      }
      else
      {
        code += '/* skipping pc test */\n';
      }
    }

    return code;
  }

  // Trivial ops can use this specialised handler which eliminates a lot of overhead.
  // Trivial ops are defined as those which:
  // Don't require cpu0.pc to be set correctly (required by branches, stuff that can throw exceptions for instance)
  // Don't set cpu0.stuffToDo
  // Don't set branchTarget
  // Don't manipulate nextPC (e.g. ERET, cop1 unusable, likely instructions)

  function generateTrivialOpBoilerplate(fn,ctx) {

    var code = '';

    // NB: trivial functions don't rely on pc being set up, so we perform the op before updating the pc.
    code += fn;

    ctx.isTrivial = true;

    if (accurateCountUpdating) {
      code += 'c.control_signed[9] += 1;\n';
    }

    // NB: do delay handler after executing op, so we can set pc directly
    if (ctx.needsDelayCheck) {
      code += 'if (c.delayPC) { c.pc = c.delayPC; c.delayPC = 0; } else { c.pc = ' + toString32(ctx.pc+4) + '; }\n';
      // Might happen: delay op from previous instruction takes effect
      code += 'if (c.pc !== ' + toString32(ctx.post_pc) + ') { return ' + ctx.fragment.opsCompiled + '; }\n';
    } else {
      code += ctx.genAssert('c.delayPC === 0', 'delay pc should be zero');

      // We can avoid off-branch checks in this case.
      if (ctx.post_pc !== ctx.pc+4) {
        n64js.assert("post_pc should always be pc+4 for trival ops?");
        code += 'c.pc = ' + toString32(ctx.pc+4) + ';\n';
        code += 'if (c.pc !== ' + toString32(ctx.post_pc) + ') { return ' + ctx.fragment.opsCompiled + '; }\n';
      } else {
        //code += 'c.pc = ' + format.toString32(ctx.pc+4) + ';\n';
        code += '/* delaying pc update */\n';
        ctx.delayedPCUpdate = ctx.pc+4;
      }
    }


    // Trivial instructions never cause a branch delay
    code += ctx.genAssert('c.delayPC === 0', 'delay pc should be zero');
    ctx.needsDelayCheck = false;

    // Trivial instructions never cause stuffToDo to be set
    code += ctx.genAssert('c.stuffToDo === 0', 'stuffToDo should be zero');

    return code;
  }

  function generateNOPBoilerplate(comment, ctx) {
    return generateTrivialOpBoilerplate(comment + '\n',ctx);
  }

}(window.n64js = window.n64js || {}));

const romdb = {
  '134c3f03a7e79e31': {name:"007 - The World is Not Enough",                              save:'Eeprom4k'   },
  '9516943beb5e0af9': {name:"007 - The World is Not Enough",                              save:'Eeprom4k'   },
  '61f1ba1ff1541c2c': {name:"1080 Snowboarding",                                          save:'SRAM'       },
  '253ffd588daa2ed9': {name:"1080 Snowboarding",                                          save:'SRAM'       },
  '091da5abd9ba68c6': {name:"40 Winks",                                                   save:'Eeprom4k'   },
  'd927f2df69814d0d': {name:"A Bug's Life"                                                                  },
  'fd04dc82f4822dcf': {name:"A Bug's Life"                                                                  },
  'c0ae382b10b85063': {name:"A Bug's Life"                                                                  },
  '96c0128fe117dc45': {name:"A Bug's Life"                                                                  },
  'f18b591b459ba2ec': {name:"Aero Fighters Assault",                                      save:'Eeprom4k'   },
  '95bef662d6d602f1': {name:"Aero Fighters Assault",                                      save:'Eeprom4k'   },
  '3e46beae4b4671cc': {name:"AeroGauge",                                                  save:'Eeprom4k'   },
  '3111f480f6454638': {name:"AeroGauge",                                                  save:'Eeprom4k'   },
  'c84530d8363a9df2': {name:"AeroGauge",                                                  save:'Eeprom4k'   },
  'a682c18cb0cad0c2': {name:"AI Shogi 3"                                                                    },
  'ccffc42d215affc8': {name:"Aidyn Chronicles - The First Mage",                          save:'SRAM'       },
  '4f5aa9e623ead2ba': {name:"Aidyn Chronicles - The First Mage",                          save:'SRAM'       },
  '0cb6456c300ee5dc': {name:"Airboarder 64",                                              save:'Eeprom4k'   },
  'd025c427c1992d8c': {name:"Airboarder 64",                                              save:'Eeprom4k'   },
  '941a95b6af49c863': {name:"Akumajou Dracula Mokushiroku"                                                  },
  '063153a55b5ef2b9': {name:"Akumajou Dracula Mokushiroku Gaiden"                                           },
  'fc81607a787a8fff': {name:"Alice no Wakuwaku Trump World",                              save:'Eeprom4k'   },
  'ad84d7df036642ae': {name:"All Star Tennis '99",                                        save:'Eeprom4k'   },
  '91e285e16d76504e': {name:"All Star Tennis '99",                                        save:'Eeprom4k'   },
  '2907d2674c7796f6': {name:"All Star! Dairantou Smash Brothers"                                            },
  '4d7a545e9507e690': {name:"All-Star Baseball 2000"                                                        },
  'efc64654bb478ee1': {name:"All-Star Baseball 2001"                                                        },
  'a7233ec41a68b140': {name:"All-Star Baseball 99"                                                          },
  '4dd5edd974e2b86b': {name:"All-Star Baseball 99"                                                          },
  '0290aeb967a3b6c1': {name:"Animal Forest",                                              save:'Eeprom4k'   },
  '17dbf6c032d5e080': {name:"Armorines - Project S.W.A.R.M."                                                },
  '32d9b51f1b48a93b': {name:"Armorines - Project S.W.A.R.M."                                                },
  '5071c73c87b9cd21': {name:"Armorines - Project S.W.A.R.M."                                                },
  'b2bb524c6b0fabce': {name:"Army Men - Air Combat"                                                         },
  '57062c866d89fd8d': {name:"Army Men - Sarge's Heroes"                                                     },
  '19df10b21a8db598': {name:"Army Men - Sarge's Heroes"                                                     },
  'b6730fb234fc7529': {name:"Army Men - Sarge's Heroes 2"                                                   },
  'abd8f7d146043b29': {name:"Asteroids Hyper 64"                                                            },
  'c45db2418667721b': {name:"Automobili Lamborghini",                                     save:'Eeprom4k'   },
  'bf9777fc3ce8954a': {name:"Automobili Lamborghini",                                     save:'Eeprom4k'   },
  '9ca440e3418d3174': {name:"Baku Bomberman",                                             save:'Eeprom4k'   },
  '4f7c3ce738b893af': {name:"Baku Bomberman 2",                                           save:'Eeprom4k'   },
  '5db998df78098458': {name:"Bakuretsu Muteki Bangaioh",                                  save:'Eeprom4k'   },
  '0a98cf88b52ed58e': {name:"Bakushou Jinsei 64 - Mezase! Resort Ou"                                        },
  '20d568510dcd5fca': {name:"Banjo to Kazooie no Dai Bouken",                             save:'Eeprom4k'   },
  '00694b518198b1b4': {name:"Banjo to Kazooie no Dai Bouken 2",                           save:'Eeprom16k'  },
  'ac5975cdaef56cb2': {name:"Banjo-Kazooie",                                              save:'Eeprom4k'   },
  '0693bfa4d1df0cbf': {name:"Banjo-Kazooie",                                              save:'Eeprom4k'   },
  'b1cc3f73f9924844': {name:"Banjo-Kazooie",                                              save:'Eeprom4k'   },
  '9aaae9c2aa705d47': {name:"Banjo-Tooie",                                                save:'Eeprom16k'  },
  '396d17c9d17947ea': {name:"Banjo-Tooie",                                                save:'Eeprom16k'  },
  'df7c5b152573daf0': {name:"Banjo-Tooie",                                                save:'Eeprom16k'  },
  'b4fb88b01d4b1e44': {name:"Bass Hunter 64",                                             save:'Eeprom4k'   },
  'caa237d15350b662': {name:"Bass Tsuri No. 1 (Shigesato Itoi's Bass Fishing)"                              },
  'aaccfabcefd814b8': {name:"Bassmasters 2000"                                                              },
  'c18944202bcf8612': {name:"Batman Beyond - Return of the Joker"                                           },
  '847f9f2526ed9e7c': {name:"Batman Beyond - Return of the Joker"                                           },
  'e7dda46ae7f4e2e3': {name:"BattleTanx"                                                                    },
  '47e2a4753d960860': {name:"BattleTanx - Global Assault"                                                   },
  'e617ad0c97b7a571': {name:"BattleTanx - Global Assault"                                                   },
  'cec4d4558ac75377': {name:"Battlezone - Rise of the Black Dogs"                                           },
  '3d1c69914d5bacf4': {name:"Beast Wars Metals"                                                             },
  '16d3794d331b50e8': {name:"Beast Wars Transmetal"                                                         },
  'a819f4edcc0419bf': {name:"Beetle Adventure Racing!"                                                      },
  'd218739cc10dae24': {name:"Beetle Adventure Racing!"                                                      },
  '614ab6a10b9414d0': {name:"Beetle Adventure Racing!"                                                      },
  'b7a4ff08b653f401': {name:"Big Mountain 2000",                                          save:'Eeprom4k'   },
  '95351208def11005': {name:"Bio F.R.E.A.K.S."                                                              },
  '1d107cabb0c858ec': {name:"Bio F.R.E.A.K.S."                                                              },
  '8824ae7e5aa3409d': {name:"Bio Hazard 2",                                               save:'SRAM'       },
  'dbe6647cdb24b955': {name:"Blast Corps",                                                save:'Eeprom4k'   },
  '257c647ce601d9d9': {name:"Blast Corps (v1.0)",                                         save:'Eeprom4k'   },
  '657e647c05d34819': {name:"Blast Corps (v1.1)",                                         save:'Eeprom4k'   },
  '514423656f34d3eb': {name:"Blast Dozer",                                                save:'Eeprom16k'  },
  '128bd07c89ff5311': {name:"Blues Brothers 2000",                                        save:'SRAM'       },
  '83c871d5cf3f2d82': {name:"Blues Brothers 2000",                                        save:'SRAM'       },
  '6f692653c3999afe': {name:"Body Harvest",                                               save:'Eeprom4k'   },
  'cdb8580bd291b2b7': {name:"Body Harvest",                                               save:'Eeprom4k'   },
  'c651d4b3e258cbe1': {name:"Bokujo Monogatari 2"                                                           },
  'f4f06fdf3842d129': {name:"Bomberman 64",                                               save:'Eeprom4k'   },
  '1ed568f51eba497e': {name:"Bomberman 64",                                               save:'Eeprom4k'   },
  '3603165ab0377bbc': {name:"Bomberman 64",                                               save:'Eeprom4k'   },
  'b4737e23376b3bd6': {name:"Bomberman 64 - The Second Attack!",                          save:'Eeprom4k'   },
  'd6fd4644088278e3': {name:"Bomberman Hero",                                             save:'Eeprom4k'   },
  'cc12ff671202bf76': {name:"Bomberman Hero",                                             save:'Eeprom4k'   },
  '294e5cd8af76e288': {name:"Bomberman Hero",                                             save:'Eeprom4k'   },
  '4dd12fd7c432ed1f': {name:"Bottom of the 9th"                                                             },
  '2ecf221e13c8aa42': {name:"Brunswick Circuit Pro Bowling"                                                 },
  '1a78ae855df056c7': {name:"Buck Bumble"                                                                   },
  'b662c7d742963df8': {name:"Buck Bumble"                                                                   },
  '9c33b2d5edcabcca': {name:"Buck Bumble"                                                                   },
  '73f0868a4be545cd': {name:"Bust-A-Move 2 - Arcade Edition"                                                },
  '1ededcce02053a51': {name:"Bust-A-Move 2 - Arcade Edition"                                                },
  'fab428e3e1284a00': {name:"Bust-A-Move 3 DX"                                                              },
  '9fd8224237b6e0af': {name:"Bust-A-Move '99"                                                               },
  '0e4016ac1a075dcf': {name:"California Speed"                                                              },
  '4e2d0ff0f4aa0f34': {name:"Carmageddon 64"                                                                },
  'ec620158f18b10e3': {name:"Carmageddon 64 (censored)"                                                     },
  'f5018ee49b1fe5e6': {name:"Carmageddon 64 (uncensored)"                                                   },
  '47ffcd4b8fafa3aa': {name:"Castlevania v1.2"                                                              },
  '955f5df3693dfe8a': {name:"Castlevania"                                                                   },
  'cab7f1645537a271': {name:"Castlevania"                                                                   },
  '3863c01c26893887': {name:"Castlevania - Legacy of Darkness"                                              },
  'e74bc5a2b2cb1967': {name:"Castlevania - Legacy of Darkness"                                              },
  '3421cfdc7835d69d': {name:"Centre Court Tennis"                                                           },
  '5a53206462800250': {name:"Chameleon Twist",                                            save:'Eeprom4k'   },
  '21f5f2a48e16ebf0': {name:"Chameleon Twist",                                            save:'Eeprom4k'   },
  'c68cafb99ff1c9de': {name:"Chameleon Twist",                                            save:'Eeprom4k'   },
  'e48c53cdf9fc8a61': {name:"Chameleon Twist 2"                                                             },
  '5a76490542d0b993': {name:"Chameleon Twist 2"                                                             },
  '019da607a1417d9a': {name:"Chameleon Twist 2"                                                             },
  'e8960e1e6b82284e': {name:"Charlie Blast's Territory"                                                     },
  'd0483cfb9ff6288d': {name:"Charlie Blast's Territory"                                                     },
  '94ad4c21243b1abe': {name:"Chopper Attack",                                             save:'Eeprom4k'   },
  '3993352ea6eda53f': {name:"Chopper Attack",                                             save:'Eeprom4k'   },
  'c4f9cc2b6f9f3d40': {name:"Choro Q 64",                                                 save:'Eeprom4k'   },
  '540fcd26e0efeb53': {name:"Choro Q 64 II",                                              save:'Eeprom4k'   },
  '281594a79d19f161': {name:"Chou Snobow Kids"                                                              },
  'f40f183af78a8e5c': {name:"Chou Kuukan Night Pro Yakyuu King 2",                        save:'Eeprom4k'   },
  'b09d00f82318296b': {name:"City-Tour GP - All Japan Grand Touring Car Champion"                           },
  'ff3d5afab9cdc9b4': {name:"Clay Fighter - Sculptor's Cut"                                                 },
  'ca243cf0cc7b23c5': {name:"Clay Fighter 63 1/3"                                                           },
  'b392968e2abb6442': {name:"Clay Fighter 63 1/3"                                                           },
  'c0a76f2b2512a709': {name:"Clay Fighter 63 1/3 (beta)"                                                    },
  'ad5b02b5fd7526d3': {name:"Command & Conquer",                                          save:'FlashRam'   },
  'b46e28958fd56ab7': {name:"Command & Conquer",                                          save:'FlashRam'   },
  '65945bae76654dc5': {name:"Command & Conquer",                                          save:'FlashRam'   },
  '50acc7302d070477': {name:"Conker's Bad Fur Day",                                       save:'Eeprom16k'  },
  '89583f370aa86c9a': {name:"Conker's Bad Fur Day",                                       save:'Eeprom16k'  },
  'aff7a346d091750f': {name:"Cruis'n Exotica",                                            save:'Eeprom4k'   },
  '542540b304c04073': {name:"Cruis'n USA",                                                save:'Eeprom4k'   },
  '60a73e50960e30e1': {name:"Cruis'n USA",                                                save:'Eeprom4k'   },
  'b42f2fff9a1461d1': {name:"Cruis'n USA (v1.0)",                                         save:'Eeprom4k'   },
  '45cf06535092c4cb': {name:"Cruis'n USA (v1.1)",                                         save:'Eeprom4k'   },
  '5311e6dfe61861d7': {name:"Cruis'n World",                                              save:'Eeprom16k'  },
  '1e93f3833d2272cb': {name:"Cruis'n World",                                              save:'Eeprom16k'  },
  '870bcb835754327e': {name:"Custom Robo",                                                save:'Eeprom4k'   },
  'b9019507ab3202ab': {name:"Custom Robo V2",                                             save:'Eeprom16k'  },
  'a18efce89183739f': {name:"CyberTiger"                                                                    },
  '078aa7d13edda352': {name:"CyberTiger"                                                                    },
  '45f48871680a4184': {name:"Dance Dance Revolution - Disney Dancing Museum"                                },
  '582ba5a441987523': {name:"Dark Rift"                                                                     },
  'd47cd67e6d5e41b4': {name:"Dark Rift"                                                                     },
  '493336f51bd2f9db': {name:"Deadly Arts"                                                                   },
  'd9a9663f005bcb9b': {name:"Defi au Tetris Magique"                                                        },
  'e167f6a51fbd1fda': {name:"Derby Stallion 64",                                          save:'SRAM'       },
  '614ac517e7f2834a': {name:"Densha de GO! 64",                                           save:'SRAM'       },
  'a284e5de8711160f': {name:"Destruction Derby 64"                                                          },
  '7da30a63dbd76b89': {name:"Destruction Derby 64"                                                          },
  '9c167989a0f689f1': {name:"Dezaemon 3D",                                                save:'SRAM'       },
  '725629d51570b59c': {name:"Diddy Kong CRACKED",                                         save:'Eeprom4k'   },
  '5aa389f362557817': {name:"Diddy Kong Racing",                                          save:'Eeprom4k'   },
  'e740d45311b01975': {name:"Diddy Kong Racing (v1.0)",                                   save:'Eeprom4k'   },
  '75f773fd5a752497': {name:"Diddy Kong Racing (v1.0)",                                   save:'Eeprom4k'   },
  '0d4302e49dfcfcd2': {name:"Diddy Kong Racing (v1.1)",                                   save:'Eeprom4k'   },
  '5b146e599f87d9f7': {name:"Diddy Kong Racing (v1.1)",                                   save:'Eeprom4k'   },
  '1b426cc1f78015a2': {name:"Disney's Donald Duck - Goin' Quackers",                      save:'Eeprom4k'   },
  '2313264c1a5e294f': {name:"Disney's Tarzan"                                                               },
  'c769fecb2aabc0f2': {name:"Disney's Tarzan",                                            save:'Eeprom4k'   },
  'd03b1a001adeb3af': {name:"Disney's Tarzan"                                                               },
  'bfe514d6c1bc6da7': {name:"Disney's Tarzan",                                            save:'Eeprom4k'   },
  '6d208ebd1c5ec398': {name:"Doubutsu No Mori",                                           save:'Eeprom4k'   },
  '8074f13d5aed3d19': {name:"Donald Duck - Quack Attack"                                                    },
  'bfea58ec69717cad': {name:"Donkey Kong 64",                                             save:'Eeprom16k'  },
  'a7893c05024306a5': {name:"Donkey Kong 64",                                             save:'Eeprom16k'  },
  '8c6d9311434b2c6f': {name:"Donkey Kong 64",                                             save:'Eeprom16k'  },
  'ababd40d1ea9a2b5': {name:"Donkey Kong 64 - Kiosk",                                     save:'Eeprom16k'  },
  '1a103ea89db637e9': {name:"Doom 64"                                                                       },
  'f4963e425bf088ce': {name:"Doom 64"                                                                       },
  '365ba67aade5cefd': {name:"Doom 64"                                                                       },
  'ac9e732c2677f79e': {name:"Doom 64"                                                                       },
  'c2b1f7bf8e14bfae': {name:"Doraemon - Mittsu no Seireiseki",                            save:'Eeprom4k'   },
  '996e30b6b2d23eb6': {name:"Doraemon 2 - Hikari no Shinden",                             save:'Eeprom16k'  },
  '405127a8e856b0b9': {name:"Doraemon 3 - Nobi Dai No Machi SOS!",                        save:'Eeprom16k'  },
  '134d9d76fe3f23da': {name:"Dr. Mario 64",                                               save:'Eeprom4k'   },
  'a0ecde3fb29b9f39': {name:"Dragon Sword 64"                                                               },
  'c33022a6884483f0': {name:"Dual Heroes"                                                                   },
  '63ab6e05d5fc15c2': {name:"Dual Heroes"                                                                   },
  '614452b6b1046ded': {name:"Dual Heroes"                                                                   },
  'faf1b9fb8986f86b': {name:"Duck Dodgers Starring Daffy Duck",                           save:'Eeprom4k'   },
  '7ff0da0488e6180d': {name:"Duke Nukem - ZER0 H0UR"                                                        },
  '4b97ca32509cc2b2': {name:"Duke Nukem - ZER0 H0UR"                                                        },
  '6a6236dccb70373f': {name:"Duke Nukem - ZER0 H0UR"                                                        },
  '56ab73a29adb33da': {name:"Duke Nukem 64"                                                                 },
  '3d88121e1827b9d3': {name:"Duke Nukem 64"                                                                 },
  '4df7bf57437774de': {name:"Duke Nukem 64"                                                                 },
  'cfb6db349d7806ea': {name:"Earthworm Jim 3D Ru",                                        save:'Eeprom4k'   },
  '914157df3d12b59e': {name:"Earthworm Jim 3D",                                           save:'Eeprom4k'   },
  'e89d2b491cc8ccc6': {name:"Earthworm Jim 3D",                                           save:'Eeprom4k'   },
  '6d76f9bd708d06bd': {name:"ECW Hardcore Revolution"                                                       },
  'dbe5388cd7277cb3': {name:"ECW Hardcore Revolution"                                                       },
  'cb53a6f23b3b6360': {name:"Elmo's Letter Adventure"                                                       },
  '8f53b102d0884bc9': {name:"Elmo's Number Journey"                                                         },
  'dce23ae1e85cb64f': {name:"Eltale Monsters"                                                               },
  '421886079fbc2ea1': {name:"Excitebike 64",                                              save:'Eeprom16k'  },
  '19351c86e51c09f6': {name:"Excitebike 64",                                              save:'Eeprom16k'  },
  'e48e2a20898bf883': {name:"Excitebike 64",                                              save:'Eeprom16k'  },
  '7b4f75af8173d11d': {name:"Excitebike 64 - Kiosk",                                      save:'Eeprom16k'  },
  'd245a2fd473d4aa7': {name:"Extreme-G"                                                                     },
  'c42d80ee7dd50b69': {name:"Extreme-G"                                                                     },
  '4e839d8ea9298b1e': {name:"Extreme-G"                                                                     },
  '0b15d45cf1c20c47': {name:"Extreme-G XG2"                                                                 },
  '819b9b3911ad33d5': {name:"Extreme-G XG2"                                                                 },
  '85ec851131775a4b': {name:"Extreme-G XG2"                                                                 },
  '7a6882ae8d383f9a': {name:"F-1 Pole Position 64"                                                          },
  'b248d2fd0e029a56': {name:"F-1 Pole Position 64"                                                          },
  'b8bcec3c07bf2661': {name:"F1 Racing Championship"                                                        },
  '3426443860f0b366': {name:"F-1 World Grand Prix",                                       save:'Eeprom4k'   },
  'b3c83ccca405c40e': {name:"F-1 World Grand Prix",                                       save:'Eeprom4k'   },
  'e5ae0bb7a805503a': {name:"F-1 World Grand Prix",                                       save:'Eeprom4k'   },
  'c447bf64ba22bdf4': {name:"F-1 World Grand Prix",                                       save:'Eeprom4k'   },
  '6e86c107decc7557': {name:"F-1 World Grand Prix II",                                    save:'Eeprom16k'  },
  '374cff6dfd63b7b1': {name:"Famista 64"                                                                    },
  '4f47294f7a70cb30': {name:"F-Cup Maniax"                                                                  },
  'decd1acbf21d29cf': {name:"FIFA - Road to World Cup 98"                                                   },
  '673c73f53a97a317': {name:"FIFA - Road to World Cup 98"                                                   },
  'f0ed310ed54972c3': {name:"FIFA - Road to World Cup 98"                                                   },
  '30a61376f396d63e': {name:"FIFA 99"                                                                       },
  '51a69801849d21fc': {name:"FIFA 99"                                                                       },
  '5991f1c35abcd265': {name:"FIFA Soccer 64"                                                                },
  '70e594fe9c3a87e4': {name:"Fighter's Destiny",                                          save:'Eeprom4k'   },
  '0588f752b7ca8f8b': {name:"Fighter's Destiny",                                          save:'Eeprom4k'   },
  'c2f9410c0d7a7101': {name:"Fighter's Destiny",                                          save:'Eeprom4k'   },
  '4bc7f136399902f2': {name:"Fighter's Destiny",                                          save:'Eeprom4k'   },
  '452fefaef1307ef9': {name:"Fighter's Destiny 2",                                        save:'Eeprom4k'   },
  '2d6ce4490c111a7b': {name:"Fighting Cup"                                                                  },
  'cbc7ef32203feac3': {name:"Fighting Force 64"                                                             },
  'fe0fcf669c7f69ad': {name:"Fighting Force 64"                                                             },
  '2d56d52850aed5e4': {name:"Fire Electric Pen",                                          save:'Eeprom4k'   },
  'e5522da955b6261d': {name:"Flying Dragon"                                                                 },
  '3f62e922ad520eb6': {name:"Flying Dragon"                                                                 },
  '1a8fff35bee3796e': {name:"Flying Dragon Fighters (Hiro no Ken Twin)"                                     },
  '79b1e5e8e830aa44': {name:"Frogger 2 (Alpha)"                                                             },
  'ff76cdc3decb9d9b': {name:"Forsaken"                                                                      },
  '010c339eba14038c': {name:"Forsaken"                                                                      },
  'aa172a14968d0213': {name:"Forsaken"                                                                      },
  '79d4613225bc0ded': {name:"Fox Sports College Hoops '99"                                                  },
  'eeea74f73eb1d8f0': {name:"Fushigi no Dungeon - Furai no Shiren 2",                     save:'FlashRAM'   },
  'a9d183398c150420': {name:"F-Zero DXP",                                                 save:'SRAM'       },
  '78d90eb3f9c90330': {name:"F-Zero X",                                                   save:'SRAM'       },
  '2e623e4d4e8b829b': {name:"F-Zero X",                                                   save:'SRAM'       },
  'f64666772bacb906': {name:"F-Zero X",                                                   save:'SRAM'       },
  'b67986afbf11105e': {name:"G.A.S.P! Fighter's NEXTream",                                save:'Eeprom16k'  },
  '26f7fc68bc8c6549': {name:"G.A.S.P! Fighter's NEXTream",                                save:'Eeprom16k'  },
  '8b162c83aecda256': {name:"Ganbare Goemon"                                                                },
  'd99c7b455253c509': {name:"Ganbare Goemon 2 - Deoru Dero Douchuu Obake Tenko"                             },
  '0afdff21981d0dfa': {name:"Ganbare Nippon Olympics 2000"                                                  },
  '325e9b7280d928b7': {name:"Gauntlet Legends"                                                              },
  '0e26b0704cd01667': {name:"Gauntlet Legends"                                                              },
  'd6bc43d556e2a52b': {name:"Gauntlet Legends"                                                              },
  'e6849c48f9496e4c': {name:"Getter Love!! Cho Renai Party Game"                                            },
  '127edc3ec91c6ce2': {name:"Gex 3 - Deep Cover Gecko"                                                      },
  '59931799c3ebe72f': {name:"Gex 3 - Deep Cover Gecko"                                                      },
  'a43347875a7423a8': {name:"Gex 3 - Deep Cover Gecko"                                                      },
  '74d7fe891be2afca': {name:"Gex 64 - Enter the Gecko"                                                      },
  '0e008ae6dd669163': {name:"Gex 64 - Enter the Gecko"                                                      },
  'ff016e8e48f9b4cc': {name:"Glover",                                                     save:'Eeprom4k'   },
  '017323f593eee399': {name:"Glover",                                                     save:'Eeprom4k'   },
  '7fd2c6b2fd8ca42d': {name:"Goemon Mononoke Sugoroku"                                                      },
  'ada552424ebf6fae': {name:"Goemon's Great Adventure"                                                      },
  '1cfb9046446dd54c': {name:"Golden Nugget 64"                                                              },
  'd150bcdca31afd09': {name:"GoldenEye 007",                                              save:'Eeprom4k'   },
  'f14c4fa2ba2723a8': {name:"GoldenEye 007",                                              save:'Eeprom4k'   },
  '61ca1404aab8572e': {name:"GoldenEye 007",                                              save:'Eeprom4k'   },
  'a2dc9ac4621b50f1': {name:"GT 64 Championship Edition",                                 save:'Eeprom4k'   },
  '330e4aeec988d58f': {name:"GT 64 Championship Edition",                                 save:'Eeprom4k'   },
  '1401a8957f2ab7e0': {name:"Hamster Monogatari 64",                                      save:'Eeprom4k'   },
  'bf2ff236f2128931': {name:"Hanafuda 64 - Tenshi no Yakusoku"                                              },
  'b157ae0937562a18': {name:"Harukanaru Augusta Masters 98",                              save:'Eeprom4k'   },
  'fc9ddf9889c10666': {name:"Harvest Moon 64",                                            save:'SRAM'       },
  '66e8703ee8ba3844': {name:"Heiwa Pachinko World",                                       save:'Eeprom4k'   },
  '77eb3c7f0a038189': {name:"Hercules - The Legendary Journeys"                                             },
  'ebdb90ae2391b879': {name:"Hercules - The Legendary Journeys"                                             },
  '0ab5b39a056166bc': {name:"Hexen"                                                                         },
  'bd5f1b5c3416967e': {name:"Hexen"                                                                         },
  'ea6aab9c001cc687': {name:"Hexen"                                                                         },
  '571a75666e9da254': {name:"Hexen"                                                                         },
  '0bb3b295c115642b': {name:"Hexen"                                                                         },
  '5d0ef1d379a52e05': {name:"Hey You, Pikachu!",                                          save:'Eeprom4k'   },
  '140efa7505d1b3c9': {name:"Holy Magic Century"                                                            },
  'b0eb5fb304b22774': {name:"Holy Magic Century"                                                            },
  '9d127b27ff7938dd': {name:"Holy Magic Century"                                                            },
  'bd02d7c14765416d': {name:"Hoshi no Kirby 64",                                          save:'Eeprom4k'   },
  '8e8fc9c7de5d1442': {name:"Hot Wheels Turbo Racing"                                                       },
  '9301d2e7938e15c1': {name:"Hot Wheels Turbo Racing"                                                       },
  '7d1d6172d2bd1999': {name:"HSV Adventure Racing"                                                          },
  '2e97355595328ebd': {name:"Human Grand Prix"                                                              },
  '6ac9dbe8eee2c9da': {name:"Hybrid Heaven"                                                                 },
  'bf882810ca884843': {name:"Hybrid Heaven"                                                                 },
  '36cee20de6291dd4': {name:"Hybrid Heaven"                                                                 },
  '7f3a1d6466048286': {name:"Hybrid Heaven"                                                                 },
  'eb65dcc804898c3d': {name:"Hydro Thunder"                                                                 },
  'e98889b5e84bfcb1': {name:"Hydro Thunder"                                                                 },
  '9e8b456936f995fc': {name:"Iggy-kun no Bura Bura Poyon"                                                   },
  'bcb516e6888b65c9': {name:"Iggy's Reckin' Balls"                                                          },
  '5ecc92d672d058ec': {name:"Iggy's Reckin' Balls"                                                          },
  '15cc9daf883d721a': {name:"Indiana Jones and the Infernal Machine",                     save:'Eeprom4k'   },
  '7a4636e49b8fde82': {name:"Indy Racing 2000",                                           save:'Eeprom4k'   },
  'e08b138c460e7095': {name:"In-Fisherman Bass Hunter 64",                                save:'Eeprom4k'   },
  '3754838eb44857cd': {name:"International Superstar Soccer 2000"                                           },
  'a0646333bfd5c806': {name:"International Superstar Soccer 2000"                                           },
  '71e8e8ba4e94ff35': {name:"International Superstar Soccer 2000"                                           },
  'c463275fe52a4162': {name:"International Superstar Soccer 64"                                             },
  'f07cd3e2ae4e7ef5': {name:"International Superstar Soccer 64"                                             },
  '43631bf4e66106c1': {name:"International Superstar Soccer 98"                                             },
  '09da0f7f0bce6160': {name:"International Superstar Soccer '98"                                            },
  'c73b072011013b5e': {name:"International Track and Field 2000"                                            },
  '79c712671d78723b': {name:"International Track and Field Summer Games"                                    },
  '476776876571c291': {name:"J. League Dynamite Soccer"                                                     },
  'aa0acec619f017d1': {name:"J. League Tactics Soccer (1.1)"                                                },
  '29a4bf4f15bb2069': {name:"J. League Eleven Beat 1997"                                                    },
  '424a5554fb5f98e4': {name:"J. League Live 64"                                                             },
  'a09dd2e8941de615': {name:"J. League Tactics Soccer"                                                      },
  '16d03ac77d53c548': {name:"Jangou Simulation Mahjong Do 64"                                               },
  '6064256986f5a3b9': {name:"Jeopardy!"                                                                     },
  'a5b130bbce12f7fc': {name:"Jeremy McGrath Supercross 2000"                                                },
  'fbabf721e8a78a6a': {name:"Jeremy McGrath Supercross 2000"                                                },
  'b609608a50e1ac94': {name:"Jet Force Gemini",                                           save:'FlashRam'   },
  'dea1d7684a837900': {name:"Jet Force Gemini",                                           save:'FlashRam'   },
  '47abd8df89ebdb3c': {name:"Jet Force Gemini - Kiosk",                                   save:'FlashRam'   },
  'f5d919afcc2302b7': {name:"Jikkyou G1 Stable"                                                             },
  '532a11638fa89fa2': {name:"Jikkyou J. League 1999 - Perfect Striker 2"                                    },
  '66436c14b3dea672': {name:"Jikkyou J. League Perfect Striker"                                             },
  '1c1f89d78837e4c3': {name:"Jikkyou Pawafuru Puroyakyu 4 (1.1)"                                            },
  'd144c20a05c60e1f': {name:"Jikkyou Pawapuro Puroyakyu 2000"                                               },
  '23df6442f7bd28be': {name:"Jikkyou Pawapuro Puroyakyu 2000"                                               },
  '2056ea3f40db5674': {name:"Jikkyou World Cup France '98"                                                  },
  '8cb354c9b3be626f': {name:"Jikkyou World Cup France '98"                                                  },
  'd6abc7e1287f704e': {name:"Jikkyou World Cup France '98"                                                  },
  '8c9fa7e0fa97cc32': {name:"Jikkyou World Soccer 3"                                                        },
  'edf6aa4aad286437': {name:"Jinsei Game 64"                                                                },
  'b01a15d04ba15cfe': {name:"John Romero's Daikatana"                                                       },
  '4b3c7e9d6c4a0fe6': {name:"John Romero's Daikatana"                                                       },
  '9531740f95dba6d8': {name:"John Romero's Daikatana"                                                       },
  '231f2836cf569700': {name:"Ken Griffey Jr.'s Slugfest",                                 save:'FlashRam'   },
  '3e269b97040047f8': {name:"Killer Instinct Gold",                                       save:'Eeprom4k'   },
  'bae28f9e7007278b': {name:"Killer Instinct Gold (v1.0)",                                save:'Eeprom4k'   },
  'facd8f9e2b65f549': {name:"Killer Instinct Gold (v1.0)",                                save:'Eeprom4k'   },
  '4cca08f927434636': {name:"Killer Instinct Gold (v1.2)",                                save:'Eeprom4k'   },
  'e1a49e51e88475eb': {name:"King Hill 64 - Extreme Snowboarding"                                           },
  'd66abc75c92b5578': {name:"Kiratto Kaiketsu! 64 Tanteidan"                                                },
  'b49f03462c823703': {name:"Kirby 64 - The Crystal Shards",                              save:'Eeprom4k'   },
  '11ba930da6683868': {name:"Kirby 64 - The Crystal Shards",                              save:'Eeprom4k'   },
  '6fb81bcac5a5cc41': {name:"Kirby 64 - The Crystal Shards (1.1)",                        save:'Eeprom4k'   },
  '7a1c580ce4206e3d': {name:"Kirby 64 - The Crystal Shards (1.2)",                        save:'Eeprom4k'   },
  '9ff8b1bca2520706': {name:"Kirby 64 - The Crystal Shards (1.3)",                        save:'Eeprom4k'   },
  '99d7e0fc546c3165': {name:"Knife Edge - Nose Gunner"                                                      },
  '3fef1a93906b19ef': {name:"Knife Edge - Nose Gunner"                                                      },
  '747c994a997f08e2': {name:"Knife Edge - Nose Gunner"                                                      },
  '9c9094082dd8d4da': {name:"Knockout Kings 2000"                                                           },
  '95a7d6e33c5d1c2a': {name:"Knockout Kings 2000"                                                           },
  '94846b611092508a': {name:"Kobe Bryant's NBA Courtside",                                save:'Eeprom16k'  },
  'baef3917683ab4d0': {name:"Kobe Bryant's NBA Courtside",                                save:'Eeprom16k'  },
  'e8603e5e95d4b54a': {name:"Kuiki Uhabi Suigo"                                                             },
  '9940307f7652cf52': {name:"Last Legion UX",                                             save:'Eeprom4k'   },
  'ea406a09100abe8a': {name:"LEGO Racers"                                                                   },
  'b3d878f46ddd1697': {name:"LEGO Racers"                                                                   },
  '2bc6673d5031d031': {name:"Let's Smash Tennis"                                                            },
  'df1850253aaed657': {name:"Lode Runner 3-D",                                            save:'Eeprom4k'   },
  '0bdd4a96db1392b2': {name:"Lode Runner 3-D",                                            save:'Eeprom4k'   },
  '80064660720e5f30': {name:"Lode Runner 3-D",                                            save:'Eeprom4k'   },
  '5b05a00a65df3776': {name:"Looney Tunes - Duck Dodgers",                                save:'Eeprom4k'   },
  '2ce9cbf412ed92b3': {name:"Lylat Wars",                                                 save:'Eeprom4k'   },
  '2bf283245e026e13': {name:"Lylat Wars",                                                 save:'Eeprom4k'   },
  '5007706bfe21d629': {name:"Mace - The Dark Age"                                                           },
  '3d444511db0e6111': {name:"Mace - The Dark Age"                                                           },
  '8616b80c815ad85f': {name:"Madden 2000"                                                                   },
  '89638313763c5b26': {name:"Madden Football 64"                                                            },
  '52cb97a10ede2075': {name:"Madden Football 64"                                                            },
  '8d4f13d7b5001ac1': {name:"Madden NFL 2002",                                            save:'Eeprom16k'  },
  '92f738eb46a20e19': {name:"Madden NFL 2001"                                                               },
  'ba8bb7de9dbdf652': {name:"Madden NFL 99"                                                                 },
  '25d625395ec7838c': {name:"Madden NFL 99"                                                                 },
  'f793efe10b8b9014': {name:"Magical Tetris Challenge"                                                      },
  '4716b67578bfda7a': {name:"Magical Tetris Challenge"                                                      },
  '4a56c880ab659c92': {name:"Magical Tetris Challenge"                                                      },
  '796690e4053f249f': {name:"Magical Tetris Challenge"                                                      },
  '41dc3ec55993e1ec': {name:"Mahjong 64"                                                                    },
  '1e82cccc838ae896': {name:"Mahjong Hourouki Classic"                                                      },
  '702cc40fcdf15487': {name:"Mahjong Master"                                                                },
  '5cc0c180f45e06ea': {name:"Major League Baseball Featuring Ken Griffey Jr.",            save:'SRAM'       },
  'be98b9cdc8a52410': {name:"Major League Baseball Featuring Ken Griffey Jr.",            save:'SRAM'       },
  'd4a34b66b7808a67': {name:"Mario Golf 64",                                              save:'SRAM'       },
  'd14489d40e3ad9b0': {name:"Mario Golf 64",                                              save:'SRAM'       },
  'd057e9625d5ac17f': {name:"Mario Golf 64",                                              save:'SRAM'       },
  'b655503e52da922e': {name:"Mario Kart 64",                                              save:'Eeprom4k'   },
  '5847ff6b5e5dffe5': {name:"Mario Kart 64 (v1.0)",                                       save:'Eeprom4k'   },
  '9ddeb6c376ded265': {name:"Mario Kart 64 (v1.0)",                                       save:'Eeprom4k'   },
  '87a9c3c94c341058': {name:"Mario Kart 64 (v1.1)",                                       save:'Eeprom4k'   },
  'd4c77725aeaa8fd1': {name:"Mario Kart 64 (v1.1)",                                       save:'Eeprom4k'   },
  'ac90989adf13c3f0': {name:"Mario No Photopie"                                                             },
  '7e652928771862a0': {name:"Mario Party",                                                save:'Eeprom4k'   },
  'be15a8ad2f622860': {name:"Mario Party",                                                save:'Eeprom4k'   },
  '6930669c804af280': {name:"Mario Party",                                                save:'Eeprom4k'   },
  '5858a99e18b672af': {name:"Mario Party 2",                                              save:'Eeprom4k'   },
  '0f7d56ed1589b038': {name:"Mario Party 2",                                              save:'Eeprom4k'   },
  '87033882d944c7df': {name:"Mario Party 2",                                              save:'Eeprom4k'   },
  'd929387cce47826e': {name:"Mario Party 3",                                              save:'Eeprom16k'  },
  'cdb40a0b3789157b': {name:"Mario Party 3",                                              save:'Eeprom16k'  },
  '604167c53c455f0f': {name:"Mario Party 3",                                              save:'Eeprom16k'  },
  'dccda73ba0524e46': {name:"Mario Story",                                                save:'FlashRam'   },
  '4fcf0150bdb30cf3': {name:"Mario Tennis",                                               save:'Eeprom16k'  },
  'b5426c3a1bdaca1a': {name:"Mario Tennis",                                               save:'Eeprom16k'  },
  'd53a9f83fa156d40': {name:"Mario Tennis",                                               save:'Eeprom16k'  },
  'f558c10e96683efb': {name:"Mega Man 64",                                                save:'FlashRam'   },
  '0cf10110c1d8513d': {name:"Mia Hamm Soccer 64"                                                            },
  'c26661e3e5a21386': {name:"Michael Owens WLS 2000"                                                        },
  '71458cfac0f9e7bb': {name:"Mickey's Speedway USA",                                      save:'Eeprom4k'   },
  '9addd0dea72582e7': {name:"Mickey's Speedway USA",                                      save:'Eeprom4k'   },
  'afe66a73c7e91741': {name:"Mickey no Racing Challenge USA",                             save:'Eeprom4k'   },
  '350c85f11279e0ac': {name:"Micro Machines 64 Turbo"                                                       },
  '8d01492a024a03d0': {name:"Micro Machines 64 Turbo"                                                       },
  '4c5eb3e4c95cc41a': {name:"Midway's Greatest Arcade Hits Volume 1"                                        },
  '163ed509b968b23a': {name:"Mike Piazza's Strike Zone"                                                     },
  'cd5e952e840800f3': {name:"Milo's Astro Lanes"                                                            },
  '9d0d499adc3a018f': {name:"Milo's Astro Lanes"                                                            },
  '1b05930bf9813d60': {name:"Mischief Makers",                                            save:'Eeprom4k'   },
  '98da8b41580f8a24': {name:"Mischief Makers",                                            save:'Eeprom4k'   },
  '7e3feb93445e6781': {name:"Mission Impossible",                                         save:'Eeprom4k'   },
  'f85c032635912b80': {name:"Mission Impossible",                                         save:'Eeprom4k'   },
  '345b0920879e3d34': {name:"Mission Impossible",                                         save:'Eeprom4k'   },
  'dc49a9ebbdecba39': {name:"Mission Impossible",                                         save:'Eeprom4k'   },
  'daec56229c1bab71': {name:"Mission Impossible",                                         save:'Eeprom4k'   },
  'e2046a5f0d07fad4': {name:"Mission Impossible",                                         save:'Eeprom4k'   },
  '6d8d76286c9779b3': {name:"Monaco Grand Prix",                                          save:'Eeprom4k'   },
  'e183c35a87e312d7': {name:"Monopoly",                                                   save:'Eeprom4k'   },
  '99d99ab11851587e': {name:"Monster Truck Madness 64"                                                      },
  'fc06d8d3a8a23ab4': {name:"Monster Truck Madness 64"                                                      },
  '70dde8e898d15d41': {name:"Morita Shogi 64",                                            save:'Eeprom4k'   },
  'f4d47d41e22f481b': {name:"Mortal Kombat 4",                                            save:'Eeprom4k'   },
  '3b6f0373e9690dce': {name:"Mortal Kombat 4",                                            save:'Eeprom4k'   },
  'ac0443c321c0792d': {name:"Mortal Kombat Mythologies - Sub-Zero"                                          },
  'c4ed44ff1392ae1a': {name:"Mortal Kombat Mythologies - Sub-Zero"                                          },
  '125cf7d9599b85a8': {name:"Mortal Kombat Trilogy"                                                         },
  '92113d8ce172f1be': {name:"Mortal Kombat Trilogy"                                                         },
  'a93af3830dd401a9': {name:"Mortal Kombat Trilogy (v1.2)"                                                  },
  '5cb6f92ad7a2e285': {name:"MRC - Multi Racing Championship",                            save:'Eeprom4k'   },
  '13b4b6a6cc13d115': {name:"MRC - Multi Racing Championship",                            save:'Eeprom4k'   },
  '03bdf0b89e187944': {name:"MRC - Multi Racing Championship",                            save:'Eeprom4k'   },
  '5c52381956966e58': {name:"Ms. Pac-Man Maze Madness"                                                      },
  '21cbbcfc6b3c9072': {name:"Mystical Ninja - Starring Goemon"                                              },
  'be0f36f51d69f12b': {name:"Mystical Ninja - Starring Goemon"                                              },
  'd345937fdeca1e84': {name:"Mystical Ninja 2 - Starring Goemon"                                            },
  '8725c27e23e31aef': {name:"Nagano Olympic Hockey '98"                                                     },
  '3730f490f570535c': {name:"Nagano Olympic Hockey '98"                                                     },
  '353a2dae1ad4f024': {name:"Nagano Olympic Hockey '98"                                                     },
  '98ae2b8dbf2537d7': {name:"Nagano Winter Olympics '98"                                                    },
  '4cc3c52f9dcc057a': {name:"Nagano Winter Olympics '98"                                                    },
  '1620456dee093c71': {name:"Nagano Winter Olympics '98"                                                    },
  'dab629518c3cef9d': {name:"Namco Museum 64"                                                               },
  '181a33df44e0d45f': {name:"NASCAR 2000"                                                                   },
  '78957423fd58dc80': {name:"NASCAR 99"                                                                     },
  '49140000c99249ae': {name:"NASCAR 99"                                                                     },
  'c99249ae53b25392': {name:"NASCAR 99"                                                                     },
  '57ebf724f4f9b374': {name:"NBA Courtside 2 - Featuring Kobe Bryant",                    save:'FlashRam'   },
  'd8526891efeadb73': {name:"NBA Courtside 2 - Featuring Kobe Bryant",                    save:'FlashRam'   },
  '87b4694e90e218fe': {name:"NBA Hangtime"                                                                  },
  'aedc88c70a0003bd': {name:"NBA Hangtime"                                                                  },
  '011fe1aa45a02526': {name:"NBA In the Zone 2000"                                                          },
  '185bf98d7b49daec': {name:"NBA In the Zone 2000"                                                          },
  '9f4f05b3b59eb696': {name:"NBA In the Zone 2000"                                                          },
  '3019126a74c25c66': {name:"NBA In the Zone '98"                                                           },
  '9bbaac36944d8df2': {name:"NBA In the Zone '98"                                                           },
  '4f5292a2492a6c3d': {name:"NBA In the Zone '99"                                                           },
  'dba8eeeb3cb2ecf2': {name:"NBA Jam 2000"                                                                  },
  'a0cad0b6c893f4e3': {name:"NBA Jam 2000"                                                                  },
  'f6290781c1cf3fe0': {name:"NBA Jam 99"                                                                    },
  '1e8300e6a822f459': {name:"NBA Jam 99"                                                                    },
  'eeb0255fdbc12762': {name:"NBA Live 2000"                                                                 },
  '8f9c49ebb66745cd': {name:"NBA Live 2000"                                                                 },
  '9b1cf85735fa3311': {name:"NBA Live 99"                                                                   },
  '5ff484cfebf6e400': {name:"NBA Live 99"                                                                   },
  '2f96deac7ff8cbb2': {name:"NBA Pro 98"                                                                    },
  'b680178d76b9b357': {name:"NBA Pro 99"                                                                    },
  'f480fe3f7e5fc1a7': {name:"NBA Showtime - NBA on NBC"                                                     },
  'db0e7e142cb1c536': {name:"Neon Genesis Evangelion",                                    save:'Eeprom16k'  },
  '4fd5ea30f60b6231': {name:"NFL Blitz - Special Edition"                                                   },
  '70b194d0ccb5c4d7': {name:"NFL Blitz"                                                                     },
  '6909a01585a2e534': {name:"NFL Blitz 2000"                                                                },
  'eb35fa36362e5ee8': {name:"NFL Blitz 2001"                                                                },
  'd04eabe3d20d0483': {name:"NFL Quarterback Club 2000"                                                     },
  '9e5abd88bfdf1fe8': {name:"NFL Quarterback Club 2000"                                                     },
  '224678288529b2ff': {name:"NFL Quarterback Club 2001"                                                     },
  'f8e29bd8df7ac999': {name:"NFL Quarterback Club 98"                                                       },
  'f49e624b9b1db299': {name:"NFL Quarterback Club 98"                                                       },
  'ffed76be092d4520': {name:"NFL Quarterback Club 99"                                                       },
  '47cfa352fc3bc14e': {name:"NFL Quarterback Club 99"                                                       },
  '6e801a591d92e6a5': {name:"NHL 99"                                                                        },
  '1e607d28aef8f4ab': {name:"NHL 99"                                                                        },
  '30dcef8261246a80': {name:"NHL Blades of Steel '99"                                                       },
  'c3cdfd6dc801e74d': {name:"NHL Breakaway 98"                                                              },
  '9276ce297985c571': {name:"NHL Breakaway 98"                                                              },
  'd06817444ff2737d': {name:"NHL Breakaway 99"                                                              },
  'cb21468727c13100': {name:"NHL Breakaway 99"                                                              },
  'd95c89a96c012070': {name:"NHL Pro 99"                                                                    },
  '4d675728da3743cc': {name:"Nightmare Creatures"                                                           },
  'df3c3ccdfa937731': {name:"Nintama Rantarou 64"                                                           },
  '45b8508f2fd229d7': {name:"Nuclear Strike 64"                                                             },
  'bbdd9849bcaeb7f7': {name:"Nuclear Strike 64"                                                             },
  '97a1978ac1f62d27': {name:"Nuclear Strike 64"                                                             },
  '20b93bd8166440cc': {name:"Nushi Zuri 64"                                                                 },
  '18169b5b49c6431b': {name:"Nushi Tsuri 64 - Shiokaze ni Notte"                                            },
  'ec939031ef09c20f': {name:"Off Road Challenge"                                                            },
  'd08922819632e5c2': {name:"Off Road Challenge"                                                            },
  'c59b41e6e31d0169': {name:"Ogre Battle 64 - Person of Lordly Caliber",                  save:'SRAM'       },
  '67cf7503aa3fa956': {name:"Ogre Battle 64 - Person of Lordly Caliber (v1.1)",           save:'SRAM'       },
  '6910969c8d48eaf5': {name:"Ohzumou 64",                                                 save:'Eeprom4k'   },
  '168bc185af2296df': {name:"Ohzumou 64 2",                                               save:'Eeprom4k'   },
  '669464dcd9f02f57': {name:"Onegai Monsters"                                                               },
  '3b4b5574b5bcaef4': {name:"Pachinko 365 Nichi"                                                            },
  '3ae5ee653c737ded': {name:"Paper Mario",                                                save:'FlashRam'   },
  'af29ab1928cd1bc7': {name:"Paper Mario",                                                save:'FlashRam'   },
  '129b52893bed5308': {name:"Paperboy"                                                                      },
  '9e8d193e7e26e1f2': {name:"Paperboy"                                                                      },
  '386b97ac7ac9a9c3': {name:"Paperboy"                                                                      },
  '31cbe2cf1d1e6b4d': {name:"Parlor! Pro 64 Pachinko Jikki Simulation Game"                                 },
  '6647dd6ea89b3ea9': {name:"Pawapuro Puroyakyu 2001"                                                       },
  'ad5b4934269d2e50': {name:"Pawapuro Puroyakyu 4"                                                          },
  'da4329d2c0772bac': {name:"Pawapuro Puroyakyu 5"                                                          },
  'b7205eb7fdfdfeb3': {name:"Pawapuro Puroyakyu 6"                                                          },
  '8c1168f44ee42ee3': {name:"PD Ultraman Battle Collection 64",                           save:'Eeprom16k'  },
  'fbb1ab739360ca9c': {name:"Penny Racers",                                               save:'Eeprom4k'   },
  '83eb3cc81962c5fd': {name:"Penny Racers",                                               save:'Eeprom4k'   },
  'b47e749643b24b10': {name:"Perfect Dark",                                               save:'Eeprom16k'  },
  '0780b0e433ff02a6': {name:"Perfect Dark",                                               save:'Eeprom16k'  },
  'cc60f4ddc034a63c': {name:"Perfect Dark (v1.0)",                                        save:'Eeprom16k'  },
  '8fb9f24166b458b4': {name:"Perfect Dark (v1.1)",                                        save:'Eeprom16k'  },
  '81e84cb52661cbbc': {name:"PGA European Tour",                                          save:'Eeprom4k'   },
  '02c608eea6d5c26b': {name:"PGA European Tour",                                          save:'Eeprom4k'   },
  '0553243faa740bfc': {name:"Pikachu Genki Dechu"                                                           },
  '1c9651c8faaafc78': {name:"Pilot Wings 64",                                             save:'Eeprom4k'   },
  '0148cc0991e42ee4': {name:"Pilot Wings 64",                                             save:'Eeprom4k'   },
  'd55aa01a802df546': {name:"Pilot Wings 64",                                             save:'Eeprom4k'   },
  '0d690fec8c43a732': {name:"Pocket Monsters Snap",                                       save:'FlashRam'   },
  '59825e661dbd98d0': {name:"Pocket Monsters Stadium",                                    save:'FlashRam'   },
  '865877637b0eb85f': {name:"Pocket Monsters Stadium 2",                                  save:'FlashRam'   },
  'ac47477a23ecee44': {name:"Pokemon Puzzle League",                                      save:'FlashRam'   },
  'a753c519524b0fa7': {name:"Pokemon Puzzle League",                                      save:'FlashRam'   },
  'f3e6b23efe9e2f06': {name:"Pokemon Puzzle League",                                      save:'FlashRam'   },
  '53d11c4af8ae30d8': {name:"Pokemon Puzzle League",                                      save:'FlashRam'   },
  '6f97f54fd859f5ac': {name:"Pokemon Snap",                                               save:'FlashRam'   },
  '6a287d81167441ef': {name:"Pokemon Snap",                                               save:'FlashRam'   },
  '0d7253574d888a2a': {name:"Pokemon Snap",                                               save:'FlashRam'   },
  '47b512cae44efa71': {name:"Pokemon Snap",                                               save:'FlashRam'   },
  '3a296cba38a3af9f': {name:"Pokemon Snap",                                               save:'FlashRam'   },
  '4650c8c0051b0561': {name:"Pokemon Snap",                                               save:'FlashRam'   },
  '408db17b59851383': {name:"Pokemon Snap",                                               save:'FlashRam'   },
  '729811399f2e7207': {name:"Pokemon Snap Station",                                       save:'FlashRam'   },
  '432d121a0faf7dc1': {name:"Pokemon Stadium - Kiosk",                                    save:'FlashRam'   },
  '2da83fa55dc1e2da': {name:"Pokemon Stadium",                                            save:'FlashRam'   },
  '5de0c991b9af3aad': {name:"Pokemon Stadium",                                            save:'FlashRam'   },
  '1b1e0142b52d55e3': {name:"Pokemon Stadium",                                            save:'FlashRam'   },
  'b3d9f590f0dc0e9d': {name:"Pokemon Stadium",                                            save:'FlashRam'   },
  'a35335a2392dbf42': {name:"Pokemon Stadium",                                            save:'FlashRam'   },
  '757207849c5b3157': {name:"Pokemon Stadium",                                            save:'FlashRam'   },
  'ce49e5b6c03481dc': {name:"Pokemon Stadium",                                            save:'FlashRam'   },
  '821157036dd02f89': {name:"Pokemon Stadium 2",                                          save:'FlashRam'   },
  'c7a55aacc3cdb0a9': {name:"Pokemon Stadium 2",                                          save:'FlashRam'   },
  '727e9b435d49a1c1': {name:"Pokemon Stadium 2",                                          save:'FlashRam'   },
  '0bfca1d04b07b82f': {name:"Pokemon Stadium 2",                                          save:'FlashRam'   },
  '00afceef48480922': {name:"Pokemon Stadium 2",                                          save:'FlashRam'   },
  '5bfca1d04b07b82f': {name:"Pokemon Stadium 2",                                          save:'FlashRam'   },
  '9c365229a8c3e4b6': {name:"Pokemon Stadium 2",                                          save:'FlashRam'   },
  'c2d74fee38d9f19c': {name:"Pokemon Stadium GS",                                         save:'FlashRam'   },
  '9207384145e067a1': {name:"Polaris Sno Cross"                                                             },
  'fadca6d7b7b6fecc': {name:"Power League Baseball 64"                                                      },
  'ad5789cfa97ed596': {name:"Power Rangers - Lightspeed Rescue"                                             },
  '110cf6397dba2eab': {name:"Power Rangers - Lightspeed Rescue"                                             },
  '75d474fcab78029a': {name:"Powerpuff Girls - Chemical X-Traction",                      save:'Eeprom4k'   },
  '547fd2f3f9ac11c1': {name:"Premier Manager 64"                                                            },
  '4e0ca19bd3ab0804': {name:"Pro Mahjong Kiwame 64"                                                         },
  '0fb3dc1b76d832a1': {name:"Pro Mahjong Tsuwamono 64"                                                      },
  '8366ce8a6e42ba3f': {name:"Pro Yak Yu King Baseball"                                                      },
  'b972464be75dbe2d': {name:"Puyo Puyo 4 - Puyo Puyo Party",                              save:'Eeprom4k'   },
  '6b7e8094e462cc60': {name:"Puyo Puyo Sun 64",                                           save:'Eeprom4k'   },
  '4707dec0d372dfa2': {name:"Puzzle Bobble 64"                                                              },
  '9cf75b9fa008fed2': {name:"Quake 64"                                                                      },
  '741d9316346ddc65': {name:"Quake 64"                                                                      },
  '43f1a8bd622dafb1': {name:"Quake II"                                                                      },
  'd7d93374d022432c': {name:"Quake II"                                                                      },
  'd94dbbc80b435fcc': {name:"Quest 64"                                                                      },
  'a55f70280e6909b5': {name:"Racing Simulation - Monaco Grand Prix",                      save:'Eeprom4k'   },
  '2dac77289a13dcc3': {name:"Racing Simulation 2"                                                           },
  'f0ca1e9f0e8ac4ee': {name:"Rakuga Kids"                                                                   },
  '6818d267614042c5': {name:"Rakuga Kids"                                                                   },
  '0cbad935865548df': {name:"Rally '99"                                                                     },
  '3d8ea87371c5c53a': {name:"Rally Challenge 2000",                                       save:'Eeprom4k'   },
  'e4f99fc27dfe4b26': {name:"Rampage - World Tour"                                                          },
  '4844d484b019ca67': {name:"Rampage - World Tour"                                                          },
  '9b093d67de08c8a4': {name:"Rampage 2 - Universal Tour"                                                    },
  '4942fc5d079c5299': {name:"Rampage 2 - Universal Tour"                                                    },
  '8ec40403b80140ac': {name:"Rat Attack"                                                                    },
  'f10bfd20871dcff5': {name:"Rat Attack"                                                                    },
  '9bbfc5f3e2330f16': {name:"Rayman 2 - The Great Escape"                                                   },
  '0be1d56046eded8b': {name:"Rayman 2 - The Great Escape"                                                   },
  '4a831839290cb515': {name:"Razor Freestyle Scooter"                                                       },
  '29b4b7ea572cc9ba': {name:"Ready 2 Rumble Boxing"                                                         },
  '34a3d48b058b131e': {name:"Ready 2 Rumble Boxing"                                                         },
  '339521e9bdaffb13': {name:"Ready 2 Rumble Boxing Round 2"                                                 },
  'a5b118aaeb6adb07': {name:"Resident Evil 2",                                            save:'SRAM'       },
  '8e0e509bb35005e9': {name:"Resident Evil 2",                                            save:'SRAM'       },
  '87a91f0fa6afc1bf': {name:"Re-Volt"                                                                       },
  '9ee2e7c3cc51725d': {name:"Re-Volt"                                                                       },
  '6c7450f00b827b24': {name:"Road Rash 64"                                                                  },
  '6a36d8029cefab6c': {name:"Road Rash 64"                                                                  },
  'db4d6b0b82e67196': {name:"Roadsters"                                                                     },
  '707ae874d4ae9362': {name:"Roadsters"                                                                     },
  'd3a5bc747e5f944a': {name:"Roadsters Trophy"                                                              },
  '0f692b27777a0aad': {name:"Robot Ponkottsu 64 - Caramel of the 7 Seas",                 save:'Eeprom4k'   },
  '93b8a075b521a34c': {name:"Robotech - Crystal Dreams"                                                     },
  '324b8eac2673b4e7': {name:"Robotron 64"                                                                   },
  '4f9df69f59005f19': {name:"Robotron 64"                                                                   },
  'f875d39fc82df345': {name:"Rocket - Robot on Wheels",                                   save:'Eeprom4k'   },
  '85e05e0c3edd67a1': {name:"Rocket - Robot on Wheels",                                   save:'Eeprom4k'   },
  '3b5966d6075ca2d7': {name:"Rockman Dash",                                               save:'FlashRam'   },
  '7e260025cec37e2a': {name:"RR64 - Ridge Racer 64",                                      save:'Eeprom16k'  },
  '1070e9fea0a9944e': {name:"RR64 - Ridge Racer 64",                                      save:'Eeprom16k'  },
  '378f8f658dd21318': {name:"RTL World League Soccer 2000"                                                  },
  'c5b3020cb811259e': {name:"Rugrats - Scavenger Hunt"                                                      },
  'dadf3a4daefc9875': {name:"Rugrats - Treasure Hunt"                                                       },
  '0fca1a458abc6378': {name:"Rugrats - Treasure Hunt"                                                       },
  'b46c692bd8dc937b': {name:"Rugrats - Treasure Hunt"                                                       },
  '3215c21fd466640b': {name:"Rugrats in Paris - The Movie"                                                  },
  '391dc60aa603faab': {name:"Rugrats in Paris - The Movie"                                                  },
  '31e0d6ed13601368': {name:"Rush 2 - Extreme Racing USA"                                                   },
  '3621cfb715a70afa': {name:"Rush 2 - Extreme Racing USA"                                                   },
  'f34791760ec13320': {name:"S.C.A.R.S."                                                                    },
  '602d8e913e6865f8': {name:"S.C.A.R.S."                                                                    },
  '20186b2a66f4bc6a': {name:"San Francisco Rush - Extreme Racing"                                           },
  'b016d1610cd624fa': {name:"San Francisco Rush - Extreme Racing"                                           },
  'a2eca9b98ee4aa17': {name:"San Francisco Rush 2049"                                                       },
  '1894d251e36ab4d5': {name:"San Francisco Rush 2049"                                                       },
  'c44e810ca85cfe58': {name:"Scooby-Doo - Classic Creep Capers"                                             },
  '1d22bde3d334083c': {name:"Scooby-Doo - Classic Creep Capers"                                             },
  'b7f6f5eb39d756c9': {name:"SD Hiryuu no Ken Densetsu"                                                     },
  '75fdd584df3cfdbb': {name:"Shadow Man"                                                                    },
  'b560473a10d4742d': {name:"Shadow Man"                                                                    },
  'c3f806eaeddec207': {name:"Shadow Man"                                                                    },
  'e537c460e31e25a2': {name:"Shadow Man"                                                                    },
  'ce97680354fad4e0': {name:"Shadowgate 64 - Trials of the Four Towers"                                     },
  '556fb4020b8d7761': {name:"Shadowgate 64 - Trials of the Four Towers"                                     },
  '84ea4ed8b4f1b245': {name:"Shadowgate 64 - Trials of the Four Towers"                                     },
  'f2fcc12bf40d9a7b': {name:"Shadowgate 64 - Trials of the Four Towers"                                     },
  '0c28d5b12abca74b': {name:"Sim City 2000"                                                                 },
  'b00fbcb6982181e3': {name:"Sin and Punishment - Tsumi To Batsu",                        save:'Eeprom4k'   },
  '19d5f42e5e0c4ac6': {name:"Snow Speeder"                                                                  },
  '9deaf4dbc0823e33': {name:"Snowboard Kids"                                                                },
  'ff04fc84e93c25b1': {name:"Snowboard Kids"                                                                },
  'a0cdd75fad51bbd9': {name:"Snowboard Kids"                                                                },
  'ea290c93bf459293': {name:"Snowboard Kids 2",                                           save:'Eeprom4k'   },
  '1a1d75c2ff9bc1f8': {name:"Snowboard Kids 2",                                           save:'Eeprom4k'   },
  '512321224b594640': {name:"Sonic Wings Assault",                                        save:'Eeprom4k'   },
  '39e9cb7e9517333c': {name:"South Park"                                                                    },
  '6236b5209f89617b': {name:"South Park"                                                                    },
  '48a90cc04bd3608e': {name:"South Park - Chef's Luv Shack"                                                 },
  '76b2f307393d8fec': {name:"South Park Rally"                                                              },
  '3afc8a4ff22d91f7': {name:"South Park Rally"                                                              },
  '123446378d38c5ea': {name:"Space Dynamites",                                            save:'Eeprom4k'   },
  '9723feeb34da74ff': {name:"Space Invaders"                                                                },
  '8438e2bfafea48ef': {name:"Spacestation Silicon Valley",                                save:'Eeprom4k'   },
  '72e270fcaae7ff08': {name:"Spacestation Silicon Valley",                                save:'Eeprom4k'   },
  '71d10ea66ed0853d': {name:"Spider-Man"                                                                    },
  '6805ed0d5e510215': {name:"St. Andrews Old Course"                                                        },
  'f815d0a743aa8922': {name:"Star Fox 64",                                                save:'Eeprom4k'   },
  'c1a7caff37858568': {name:"Star Fox 64",                                                save:'Eeprom4k'   },
  'a00b78ba34db210f': {name:"Star Fox 64",                                                save:'Eeprom4k'   },
  '853cd9dde881e3da': {name:"Star Soldier Vanishing Earth",                               save:'Eeprom4k'   },
  '23eb03b73ae5aa28': {name:"Star Soldier Vanishing Earth",                               save:'Eeprom4k'   },
  '42a263f13b9b44f2': {name:"Star Twins"                                                                    },
  '124aa266c26aaf22': {name:"Star Wars - Rogue Squadron",                                 save:'Eeprom4k'   },
  'a2bd5c164622a605': {name:"Star Wars - Rogue Squadron",                                 save:'Eeprom4k'   },
  'c1919121613c1833': {name:"Star Wars - Rogue Squadron",                                 save:'Eeprom4k'   },
  'ec4ba2664fd9ad2e': {name:"Star Wars - Rogue Squadron",                                 save:'Eeprom4k'   },
  'bbe8e07eaa11e449': {name:"Star Wars - Rogue Squadron",                                 save:'Eeprom4k'   },
  '63ac24fe17aa411b': {name:"Star Wars - Shadows of the Empire",                          save:'Eeprom4k'   },
  '8166484d45927dab': {name:"Star Wars - Shadows of the Empire",                          save:'Eeprom4k'   },
  '5c7e4d2622468718': {name:"Star Wars - Shadows of the Empire (v1.0)",                   save:'Eeprom4k'   },
  '91b0474160102563': {name:"Star Wars - Shadows of the Empire (v1.1)",                   save:'Eeprom4k'   },
  '54edd74d7d28f974': {name:"Star Wars - Shadows of the Empire (v1.2)",                   save:'Eeprom4k'   },
  '90487e82dc688495': {name:"Star Wars - Shuggeki Rogue Chitai",                          save:'Eeprom4k'   },
  '9b98023de281a3d4': {name:"Star Wars Episode I - Battle for Naboo",                     save:'Eeprom4k'   },
  'e2ace6ea84430b02': {name:"Star Wars Episode I - Battle for Naboo",                     save:'Eeprom4k'   },
  '9803f7728ba95665': {name:"Star Wars Episode I - Racer",                                save:'Eeprom16k'  },
  '52b1f561ab226104': {name:"Star Wars Episode I - Racer",                                save:'Eeprom16k'  },
  'c42ded5302802506': {name:"Star Wars Episode I - Racer",                                save:'Eeprom16k'  },
  'fbfb8406a5a83e5d': {name:"StarCraft 64",                                               save:'FlashRam'   },
  'a35ecf42df34139a': {name:"StarCraft 64",                                               save:'FlashRam'   },
  'c32c9bbca54dd04e': {name:"StarCraft 64 (beta)",                                        save:'FlashRam'   },
  'b8a5ed9403e97386': {name:"Starshot - Space Circus Fever",                              save:'Eeprom4k'   },
  '550e9ed89aa97ab1': {name:"Starshot - Space Circus Fever",                              save:'Eeprom4k'   },
  'd7d81095d20d1035': {name:"Stunt Racer 64"                                                                },
  '696b64f4951075c5': {name:"Super B-Daman - Battle Phoenix 64"                                             },
  '5a211daa9abecb91': {name:"Super Bowling 64"                                                              },
  '85f3f2f37f0c496e': {name:"Super Bowling 64"                                                              },
  'f08cbca5f651bad8': {name:"Super Mario 64 - Star Road",                                 save:'Eeprom4k'   },
  '76d1fe61f9bb05ea': {name:"Super Mario 64 - The Missing Stars v2",                      save:'Eeprom4k'   },
  '88aefe21241410a4': {name:"Super Mario 64 - The Missing Stars",                         save:'Eeprom4k'   },
  'd5ba7f26dcfa9375': {name:"Super Mario 64 Ru",                                          save:'Eeprom4k'   },
  'c5425a63dc8ec5bd': {name:"Super Mario 64 Extended",                                    save:'Eeprom4k'   },
  'ff2b5a632623028b': {name:"Super Mario 64",                                             save:'Eeprom4k'   },
  '0e3daa4e247c7574': {name:"Super Mario 64",                                             save:'Eeprom4k'   },
  '36f03ca0d2c5c1bc': {name:"Super Mario 64",                                             save:'Eeprom4k'   },
  'a8a4fbd62caa2663': {name:"Super Mario 64 Shindou Edition",                             save:'Eeprom4k'   },
  '80205766e148e328': {name:"Super Robot Spirits"                                                           },
  '10d84916d2d63af7': {name:"Super Robot Taisen 64"                                                         },
  '5b8b6b91a4850b78': {name:"Super Smash Brothers",                                       save:'SRAM'       },
  '485f9493302e0f5c': {name:"Super Smash Brothers",                                       save:'SRAM'       },
  'a1fd26dde36b4acb': {name:"Super Smash Brothers",                                       save:'SRAM'       },
  '222ee09cb0f16e20': {name:"Super Speed Race 64"                                                           },
  '532545c1d9247b5d': {name:"Supercross 2000"                                                               },
  '7f12bb2cd8bfc209': {name:"Supercross 2000"                                                               },
  '5bf3e8a2d987dcc9': {name:"Superman - The Animated Series"                                                },
  '74ab4cb4299a0207': {name:"Superman - The Animated Series"                                                },
  'f311e83524277999': {name:"Susume! Taisen Puzzle Dama Toukon! Marumata Chou"                              },
  '56a48bb9af762b5b': {name:"Tamagotchi World 64"                                                           },
  '54ddbcae4a83ff15': {name:"Taz Express",                                                save:'Eeprom4k'   },
  'bb2f04d97c99fffc': {name:"Telefoot Soccer 2000"                                                          },
  'a6db3a969bc8d5f7': {name:"Tetris 64"                                                                     },
  'beda1f3cbae0a402': {name:"Tetrisphere",                                                save:'Eeprom4k'   },
  'a984e60fc47ab78b': {name:"Tetrisphere",                                                save:'Eeprom4k'   },
  '161b7d91e19b1f83': {name:"The Legend of Zelda - OoT Nightmare Mod",                    save:'SRAM'       },
  'c7c7b1f831a4fc1e': {name:"The Legend of Zelda - Ocarina of Time Ru",                   save:'SRAM'       },
  '4fecec6a144892f0': {name:"The Legend of Zelda - Majora's Mask ",                       save:'FlashRam'   },
  'E585C39FC705CC3E': {name:"The Legend of Zelda - Majora's Mask Debug",                  save:'FlashRam'   },
  'b71170ec2bd71676': {name:"The Legend of Zelda - Ocarina of Time (v1.0)",               save:'SRAM'       },
  '1a0034f006ed47ae': {name:"The Legend of Zelda - Ocarina of Time Master Quest (GC)",    save:'SRAM'       },
  '69b544b085193c37': {name:"The Legend of Zelda - Ocarina of Time (v1.0)",               save:'SRAM'       },
  '1fa83dd4191e1e02': {name:"The Legend of Zelda - Ocarina of Time (v1.1)",               save:'SRAM'       },
  'bd5f05b20c4eab0b': {name:"The Legend of Zelda - Ocarina of Time (v1.1)",               save:'SRAM'       },
  'aea23b699f4ef1b7': {name:"The Legend of Zelda - Ocarina of Time (v1.2)",               save:'SRAM'       },
  'c35a46091b50cbf8': {name:"The Legend of Zelda - Ocarina of Time (GC)",                 save:'SRAM'       },
  'f6187d915354bc69': {name:"The Legend of Zelda - Zelda's Birthday",                     save:'SRAM'       },
  '08eb43b49311b34d': {name:"The Legend of Zelda - Majora's Mask (GC)",                   save:'FlashRam'   },
  '459379bf027aff39': {name:"The Legend of Zelda - Majora's Mask (Demo)",                 save:'FlashRam'   },
  '1c635453f0dea203': {name:"The Legend of Zelda - Majora's Mask",                        save:'FlashRam'   },
  'c65579e9388d33bc': {name:"The Legend of Zelda - Majora's Mask",                        save:'FlashRam'   },
  'ba35ddf375e05241': {name:"The Legend of Zelda - Ocarina of Time (GC)",                 save:'SRAM'       },
  'f336411da9ee63af': {name:"The Legend of Zelda - OOT (Master Quest)",                   save:'SRAM'       },
  '3f14532151632d99': {name:"The New Tetris",                                             save:'SRAM'       },
  '0aff1ce6710d1cce': {name:"The New Tetris",                                             save:'SRAM'       },
  '33ddbf4e849d4c66': {name:"Tigger's Honey Hunt",                                        save:'FlashRam'   },
  '2ff7c4e006159e76': {name:"Tigger's Honey Hunt",                                        save:'FlashRam'   },
  '1c39e76333eacce6': {name:"Tom and Jerry in Fists of Furry",                            save:'Eeprom4k'   },
  'fb4e4f2bfe11c543': {name:"Tom and Jerry in Fists of Furry",                            save:'Eeprom4k'   },
  '3329418ddb648f58': {name:"Tom Clancy's Rainbow Six"                                                      },
  '35f36b4881cc4d03': {name:"Tom Clancy's Rainbow Six"                                                      },
  '420c2a397de790b7': {name:"Tom Clancy's Rainbow Six"                                                      },
  '3daf7548a2d3669a': {name:"Tom Clancy's Rainbow Six"                                                      },
  '14979eef7d2c3bc0': {name:"Tonic Trouble"                                                                 },
  '6e913f0998b60844': {name:"Tonic Trouble"                                                                 },
  '22c04e2085d119b1': {name:"Tony Hawk's Pro Skater (v1.0)"                                                 },
  '804114e0c9780b65': {name:"Tony Hawk's Pro Skater (v1.1)"                                                 },
  'a526899f09b48705': {name:"Tony Hawk's Pro Skater"                                                        },
  '57b5ea840f198ac8': {name:"Tony Hawk's Pro Skater 2"                                                      },
  '180e1599a5e66612': {name:"Tony Hawk's Pro Skater 2"                                                      },
  '99150E181266E6A5': {name:"Tony Hawk's Pro Skater 2"                                                      },
  'b5707f1afdb9b700': {name:"Tony Hawk's Pro Skater 3"                                                      },
  'bf6e749a99ea0228': {name:"Toon Panic (Proto)"                                                            },
  'f002cc8e81de8b7f': {name:"Top Gear Hyper-Bike",                                        save:'Eeprom4k'   },
  'c6493f5fb014c70d': {name:"Top Gear Hyper-Bike",                                        save:'Eeprom4k'   },
  '80cd41d712b9a9ac': {name:"Top Gear Overdrive",                                         save:'Eeprom4k'   },
  '4ff2780517bf7591': {name:"Top Gear Overdrive",                                         save:'Eeprom4k'   },
  '38a59bd089541a1c': {name:"Top Gear Overdrive",                                         save:'Eeprom4k'   },
  '3d9b2662e8b111fe': {name:"Top Gear Rally",                                             save:'Eeprom4k'   },
  '4762590e8b4b3d75': {name:"Top Gear Rally",                                             save:'Eeprom4k'   },
  '01e7437fd1286353': {name:"Top Gear Rally",                                             save:'Eeprom4k'   },
  'e07359beb8edb089': {name:"Top Gear Rally 2"                                                              },
  'd62cefcfe673e9c9': {name:"Top Gear Rally 2"                                                              },
  '77b6babee4b5b051': {name:"Top Gear Rally 2"                                                              },
  '77d32df847b33f8c': {name:"Top Gear Rally 2"                                                              },
  'a43c70efc99a4a4d': {name:"Toukon Road - Brave Spirits"                                                   },
  '437f1c551c834991': {name:"Toukon Road 2 - The Next Generation"                                           },
  '75902a781d6352e5': {name:"Toy Story 2"                                                                   },
  '3e7450a1cd2225cf': {name:"Toy Story 2"                                                                   },
  '97db93cbd5635c7f': {name:"Toy Story 2"                                                                   },
  '5838ebcc972d9526': {name:"Toy Story 2"                                                                   },
  '436b4bfea7291d08': {name:"Triple Play 2000"                                                              },
  '0ffae466d0c788de': {name:"Turok - Legenden des Verlorenen Landes"                                        },
  '8b49b9ad558ff2da': {name:"Turok - Rage Wars"                                                             },
  '1462a21e0f9090e7': {name:"Turok - Rage Wars"                                                             },
  'dd09702f53ac3bfc': {name:"Turok - The Dinosaur Hunter"                                                   },
  '63d95f661266ccb5': {name:"Turok - The Dinosaur Hunter"                                                   },
  'b8e66a9122ab1788': {name:"Turok - The Dinosaur Hunter"                                                   },
  '0df1702fff87415c': {name:"Turok - The Dinosaur Hunter (v1.0)"                                            },
  'dd095f6653ac3bfc': {name:"Turok - The Dinosaur Hunter (v1.0)"                                            },
  'cd0d702fc9c56c17': {name:"Turok - The Dinosaur Hunter (v1.1/v1.2)"                                       },
  '49770e2e599db4b8': {name:"Turok 2 - Seeds of Evil"                                                       },
  '942bb9e025e0a7b9': {name:"Turok 2 - Seeds of Evil"                                                       },
  '0b8405fe0c329393': {name:"Turok 2 - Seeds of Evil"                                                       },
  '118a08497e959464': {name:"Turok 2 - Seeds of Evil"                                                       },
  '942bb9e0bd7ce880': {name:"Turok 2 - Seeds of Evil"                                                       },
  'fc5ac9e8da21d135': {name:"Turok 2 - Seeds of Evil - Kiosk"                                               },
  'f179a589ef977e66': {name:"Turok 3 - Shadow of Oblivion"                                                  },
  'f22f166a4c709320': {name:"Turok 3 - Shadow of Oblivion"                                                  },
  '329dc9bb80aa7d11': {name:"Twisted Edge Extreme Snowboarding"                                             },
  'b8a588e6183f4bb1': {name:"Twisted Edge Extreme Snowboarding"                                             },
  '7851da6ec1fe96d3': {name:"Vigilante 8"                                                                   },
  '6a0571ea474821e4': {name:"Vigilante 8"                                                                   },
  'a282bce294d61c59': {name:"Vigilante 8"                                                                   },
  'f4791f15e5c8ed8e': {name:"Vigilante 8"                                                                   },
  '6d86c5f5d9132705': {name:"Vigilante 8 - 2nd Offense"                                                     },
  '7ebc10dd51b300f9': {name:"Vigilante 8 - 2nd Offense"                                                     },
  '986c006081a30526': {name:"Violence Killer - Turok New Generation"                                        },
  '8b24b3824d243ee7': {name:"Virtual Chess 64"                                                              },
  '21a2da2fcea788a5': {name:"Virtual Chess 64"                                                              },
  '43764a4ed73974a3': {name:"Virtual Pool 64"                                                               },
  'd0f2f9989cf0d903': {name:"Virtual Pool 64"                                                               },
  'c4085c048b79fd4a': {name:"Virtual Pro Wrestling",                                      save:'Eeprom4k'   },
  '354209cd624b0788': {name:"Virtual Pro Wrestling 2",                                    save:'SRAM'       },
  '3890053c8221bfc8': {name:"V-Rally Edition 99",                                         save:'Eeprom4k'   },
  'a524024d9457eb1b': {name:"V-Rally Edition 99",                                         save:'Eeprom4k'   },
  '196b6e635fdc7de5': {name:"V-Rally Edition 99",                                         save:'Eeprom4k'   },
  '8ad56680c1cadec3': {name:"Waialae Country Club - True Golf Classics",                  save:'Eeprom4k'   },
  '75300593430f1e26': {name:"Waialae Country Club - True Golf Classics",                  save:'Eeprom4k'   },
  'ad57500c6e126e04': {name:"Waialae Country Club - True Golf Classics (1.1)",            save:'Eeprom4k'   },
  'e28c31ddba9837b7': {name:"Waialae Country Club - True Golf Classics (1.1)",            save:'Eeprom4k'   },
  'f628fef7c3acf2c3': {name:"War Gods"                                                                      },
  '70cc15d7d6f51c27': {name:"War Gods"                                                                      },
  'd691915c06c30ab3': {name:"Wave Race 64",                                               save:'Eeprom4k'   },
  '96fa0e65a7f9dd30': {name:"Wave Race 64",                                               save:'Eeprom4k'   },
  '531fe17d9d2f8774': {name:"Wave Race 64 (v1.0)",                                        save:'Eeprom4k'   },
  '614b2f496a14e504': {name:"Wave Race 64 (v1.1)",                                        save:'Eeprom4k'   },
  'e2f35d53f1899760': {name:"Wave Race 64 Shindou Edition",                               save:'Eeprom4k'   },
  '59aa3bdc6a45bb0a': {name:"Wayne Gretzky's 3D Hockey v1.1"                                                },
  '3f22456b565c0ef0': {name:"Wayne Gretzky's 3D Hockey"                                                     },
  '431030f11a5480fd': {name:"Wayne Gretzky's 3D Hockey"                                                     },
  '4b090922af59952c': {name:"Wayne Gretzky's 3D Hockey"                                                     },
  '59389d5a10e7aa97': {name:"Wayne Gretzky's 3D Hockey '98"                                                 },
  'f3451b666d26d69e': {name:"Wayne Gretzky's 3D Hockey '98"                                                 },
  'dd5a6f39a7ec9366': {name:"WCW Backstage Assault"                                                         },
  'd68cbe33126918ec': {name:"WCW Mayhem"                                                                    },
  '58067baa7b93969c': {name:"WCW Mayhem"                                                                    },
  '1a5ac4d45eb225f4': {name:"WCW Nitro"                                                                     },
  '68afdb8b364b5b34': {name:"WCW vs. NWO - World Tour"                                                      },
  'bd193e2c5eee1351': {name:"WCW vs. NWO - World Tour (v1.0)"                                               },
  'b960be713cfbdb1d': {name:"WCW vs. NWO - World Tour (v1.2)"                                               },
  'ab96e5dee77a3baf': {name:"WCW-NWO Revenge",                                            save:'SRAM'       },
  '75a8e86886a4e70c': {name:"WCW-NWO Revenge",                                            save:'SRAM'       },
  '4fb5a8ce03d5217f': {name:"Wetrix"                                                                        },
  'faeab6dca3cfbbc6': {name:"Wetrix"                                                                        },
  '2b0996e84e4d24dc': {name:"Wheel of Fortune"                                                              },
  'c7c4eb0c32e99c0c': {name:"Wild Choppers",                                              save:'Eeprom4k'   },
  '7e9598edacdc4282': {name:"WinBack - Covert Operations"                                                   },
  'e056a01f6a94b9a4': {name:"WinBack - Covert Operations"                                                   },
  'af8c89d55bb60760': {name:"WinBack - Covert Operations"                                                   },
  '32272d1318910ec7': {name:"Wipeout 64"                                                                    },
  '7d0e3154d830546b': {name:"Wipeout 64"                                                                    },
  '65973ce4bec1b105': {name:"Wonder Project J2"                                                             },
  '38594b3a9d986fa2': {name:"Wonder Project J2 (English)"                                                   },
  'f7881e4f963f5a4a': {name:"Wonder Project J2 (English)"                                                   },
  '6a6d63bdba541f5d': {name:"World Cup 98"                                                                  },
  '9030fcf9c24e01ff': {name:"World Cup 98"                                                                  },
  'c8fe8d30f6b52ece': {name:"World Driver Championship"                                                     },
  '782706acb8fcaddf': {name:"World Driver Championship"                                                     },
  'a059e913b0ca930e': {name:"Worms - Armageddon",                                         save:'Eeprom4k'   },
  '7bc5212d8cc5e48f': {name:"Worms - Armageddon",                                         save:'Eeprom4k'   },
  '0fec5bcd0810fd86': {name:"WWF - War Zone"                                                                },
  'a475a233594450b8': {name:"WWF - War Zone"                                                                },
  'c851318f45f53a4f': {name:"WWF Attitude"                                                                  },
  '142fbed288374538': {name:"WWF Attitude"                                                                  },
  '7b5bf45be8ee6b59': {name:"WWF Attitude"                                                                  },
  '40064b4efbbc491b': {name:"WWF No Mercy",                                               save:'FlashRAM'   },
  '8ef08d6dcfc308d0': {name:"WWF No Mercy (v1.0)",                                        save:'FlashRAM'   },
  'c294db8cf0c646cb': {name:"WWF No Mercy (v1.1)",                                        save:'FlashRAM'   },
  '0390a59064980831': {name:"WWF WrestleMania 2000",                                      save:'SRAM'       },
  'a57d731259919623': {name:"WWF Wrestlemania 2000",                                      save:'SRAM'       },
  'be5313c7eea609aa': {name:"WWF WrestleMania 2000",                                      save:'SRAM'       },
  '9dae5305c1e0d8ea': {name:"Xena Warrior Princess - Talisman of Fate"                                      },
  'c767160aa6463329': {name:"Xena Warrior Princess - Talisman of Fate"                                      },
  'c3968b9fdc9411a0': {name:"Yakouchuu II - Satsujun Kouru"                                                 },
  'e8d83723ec7c8e6b': {name:"Yoshi's Story",                                              save:'Eeprom16k'  },
  '60cacf2d47b15483': {name:"Yoshi's Story",                                              save:'Eeprom16k'  },
  '497df9d35b132469': {name:"Yoshi's Story",                                              save:'Eeprom16k'  },
  '8d3bda777c0d2b16': {name:"Yosuke no Mahjong Juku",                                     save:'Eeprom4k'   },
  '2d16e69f37407ee9': {name:"Yuke Yuke!! Trouble Makers"                                                    },
  'c1d0738466061223': {name:"Zelda no Densetsu 2 - Mujura no Kamen",                      save:'FlashRam'   },
  'b82df5f736e69521': {name:"Zelda no Densetsu - Toki no Ocarina Collectors Ed.",         save:'SRAM'       },
  'baf411f65c1384c5': {name:"Zelda no Densetsu - Toki no Ocarina (GC)",                   save:'SRAM'       },
  'ba453bf46f9b0e2f': {name:"Zelda no Densetsu - Toki no Ocarina (GC)",                   save:'SRAM'       },
  '127341ec5fde31eb': {name:"Zelda no Densetsu 2 - Mujura no Kamen",                      save:'FlashRam'   },
  '3804ae69f3f3632c': {name:"Zelda no Densetsu 2 - Mujura no Kamen (1.1)",                save:'FlashRam'   },
  'cd0c011cfab7d322': {name:"Zool - Majou Tsukai Densetsu"                                                  },
  '54a43977662af5a2': {name:"A HORiZON64 RELEASE"                                                           },
  '91d8ab5ccef62962': {name:"Fishy by NaN v0.3141"                                                          },
  'bc069a1355006b41': {name:"Mind Present-Readme"                                                           },
  'b1cb11c87c61b78f': {name:"Mind Present / DNX"                                                            },
  '54f53fcb0bcd7387': {name:"Tron Demo"                                                                     },
  '4549049c0c0b1ed3': {name:"POM99 - README"                                                                },
  '7a7d3b994df0542e': {name:"POM99 - MADEIRAGAMES"                                                          },
  '575aa9a37dc2e69f': {name:"POM99 - WET DREAMS"                                                            },
  '95c03bca0a864996': {name:"POM99 - CAN-BETA"                                                              },
  'd44a7da4f981fa8b': {name:"Manic Miner 64"                                                                },
  '2d369c9d086be65b': {name:"Shag-a-delic/CAMELOT"                                                          },
  'c479518fdc263580': {name:"Space Rotator"                                                                 },
  '70bb552625997d66': {name:"O.D.T.",                                                     save:'Controller' },
  'a61564e8535b3998': {name:"O.D.T.",                                                     save:'Controller' }
};

/*jshint browser:true, devel:true */

(function (n64js) {'use strict';
  /**
   * @constructor
   */
  function BinaryRequest(get_or_post, url, args, data, cb) {
    get_or_post = get_or_post || 'GET';

    var alwaysCallbacks = [];

    if (args) {
      var arg_str = '';
      var i;
      for (i in args) {
        if (args.hasOwnProperty(i)) {
          if (arg_str) {
            arg_str += '&';
          }
          arg_str += escape(i);
          if (args[i] !== undefined) {
            arg_str += '=' + escape(args[i]);
          }
        }
      }

      url += '?' + arg_str;
    }

    function invokeAlways() {
      var i;
      for (i = 0; i < alwaysCallbacks.length; ++i) {
        alwaysCallbacks[i]();
      }
    }

    var xhr = new XMLHttpRequest();
    xhr.open(get_or_post, url, true);
    try {
      xhr.responseType = "arraybuffer";
    } catch (e) {
      alert('responseType arrayBuffer not supported!');
    }
    xhr.onreadystatechange = function onreadystatechange () {
      if(xhr.readyState === 4) {
        invokeAlways();
      }
    };
    xhr.onload = function onload() {
      if (ArrayBuffer.prototype.isPrototypeOf(this.response)) {
        cb(this.response);
      } else {
        alert("wasn't arraybuffer, was " + typeof(this.response) + JSON.stringify(this.response));
      }
    };
    xhr.send(data);


    this.always = function (cb) {
      // If the request has already completed then ensure the callback is called.
      if(xhr.readyState === 4) {
        cb();
      }
      alwaysCallbacks.push(cb);
      return this;
    };
  }

  /**
   * @constructor
   */
  function SyncReader() {
    this.kBufferLength = 1024*1024;
    this.syncBuffer    = null;
    this.syncBufferIdx = 0;
    this.fileOffset    = 0;
    this.curRequest    = null;
    this.oos           = false;

    this.nextBuffer    = null;
  }

  SyncReader.prototype.refill = function () {
    if (!this.syncBuffer || this.syncBufferIdx >= this.syncBuffer.length) {
      this.syncBuffer    = this.nextBuffer;
      this.syncBufferIdx = 0;
      this.nextBuffer    = null;
    }
  };

  SyncReader.prototype.tick = function () {

    this.refill();

    if (!this.nextBuffer && !this.curRequest) {
      var that = this;

      this.curRequest = new BinaryRequest('GET', "rsynclog", {o:this.fileOffset,l:this.kBufferLength}, undefined, function (result){
        that.nextBuffer     = new Uint32Array(result);
        that.fileOffset     += result.byteLength;
      }).always(function () {
        that.curRequest = null;
      });

      return false;
    }

    return true;
  };

  SyncReader.prototype.getAvailableBytes = function () {
    var ops = 0;
    if (this.syncBuffer) {
      ops += this.syncBuffer.length - this.syncBufferIdx;
    }
    if (this.nextBuffer) {
      ops += this.nextBuffer.length;
    }

    return ops * 4;
  };

  SyncReader.prototype.pop = function () {
    if (!this.syncBuffer || this.syncBufferIdx >= this.syncBuffer.length) {
      this.refill();
    }

    if (this.syncBuffer && this.syncBufferIdx < this.syncBuffer.length) {
      var r = this.syncBuffer[this.syncBufferIdx];
      this.syncBufferIdx++;
      return r;
    }
    return -1;
  };

  SyncReader.prototype.sync32 = function (val, name) {

    if (this.oos) {
      return false;
    }

    var other = this.pop();
    if (val !== other) {
      n64js.warn(name + ' mismatch: local ' + toString32(val) + ' remote ' + toString32(other));
      // Flag that we're out of sync so that we don't keep spamming errors.
      this.oos = true;
      return false;
    }

    return true;
  };

  SyncReader.prototype.reflect32 = function (val) {
    if (this.oos) {
      return val;
    }
    // Ignore val, just return the recorded value from the stream.
    return this.pop();
  };


  /**
   * @constructor
   */
  function SyncWriter() {
    this.kBufferLength  = 1024*1024/4;
    this.syncBuffer    = new Uint32Array(this.kBufferLength);
    this.syncBufferIdx = 0;


    this.fileOffset     = 0;
    this.curRequest     = null;
    this.buffers        = [];
  }

  SyncWriter.prototype.flushBuffer = function () {
    if (this.syncBufferIdx >= this.syncBuffer.length) {
      this.buffers.push(this.syncBuffer);
      this.syncBuffer    = new Uint32Array(this.kBufferLength);
      this.syncBufferIdx = 0;
    }
  };

  SyncWriter.prototype.tick = function () {

    if (!this.curRequest && this.syncBufferIdx > 0) {

      var b = new Uint32Array(this.syncBufferIdx);
      for (var i = 0; i < this.syncBufferIdx; ++i) {
        b[i] = this.syncBuffer[i];
      }
      this.buffers.push(b);
      this.syncBuffer    = new Uint32Array(this.kBufferLength);
      this.syncBufferIdx = 0;
    }
    // If no request is active and we have more buffers to flush, kick off the next upload.
    if (!this.curRequest && this.buffers.length > 0) {

      var buffer = this.buffers[0];
      this.buffers.splice(0,1);

      var that = this;
      var bytes = buffer.length * 4;
      this.curRequest = new BinaryRequest('POST', "wsynclog", {o:this.fileOffset,l:bytes}, buffer, function (result) {
        that.fileOffset += bytes;
      }).always(function () {
        that.curRequest = null;
      });
    }

    return this.buffers.length === 0;
  };

  SyncWriter.prototype.getAvailableBytes = function () {
    // NB we can always handle full buffers, so return a large number here.
    return 1000000000;
  };

  SyncWriter.prototype.sync32 = function (val, name) {
    if (this.syncBufferIdx >= this.syncBuffer.length) {
      this.flushBuffer();
    }

    this.syncBuffer[this.syncBufferIdx] = val;
    this.syncBufferIdx++;
    return true;
  };

  SyncWriter.prototype.reflect32 = function (val) {
    if (this.syncBufferIdx >= this.syncBuffer.length) {
      this.flushBuffer();
    }

    this.syncBuffer[this.syncBufferIdx] = val;
    this.syncBufferIdx++;
    return val;
  };

  n64js.createSyncConsumer = function () { return new SyncReader(); };
  n64js.createSyncProducer = function () { return new SyncWriter(); };

}(window.n64js = window.n64js || {}));

/*jshint jquery:true, browser:true, devel:true */
/*global Stats:false */

(function (n64js) {'use strict';
  const toString32$$1 = toString32;

  var stats = null;

  const kCyclesPerUpdate = 100000000;

  var syncFlow;
  var syncInput;
  function initSync() {
    syncFlow  = undefined;//n64js.createSyncConsumer();
    syncInput = undefined;//n64js.createSyncConsumer();
  }
  n64js.getSyncFlow = function () {
    return syncFlow;
  };

  const kBootstrapOffset = 0x40;
  const kGameOffset      = 0x1000;

  const kOpBreakpoint = 58;

  var breakpoints = {};     // address -> original op

  const SP_MEM_ADDR_REG     = 0x00;
  const SP_DRAM_ADDR_REG    = 0x04;
  const SP_RD_LEN_REG       = 0x08;
  const SP_WR_LEN_REG       = 0x0C;
  const SP_STATUS_REG       = 0x10;
  const SP_DMA_FULL_REG     = 0x14;
  const SP_DMA_BUSY_REG     = 0x18;
  const SP_SEMAPHORE_REG    = 0x1C;

  const SP_CLR_HALT           = 0x0000001;
  const SP_SET_HALT           = 0x0000002;
  const SP_CLR_BROKE          = 0x0000004;
  const SP_CLR_INTR           = 0x0000008;
  const SP_SET_INTR           = 0x0000010;
  const SP_CLR_SSTEP          = 0x0000020;
  const SP_SET_SSTEP          = 0x0000040;
  const SP_CLR_INTR_BREAK     = 0x0000080;
  const SP_SET_INTR_BREAK     = 0x0000100;
  const SP_CLR_SIG0           = 0x0000200;
  const SP_SET_SIG0           = 0x0000400;
  const SP_CLR_SIG1           = 0x0000800;
  const SP_SET_SIG1           = 0x0001000;
  const SP_CLR_SIG2           = 0x0002000;
  const SP_SET_SIG2           = 0x0004000;
  const SP_CLR_SIG3           = 0x0008000;
  const SP_SET_SIG3           = 0x0010000;
  const SP_CLR_SIG4           = 0x0020000;
  const SP_SET_SIG4           = 0x0040000;
  const SP_CLR_SIG5           = 0x0080000;
  const SP_SET_SIG5           = 0x0100000;
  const SP_CLR_SIG6           = 0x0200000;
  const SP_SET_SIG6           = 0x0400000;
  const SP_CLR_SIG7           = 0x0800000;
  const SP_SET_SIG7           = 0x1000000;

  const SP_STATUS_HALT        = 0x0001;
  const SP_STATUS_BROKE       = 0x0002;
  const SP_STATUS_DMA_BUSY    = 0x0004;
  const SP_STATUS_DMA_FULL    = 0x0008;
  const SP_STATUS_IO_FULL     = 0x0010;
  const SP_STATUS_SSTEP       = 0x0020;
  const SP_STATUS_INTR_BREAK  = 0x0040;
  const SP_STATUS_SIG0        = 0x0080;
  const SP_STATUS_SIG1        = 0x0100;
  const SP_STATUS_SIG2        = 0x0200;
  const SP_STATUS_SIG3        = 0x0400;
  const SP_STATUS_SIG4        = 0x0800;
  const SP_STATUS_SIG5        = 0x1000;
  const SP_STATUS_SIG6        = 0x2000;
  const SP_STATUS_SIG7        = 0x4000;

  const SP_STATUS_YIELD       = SP_STATUS_SIG0;
  const SP_STATUS_YIELDED     = SP_STATUS_SIG1;
  const SP_STATUS_TASKDONE    = SP_STATUS_SIG2;

  // DP Command
  const DPC_START_REG         = 0x00;
  const DPC_END_REG           = 0x04;
  const DPC_CURRENT_REG       = 0x08;
  const DPC_STATUS_REG        = 0x0C;
  const DPC_CLOCK_REG         = 0x10;
  const DPC_BUFBUSY_REG       = 0x14;
  const DPC_PIPEBUSY_REG      = 0x18;
  const DPC_TMEM_REG          = 0x1C;

  const DPC_CLR_XBUS_DMEM_DMA = 0x0001;
  const DPC_SET_XBUS_DMEM_DMA = 0x0002;
  const DPC_CLR_FREEZE        = 0x0004;
  const DPC_SET_FREEZE        = 0x0008;
  const DPC_CLR_FLUSH         = 0x0010;
  const DPC_SET_FLUSH         = 0x0020;
  const DPC_CLR_TMEM_CTR      = 0x0040;
  const DPC_CLR_PIPE_CTR      = 0x0080;
  const DPC_CLR_CMD_CTR       = 0x0100;
  const DPC_CLR_CLOCK_CTR     = 0x0200;

  const DPC_STATUS_XBUS_DMEM_DMA = 0x001;
  const DPC_STATUS_FREEZE        = 0x002;
  const DPC_STATUS_FLUSH         = 0x004;
  const DPC_STATUS_START_GCLK    = 0x008;
  const DPC_STATUS_TMEM_BUSY     = 0x010;
  const DPC_STATUS_PIPE_BUSY     = 0x020;
  const DPC_STATUS_CMD_BUSY      = 0x040;
  const DPC_STATUS_CBUF_READY    = 0x080;
  const DPC_STATUS_DMA_BUSY      = 0x100;
  const DPC_STATUS_END_VALID     = 0x200;
  const DPC_STATUS_START_VALID   = 0x400;


  // DP Span
  const DPS_TBIST_REG        = 0x00;
  const DPS_TEST_MODE_REG    = 0x04;
  const DPS_BUFTEST_ADDR_REG = 0x08;
  const DPS_BUFTEST_DATA_REG = 0x0C;

  const DPS_TBIST_CHECK      = 0x01;
  const DPS_TBIST_GO         = 0x02;
  const DPS_TBIST_CLEAR      = 0x04;

  const DPS_TBIST_DONE      = 0x004;
  const DPS_TBIST_FAILED    = 0x7F8;

  // MIPS Interface
  const MI_MODE_REG         = 0x00;
  const MI_VERSION_REG      = 0x04;
  const MI_INTR_REG         = 0x08;
  const MI_INTR_MASK_REG    = 0x0C;

  const MI_CLR_INIT         = 0x0080;
  const MI_SET_INIT         = 0x0100;
  const MI_CLR_EBUS         = 0x0200;
  const MI_SET_EBUS         = 0x0400;
  const MI_CLR_DP_INTR      = 0x0800;
  const MI_CLR_RDRAM        = 0x1000;
  const MI_SET_RDRAM        = 0x2000;

  const MI_MODE_INIT        = 0x0080;
  const MI_MODE_EBUS        = 0x0100;
  const MI_MODE_RDRAM       = 0x0200;

  const MI_INTR_MASK_CLR_SP = 0x0001;
  const MI_INTR_MASK_SET_SP = 0x0002;
  const MI_INTR_MASK_CLR_SI = 0x0004;
  const MI_INTR_MASK_SET_SI = 0x0008;
  const MI_INTR_MASK_CLR_AI = 0x0010;
  const MI_INTR_MASK_SET_AI = 0x0020;
  const MI_INTR_MASK_CLR_VI = 0x0040;
  const MI_INTR_MASK_SET_VI = 0x0080;
  const MI_INTR_MASK_CLR_PI = 0x0100;
  const MI_INTR_MASK_SET_PI = 0x0200;
  const MI_INTR_MASK_CLR_DP = 0x0400;
  const MI_INTR_MASK_SET_DP = 0x0800;

  const MI_INTR_MASK_SP   = 0x01;
  const MI_INTR_MASK_SI   = 0x02;
  const MI_INTR_MASK_AI   = 0x04;
  const MI_INTR_MASK_VI   = 0x08;
  const MI_INTR_MASK_PI   = 0x10;
  const MI_INTR_MASK_DP   = 0x20;

  const MI_INTR_SP        = 0x01;
  const MI_INTR_SI        = 0x02;
  const MI_INTR_AI        = 0x04;
  const MI_INTR_VI        = 0x08;
  const MI_INTR_PI        = 0x10;
  const MI_INTR_DP        = 0x20;

  // Video Interface
  const VI_STATUS_REG     = 0x00;
  const VI_ORIGIN_REG     = 0x04;
  const VI_WIDTH_REG      = 0x08;
  const VI_INTR_REG       = 0x0C;
  const VI_CURRENT_REG    = 0x10;
  const VI_BURST_REG      = 0x14;
  const VI_V_SYNC_REG     = 0x18;
  const VI_H_SYNC_REG     = 0x1C;
  const VI_LEAP_REG       = 0x20;
  const VI_H_START_REG    = 0x24;
  const VI_V_START_REG    = 0x28;
  const VI_V_BURST_REG    = 0x2C;
  const VI_X_SCALE_REG    = 0x30;
  const VI_Y_SCALE_REG    = 0x34;

  const VI_CONTROL_REG        = VI_STATUS_REG;
  const VI_DRAM_ADDR_REG      = VI_ORIGIN_REG;
  const VI_H_WIDTH_REG        = VI_WIDTH_REG;
  const VI_V_INTR_REG         = VI_INTR_REG;
  const VI_V_CURRENT_LINE_REG = VI_CURRENT_REG;
  const VI_TIMING_REG         = VI_BURST_REG;
  const VI_H_SYNC_LEAP_REG    = VI_LEAP_REG;
  const VI_H_VIDEO_REG        = VI_H_START_REG;
  const VI_V_VIDEO_REG        = VI_V_START_REG;

  // Audio Interface
  const AI_DRAM_ADDR_REG  = 0x00;
  const AI_LEN_REG        = 0x04;
  const AI_CONTROL_REG    = 0x08;
  const AI_STATUS_REG     = 0x0C;
  const AI_DACRATE_REG    = 0x10;
  const AI_BITRATE_REG    = 0x14;

  // Peripheral Interface
  const PI_DRAM_ADDR_REG    = 0x00;
  const PI_CART_ADDR_REG    = 0x04;
  const PI_RD_LEN_REG       = 0x08;
  const PI_WR_LEN_REG       = 0x0C;
  const PI_STATUS_REG       = 0x10;
  const PI_BSD_DOM1_LAT_REG = 0x14;
  const PI_BSD_DOM1_PWD_REG = 0x18;
  const PI_BSD_DOM1_PGS_REG = 0x1C;
  const PI_BSD_DOM1_RLS_REG = 0x20;
  const PI_BSD_DOM2_LAT_REG = 0x24;
  const PI_BSD_DOM2_PWD_REG = 0x28;
  const PI_BSD_DOM2_PGS_REG = 0x2C;
  const PI_BSD_DOM2_RLS_REG = 0x30;

  // Values read from status reg
  const PI_STATUS_DMA_BUSY    = 0x01;
  const PI_STATUS_IO_BUSY     = 0x02;
  const PI_STATUS_DMA_IO_BUSY = 0x03;
  const PI_STATUS_ERROR       = 0x04;

  // Values written to status reg
  const PI_STATUS_RESET     = 0x01;
  const PI_STATUS_CLR_INTR  = 0x02;

  const PI_DOM1_ADDR1   = 0x06000000;
  const PI_DOM1_ADDR2   = 0x10000000;
  const PI_DOM1_ADDR3   = 0x1FD00000;
  const PI_DOM2_ADDR1   = 0x05000000;
  const PI_DOM2_ADDR2   = 0x08000000;

  function isDom1Addr1(address) { return address >= PI_DOM1_ADDR1 && address < PI_DOM2_ADDR2; }
  function isDom1Addr2(address) { return address >= PI_DOM1_ADDR2 && address < 0x1FBFFFFF;    }
  function isDom1Addr3(address) { return address >= PI_DOM1_ADDR3 && address < 0x7FFFFFFF;    }
  function isDom2Addr1(address) { return address >= PI_DOM2_ADDR1 && address < PI_DOM1_ADDR1; }
  function isDom2Addr2(address) { return address >= PI_DOM2_ADDR2 && address < PI_DOM1_ADDR2; }

  // RDRAM Interface
  const RI_MODE_REG             = 0x00;
  const RI_CONFIG_REG           = 0x04;
  const RI_CURRENT_LOAD_REG     = 0x08;
  const RI_SELECT_REG           = 0x0C;
  const RI_REFRESH_REG          = 0x10;
  const RI_COUNT_REG            = RI_REFRESH_REG;
  const RI_LATENCY_REG          = 0x14;
  const RI_RERROR_REG           = 0x18;
  const RI_WERROR_REG           = 0x1C;
  const RI_LAST_REG             = RI_WERROR_REG;

  // Serial Interface
  const SI_DRAM_ADDR_REG      = 0x00;
  const SI_PIF_ADDR_RD64B_REG = 0x04;
  const SI_PIF_ADDR_WR64B_REG = 0x10;
  const SI_STATUS_REG         = 0x18;

  const SI_STATUS_DMA_BUSY    = 0x0001;
  const SI_STATUS_RD_BUSY     = 0x0002;
  const SI_STATUS_DMA_ERROR   = 0x0008;
  const SI_STATUS_INTERRUPT   = 0x1000;

  var running       = false;

  var setMemorySize = false;

  var cur_vbl       = 0;
  var last_vbl      = 0;

  var gRumblePakActive = false;
  var gEnableRumble = false;

  var resetCallbacks = [];

  var rominfo = {
    id:             '',
    name:           '',
    cic:            '6101',
    country:        0x45,
    save:           'Eeprom4k'
  };

  /**
   * An exception thrown when an assert fails.
   * @constructor
   */
  function AssertException(message) {
    this.message = message;
  }

  AssertException.prototype.toString = function () {
    return 'AssertException: ' + this.message;
  };

  function assert(e, m) {
    if (!e) {
      throw new AssertException(m);
    }
  }

  function memoryCopy(dst, dstoff, src, srcoff, len) {
    var i;
    for (i = 0; i < len; ++i) {
      dst.u8[dstoff+i] = src.u8[srcoff+i];
    }
  }

  var rom           = null;   // Will be memory, mapped at 0xb0000000
  var pi_mem        = new MemoryRegion(new ArrayBuffer(0x7c0 + 0x40));   // rom+ram
  var ram           = new MemoryRegion(new ArrayBuffer(8*1024*1024));
  var sp_mem        = new MemoryRegion(new ArrayBuffer(0x2000));
  var sp_reg        = new MemoryRegion(new ArrayBuffer(0x20));
  var sp_ibist_mem  = new MemoryRegion(new ArrayBuffer(0x8));
  var dpc_mem       = new MemoryRegion(new ArrayBuffer(0x20));
  var dps_mem       = new MemoryRegion(new ArrayBuffer(0x10));
  var rdram_reg     = new MemoryRegion(new ArrayBuffer(0x30));
  var mi_reg        = new MemoryRegion(new ArrayBuffer(0x10));
  var vi_reg        = new MemoryRegion(new ArrayBuffer(0x38));
  var ai_reg        = new MemoryRegion(new ArrayBuffer(0x18));
  var pi_reg        = new MemoryRegion(new ArrayBuffer(0x34));
  var ri_reg        = new MemoryRegion(new ArrayBuffer(0x20));
  var si_reg        = new MemoryRegion(new ArrayBuffer(0x1c));

  var eeprom        = null;   // Initialised during reset, using correct size for this rom (may be null if eeprom isn't used)
  var eepromDirty   = false;

  // Keep a DataView around as a view onto the RSP task
  var kTaskOffset   = 0x0fc0;
  var rsp_task_view = new DataView(sp_mem.arrayBuffer, kTaskOffset, 0x40);

  var mapped_mem_handler         = new Device("VMEM",     null,         0x00000000, 0x80000000);
  var rdram_handler_cached       = new Device("RAM",      ram,          0x80000000, 0x80800000);
  var rdram_handler_uncached     = new Device("RAM",      ram,          0xa0000000, 0xa0800000);
  var rdram_reg_handler_uncached = new Device("RDRAMReg", rdram_reg,    0xa3f00000, 0xa4000000);
  var sp_mem_handler_uncached    = new Device("SPMem",    sp_mem,       0xa4000000, 0xa4002000);
  var sp_reg_handler_uncached    = new Device("SPReg",    sp_reg,       0xa4040000, 0xa4040020);
  var sp_ibist_handler_uncached  = new Device("SPIBIST",  sp_ibist_mem, 0xa4080000, 0xa4080008);
  var dpc_handler_uncached       = new Device("DPC",      dpc_mem,      0xa4100000, 0xa4100020);
  var dps_handler_uncached       = new Device("DPS",      dps_mem,      0xa4200000, 0xa4200010);
  var mi_reg_handler_uncached    = new Device("MIReg",    mi_reg,       0xa4300000, 0xa4300010);
  var vi_reg_handler_uncached    = new Device("VIReg",    vi_reg,       0xa4400000, 0xa4400038);
  var ai_reg_handler_uncached    = new Device("AIReg",    ai_reg,       0xa4500000, 0xa4500018);
  var pi_reg_handler_uncached    = new Device("PIReg",    pi_reg,       0xa4600000, 0xa4600034);
  var ri_reg_handler_uncached    = new Device("RIReg",    ri_reg,       0xa4700000, 0xa4700020);
  var si_reg_handler_uncached    = new Device("SIReg",    si_reg,       0xa4800000, 0xa480001c);
  var rom_d2a1_handler_uncached  = new Device("ROMd2a1",  null,         0xa5000000, 0xa6000000);
  var rom_d1a1_handler_uncached  = new Device("ROMd1a1",  rom,          0xa6000000, 0xa8000000);
  var rom_d2a2_handler_uncached  = new Device("ROMd2a2",  null,         0xa8000000, 0xb0000000);
  var rom_d1a2_handler_uncached  = new Device("ROMd1a2",  rom,          0xb0000000, 0xbfc00000);
  var pi_mem_handler_uncached    = new Device("PIRAM",    pi_mem,       0xbfc00000, 0xbfc00800);
  var rom_d1a3_handler_uncached  = new Device("ROMd1a3",  rom,          0xbfd00000, 0xc0000000);


  function fixEndian(arrayBuffer) {
    var dataView = new DataView(arrayBuffer);

    function byteSwap(buffer, i0, i1, i2, i3) {

      var u8 = new Uint8Array(buffer);
      var i;
      for (i = 0; i < u8.length; i += 4) {
        var a = u8[i+i0], b = u8[i+i1], c = u8[i+i2], d = u8[i+i3];
        u8[i  ] = a;
        u8[i+1] = b;
        u8[i+2] = c;
        u8[i+3] = d;
      }
    }

    switch (dataView.getUint32(0)) {
      case 0x80371240:
        // ok
        break;
      case 0x40123780:
        byteSwap(arrayBuffer, 3, 2, 1, 0);
        break;
      case 0x12408037:
        byteSwap(arrayBuffer, 2, 3, 0, 1);
        break;
      case 0x37804012:
        byteSwap(arrayBuffer, 1, 0, 3, 2);
        break;
      default:
        throw 'Unhandled byteswapping: ' + dataView.getUint32(0).toString(16);
    }
  }

  function uint8ArrayReadString(u8array, offset, max_len) {
    var s = '';
    var i;
    for (i = 0; i < max_len; ++i) {
      var c = u8array[offset+i];
      if (c === 0) {
        break;
      }
      s += String.fromCharCode(c);
    }
    return s;
  }

  function byteswap(a) {
    return ((a>>24)&0x000000ff) |
           ((a>> 8)&0x0000ff00) |
           ((a<< 8)&0x00ff0000) |
           ((a<<24)&0xff000000);
  }

  function generateRomId(crclo, crchi) {
    return toHex(byteswap(crclo),32) + toHex(byteswap(crchi),32);
  }

  function generateCICType(u8array)
  {
    var cic = 0;
    var i;
    for (i = 0; i < 0xFC0; i++) {
      cic = cic + u8array[0x40 + i];
    }

    switch (cic) {
      case 0x33a27: return '6101';
      case 0x3421e: return '6101';
      case 0x34044: return '6102';
      case 0x357d0: return '6103';
      case 0x47a81: return '6105';
      case 0x371cc: return '6106';
      case 0x343c9: return '6106';
      default:
        log('Unknown CIC Code ' + toString32$$1(cic) );
        return '6102';
    }
  }

  function loadRom(arrayBuffer) {
    fixEndian(arrayBuffer);

    rom = new MemoryRegion(arrayBuffer);
    rom_d1a1_handler_uncached.setMem(rom);
    rom_d1a2_handler_uncached.setMem(rom);
    rom_d1a3_handler_uncached.setMem(rom);

    var hdr = {
      header:       rom.readU32(0),
      clock:        rom.readU32(4),
      bootAddress:  rom.readU32(8),
      release:      rom.readU32(12),
      crclo:        rom.readU32(16),   // or hi?
      crchi:        rom.readU32(20),   // or lo?
      unk0:         rom.readU32(24),
      unk1:         rom.readU32(28),
      name:         uint8ArrayReadString(rom.u8, 32, 20),
      unk2:         rom.readU32(52),
      unk3:         rom.readU16(56),
      unk4:         rom.readU8 (58),
      manufacturer: rom.readU8 (59),
      cartId:       rom.readU16(60),
      countryId:    rom.readU8 (62),  // char
      unk5:         rom.readU8 (63)
    };


    var $table = $('<table class="register-table"><tbody></tbody></table>');
    var $tb = $table.find('tbody');
    var i;
    for (i in hdr) {
      $tb.append('<tr>' +
        '<td>' + i + '</td><td>' + (typeof hdr[i] === 'string' ? hdr[i] : toString32$$1(hdr[i])) + '</td>' +
        '</tr>');
    }
    logHTML($table);

    // Set up rominfo
    rominfo.cic     = generateCICType(rom.u8);
    rominfo.id      = generateRomId(hdr.crclo, hdr.crchi);
    rominfo.country = hdr.countryId;

    var info = romdb[rominfo.id];
    if (info) {
      log('Loaded info for ' + rominfo.id + ' from db');
      rominfo.name = info.name;
      rominfo.save = info.save;
    } else {
      log('No info for ' + rominfo.id + ' in db');
      rominfo.name = hdr.name;
      rominfo.save = 'Eeprom4k';
    }

    log('rominfo is ' + JSON.stringify(rominfo));

    $('#title').text('n64js - ' + rominfo.name);
  }

  n64js.toggleRun = function () {
    running = !running;
    $('#runbutton').html(running ? '<i class="glyphicon glyphicon-pause"></i> Pause' : '<i class="glyphicon glyphicon-play"></i> Run');
    if (running) {
      updateLoopAnimframe();
    }
  };

  n64js.breakEmulationForDisplayListDebug = function () {
    if (running) {
      n64js.toggleRun();
      n64js.cpu0.breakExecution();
      //updateLoopAnimframe();
    }
  };

  n64js.triggerLoad = function () {
    var $fileinput = $('#fileInput');

    // Reset fileInput value, otherwise onchange doesn't recognise when we select the same rome back-to-back
    $fileinput.val('');
    $fileinput.click();
  };

  n64js.loadFile = function () {
    var f = document.getElementById("fileInput");
    if (f && f.files.length > 0) {
      var file = f.files[0];
      var name = file.fileName;
      var size = file.fileSize;

      var reader = new FileReader();

      reader.onerror = function (e) {
        n64js.displayWarning('error loading file');
      };
      reader.onload = function (e) {
        loadRom(e.target.result);
        n64js.reset();
        n64js.refreshDebugger();
        running = false;
        n64js.toggleRun();
      };

      reader.readAsArrayBuffer(file);
    }
  };

  n64js.step = function () {
    if (!running) {
      n64js.singleStep();
      n64js.refreshDebugger();
    }
  };

  function syncActive() {
    return (syncFlow || syncInput) ? true : false;
  }

  function syncTick(max_count) {
    var kEstimatedBytePerCycle = 8;
    var sync_objects   = [syncFlow, syncInput],
        max_safe_count = max_count,
        count,
        i;

    for (i = 0; i < sync_objects.length; ++i) {
      var s = sync_objects[i];
      if (s) {
        if (!s.tick()) {
          max_safe_count = 0;
        }

        // Guesstimate num bytes used per cycle
        count = Math.floor(s.getAvailableBytes() / kEstimatedBytePerCycle);

        // Ugh - bodgy hacky hacky for input sync
        count = Math.max(0, count - 100);

        max_safe_count = Math.min(max_safe_count, count);
      }
    }

    return max_safe_count;
  }

  function updateLoopAnimframe() {
    if (stats) {
      stats.begin();
    }

    if (running) {
      requestAnimationFrame(updateLoopAnimframe);

      var max_cycles = kCyclesPerUpdate;

      // NB: don't slow down debugger when we're waiting for a display list to be debugged.
      var debugging = $('.debug').is(':visible');
      if (debugging && !n64js.debugDisplayListRequested()) {
        max_cycles = n64js.getDebugCycles();
      }

      if (syncActive()) {
        // Check how many cycles we can safely execute
        var sync_count = syncTick(max_cycles);
        if (sync_count > 0) {
          n64js.run(sync_count);
          n64js.refreshDebugger();
        }
      } else {
        n64js.run(max_cycles);
        n64js.refreshDebugger();
      }

      if (!running) {
        $('#runbutton').html('<i class="glyphicon glyphicon-play"></i> Run');
      }
    } else if (n64js.debugDisplayListRunning()) {
      requestAnimationFrame(updateLoopAnimframe);
      if (n64js.debugDisplayList()) {
        n64js.presentBackBuffer(n64js.getRamU8Array(), n64js.viOrigin());
      }
    }

    if (stats) {
      stats.end();
    }
  }

  n64js.getRamU8Array = function () {
    return rdram_handler_cached.u8;
  };

  n64js.getRamS32Array = function () {
    return rdram_handler_cached.mem.s32;
  };

  n64js.getRamDataView = function () {
    // FIXME: should cache this object, or try to get rid of DataView entirely (Uint8Array + manual shuffling is faster)
    return new DataView(ram.arrayBuffer);
  };

  // This function gets hit A LOT, so eliminate as much fat as possible.
  rdram_handler_cached.readU32 = function (address) {
    var off = address - 0x80000000;
    return ((this.u8[off+0] << 24) | (this.u8[off+1] << 16) | (this.u8[off+2] << 8) | (this.u8[off+3]))>>>0;
  };
  rdram_handler_cached.readS32 = function (address) {
    var off = address - 0x80000000;
    return (this.u8[off+0] << 24) | (this.u8[off+1] << 16) | (this.u8[off+2] << 8) | (this.u8[off+3]);
  };
  rdram_handler_cached.write32 = function (address, value) {
    var off = address - 0x80000000;
    this.u8[off+0] = value >> 24;
    this.u8[off+1] = value >> 16;
    this.u8[off+2] = value >>  8;
    this.u8[off+3] = value;
  };

  mapped_mem_handler.readInternal32 = function (address) {
    var mapped = n64js.cpu0.translateReadInternal(address) & 0x007fffff;
    if (mapped !== 0) {
      if (mapped+4 <= ram.u8.length) {
        return ram.readU32(mapped);
      }
    }
    return 0x00000000;
  };
  mapped_mem_handler.writeInternal32 = function (address, value) {
    var mapped = n64js.cpu0.translateReadInternal(address) & 0x007fffff;
    if (mapped !== 0) {
      if (mapped+4 <= ram.u8.length) {
        ram.write32(mapped, value);
      }
    }
  };

  mapped_mem_handler.readU32 = function (address) {
    var mapped = n64js.cpu0.translateRead(address) & 0x007fffff;
    if (mapped !== 0) {
      return ram.readU32(mapped);
    }
    n64js.halt('virtual readU32 failed - need to throw refill/invalid');
    return 0x00000000;
  };
  mapped_mem_handler.readU16 = function (address) {
    var mapped = n64js.cpu0.translateRead(address) & 0x007fffff;
    if (mapped !== 0) {
      return ram.readU16(mapped);
    }
    n64js.halt('virtual readU16 failed - need to throw refill/invalid');
    return 0x0000;
  };
  mapped_mem_handler.readU8 = function (address) {
    var mapped = n64js.cpu0.translateRead(address) & 0x007fffff;
    if (mapped !== 0) {
      return ram.readU8(mapped);
    }
    n64js.halt('virtual readU8 failed - need to throw refill/invalid');
    return 0x00;
  };

  mapped_mem_handler.readS32 = function (address) {
    var mapped = n64js.cpu0.translateRead(address) & 0x007fffff;
    if (mapped !== 0) {
      return ram.readS32(mapped);
    }
    // FIXME: need to somehow interrupt the current instruction from executing, before it has chance to modify state.
    // For now, goldeneye hits this initially when reading the current instruction. I laemly return 0 so that I execute a NOP and then jump to the exception handler.
    //    n64js.halt('virtual readS32 failed - need to throw refill/invalid');
    return 0x00000000;
  };
  mapped_mem_handler.readS16 = function (address) {
    var mapped = n64js.cpu0.translateRead(address) & 0x007fffff;
    if (mapped !== 0) {
      return ram.readS16(mapped);
    }
    n64js.halt('virtual readS16 failed - need to throw refill/invalid');
    return 0x0000;
  };
  mapped_mem_handler.readS8 = function (address) {
    var mapped = n64js.cpu0.translateRead(address);
    if (mapped !== 0) {
      return ram.readS8(mapped);
    }
    n64js.halt('virtual readS8 failed - need to throw refill/invalid');
    return 0x00;
  };

  mapped_mem_handler.write32 = function (address, value) {
    var mapped = n64js.cpu0.translateWrite(address) & 0x007fffff;
    if (mapped !== 0) {
      ram.write32(mapped, value);
      return;
    }
    n64js.halt('virtual write32 failed - need to throw refill/invalid');
  };
  mapped_mem_handler.write16 = function (address, value) {
    var mapped = n64js.cpu0.translateWrite(address) & 0x007fffff;
    if (mapped !== 0) {
      ram.write16(mapped, value);
      return;
    }
    n64js.halt('virtual write16 failed - need to throw refill/invalid');
  };
  mapped_mem_handler.write8 = function (address, value) {
    var mapped = n64js.cpu0.translateWrite(address) & 0x007fffff;
    if (mapped !== 0) {
      ram.write8(mapped, value);
      return;
    }
    n64js.halt('virtual write8 failed - need to throw refill/invalid');
  };

  rom_d1a1_handler_uncached.write32 = function (address, value) { throw 'Writing to rom d1a1'; };
  rom_d1a1_handler_uncached.write16 = function (address, value) { throw 'Writing to rom d1a1'; };
  rom_d1a1_handler_uncached.write8  = function (address, value) { throw 'Writing to rom d1a1'; };

  rom_d1a2_handler_uncached.write32 = function (address, value) { throw 'Writing to rom d1a2'; };
  rom_d1a2_handler_uncached.write16 = function (address, value) { throw 'Writing to rom d1a2'; };
  rom_d1a2_handler_uncached.write8  = function (address, value) { throw 'Writing to rom d1a2'; };

  rom_d1a3_handler_uncached.write32 = function (address, value) { throw 'Writing to rom d1a3'; };
  rom_d1a3_handler_uncached.write16 = function (address, value) { throw 'Writing to rom d1a3'; };
  rom_d1a3_handler_uncached.write8  = function (address, value) { throw 'Writing to rom d1a3'; };

  // Should read noise?
  function getRandomU32() {
    var hi = Math.floor( Math.random() * 0xffff ) & 0xffff;
    var lo = Math.floor( Math.random() * 0xffff ) & 0xffff;

    var v = (hi<<16) | lo;

    if (syncInput) {
      v = syncInput.reflect32(v);
    }

    return v;
  }

  rom_d2a1_handler_uncached.readU32  = function (address)        { log('reading noise'); return getRandomU32(); };
  rom_d2a1_handler_uncached.readU16  = function (address)        { log('reading noise'); return getRandomU32() & 0xffff; };
  rom_d2a1_handler_uncached.readU8   = function (address)        { log('reading noise'); return getRandomU32() & 0xff; };
  rom_d2a1_handler_uncached.readS32  = function (address)        { log('reading noise'); return getRandomU32(); };
  rom_d2a1_handler_uncached.readS16  = function (address)        { log('reading noise'); return getRandomU32() & 0xffff; };
  rom_d2a1_handler_uncached.readS8   = function (address)        { log('reading noise'); return getRandomU32() & 0xff; };
  rom_d2a1_handler_uncached.write32  = function (address, value) { throw 'Writing to rom'; };
  rom_d2a1_handler_uncached.write16  = function (address, value) { throw 'Writing to rom'; };
  rom_d2a1_handler_uncached.write8   = function (address, value) { throw 'Writing to rom'; };

  rom_d2a2_handler_uncached.readU32  = function (address)        { throw 'Reading from rom d2a2'; };
  rom_d2a2_handler_uncached.readU16  = function (address)        { throw 'Reading from rom d2a2'; };
  rom_d2a2_handler_uncached.readU8   = function (address)        { throw 'Reading from rom d2a2'; };
  rom_d2a2_handler_uncached.readS32  = function (address)        { throw 'Reading from rom d2a2'; };
  rom_d2a2_handler_uncached.readS16  = function (address)        { throw 'Reading from rom d2a2'; };
  rom_d2a2_handler_uncached.readS8   = function (address)        { throw 'Reading from rom d2a2'; };
  rom_d2a2_handler_uncached.write32  = function (address, value) { throw 'Writing to rom'; };
  rom_d2a2_handler_uncached.write16  = function (address, value) { throw 'Writing to rom'; };
  rom_d2a2_handler_uncached.write8   = function (address, value) { throw 'Writing to rom'; };

  rdram_reg_handler_uncached.calcEA  = function (address) {
    return address&0xff;
  };

  function spUpdateStatus(flags) {

    if (!sp_reg_handler_uncached.quiet) {
      if (flags & SP_CLR_HALT)       { log( 'SP: Clearing Halt' ); }
      if (flags & SP_SET_HALT)       { log( 'SP: Setting Halt' ); }
      if (flags & SP_CLR_BROKE)      { log( 'SP: Clearing Broke' ); }
      // No SP_SET_BROKE
      if (flags & SP_CLR_INTR)       { log( 'SP: Clearing Interrupt' ); }
      if (flags & SP_SET_INTR)       { log( 'SP: Setting Interrupt' ); }
      if (flags & SP_CLR_SSTEP)      { log( 'SP: Clearing Single Step' ); }
      if (flags & SP_SET_SSTEP)      { log( 'SP: Setting Single Step' ); }
      if (flags & SP_CLR_INTR_BREAK) { log( 'SP: Clearing Interrupt on break' ); }
      if (flags & SP_SET_INTR_BREAK) { log( 'SP: Setting Interrupt on break' ); }
      if (flags & SP_CLR_SIG0)       { log( 'SP: Clearing Sig0 (Yield)' ); }
      if (flags & SP_SET_SIG0)       { log( 'SP: Setting Sig0 (Yield)' ); }
      if (flags & SP_CLR_SIG1)       { log( 'SP: Clearing Sig1 (Yielded)' ); }
      if (flags & SP_SET_SIG1)       { log( 'SP: Setting Sig1 (Yielded)' ); }
      if (flags & SP_CLR_SIG2)       { log( 'SP: Clearing Sig2 (TaskDone)' ); }
      if (flags & SP_SET_SIG2)       { log( 'SP: Setting Sig2 (TaskDone)' ); }
      if (flags & SP_CLR_SIG3)       { log( 'SP: Clearing Sig3' ); }
      if (flags & SP_SET_SIG3)       { log( 'SP: Setting Sig3' ); }
      if (flags & SP_CLR_SIG4)       { log( 'SP: Clearing Sig4' ); }
      if (flags & SP_SET_SIG4)       { log( 'SP: Setting Sig4' ); }
      if (flags & SP_CLR_SIG5)       { log( 'SP: Clearing Sig5' ); }
      if (flags & SP_SET_SIG5)       { log( 'SP: Setting Sig5' ); }
      if (flags & SP_CLR_SIG6)       { log( 'SP: Clearing Sig6' ); }
      if (flags & SP_SET_SIG6)       { log( 'SP: Setting Sig6' ); }
      if (flags & SP_CLR_SIG7)       { log( 'SP: Clearing Sig7' ); }
      if (flags & SP_SET_SIG7)       { log( 'SP: Setting Sig7' ); }
    }

    var clr_bits = 0;
    var set_bits = 0;

    var start_rsp = false;
    var stop_rsp = false;

    if (flags & SP_CLR_HALT)       { clr_bits |= SP_STATUS_HALT; start_rsp = true; }
    if (flags & SP_SET_HALT)       { set_bits |= SP_STATUS_HALT; stop_rsp  = true; }

    if (flags & SP_SET_INTR)       { mi_reg.setBits32  (MI_INTR_REG, MI_INTR_SP); n64js.cpu0.updateCause3(); }   // Shouldn't ever set this?
    else if (flags & SP_CLR_INTR)  { mi_reg.clearBits32(MI_INTR_REG, MI_INTR_SP); n64js.cpu0.updateCause3(); }

    clr_bits |= (flags & SP_CLR_BROKE) >> 1;
    clr_bits |= (flags & SP_CLR_SSTEP);
    clr_bits |= (flags & SP_CLR_INTR_BREAK) >> 1;
    clr_bits |= (flags & SP_CLR_SIG0) >> 2;
    clr_bits |= (flags & SP_CLR_SIG1) >> 3;
    clr_bits |= (flags & SP_CLR_SIG2) >> 4;
    clr_bits |= (flags & SP_CLR_SIG3) >> 5;
    clr_bits |= (flags & SP_CLR_SIG4) >> 6;
    clr_bits |= (flags & SP_CLR_SIG5) >> 7;
    clr_bits |= (flags & SP_CLR_SIG6) >> 8;
    clr_bits |= (flags & SP_CLR_SIG7) >> 9;

    set_bits |= (flags & SP_SET_SSTEP) >> 1;
    set_bits |= (flags & SP_SET_INTR_BREAK) >> 2;
    set_bits |= (flags & SP_SET_SIG0) >> 3;
    set_bits |= (flags & SP_SET_SIG1) >> 4;
    set_bits |= (flags & SP_SET_SIG2) >> 5;
    set_bits |= (flags & SP_SET_SIG3) >> 6;
    set_bits |= (flags & SP_SET_SIG4) >> 7;
    set_bits |= (flags & SP_SET_SIG5) >> 8;
    set_bits |= (flags & SP_SET_SIG6) >> 9;
    set_bits |= (flags & SP_SET_SIG7) >> 10;

    var status_bits = sp_reg.readU32(SP_STATUS_REG);
    status_bits &= ~clr_bits;
    status_bits |=  set_bits;
    sp_reg.write32(SP_STATUS_REG, status_bits);

    if (start_rsp) {
      n64js.rspProcessTask(rsp_task_view);
    } //else if (stop_rsp) {
      // As we handle all RSP via HLE, nothing to do here.
    //}
  }

  function spCopyFromRDRAM() {
    var sp_mem_address = sp_reg.readU32(SP_MEM_ADDR_REG);
    var rd_ram_address = sp_reg.readU32(SP_DRAM_ADDR_REG);
    var rdlen_reg      = sp_reg.readU32(SP_RD_LEN_REG);
    var splen          = (rdlen_reg & 0xfff) + 1;

    if (!sp_reg_handler_uncached.quiet) {
      log('SP: copying from ram ' + toString32$$1(rd_ram_address) + ' to sp ' + toString16(sp_mem_address) );
    }

    memoryCopy( sp_mem, sp_mem_address & 0xfff, ram, rd_ram_address & 0xffffff, splen );

    sp_reg.setBits32(SP_DMA_BUSY_REG, 0);
    sp_reg.clearBits32(SP_STATUS_REG, SP_STATUS_DMA_BUSY);
  }

  function spCopyToRDRAM() {
    var sp_mem_address = sp_reg.readU32(SP_MEM_ADDR_REG);
    var rd_ram_address = sp_reg.readU32(SP_DRAM_ADDR_REG);
    var wrlen_reg      = sp_reg.readU32(SP_WR_LEN_REG);
    var splen          = (wrlen_reg & 0xfff) + 1;

    if (!sp_reg_handler_uncached.quiet) {
      log('SP: copying from sp ' + toString16(sp_mem_address) + ' to ram ' + toString32$$1(rd_ram_address) );
    }

    memoryCopy( ram, rd_ram_address & 0xffffff, sp_mem, sp_mem_address & 0xfff, splen );

    sp_reg.setBits32(SP_DMA_BUSY_REG, 0);
    sp_reg.clearBits32(SP_STATUS_REG, SP_STATUS_DMA_BUSY);
  }


  sp_reg_handler_uncached.write32 = function (address, value) {
    var ea = this.calcEA(address);
    if (ea+4 > this.u8.length) {
      throw 'Write is out of range';
    }

    switch( ea ) {
      case SP_MEM_ADDR_REG:
      case SP_DRAM_ADDR_REG:
      case SP_SEMAPHORE_REG:
        this.mem.write32(ea, value);
        break;
      case SP_RD_LEN_REG:
        this.mem.write32(ea, value);
        spCopyFromRDRAM();
        break;

      case SP_WR_LEN_REG:
        this.mem.write32(ea, value);
        spCopyToRDRAM();
        break;

      case SP_STATUS_REG:
        spUpdateStatus( value );
        break;

      case SP_DMA_FULL_REG:
      case SP_DMA_BUSY_REG:
        // Prevent writing to read-only mem
        break;

      default:
        log('Unhandled write to SPReg: ' + toString32$$1(value) + ' -> [' + toString32$$1(address) + ']' );
        this.mem.write32(ea, value);
    }
  };

  function dpcUpdateStatus(value)
  {
    var dpc_status  =  dpc_mem.readU32(DPC_STATUS_REG);

    if (value & DPC_CLR_XBUS_DMEM_DMA)      { dpc_status &= ~DPC_STATUS_XBUS_DMEM_DMA; }
    if (value & DPC_SET_XBUS_DMEM_DMA)      { dpc_status |=  DPC_STATUS_XBUS_DMEM_DMA; }
    if (value & DPC_CLR_FREEZE)             { dpc_status &= ~DPC_STATUS_FREEZE; }
    //if (value & DPC_SET_FREEZE)           { dpc_status |=  DPC_STATUS_FREEZE; }  // Thanks Lemmy! <= what's wrong with this? ~ Salvy
    if (value & DPC_CLR_FLUSH)              { dpc_status &= ~DPC_STATUS_FLUSH; }
    if (value & DPC_SET_FLUSH)              { dpc_status |=  DPC_STATUS_FLUSH; }

    // These should be ignored ! - Salvy
    /*
    if (value & DPC_CLR_TMEM_CTR)          { dpc_mem.write32(DPC_TMEM_REG, 0); }
    if (value & DPC_CLR_PIPE_CTR)          { dpc_mem.write32(DPC_PIPEBUSY_REG, 0); }
    if (value & DPC_CLR_CMD_CTR)           { dpc_mem.write32(DPC_BUFBUSY_REG, 0); }
    if (value & DPC_CLR_CLOCK_CTR)         { dpc_mem.write32(DPC_CLOCK_REG, 0); }
    */

    // if (value & DPC_CLR_XBUS_DMEM_DMA)  { logger.log('DPC_CLR_XBUS_DMEM_DMA'); }
    // if (value & DPC_SET_XBUS_DMEM_DMA)  { logger.log('DPC_SET_XBUS_DMEM_DMA'); }
    // if (value & DPC_CLR_FREEZE)         { logger.log('DPC_CLR_FREEZE'); }
    // if (value & DPC_SET_FREEZE)         { logger.log('DPC_SET_FREEZE'); }
    // if (value & DPC_CLR_FLUSH)          { logger.log('DPC_CLR_FLUSH'); }
    // if (value & DPC_SET_FLUSH)          { logger.log('DPC_SET_FLUSH'); }
    // if (value & DPC_CLR_TMEM_CTR)       { logger.log('DPC_CLR_TMEM_CTR'); }
    // if (value & DPC_CLR_PIPE_CTR)       { logger.log('DPC_CLR_PIPE_CTR'); }
    // if (value & DPC_CLR_CMD_CTR)        { logger.log('DPC_CLR_CMD_CTR'); }
    // if (value & DPC_CLR_CLOCK_CTR)      { logger.log('DPC_CLR_CLOCK_CTR'); }

    //logger.log( 'Modified DPC_STATUS_REG - now ' + toString32(dpc_status) );

    dpc_mem.write32(DPC_STATUS_REG, dpc_status);
  }

  dpc_handler_uncached.write32 = function (address, value) {
    var ea = this.calcEA(address);
    if (ea+4 > this.u8.length) {
      throw 'Write is out of range';
    }

    switch( ea ) {
      case DPC_START_REG:
        if (!this.quiet) { log('DPC start set to: ' + toString32$$1(value) ); }
        this.mem.write32(ea, value);
        this.mem.write32(DPC_CURRENT_REG, value);
        break;
      case DPC_END_REG:
        if (!this.quiet) { log('DPC end set to: ' + toString32$$1(value) ); }
        this.mem.write32(ea, value);
        //mi_reg.setBits32(MI_INTR_REG, MI_INTR_DP);
        //n64js.cpu0.updateCause3();
        break;
      case DPC_STATUS_REG:
        //if (!this.quiet) { logger.log('DPC status set to: ' + toString32(value) ); }
        dpcUpdateStatus(value);
        break;

      // Read only
      case DPC_CURRENT_REG:
      case DPC_CLOCK_REG:
      case DPC_BUFBUSY_REG:
      case DPC_PIPEBUSY_REG:
      case DPC_TMEM_REG:
        log('Wrote to read only DPC reg');
        break;

      default:
        this.mem.write32(ea, value);
        break;
    }
  };

  dpc_handler_uncached.readS32 = function (address) {
    this.logRead(address);
    var ea = this.calcEA(address);

    if (ea+4 > this.u8.length) {
      throw 'Read is out of range';
    }
   return this.mem.readS32(ea);
  };

  dpc_handler_uncached.readU32 = function (address) {
    return this.readS32(address)>>>0;
  };



  dps_handler_uncached.write32 = function (address, value) {
    var ea = this.calcEA(address);
    if (ea+4 > this.u8.length) {
      throw 'Write is out of range';
    }
    throw 'DPS writes are unhandled';
    //this.mem.write32(ea, value);
  };

  dps_handler_uncached.readS32 = function (address) {
    this.logRead(address);
    var ea = this.calcEA(address);

    if (ea+4 > this.u8.length) {
      throw 'Read is out of range';
    }
    throw 'DPS reads are unhandled';
    //return this.mem.readS32(ea);
  };

  dps_handler_uncached.readU32 = function (address) {
    return this.readS32(address)>>>0;
  };



  function miWriteModeReg(value) {
    var mi_mode_reg = mi_reg.readU32(MI_MODE_REG);

    if (value & MI_SET_RDRAM)   { mi_mode_reg |=  MI_MODE_RDRAM; }
    if (value & MI_CLR_RDRAM)   { mi_mode_reg &= ~MI_MODE_RDRAM; }

    if (value & MI_SET_INIT)    { mi_mode_reg |=  MI_MODE_INIT; }
    if (value & MI_CLR_INIT)    { mi_mode_reg &= ~MI_MODE_INIT; }

    if (value & MI_SET_EBUS)    { mi_mode_reg |=  MI_MODE_EBUS; }
    if (value & MI_CLR_EBUS)    { mi_mode_reg &= ~MI_MODE_EBUS; }

    mi_reg.write32(MI_MODE_REG, mi_mode_reg);

    if (value & MI_CLR_DP_INTR) {
      mi_reg.clearBits32(MI_INTR_REG, MI_INTR_DP);
      n64js.cpu0.updateCause3();
    }
  }

  function miWriteIntrMaskReg(value) {
    var mi_intr_mask_reg = mi_reg.readU32(MI_INTR_MASK_REG);
    var mi_intr_reg      = mi_reg.readU32(MI_INTR_REG);

    var clr = 0;
    var set = 0;

    // From Corn - nicer way to avoid branching
    clr |= (value & MI_INTR_MASK_CLR_SP) >>> 0;
    clr |= (value & MI_INTR_MASK_CLR_SI) >>> 1;
    clr |= (value & MI_INTR_MASK_CLR_AI) >>> 2;
    clr |= (value & MI_INTR_MASK_CLR_VI) >>> 3;
    clr |= (value & MI_INTR_MASK_CLR_PI) >>> 4;
    clr |= (value & MI_INTR_MASK_CLR_DP) >>> 5;

    set |= (value & MI_INTR_MASK_SET_SP) >>> 1;
    set |= (value & MI_INTR_MASK_SET_SI) >>> 2;
    set |= (value & MI_INTR_MASK_SET_AI) >>> 3;
    set |= (value & MI_INTR_MASK_SET_VI) >>> 4;
    set |= (value & MI_INTR_MASK_SET_PI) >>> 5;
    set |= (value & MI_INTR_MASK_SET_DP) >>> 6;

    mi_intr_mask_reg &= ~clr;
    mi_intr_mask_reg |=  set;

    mi_reg.write32(MI_INTR_MASK_REG, mi_intr_mask_reg);

    // Check if any interrupts are enabled now, and immediately trigger an interrupt
    if (mi_intr_mask_reg & mi_intr_reg) {
      n64js.cpu0.updateCause3();
    }
  }

  mi_reg_handler_uncached.write32 = function (address, value) {
    var ea = this.calcEA(address);
    if (ea+4 > this.u8.length) {
      throw 'Write is out of range';
    }

    switch( ea ) {
      case MI_MODE_REG:
        if (!this.quiet) { log('Wrote to MI mode register: ' + toString32$$1(value) ); }
        miWriteModeReg(value);
        break;
      case MI_INTR_MASK_REG:
        if (!this.quiet) { log('Wrote to MI interrupt mask register: ' + toString32$$1(value) ); }
        miWriteIntrMaskReg(value);
        break;

      case MI_VERSION_REG:
      case MI_INTR_REG:
        // Read only
        break;

      default:
        log('Unhandled write to MIReg: ' + toString32$$1(value) + ' -> [' + toString32$$1(address) + ']' );
        this.mem.write32(ea, value);
        break;
    }
  };


  ai_reg_handler_uncached.write32 = function (address, value) {
    var ea = this.calcEA(address);
    if (ea+4 > this.u8.length) {
      throw 'Write is out of range';
    }

    switch( ea ) {
      case AI_DRAM_ADDR_REG:
      case AI_CONTROL_REG:
      case AI_BITRATE_REG:
        if(!this.quiet) { log('Wrote to AIReg: ' + toString32$$1(value) + ' -> [' + toString32$$1(address) + ']' ); }
        this.mem.write32(ea, value);
        break;

      case AI_LEN_REG:
        if(!this.quiet) { log('AI len changed to ' + value); }
        this.mem.write32(ea, value);
        break;
      case AI_DACRATE_REG:
        if(!this.quiet) { log('AI dacrate changed to ' + value); }
        this.mem.write32(ea, value);
        break;

      case AI_STATUS_REG:
        log('AI interrupt cleared');
        ai_reg.clearBits32(MI_INTR_REG, MI_INTR_AI);
        n64js.cpu0.updateCause3();
        break;

      default:
        log('Unhandled write to AIReg: ' + toString32$$1(value) + ' -> [' + toString32$$1(address) + ']' );
        this.mem.write32(ea, value);
        break;
    }
  };

  vi_reg_handler_uncached.write32 = function (address, value) {
    var ea = this.calcEA(address);
    if (ea+4 > this.u8.length) {
      throw 'Write is out of range';
    }

    switch( ea ) {
      case VI_ORIGIN_REG:
        var last_origin = this.mem.readU32(ea);
        var new_origin = value>>>0;
        if (new_origin !== last_origin/* || cur_vbl !== last_vbl*/) {
          n64js.presentBackBuffer(n64js.getRamU8Array(), new_origin);
          n64js.returnControlToSystem();
          last_vbl = cur_vbl;
        }
        this.mem.write32(ea, value);
        break;
      case VI_CONTROL_REG:
        if (!this.quiet) { log('VI control set to: ' + toString32$$1(value) ); }
        this.mem.write32(ea, value);
        break;
      case VI_WIDTH_REG:
        if (!this.quiet) { log('VI width set to: ' + value ); }
        this.mem.write32(ea, value);
        break;
      case VI_CURRENT_REG:
        if (!this.quiet) { log('VI current set to: ' + toString32$$1(value) + '.' ); }
        if (!this.quiet) { log('VI interrupt cleared'); }
        mi_reg.clearBits32(MI_INTR_REG, MI_INTR_VI);
        n64js.cpu0.updateCause3();
        break;

      default:
        this.mem.write32(ea, value);
        break;
    }
  };

  vi_reg_handler_uncached.readS32 = function (address) {
    this.logRead(address);
    var ea = this.calcEA(address);

    if (ea+4 > this.u8.length) {
      throw 'Read is out of range';
    }
    var value = this.mem.readS32(ea);
    if (ea === VI_CURRENT_REG) {
      value = (value + 2) % 512;
      this.mem.write32(ea, value);
    }
    return value;
  };

  vi_reg_handler_uncached.readU32 = function (address) {
    return this.readS32(address)>>>0;
  };


  pi_reg_handler_uncached.write32 = function (address, value) {
    var ea = this.calcEA(address);
    if (ea+4 > this.u8.length) {
      throw 'Write is out of range';
    }
    switch( ea ) {
      case PI_DRAM_ADDR_REG:
      case PI_CART_ADDR_REG:
        if (!this.quiet) { log('Writing to PIReg: ' + toString32$$1(value) + ' -> [' + toString32$$1(address) + ']' ); }
        this.mem.write32(ea, value);
        break;
      case PI_RD_LEN_REG:
        this.mem.write32(ea, value);
        n64js.halt('PI copy from rdram triggered!');
        break;
      case PI_WR_LEN_REG:
        this.mem.write32(ea, value);
        piCopyToRDRAM();
        break;
      case PI_STATUS_REG:
        if (value & PI_STATUS_RESET) {
          if (!this.quiet) { log('PI_STATUS_REG reset'); }
          this.mem.write32(PI_STATUS_REG, 0);
        }
        if (value & PI_STATUS_CLR_INTR) {
          if (!this.quiet) { log('PI interrupt cleared'); }
          mi_reg.clearBits32(MI_INTR_REG, MI_INTR_PI);
          n64js.cpu0.updateCause3();
        }

        break;
      default:
        log('Unhandled write to PIReg: ' + toString32$$1(value) + ' -> [' + toString32$$1(address) + ']' );
        this.mem.write32(ea, value);
        break;
    }

  };

  function siCopyFromRDRAM() {
    var dram_address = si_reg.readU32(SI_DRAM_ADDR_REG) & 0x1fffffff;
    var pi_ram       = new Uint8Array(pi_mem.arrayBuffer, 0x7c0, 0x040);

    if (!si_reg_handler_uncached.quiet) { log('SI: copying from ' + toString32$$1(dram_address) + ' to PI RAM'); }

    var i;
    for (i = 0; i < 64; ++i) {
      pi_ram[i] = ram.u8[dram_address+i];
    }

    var control_byte = pi_ram[0x3f];
    if (control_byte > 0) {
      if (!si_reg_handler_uncached.quiet) { log('SI: wrote ' + control_byte + ' to the control byte'); }
    }

    si_reg.setBits32(SI_STATUS_REG, SI_STATUS_INTERRUPT);
    mi_reg.setBits32(MI_INTR_REG, MI_INTR_SI);
    n64js.cpu0.updateCause3();
  }

  function siCopyToRDRAM() {

    // Update controller state here
    updateController();

    var dram_address = si_reg.readU32(SI_DRAM_ADDR_REG) & 0x1fffffff;
    var pi_ram       = new Uint8Array(pi_mem.arrayBuffer, 0x7c0, 0x040);

    if (!si_reg_handler_uncached.quiet) { log('SI: copying from PI RAM to ' + toString32$$1(dram_address)); }

    var i;
    for (i = 0; i < 64; ++i) {
      ram.u8[dram_address+i] = pi_ram[i];
    }

    si_reg.setBits32(SI_STATUS_REG, SI_STATUS_INTERRUPT);
    mi_reg.setBits32(MI_INTR_REG, MI_INTR_SI);
    n64js.cpu0.updateCause3();
  }


  const PC_CONTROLLER_0      = 0;
  const PC_CONTROLLER_1      = 1;
  const PC_CONTROLLER_2      = 2;
  const PC_CONTROLLER_3      = 3;
  const PC_EEPROM            = 4;
  const PC_UNKNOWN_1         = 5;
  const NUM_CHANNELS         = 5;

  const CONT_GET_STATUS      = 0x00;
  const CONT_READ_CONTROLLER = 0x01;
  const CONT_READ_MEMPACK    = 0x02;
  const CONT_WRITE_MEMPACK   = 0x03;
  const CONT_READ_EEPROM     = 0x04;
  const CONT_WRITE_EEPROM    = 0x05;
  const CONT_RTC_STATUS      = 0x06;
  const CONT_RTC_READ        = 0x07;
  const CONT_RTC_WRITE       = 0x08;
  const CONT_RESET           = 0xff;

  const CONT_TX_SIZE_CHANSKIP   = 0x00;         // Channel Skip
  const CONT_TX_SIZE_DUMMYDATA  = 0xFF;         // Dummy Data
  const CONT_TX_SIZE_FORMAT_END = 0xFE;         // Format End
  const CONT_TX_SIZE_CHANRESET  = 0xFD;         // Channel Reset

  function updateController() {
    // read controllers
    var pi_ram = new Uint8Array(pi_mem.arrayBuffer, 0x7c0, 0x040);

    var count   = 0;
    var channel = 0;
    while (count < 64) {
      var cmd = pi_ram.subarray(count);

      if (cmd[0] === CONT_TX_SIZE_FORMAT_END) {
        count = 64;
        break;
      }

      if ((cmd[0] === CONT_TX_SIZE_DUMMYDATA) || (cmd[0] === CONT_TX_SIZE_CHANRESET)) {
        count++;
        continue;
      }

      if (cmd[0] === CONT_TX_SIZE_CHANSKIP) {
        count++;
        channel++;
        continue;
      }

      // 0-3: controller channels
      if (channel < PC_EEPROM) {
        // copy controller status
        if (!processController(cmd, channel)) {
          count = 64;
          break;
        }
      } else if (channel === PC_EEPROM) {
        if (!processEeprom(cmd)) {
          count = 64;
          break;
        }
        break;
      } else {
        n64js.halt('Trying to read from invalid controller channel ' + channel + '!');
        return;
      }

      channel++;
      count += cmd[0] + (cmd[1]&0x3f) + 2;
    }

    pi_ram[63] = 0;
  }

  var controllers = [{buttons: 0, stick_x: 0, stick_y: 0, present:true, mempack:true},
                     {buttons: 0, stick_x: 0, stick_y: 0, present:true, mempack:false},
                     {buttons: 0, stick_x: 0, stick_y: 0, present:true, mempack:false},
                     {buttons: 0, stick_x: 0, stick_y: 0, present:true, mempack:false}];

  var mempack_memory = [
    new Uint8Array(0x400 * 32),
    new Uint8Array(0x400 * 32),
    new Uint8Array(0x400 * 32),
    new Uint8Array(0x400 * 32)
  ];

  const kButtonA      = 0x8000;
  const kButtonB      = 0x4000;
  const kButtonZ      = 0x2000;
  const kButtonStart  = 0x1000;
  const kButtonJUp    = 0x0800;
  const kButtonJDown  = 0x0400;
  const kButtonJLeft  = 0x0200;
  const kButtonJRight = 0x0100;

  const kButtonL      = 0x0020;
  const kButtonR      = 0x0010;
  const kButtonCUp    = 0x0008;
  const kButtonCDown  = 0x0004;
  const kButtonCLeft  = 0x0002;
  const kButtonCRight = 0x0001;

  const kKeyLeft      = 37;
  const kKeyUp        = 38;
  const kKeyRight     = 39;
  const kKeyDown      = 40;


  n64js.handleKey = function (key, down) {
    var button = 0;
    switch (key) {
      case 'A'.charCodeAt(0): button = kButtonStart;  break;
      case 'S'.charCodeAt(0): button = kButtonA;      break;
      case 'X'.charCodeAt(0): button = kButtonB;      break;
      case 'Z'.charCodeAt(0): button = kButtonZ;      break;
      case 'Y'.charCodeAt(0): button = kButtonZ;      break;
      case 'C'.charCodeAt(0): button = kButtonL;      break;
      case 'V'.charCodeAt(0): button = kButtonR;      break;

      case 'T'.charCodeAt(0): button = kButtonJUp;    break;
      case 'G'.charCodeAt(0): button = kButtonJDown;  break;
      case 'F'.charCodeAt(0): button = kButtonJLeft;  break;
      case 'H'.charCodeAt(0): button = kButtonJRight; break;

      case 'I'.charCodeAt(0): button = kButtonCUp;    break;
      case 'K'.charCodeAt(0): button = kButtonCDown;  break;
      case 'J'.charCodeAt(0): button = kButtonCLeft;  break;
      case 'L'.charCodeAt(0): button = kButtonCRight; break;

      case kKeyLeft:  controllers[0].stick_x = down ? -80 : 0; break;
      case kKeyRight: controllers[0].stick_x = down ? +80 : 0; break;
      case kKeyDown:  controllers[0].stick_y = down ? -80 : 0; break;
      case kKeyUp:    controllers[0].stick_y = down ? +80 : 0; break;
      //default: logger.log( 'up code:' + event.which);
    }

    if (button) {
      var buttons = controllers[0].buttons;

      if (down) {
        buttons |= button;
      } else {
        buttons &= ~button;
      }
      controllers[0].buttons = buttons;
    }
  };

  function processController(cmd, channel) {
    if (!controllers[channel].present) {
      cmd[1] |= 0x80;
      cmd[3]  = 0xff;
      cmd[4]  = 0xff;
      cmd[5]  = 0xff;
      return true;
    }

    var buttons, stick_x, stick_y;

    switch (cmd[2]) {
      case CONT_RESET:
      case CONT_GET_STATUS:
        cmd[3] = 0x05;
        cmd[4] = 0x00;
        cmd[5] = controllers[channel].mempack ? 0x01 : 0x00;
        break;

      case CONT_READ_CONTROLLER:

        buttons = controllers[channel].buttons;
        stick_x = controllers[channel].stick_x;
        stick_y = controllers[channel].stick_y;

        if (syncInput) {
          syncInput.sync32(0xbeeff00d, 'input');
          buttons = syncInput.reflect32(buttons); // FIXME reflect16
          stick_x = syncInput.reflect32(stick_x); // FIXME reflect8
          stick_y = syncInput.reflect32(stick_y); // FIXME reflect8
        }

        cmd[3] = buttons >>> 8;
        cmd[4] = buttons & 0xff;
        cmd[5] = stick_x;
        cmd[6] = stick_y;
        break;

      case CONT_READ_MEMPACK:
        if (gEnableRumble) {
          commandReadRumblePack(cmd);
        } else {
          commandReadMemPack(cmd, channel);
        }
        return false;
      case CONT_WRITE_MEMPACK:
        if (gEnableRumble) {
          commandWriteRumblePack(cmd);
        } else {
          commandWriteMemPack(cmd, channel);
        }
        return false;
      default:
        n64js.halt('Unknown controller command ' + cmd[2]);
        break;
    }

    return true;
  }

  function processEeprom(cmd) {
    var i, offset;

    switch(cmd[2]) {
    case CONT_RESET:
    case CONT_GET_STATUS:
      cmd[3] = 0x00;
      cmd[4] = 0x80; /// FIXME GetEepromContType();
      cmd[5] = 0x00;
      break;

    case CONT_READ_EEPROM:
      offset = cmd[3]*8;
      log('Reading from eeprom+' + offset);
      for (i = 0; i < 8; ++i) {
        cmd[4+i] = eeprom.u8[offset+i];
      }
      break;

    case CONT_WRITE_EEPROM:
      offset = cmd[3]*8;
      log('Writing to eeprom+' + offset);
      for (i = 0; i < 8; ++i) {
        eeprom.u8[offset+i] = cmd[4+i];
      }
      eepromDirty = true;
      break;

    // RTC credit: Mupen64 source
    //
    case CONT_RTC_STATUS: // RTC status query
        cmd[3] = 0x00;
        cmd[4] = 0x10;
        cmd[5] = 0x00;
      break;

    case CONT_RTC_READ: // read RTC block
      n64js.halt('rtc read unhandled');
      //CommandReadRTC( cmd );
      break;

    case CONT_RTC_WRITE:  // write RTC block
      n64js.halt('rtc write unhandled');
      break;

    default:
      n64js.halt('unknown eeprom command: ' + toString8(cmd[2]));
      break;
    }

    return false;
  }

  function calculateDataCrc(buf, offset) {
    var c = 0, i;
    for (i = 0; i < 32; i++) {
      var s = buf[offset+i];

      c = (((c << 1) | ((s >> 7) & 1))) ^ ((c & 0x80) ? 0x85 : 0);
      c = (((c << 1) | ((s >> 6) & 1))) ^ ((c & 0x80) ? 0x85 : 0);
      c = (((c << 1) | ((s >> 5) & 1))) ^ ((c & 0x80) ? 0x85 : 0);
      c = (((c << 1) | ((s >> 4) & 1))) ^ ((c & 0x80) ? 0x85 : 0);
      c = (((c << 1) | ((s >> 3) & 1))) ^ ((c & 0x80) ? 0x85 : 0);
      c = (((c << 1) | ((s >> 2) & 1))) ^ ((c & 0x80) ? 0x85 : 0);
      c = (((c << 1) | ((s >> 1) & 1))) ^ ((c & 0x80) ? 0x85 : 0);
      c = (((c << 1) | ((s >> 0) & 1))) ^ ((c & 0x80) ? 0x85 : 0);
    }

    for (i = 8; i !== 0; i--) {
      c = (c << 1) ^ ((c & 0x80) ? 0x85 : 0);
    }

    return c;
  }

  function commandReadMemPack(cmd, channel) {
    var addr = ((cmd[3] << 8) | cmd[4]);
    var i;

    if (addr === 0x8001) {
      for (i = 0; i < 32; ++i) {
        cmd[5+i] = 0;
      }
    } else {
      log('Reading from mempack+' + addr);
      addr &= 0xFFE0;

      if (addr <= 0x7FE0) {
        for (i = 0; i < 32; ++i) {
          cmd[5+i] = mempack_memory[channel][addr+i];
        }
      } else {
        // RumblePak
        for (i = 0; i < 32; ++i) {
          cmd[5+i] = 0;
        }
      }
    }

    cmd[37] = calculateDataCrc(cmd, 5);
  }

  function commandWriteMemPack(cmd, channel) {
    var addr = ((cmd[3] << 8) | cmd[4]);
    var i;

    if (addr !== 0x8001) {
      log('Writing to mempack+' + addr);
      addr &= 0xFFE0;

      if (addr <= 0x7FE0) {
        for (i = 0; i < 32; ++i) {
          mempack_memory[channel][addr+i] = cmd[5+i];
        }
      } else {
        // Do nothing, eventually enable rumblepak
      }

    }

    cmd[37] = calculateDataCrc(cmd, 5);
  }

  function commandReadRumblePack(cmd) {
    var addr = ((cmd[3] << 8) | cmd[4]) & 0xFFE0;
    var val = (addr === 0x8000) ? 0x80 : 0x00;
    var i;
    for (i = 0; i < 32; ++i) {
      cmd[5+i] = val;
    }

    cmd[37] = calculateDataCrc(cmd, 5);
  }

  function commandWriteRumblePack(cmd) {
    var addr = ((cmd[3] << 8) | cmd[4]) & 0xFFE0;

    if (addr === 0xC000) {
      gRumblePakActive = cmd[5];
    }

    cmd[37] = calculateDataCrc(cmd, 5);
  }

  function checkSIStatusConsistent() {
    var mi_si_int_set     = mi_reg.getBits32(MI_INTR_REG,   MI_INTR_SI)          !== 0;
    var si_status_int_set = si_reg.getBits32(SI_STATUS_REG, SI_STATUS_INTERRUPT) !== 0;
    if (mi_si_int_set !== si_status_int_set) {
      n64js.halt("SI_STATUS register is in an inconsistent state");
    }
  }
  n64js.checkSIStatusConsistent = checkSIStatusConsistent;

  si_reg_handler_uncached.readS32 = function (address) {
    this.logRead(address);
    var ea = this.calcEA(address);

    if (ea+4 > this.u8.length) {
      throw 'Read is out of range';
    }
    if (ea === SI_STATUS_REG) {
      checkSIStatusConsistent();
    }
    return this.mem.readS32(ea);
  };

  si_reg_handler_uncached.readU32 = function (address) {
    return this.readS32(address)>>>0;
  };

  si_reg_handler_uncached.write32 = function (address, value) {
    var ea = this.calcEA(address);
    if (ea+4 > this.u8.length) {
      throw 'Write is out of range';
    }

    switch( ea ) {
      case SI_DRAM_ADDR_REG:
        if (!this.quiet) { log('Writing to SI dram address reigster: ' + toString32$$1(value) ); }
        this.mem.write32(ea, value);
        break;
      case SI_PIF_ADDR_RD64B_REG:
        this.mem.write32(ea, value);
        siCopyToRDRAM();
        break;
      case SI_PIF_ADDR_WR64B_REG:
        this.mem.write32(ea, value);
        siCopyFromRDRAM();
        break;
      case SI_STATUS_REG:
        if (!this.quiet) { log('SI interrupt cleared'); }
        si_reg.clearBits32(SI_STATUS_REG, SI_STATUS_INTERRUPT);
        mi_reg.clearBits32(MI_INTR_REG,   MI_INTR_SI);
        n64js.cpu0.updateCause3();
        break;
      default:
        log('Unhandled write to SIReg: ' + toString32$$1(value) + ' -> [' + toString32$$1(address) + ']' );
        this.mem.write32(ea, value);
        break;
    }
  };


  function piCopyToRDRAM() {
    var dram_address = pi_reg.readU32(PI_DRAM_ADDR_REG) & 0x00ffffff;
    var cart_address = pi_reg.readU32(PI_CART_ADDR_REG);
    var transfer_len = pi_reg.readU32(PI_WR_LEN_REG) + 1;

    if (!pi_reg_handler_uncached.quiet) { log('PI: copying ' + transfer_len + ' bytes of data from ' + toString32$$1(cart_address) + ' to ' + toString32$$1(dram_address)); }

    if (transfer_len&1) {
      log('PI: Warning - odd address');
      transfer_len++;
    }

    var copy_succeeded = false;

    if (isDom1Addr1(cart_address)) {
      cart_address -= PI_DOM1_ADDR1;
      memoryCopy( ram, dram_address, rom, cart_address, transfer_len );
      n64js.invalidateICacheRange( 0x80000000 | dram_address, transfer_len, 'PI' );
      copy_succeeded = true;
    } else if (isDom1Addr2(cart_address)) {
      cart_address -= PI_DOM1_ADDR2;
      memoryCopy( ram, dram_address, rom, cart_address, transfer_len );
      n64js.invalidateICacheRange( 0x80000000 | dram_address, transfer_len, 'PI' );
      copy_succeeded = true;
    } else if (isDom1Addr3(cart_address)) {
      cart_address -= PI_DOM1_ADDR3;
      memoryCopy( ram, dram_address, rom, cart_address, transfer_len );
      n64js.invalidateICacheRange( 0x80000000 | dram_address, transfer_len, 'PI' );
      copy_succeeded = true;

    } else if (isDom2Addr1(cart_address)) {
      cart_address -= PI_DOM2_ADDR1;
      n64js.halt('PI: dom2addr1 transfer is unhandled (save)');

    } else if (isDom2Addr2(cart_address)) {
      cart_address -= PI_DOM2_ADDR2;
      n64js.halt('PI: dom2addr2 transfer is unhandled (save/flash)');

    } else {
      n64js.halt('PI: unknown cart address: ' + cart_address);
    }

    if (!setMemorySize) {
      var addr = (rominfo.cic === '6105') ? 0x800003F0 : 0x80000318;
      ram.write32(addr - 0x80000000, 8*1024*1024);
      log('Setting memory size');
      setMemorySize = true;
    }

    // If this is the first DMA write the ram size to 0x800003F0 (cic6105) or 0x80000318 (others)
    pi_reg.clearBits32(PI_STATUS_REG, PI_STATUS_DMA_BUSY);
    mi_reg.setBits32(MI_INTR_REG, MI_INTR_PI);
    n64js.cpu0.updateCause3();
  }

  function pifUpdateControl() {
    var pi_rom = new Uint8Array(pi_mem.arrayBuffer, 0x000, 0x7c0);
    var pi_ram = new Uint8Array(pi_mem.arrayBuffer, 0x7c0, 0x040);
    var command = pi_ram[0x3f];
    var i;

    switch (command) {
      case 0x01:
        log('PI: execute block\n');
        break;
      case 0x08:
        log('PI: interrupt control\n');
        pi_ram[0x3f] = 0x00;
        si_reg.setBits32(SI_STATUS_REG, SI_STATUS_INTERRUPT);
        mi_reg.setBits32(MI_INTR_REG,   MI_INTR_SI);
        n64js.cpu0.updateCause3();
        break;
      case 0x10:
        log('PI: clear rom\n');
        for(i = 0; i < pi_rom.length; ++i) {
          pi_rom[i] = 0;
        }
        break;
      case 0x30:
        log('PI: set 0x80 control \n');
        pi_ram[0x3f] = 0x80;
        break;
      case 0xc0:
        log('PI: clear ram\n');
        for(i = 0; i < pi_ram.length; ++i) {
          pi_ram[i] = 0;
        }
        break;
      default:
        n64js.halt('Unkown PI control value: ' + toString8(command));
        break;
    }
  }

  pi_mem_handler_uncached.readS32 = function (address) {
    var ea = this.calcEA(address);

    if (ea+4 > this.u8.length) {
      throw 'Read is out of range';
    }
    var v = this.mem.readS32(ea);

    if (ea < 0x7c0) {
      log('Reading from PIF rom (' + toString32$$1(address) + '). Got ' + toString32$$1(v));
    } else {
      var ram_offset = ea - 0x7c0;
      switch(ram_offset) {
        case 0x24:  log('Reading CIC values: '   + toString32$$1(v)); break;
        case 0x3c:  log('Reading Control byte: ' + toString32$$1(v)); break;
        default:    log('Reading from PI ram ['  + toString32$$1(address) + ']. Got ' + toString32$$1(v));
      }
    }
    return v;
  };

  pi_mem_handler_uncached.readU32 = function (address) {
    return this.readS32(address)>>>0;
  };

  pi_mem_handler_uncached.readS8 = function (address) {
    var ea = this.calcEA(address);

    var v = pi_mem.readU8(ea);

    if (ea < 0x7c0) {
      log('Reading from PIF rom (' + toString32$$1(address) + '). Got ' + toString8(v));
    } else {
      var ram_offset = ea - 0x7c0;
      switch(ram_offset) {
        case 0x24:  log('Reading CIC values: '   + toString8(v)); break;
        case 0x3c:  log('Reading Control byte: ' + toString8(v)); break;
        default:    log('Reading from PI ram ['  + toString32$$1(address) + ']. Got ' + toString8(v));
      }
    }
    return v;
  };

  pi_mem_handler_uncached.readU8 = function (address) {
    return this.mem.readS8(address)>>>0;
  };
  pi_mem_handler_uncached.write32 = function (address, value) {
    var ea = this.calcEA(address);

    if (ea < 0x7c0) {
      log('Attempting to write to PIF ROM');
    } else {
      var ram_offset = ea - 0x7c0;
      this.mem.write32(ea, value);
      switch(ram_offset) {
      case 0x24:  log('Writing CIC values: '   + toString32$$1(value) ); break;
      case 0x3c:  log('Writing Control byte: ' + toString32$$1(value) ); pifUpdateControl(); break;
      default:    log('Writing directly to PI ram [' + toString32$$1(address) + '] <-- ' + toString32$$1(value)); break;
      }
    }
  };

  // We create a memory map of 1<<14 entries, corresponding to the top bits of the address range.
  var memMap = (function () {
    var map = [];
    var i;
    for (i = 0; i < 0x4000; ++i) {
      map.push(undefined);
    }

    [
     mapped_mem_handler,
          rdram_handler_cached,
          rdram_handler_uncached,
         sp_mem_handler_uncached,
         sp_reg_handler_uncached,
       sp_ibist_handler_uncached,
            dpc_handler_uncached,
            dps_handler_uncached,
      rdram_reg_handler_uncached,
         mi_reg_handler_uncached,
         vi_reg_handler_uncached,
         ai_reg_handler_uncached,
         pi_reg_handler_uncached,
         ri_reg_handler_uncached,
         si_reg_handler_uncached,
       rom_d2a1_handler_uncached,
       rom_d2a2_handler_uncached,
       rom_d1a1_handler_uncached,
       rom_d1a2_handler_uncached,
       rom_d1a3_handler_uncached,
         pi_mem_handler_uncached
    ].map(function (e){
        var i;
        var beg = (e.rangeStart)>>>18;
        var end = (e.rangeEnd-1)>>>18;
        for (i = beg; i <= end; ++i) {
          map[i] = e;
        }
    });

    if (map.length !== 0x4000) {
      throw 'initialisation error';
    }

    return map;

  }());

  function getMemoryHandler(address) {
    //assert(address>=0, "Address is negative");
    var handler = memMap[address >>> 18];
    if (handler) {
      return handler;
    }

    log('read from unhandled location ' + toString32$$1(address));
    throw 'unmapped read ' + toString32$$1(address) + ' - need to set exception';
  }

  // Read/Write memory internal is used for stuff like the debugger. It shouldn't ever throw or change the state of the emulated program.
  n64js.readMemoryInternal32 = address => {
    var handler = memMap[address >>> 18];
    if (handler) {
      return handler.readInternal32(address);
    }
    return 0xdddddddd;
  };

  n64js.writeMemoryInternal32 = (address, value) => {
    var handler = memMap[address >>> 18];
    if (handler) {
      handler.writeInternal32(address, value);
    }
  };

  n64js.getInstruction = address => {
    var instruction = n64js.readMemoryInternal32(address);
    if (((instruction>>26)&0x3f) === kOpBreakpoint) {
      instruction = breakpoints[address] || 0;
    }

    return instruction;
  };

  n64js.isBreakpoint = address => {
    var orig_op = n64js.readMemoryInternal32(address);
    return ((orig_op>>26)&0x3f) === kOpBreakpoint;
  };

  n64js.toggleBreakpoint = address => {
    var orig_op = n64js.readMemoryInternal32(address);
    var new_op;

    if (((orig_op>>26)&0x3f) === kOpBreakpoint) {
      // breakpoint is already set
      new_op = breakpoints[address] || 0;
      delete breakpoints[address];
    } else {
      new_op = (kOpBreakpoint<<26);
      breakpoints[address] = orig_op;
    }

    n64js.writeMemoryInternal32(address, new_op);
  };

  // 'emulated' read. May cause exceptions to be thrown in the emulated process
  n64js.readMemoryU32 = address => { return getMemoryHandler(address).readU32(address); };
  n64js.readMemoryU16 = address => { return getMemoryHandler(address).readU16(address); };
  n64js.readMemoryU8  = address => { return getMemoryHandler(address).readU8(address);  };

  n64js.readMemoryS32 = address => { return getMemoryHandler(address).readS32(address); };
  n64js.readMemoryS16 = address => { return getMemoryHandler(address).readS16(address); };
  n64js.readMemoryS8  = address => { return getMemoryHandler(address).readS8(address);  };

  // 'emulated' write. May cause exceptions to be thrown in the emulated process
  n64js.writeMemory32 = (address, value) => { return getMemoryHandler(address).write32(address, value); };
  n64js.writeMemory16 = (address, value) => { return getMemoryHandler(address).write16(address, value); };
  n64js.writeMemory8  = (address, value) => { return getMemoryHandler(address).write8(address, value); };

  var Base64 = {
    lookup : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encodeArray(arr) {
      var t = '';
      var i;
      for (i = 0; i < arr.length; i += 3) {
        var c0 = arr[i+0];
        var c1 = arr[i+1];
        var c2 = arr[i+2];

        // aaaaaabb bbbbcccc ccdddddd
        var a = c0>>>2;
        var b = ((c0 & 3)<<4) | (c1>>>4);
        var c = ((c1 & 15)<<2) | (c2>>>6);
        var d = c2 & 63;

        if (i+1 >= arr.length) {
          c = 64;
        }
        if (i+2 >= arr.length) {
          d = 64;
        }

        t += this.lookup.charAt(a) + this.lookup.charAt(b) + this.lookup.charAt(c) + this.lookup.charAt(d);
      }
      return t;
    },

    decodeArray(str, arr) {
      var outi = 0;

      var i;
      for (i = 0; i < str.length; i += 4) {
        var a = this.lookup.indexOf(str.charAt(i+0));
        var b = this.lookup.indexOf(str.charAt(i+1));
        var c = this.lookup.indexOf(str.charAt(i+2));
        var d = this.lookup.indexOf(str.charAt(i+3));

        var c0 = (a << 2) | (b >>> 4);
        var c1 = ((b & 15) << 4) | (c >>> 2);
        var c2 = ((c & 3) << 6) | d;

        arr[outi++] = c0;
        if (c !== 64) {
          arr[outi++] = c1;
        }
        if (d !== 64) {
          arr[outi++] = c2;
        }
      }
    }
  };

  function getLocalStorageName(item) {
    return item + '-' + rominfo.id;
  }

  n64js.getLocalStorageItem = function(name) {
    var ls_name  = getLocalStorageName(name);
    var data_str = localStorage.getItem(ls_name);
    var data     = data_str ? JSON.parse(data_str) : undefined;
    return data;
  };

  n64js.setLocalStorageItem = function(name, data) {
    var ls_name = getLocalStorageName(name);
    var data_str = JSON.stringify(data);
    localStorage.setItem(ls_name, data_str);
  };

  function initEeprom(size, eeprom_data) {
    var memory = new MemoryRegion(new ArrayBuffer(size));
    if (eeprom_data && eeprom_data.data) {
      Base64.decodeArray(eeprom_data.data, memory.u8);
    }
    return memory;
  }

  function initSaveGame(save_type) {
    eeprom      = null;
    eepromDirty = false;

    if (save_type) {
      switch (save_type) {
        case 'Eeprom4k':
          eeprom = initEeprom(4*1024, n64js.getLocalStorageItem('eeprom'));
          break;
        case 'Eeprom16k':
          eeprom = initEeprom(16*1024, n64js.getLocalStorageItem('eeprom'));
          break;

        default:
          n64js.displayWarning('Unhandled savegame type: ' + save_type + '.');
      }
    }
  }

  function saveEeprom() {
    if (eeprom && eepromDirty) {

      var encoded = Base64.encodeArray(eeprom.u8);

      // Store the name and id so that we can provide some kind of save management in the future
      var d = {
        name: rominfo.name,
        id:   rominfo.id,
        data: encoded
      };

      n64js.setLocalStorageItem('eeprom', d);
      eepromDirty = false;
    }
  }

  //
  // Performance
  //
  var startTime;
  var lastPresentTime;
  var frameTimeSeries;

  n64js.emitRunningTime  = function (msg) {
    var cur_time = new Date();
    n64js.displayWarning('Time to ' + msg + ' ' + (cur_time.getTime() - startTime.getTime()).toString());
  };

  function setFrameTime(t) {
    var title_text;
    if (rominfo.name)
      title_text = 'n64js - ' + rominfo.name + ' - ' + t + 'mspf';
    else
      title_text = 'n64js - ' + t + 'mspf';

    $('#title').text(title_text);
  }

  n64js.onPresent = function () {
    var cur_time = new Date();
    if (lastPresentTime) {
      var t = cur_time.getTime() - lastPresentTime.getTime();
      setFrameTime(t);
    }

    lastPresentTime = cur_time;
  };

  n64js.addResetCallback = function (fn) {
    resetCallbacks.push(fn);
  };

  n64js.reset = function () {
    var country  = rominfo.country;
    var cic_chip = rominfo.cic;

    breakpoints = {};

    initSync();

    setMemorySize = false;

    initSaveGame(rominfo.save);

    // NB: don't set eeprom to 0 - we handle this in initSaveGame
    var memory_regions = [ pi_mem, ram, sp_mem, sp_reg, sp_ibist_mem, rdram_reg, mi_reg, vi_reg, ai_reg, pi_reg, ri_reg, si_reg ];
    var i;
    for (i = 0; i < memory_regions.length; ++i) {
      memory_regions[i].clear();
    }

    n64js.cpu0.reset();
    n64js.cpu1.reset();

    n64js.resetRenderer();

    mi_reg.write32(MI_VERSION_REG, 0x02020102);
    ri_reg.write32(RI_SELECT_REG, 1);           // This skips most of init

    // Simulate boot

    if (rom) {
      memoryCopy( sp_mem, kBootstrapOffset, rom, kBootstrapOffset, kGameOffset - kBootstrapOffset );
    }

    var cpu0 = n64js.cpu0;

    function setGPR(reg, hi, lo) {
      cpu0.gprHi[reg] = hi;
      cpu0.gprLo[reg] = lo;
    }

    cpu0.control[cpu0.kControlSR]       = 0x34000000;
    cpu0.control[cpu0.kControlConfig]   = 0x0006E463;
    cpu0.control[cpu0.kControlCount]    = 0x5000;
    cpu0.control[cpu0.kControlCause]    = 0x0000005c;
    cpu0.control[cpu0.kControlContext]  = 0x007FFFF0;
    cpu0.control[cpu0.kControlEPC]      = 0xFFFFFFFF;
    cpu0.control[cpu0.kControlBadVAddr] = 0xFFFFFFFF;
    cpu0.control[cpu0.kControlErrorEPC] = 0xFFFFFFFF;

    setGPR(0, 0x00000000, 0x00000000);
    setGPR(6, 0xFFFFFFFF, 0xA4001F0C);
    setGPR(7, 0xFFFFFFFF, 0xA4001F08);
    setGPR(8, 0x00000000, 0x000000C0);
    setGPR(9, 0x00000000, 0x00000000);
    setGPR(10, 0x00000000, 0x00000040);
    setGPR(11, 0xFFFFFFFF, 0xA4000040);
    setGPR(16, 0x00000000, 0x00000000);
    setGPR(17, 0x00000000, 0x00000000);
    setGPR(18, 0x00000000, 0x00000000);
    setGPR(19, 0x00000000, 0x00000000);
    setGPR(21, 0x00000000, 0x00000000);
    setGPR(26, 0x00000000, 0x00000000);
    setGPR(27, 0x00000000, 0x00000000);
    setGPR(28, 0x00000000, 0x00000000);
    setGPR(29, 0xFFFFFFFF, 0xA4001FF0);
    setGPR(30, 0x00000000, 0x00000000);

    switch (country) {
      case 0x44: //Germany
      case 0x46: //french
      case 0x49: //Italian
      case 0x50: //Europe
      case 0x53: //Spanish
      case 0x55: //Australia
      case 0x58: // ????
      case 0x59: // X (PAL)
        switch (cic_chip) {
          case '6102':
            setGPR(5, 0xFFFFFFFF, 0xC0F1D859);
            setGPR(14, 0x00000000, 0x2DE108EA);
            setGPR(24, 0x00000000, 0x00000000);
            break;
          case '6103':
            setGPR(5, 0xFFFFFFFF, 0xD4646273);
            setGPR(14, 0x00000000, 0x1AF99984);
            setGPR(24, 0x00000000, 0x00000000);
            break;
          case '6105':
            //*(u32 *)&pIMemBase[0x04] = 0xBDA807FC;
            setGPR(5, 0xFFFFFFFF, 0xDECAAAD1);
            setGPR(14, 0x00000000, 0x0CF85C13);
            setGPR(24, 0x00000000, 0x00000002);
            break;
          case '6106':
            setGPR(5, 0xFFFFFFFF, 0xB04DC903);
            setGPR(14, 0x00000000, 0x1AF99984);
            setGPR(24, 0x00000000, 0x00000002);
            break;
          default:
            break;
        }

        setGPR(20, 0x00000000, 0x00000000);
        setGPR(23, 0x00000000, 0x00000006);
        setGPR(31, 0xFFFFFFFF, 0xA4001554);
        break;
      case 0x37: // 7 (Beta)
      case 0x41: // ????
      case 0x45: //USA
      case 0x4A: //Japan
      default:
        switch (cic_chip) {
          case '6102':
            setGPR(5, 0xFFFFFFFF, 0xC95973D5);
            setGPR(14, 0x00000000, 0x2449A366);
            break;
          case '6103':
            setGPR(5, 0xFFFFFFFF, 0x95315A28);
            setGPR(14, 0x00000000, 0x5BACA1DF);
            break;
          case '6105':
            //*(u32  *)&pIMemBase[0x04] = 0x8DA807FC;
            setGPR(5, 0x00000000, 0x5493FB9A);
            setGPR(14, 0xFFFFFFFF, 0xC2C20384);
            break;
          case '6106':
            setGPR(5, 0xFFFFFFFF, 0xE067221F);
            setGPR(14, 0x00000000, 0x5CD2B70F);
            break;
          default:
            break;
        }
        setGPR(20, 0x00000000, 0x00000001);
        setGPR(23, 0x00000000, 0x00000000);
        setGPR(24, 0x00000000, 0x00000003);
        setGPR(31, 0xFFFFFFFF, 0xA4001550);
    }


    switch (cic_chip) {
      case '6101':
        setGPR(22, 0x00000000, 0x0000003F);
        break;
      case '6102':
        setGPR(1, 0x00000000, 0x00000001);
        setGPR(2, 0x00000000, 0x0EBDA536);
        setGPR(3, 0x00000000, 0x0EBDA536);
        setGPR(4, 0x00000000, 0x0000A536);
        setGPR(12, 0xFFFFFFFF, 0xED10D0B3);
        setGPR(13, 0x00000000, 0x1402A4CC);
        setGPR(15, 0x00000000, 0x3103E121);
        setGPR(22, 0x00000000, 0x0000003F);
        setGPR(25, 0xFFFFFFFF, 0x9DEBB54F);
        break;
      case '6103':
        setGPR(1, 0x00000000, 0x00000001);
        setGPR(2, 0x00000000, 0x49A5EE96);
        setGPR(3, 0x00000000, 0x49A5EE96);
        setGPR(4, 0x00000000, 0x0000EE96);
        setGPR(12, 0xFFFFFFFF, 0xCE9DFBF7);
        setGPR(13, 0xFFFFFFFF, 0xCE9DFBF7);
        setGPR(15, 0x00000000, 0x18B63D28);
        setGPR(22, 0x00000000, 0x00000078);
        setGPR(25, 0xFFFFFFFF, 0x825B21C9);
        break;
      case '6105':
        //*(u32  *)&pIMemBase[0x00] = 0x3C0DBFC0;
        //*(u32  *)&pIMemBase[0x08] = 0x25AD07C0;
        //*(u32  *)&pIMemBase[0x0C] = 0x31080080;
        //*(u32  *)&pIMemBase[0x10] = 0x5500FFFC;
        //*(u32  *)&pIMemBase[0x14] = 0x3C0DBFC0;
        //*(u32  *)&pIMemBase[0x18] = 0x8DA80024;
        //*(u32  *)&pIMemBase[0x1C] = 0x3C0BB000;
        setGPR(1, 0x00000000, 0x00000000);
        setGPR(2, 0xFFFFFFFF, 0xF58B0FBF);
        setGPR(3, 0xFFFFFFFF, 0xF58B0FBF);
        setGPR(4, 0x00000000, 0x00000FBF);
        setGPR(12, 0xFFFFFFFF, 0x9651F81E);
        setGPR(13, 0x00000000, 0x2D42AAC5);
        setGPR(15, 0x00000000, 0x56584D60);
        setGPR(22, 0x00000000, 0x00000091);
        setGPR(25, 0xFFFFFFFF, 0xCDCE565F);
        break;
      case '6106':
        setGPR(1, 0x00000000, 0x00000000);
        setGPR(2, 0xFFFFFFFF, 0xA95930A4);
        setGPR(3, 0xFFFFFFFF, 0xA95930A4);
        setGPR(4, 0x00000000, 0x000030A4);
        setGPR(12, 0xFFFFFFFF, 0xBCB59510);
        setGPR(13, 0xFFFFFFFF, 0xBCB59510);
        setGPR(15, 0x00000000, 0x7A3C07F4);
        setGPR(22, 0x00000000, 0x00000085);
        setGPR(25, 0x00000000, 0x465E3F72);
        break;
      default:
        break;
    }

    cpu0.pc = 0xA4000040;

    startTime = new Date();
    lastPresentTime = undefined;

    for (i = 0; i < resetCallbacks.length; ++i) {
      resetCallbacks[i]();
    }
  };


  n64js.verticalBlank = function () {
    // FIXME: framerate limit etc

    saveEeprom();

    mi_reg.setBits32(MI_INTR_REG, MI_INTR_VI);
    n64js.cpu0.updateCause3();

    ++cur_vbl;
  };

  n64js.miInterruptsUnmasked = function () {
    return (mi_reg.readU32(MI_INTR_MASK_REG) & mi_reg.readU32(MI_INTR_REG)) !== 0;
  };

  n64js.miIntrReg = function () {
    return mi_reg.readU32(MI_INTR_REG);
  };

  n64js.miIntrMaskReg = function () {
    return mi_reg.readU32(MI_INTR_MASK_REG);
  };

  n64js.viOrigin = function () { return vi_reg.readU32(VI_ORIGIN_REG); };
  n64js.viWidth  = function () { return vi_reg.readU32(VI_WIDTH_REG); };
  n64js.viXScale = function () { return vi_reg.readU32(VI_X_SCALE_REG); };
  n64js.viYScale = function () { return vi_reg.readU32(VI_Y_SCALE_REG); };
  n64js.viHStart = function () { return vi_reg.readU32(VI_H_START_REG); };
  n64js.viVStart = function () { return vi_reg.readU32(VI_V_START_REG); };

  n64js.haltSP = function () {
    var status = sp_reg.setBits32(SP_STATUS_REG, SP_STATUS_TASKDONE|SP_STATUS_BROKE|SP_STATUS_HALT);
    if (status & SP_STATUS_INTR_BREAK) {
      mi_reg.setBits32(MI_INTR_REG, MI_INTR_SP);
      n64js.cpu0.updateCause3();
    }
  };

  n64js.interruptDP = function () {
    mi_reg.setBits32(MI_INTR_REG, MI_INTR_DP);
    n64js.cpu0.updateCause3();
  };

  n64js.assert = assert;

  n64js.check = function (e, m) {
    if (!e) {
      log(m);
    }
  };

  n64js.warn = function (m) {
    log(m);
  };

  n64js.stopForBreakpoint = function () {
    running = false;
    n64js.cpu0.breakExecution();
    log('<span style="color:red">Breakpoint</span>');
  };

  n64js.halt = function (msg) {
    running = false;
    n64js.cpu0.breakExecution();
    log('<span style="color:red">' + msg + '</span>');

    n64js.displayError(msg);
  };

  n64js.displayWarning = function (message) {
    var $alert = $('<div class="alert"><button class="close" data-dismiss="alert">×</button><strong>Warning!</strong> ' + message + '</div>');
    $('#alerts').append($alert);
  };
  n64js.displayError = function (message) {
    var $alert = $('<div class="alert alert-error"><button class="close" data-dismiss="alert">×</button><strong>Error!</strong> ' + message + '</div>');
    $('#alerts').append($alert);
  };

  // Similar to halt, but just relinquishes control to the system
  n64js.returnControlToSystem = function () {
    n64js.cpu0.breakExecution();
  };

  n64js.init = function () {
    rdram_handler_cached.quiet      = true;
    rdram_handler_uncached.quiet    = true;
    sp_mem_handler_uncached.quiet   = true;
    sp_reg_handler_uncached.quiet   = true;
    sp_ibist_handler_uncached.quiet = true;
    mi_reg_handler_uncached.quiet   = true;
    vi_reg_handler_uncached.quiet   = true;
    ai_reg_handler_uncached.quiet   = true;
    pi_reg_handler_uncached.quiet   = true;
    si_reg_handler_uncached.quiet   = true;
    rom_d1a2_handler_uncached.quiet = true;
    dpc_handler_uncached.quiet      = true;

    n64js.reset();

    $('.debug').hide();

    n64js.initialiseDebugger();

    n64js.initialiseRenderer($('#display'));

    $('body').keyup(function (event) {
      n64js.handleKey(event.which, false);
    });
    $('body').keydown(function (event) {
      n64js.handleKey(event.which, true);
    });
    // $('body').keypress(function (event) {
    //   switch (event.which) {
    //     case 'o'.charCodeAt(0): $('#output-tab').tab('show'); break;
    //     case 'd'.charCodeAt(0): $( '#debug-tab').tab('show'); break;
    //     case 'm'.charCodeAt(0): $('#memory-tab').tab('show'); break;
    //     case 'l'.charCodeAt(0): n64js.triggerLoad();          break;
    //     case 'g'.charCodeAt(0): n64js.toggleRun();            break;
    //     case 's'.charCodeAt(0): n64js.step();                 break;
    //   }
    // });

    // Make sure that the tabs refresh when clicked
    $('.tabbable a').on('shown', function (e) {
      n64js.refreshDebugger();
    });

    n64js.refreshDebugger();
  };

  n64js.togglePerformance = function () {
    if (stats) {
      $('#performance').html('');
      stats = null;
    } else {
      stats = new Stats();
      stats.setMode(1); // 0: fps, 1: ms

      // Align top-left
      stats.domElement.style.position = 'relative';
      stats.domElement.style.left = '8px';
      stats.domElement.style.top = '0px';

      //document.body.appendChild( stats.domElement );
      $('#performance').append(stats.domElement);
    }
  };

}(window.n64js = window.n64js || {}));
