export type InputType = 'text' | 'url' | 'maps' | 'contact' | 'image' | 'audio' | 'video' | 'document';

export interface QRCustomization {
  fgColor: string;
  bgColor: string;
  size: number;
  errorLevel: 'L' | 'M' | 'Q' | 'H';
  cornerStyle: 'square' | 'dots' | 'fluid';
  dotStyle: 'squares' | 'dots' | 'fluid';
  padding: number;
  useGradient: boolean;
  gradientColor2: string;
}

export interface QREntry {
  id: string;
  title: string;
  inputType: InputType;
  rawData: string;
  customization: QRCustomization;
  logoType: 'auto' | 'custom' | 'none';
  customLogoData?: string; // base64
  previewImage?: string; // base64 PNG
  createdAt: string;
  updatedAt: string;
  fileName?: string;
}

export interface QRSettings {
  defaultFgColor: string;
  defaultBgColor: string;
  defaultSize: number;
  defaultErrorLevel: 'L' | 'M' | 'Q' | 'H';
}
