export interface ImageProcessOptions {
  format?: string; // 'image/jpeg', 'image/png', 'image/webp'
  quality?: number; // 0.0 to 1.0
  scale?: number; // 1.0 is original size
  width?: number; // explicit width
  height?: number; // explicit height
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  mode: 'cover' | 'contain';
  bgColor?: string;
  format?: string;
  quality?: number;
}

export class ImageService {
  
  static fileToImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Erro ao carregar a imagem.'));
      };
      img.src = url;
    });
  }

  static async processImage(file: File | Blob, options: ImageProcessOptions): Promise<Blob> {
    const f = file instanceof File ? file : new File([file], 'image', { type: file.type });
    const img = await this.fileToImage(f);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (options.width && options.height) {
      canvas.width = Math.max(1, Math.round(options.width));
      canvas.height = Math.max(1, Math.round(options.height));
    } else {
      const scale = options.scale || 1;
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
    }
    
    if (!ctx) throw new Error('Falha ao inicializar o Canvas.');

    const targetFormat = options.format || f.type;
    
    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Falha ao processar a imagem.'));
        },
        targetFormat,
        options.quality !== undefined ? options.quality : 0.8
      );
    });
  }

  static async createThumbnail(file: File | Blob, options: ThumbnailOptions): Promise<Blob> {
    const f = file instanceof File ? file : new File([file], 'image', { type: file.type });
    const img = await this.fileToImage(f);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Falha ao inicializar o Canvas.');

    canvas.width = Math.max(1, Math.round(options.width));
    canvas.height = Math.max(1, Math.round(options.height));

    const targetFormat = options.format || 'image/png';
    const bgColor = options.bgColor || '#ffffff';

    if (options.mode === 'contain' || targetFormat === 'image/jpeg') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    let scale = 1;
    if (options.mode === 'contain') {
      scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    } else {
      // cover
      scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    }

    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = (canvas.width - drawW) / 2;
    const drawY = (canvas.height - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Falha ao gerar miniatura.'));
        },
        targetFormat,
        options.quality !== undefined ? options.quality : 0.92
      );
    });
  }
}
