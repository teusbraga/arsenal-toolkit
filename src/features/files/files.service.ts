export interface FileHashes {
  sha256: string;
  sha1: string;
  sha512: string;
  md5: string;
}

export class FilesService {
  
  static formatBytes(bytes: number, decimals = 2): string {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  static bufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  static async computeHashes(file: File): Promise<FileHashes> {
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // SubtleCrypto for SHA-1, SHA-256, SHA-512
    const [sha1Buf, sha256Buf, sha512Buf] = await Promise.all([
      crypto.subtle.digest('SHA-1', arrayBuffer),
      crypto.subtle.digest('SHA-256', arrayBuffer),
      crypto.subtle.digest('SHA-512', arrayBuffer)
    ]);

    const md5Str = this.calculateMd5(uint8);

    return {
      sha256: this.bufferToHex(sha256Buf),
      sha1: this.bufferToHex(sha1Buf),
      sha512: this.bufferToHex(sha512Buf),
      md5: md5Str
    };
  }

  // RFC 1321 MD5 Implementation
  static calculateMd5(bytes: Uint8Array): string {
    function safeAdd(x: number, y: number): number {
      const lsw = (x & 0xffff) + (y & 0xffff);
      const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xffff);
    }

    function bitRotateLeft(num: number, cnt: number): number {
      return (num << cnt) | (num >>> (32 - cnt));
    }

    function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
      return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
    }
    function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return md5cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return md5cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return md5cmn(c ^ (b | ~d), a, b, x, s, t);
    }

    const n = bytes.length;
    const words: number[] = [];
    for (let i = 0; i < n; i++) {
      words[i >> 2] = (words[i >> 2] || 0) | (bytes[i] << ((i % 4) * 8));
    }
    words[n >> 2] = (words[n >> 2] || 0) | (0x80 << ((n % 4) * 8));
    const wordCount = (((n + 8) >> 6) + 1) * 16;
    for (let i = (n >> 2) + 1; i < wordCount; i++) {
      words[i] = 0;
    }
    words[wordCount - 2] = (n * 8) & 0xffffffff;
    words[wordCount - 1] = Math.floor((n * 8) / 0x100000000);

    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;

    for (let i = 0; i < wordCount; i += 16) {
      const olda = a, oldb = b, oldc = c, oldd = d;

      a = md5ff(a, b, c, d, words[i] || 0, 7, -680876936);
      d = md5ff(d, a, b, c, words[i + 1] || 0, 12, -389564586);
      c = md5ff(c, d, a, b, words[i + 2] || 0, 17, 606105819);
      b = md5ff(b, c, d, a, words[i + 3] || 0, 22, -1044525330);
      a = md5ff(a, b, c, d, words[i + 4] || 0, 7, -176418897);
      d = md5ff(d, a, b, c, words[i + 5] || 0, 12, 1200080426);
      c = md5ff(c, d, a, b, words[i + 6] || 0, 17, -1473231341);
      b = md5ff(b, c, d, a, words[i + 7] || 0, 22, -45705983);
      a = md5ff(a, b, c, d, words[i + 8] || 0, 7, 1770035416);
      d = md5ff(d, a, b, c, words[i + 9] || 0, 12, -1958414417);
      c = md5ff(c, d, a, b, words[i + 10] || 0, 17, -42063);
      b = md5ff(b, c, d, a, words[i + 11] || 0, 22, -1990404162);
      a = md5ff(a, b, c, d, words[i + 12] || 0, 7, 1804603682);
      d = md5ff(d, a, b, c, words[i + 13] || 0, 12, -40341101);
      c = md5ff(c, d, a, b, words[i + 14] || 0, 17, -1502002290);
      b = md5ff(b, c, d, a, words[i + 15] || 0, 22, 1236535329);

      a = md5gg(a, b, c, d, words[i + 1] || 0, 5, -165796510);
      d = md5gg(d, a, b, c, words[i + 6] || 0, 9, -1069501632);
      c = md5gg(c, d, a, b, words[i + 11] || 0, 14, 643717713);
      b = md5gg(b, c, d, a, words[i] || 0, 20, -373897302);
      a = md5gg(a, b, c, d, words[i + 5] || 0, 5, -701558691);
      d = md5gg(d, a, b, c, words[i + 10] || 0, 9, 38016083);
      c = md5gg(c, d, a, b, words[i + 15] || 0, 14, -660478335);
      b = md5gg(b, c, d, a, words[i + 4] || 0, 20, -405537848);
      a = md5gg(a, b, c, d, words[i + 9] || 0, 5, 568446438);
      d = md5gg(d, a, b, c, words[i + 14] || 0, 9, -1019803690);
      c = md5gg(c, d, a, b, words[i + 3] || 0, 14, -187363961);
      b = md5gg(b, c, d, a, words[i + 8] || 0, 20, 1163531501);
      a = md5gg(a, b, c, d, words[i + 13] || 0, 5, -1444681467);
      d = md5gg(d, a, b, c, words[i + 2] || 0, 9, -51403784);
      c = md5gg(c, d, a, b, words[i + 7] || 0, 14, 1735328473);
      b = md5gg(b, c, d, a, words[i + 12] || 0, 20, -1926607734);

      a = md5hh(a, b, c, d, words[i + 5] || 0, 4, -378558);
      d = md5hh(d, a, b, c, words[i + 8] || 0, 11, -2022574463);
      c = md5hh(c, d, a, b, words[i + 11] || 0, 16, 1839030562);
      b = md5hh(b, c, d, a, words[i + 14] || 0, 23, -35309556);
      a = md5hh(a, b, c, d, words[i + 1] || 0, 4, -1530992060);
      d = md5hh(d, a, b, c, words[i + 4] || 0, 11, 1272893353);
      c = md5hh(c, d, a, b, words[i + 7] || 0, 16, -155497632);
      b = md5hh(b, c, d, a, words[i + 10] || 0, 23, -1094730640);
      a = md5hh(a, b, c, d, words[i + 13] || 0, 4, 681279174);
      d = md5hh(d, a, b, c, words[i] || 0, 11, -358537222);
      c = md5hh(c, d, a, b, words[i + 3] || 0, 16, -722521979);
      b = md5hh(b, c, d, a, words[i + 6] || 0, 23, 76029189);
      a = md5hh(a, b, c, d, words[i + 9] || 0, 4, -640364487);
      d = md5hh(d, a, b, c, words[i + 12] || 0, 11, -421815835);
      c = md5hh(c, d, a, b, words[i + 15] || 0, 16, 530742520);
      b = md5hh(b, c, d, a, words[i + 2] || 0, 23, -995338651);

      a = md5ii(a, b, c, d, words[i] || 0, 6, -198630844);
      d = md5ii(d, a, b, c, words[i + 7] || 0, 10, 1126891415);
      c = md5ii(c, d, a, b, words[i + 14] || 0, 15, -1416354905);
      b = md5ii(b, c, d, a, words[i + 5] || 0, 21, -57434055);
      a = md5ii(a, b, c, d, words[i + 12] || 0, 6, 1700485571);
      d = md5ii(d, a, b, c, words[i + 3] || 0, 10, -1894986606);
      c = md5ii(c, d, a, b, words[i + 10] || 0, 15, -1051523);
      b = md5ii(b, c, d, a, words[i + 1] || 0, 21, -2054922799);
      a = md5ii(a, b, c, d, words[i + 8] || 0, 6, 1873313359);
      d = md5ii(d, a, b, c, words[i + 15] || 0, 10, -30611744);
      c = md5ii(c, d, a, b, words[i + 6] || 0, 15, -1560198380);
      b = md5ii(b, c, d, a, words[i + 13] || 0, 21, 1309151649);
      a = md5ii(a, b, c, d, words[i + 4] || 0, 6, -145523070);
      d = md5ii(d, a, b, c, words[i + 11] || 0, 10, -1120210379);
      c = md5ii(c, d, a, b, words[i + 2] || 0, 15, 718787259);
      b = md5ii(b, c, d, a, words[i + 9] || 0, 21, -343485551);

      a = safeAdd(a, olda);
      b = safeAdd(b, oldb);
      c = safeAdd(c, oldc);
      d = safeAdd(d, oldd);
    }

    function rhex(num: number): string {
      let str = '';
      for (let j = 0; j <= 3; j++) {
        str += ((num >> (j * 8 + 4)) & 0x0f).toString(16) + ((num >> (j * 8)) & 0x0f).toString(16);
      }
      return str;
    }

    return (rhex(a) + rhex(b) + rhex(c) + rhex(d)).toLowerCase();
  }

  // Shannon Entropy: 0 to 8
  static calculateEntropy(bytes: Uint8Array): number {
    if (bytes.length === 0) return 0;
    const freq = new Array(256).fill(0);
    for (let i = 0; i < bytes.length; i++) {
      freq[bytes[i]]++;
    }
    let entropy = 0;
    const len = bytes.length;
    for (let i = 0; i < 256; i++) {
      if (freq[i] > 0) {
        const p = freq[i] / len;
        entropy -= p * Math.log2(p);
      }
    }
    return parseFloat(entropy.toFixed(2));
  }

  // Hex Dump (rows of 16 bytes: offset | hex | ascii)
  static generateHexDump(bytes: Uint8Array, maxBytes = 512): Array<{ offset: string; hex: string; ascii: string }> {
    const limit = Math.min(bytes.length, maxBytes);
    const rows: Array<{ offset: string; hex: string; ascii: string }> = [];

    for (let i = 0; i < limit; i += 16) {
      const chunk = bytes.subarray(i, Math.min(i + 16, limit));
      const offset = i.toString(16).padStart(8, '0').toUpperCase();

      let hexParts: string[] = [];
      let ascii = '';

      for (let j = 0; j < 16; j++) {
        if (j < chunk.length) {
          const byte = chunk[j];
          hexParts.push(byte.toString(16).padStart(2, '0').toUpperCase());
          // Printable ascii between 32 and 126
          ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
        } else {
          hexParts.push('  ');
        }
      }

      // Format with gap after 8 bytes for readability
      const hex = hexParts.slice(0, 8).join(' ') + '  ' + hexParts.slice(8).join(' ');

      rows.push({ offset, hex, ascii });
    }

    return rows;
  }

  // Magic Numbers / Header Signature Detection
  static detectSignature(headerBytes: Uint8Array, fileName: string): {
    detectedExt: string;
    detectedMime: string;
    description: string;
    category: string;
    isMismatch: boolean;
  } {
    const b = headerBytes;
    const len = b.length;

    let detectedExt = 'desconhecido';
    let detectedMime = 'application/octet-stream';
    let description = 'Tipo binário ou desconhecido';
    let category = 'Binário';

    if (len >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) {
      detectedExt = 'pdf';
      detectedMime = 'application/pdf';
      description = 'Documento Adobe PDF (%PDF)';
      category = 'Documento';
    } else if (len >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 && b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A) {
      detectedExt = 'png';
      detectedMime = 'image/png';
      description = 'Imagem PNG (Portable Network Graphics)';
      category = 'Imagem';
    } else if (len >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) {
      detectedExt = 'jpg';
      detectedMime = 'image/jpeg';
      description = 'Imagem JPEG / JPG (JFIF/EXIF)';
      category = 'Imagem';
    } else if (len >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) {
      detectedExt = 'gif';
      detectedMime = 'image/gif';
      description = 'Imagem Animada GIF (GIF87a/GIF89a)';
      category = 'Imagem';
    } else if (len >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
      detectedExt = 'webp';
      detectedMime = 'image/webp';
      description = 'Imagem Google WebP (RIFF/WEBP)';
      category = 'Imagem';
    } else if (len >= 4 && b[0] === 0x50 && b[1] === 0x4B && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07) && (b[3] === 0x04 || b[3] === 0x06 || b[3] === 0x08)) {
      detectedExt = 'zip';
      detectedMime = 'application/zip';
      description = 'Arquivo Compactado ZIP / Pacote Office OpenXML (DOCX, XLSX)';
      category = 'Compactado';
    } else if (len >= 6 && b[0] === 0x52 && b[1] === 0x61 && b[2] === 0x72 && b[3] === 0x21 && b[4] === 0x1A && b[5] === 0x07) {
      detectedExt = 'rar';
      detectedMime = 'application/vnd.rar';
      description = 'Arquivo Compactado WinRAR';
      category = 'Compactado';
    } else if (len >= 6 && b[0] === 0x37 && b[1] === 0x7A && b[2] === 0xBC && b[3] === 0xAF && b[4] === 0x27 && b[5] === 0x1C) {
      detectedExt = '7z';
      detectedMime = 'application/x-7z-compressed';
      description = 'Arquivo Compactado 7-Zip';
      category = 'Compactado';
    } else if (len >= 2 && b[0] === 0x1F && b[1] === 0x8B) {
      detectedExt = 'gz';
      detectedMime = 'application/gzip';
      description = 'Arquivo Comprimido GZip';
      category = 'Compactado';
    } else if (len >= 2 && b[0] === 0x4D && b[1] === 0x5A) {
      detectedExt = 'exe';
      detectedMime = 'application/x-msdownload';
      description = 'Executável Windows / DLL (DOS MZ header)';
      category = 'Executável';
    } else if (len >= 4 && b[0] === 0x7F && b[1] === 0x45 && b[2] === 0x4C && b[3] === 0x46) {
      detectedExt = 'elf';
      detectedMime = 'application/x-elf';
      description = 'Executável Binário Linux (ELF)';
      category = 'Executável';
    } else if (len >= 8 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
      detectedExt = 'mp4';
      detectedMime = 'video/mp4';
      description = 'Vídeo MPEG-4 / QuickTime (ftyp container)';
      category = 'Vídeo';
    } else if (len >= 3 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) {
      detectedExt = 'mp3';
      detectedMime = 'audio/mpeg';
      description = 'Áudio MP3 com tag ID3v2';
      category = 'Áudio';
    } else if (len >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45) {
      detectedExt = 'wav';
      detectedMime = 'audio/wav';
      description = 'Áudio WAV (RIFF/WAVE)';
      category = 'Áudio';
    } else if (len >= 4 && b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3) {
      detectedExt = 'mkv';
      detectedMime = 'video/x-matroska';
      description = 'Vídeo Matroska / WebM Container';
      category = 'Vídeo';
    } else if (len >= 2 && b[0] === 0x42 && b[1] === 0x4D) {
      detectedExt = 'bmp';
      detectedMime = 'image/bmp';
      description = 'Imagem Bitmap do Windows (BM)';
      category = 'Imagem';
    } else if (len >= 4 && b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) {
      detectedExt = 'ico';
      detectedMime = 'image/x-icon';
      description = 'Ícone de Aplicação do Windows / Favicon';
      category = 'Imagem';
    } else if (len >= 16 && String.fromCharCode(...b.subarray(0, 16)).startsWith('SQLite format 3')) {
      detectedExt = 'sqlite';
      detectedMime = 'application/vnd.sqlite3';
      description = 'Banco de Dados SQLite v3';
      category = 'Banco de Dados';
    } else if (len >= 5 && String.fromCharCode(...b.subarray(0, 5)).toLowerCase().startsWith('<?xml')) {
      detectedExt = 'xml';
      detectedMime = 'application/xml';
      description = 'Documento Estruturado XML';
      category = 'Texto/Código';
    } else if (len >= 6 && (String.fromCharCode(...b.subarray(0, 6)).toLowerCase().startsWith('<html') || String.fromCharCode(...b.subarray(0, 9)).toLowerCase().startsWith('<!doctype'))) {
      detectedExt = 'html';
      detectedMime = 'text/html';
      description = 'Página Web HTML';
      category = 'Texto/Código';
    } else {
      // Heuristic text check (printable ascii / utf-8)
      let isText = true;
      const sampleLimit = Math.min(len, 256);
      for (let i = 0; i < sampleLimit; i++) {
        const char = b[i];
        if (char === 0x00) {
          isText = false;
          break;
        }
      }
      if (isText && len > 0) {
        detectedExt = 'txt';
        detectedMime = 'text/plain';
        description = 'Arquivo de Texto Plano / Código Fonte';
        category = 'Texto';
      }
    }

    // Check extension mismatch
    const dotIndex = fileName.lastIndexOf('.');
    const declaredExt = dotIndex !== -1 ? fileName.substring(dotIndex + 1).toLowerCase() : '';
    
    let isMismatch = false;
    if (detectedExt !== 'desconhecido' && declaredExt) {
      // Group equivalent extensions
      const matches: Record<string, string[]> = {
        'jpg': ['jpg', 'jpeg', 'jpe'],
        'png': ['png'],
        'gif': ['gif'],
        'webp': ['webp'],
        'pdf': ['pdf'],
        'zip': ['zip', 'docx', 'xlsx', 'pptx', 'jar', 'apk', 'epub'],
        'rar': ['rar'],
        '7z': ['7z'],
        'gz': ['gz', 'gzip', 'tgz'],
        'exe': ['exe', 'dll', 'sys', 'scr'],
        'elf': ['elf', 'so', 'bin'],
        'mp4': ['mp4', 'm4v', 'mov'],
        'mp3': ['mp3'],
        'wav': ['wav'],
        'mkv': ['mkv', 'webm'],
        'bmp': ['bmp'],
        'ico': ['ico'],
        'sqlite': ['sqlite', 'db', 'sqlite3'],
        'xml': ['xml', 'svg'],
        'html': ['html', 'htm'],
        'txt': ['txt', 'csv', 'json', 'js', 'ts', 'css', 'md', 'log', 'yaml', 'yml', 'env', 'sh', 'bat', 'ps1']
      };

      const validList = matches[detectedExt] || [detectedExt];
      if (!validList.includes(declaredExt)) {
        isMismatch = true;
      }
    }

    return {
      detectedExt,
      detectedMime,
      description,
      category,
      isMismatch
    };
  }
}
