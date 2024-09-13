declare module 'jimp' {
  interface Jimp {
    read(path: string | Buffer): Promise<Jimp>;
    write(path: string): this;
    getBuffer(mime: string, callback: (err: Error, buffer: Buffer) => void): void;
    getBufferAsync(mime: string): Promise<Buffer>;
    print(
      font: any,
      x: number,
      y: number,
      text: {
        text: string;
        alignmentX: number;
        alignmentY: number;
      },
      maxWidth: number,
      maxHeight: number
    ): this;
    bitmap: {
      width: number;
      height: number;
    };
  }

  function read(path: string | Buffer): Promise<Jimp>;

  function loadFont(file: string): Promise<Jimp>;

  function measureTextHeight(font: any, text: string, maxWidth: number): number;

  const FONT_SANS_8_BLACK: string;
  const FONT_SANS_16_BLACK: string;
  const FONT_SANS_32_BLACK: string;
  const FONT_SANS_64_BLACK: string;
  const FONT_SANS_128_BLACK: string;

  const FONT_SANS_8_WHITE: string;
  const FONT_SANS_16_WHITE: string;
  const FONT_SANS_32_WHITE: string;
  const FONT_SANS_64_WHITE: string;
  const FONT_SANS_128_WHITE: string;

  const MIME_JPEG: string;
  const HORIZONTAL_ALIGN_CENTER: number;
  const VERTICAL_ALIGN_BOTTOM: number;
}
