import React, { Component, useRef, useState, useEffect } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCustomization, InputType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// QR code capacity limits (bytes) per error correction level at version 40 (max)
// We use a conservative limit that works reliably across levels
const QR_MAX_BYTES: Record<string, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

const icons = {
  url: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>',
  maps: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  contact: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  image: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
  audio: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  video: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect width="15" height="14" x="1" y="5" rx="2" ry="2"/></svg>',
  document: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
  text: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>',
};

const getLogoDataUri = (type: InputType, fgColor: string) => {
  let svgString = icons[type] || icons.text;
  svgString = svgString.replace('stroke="currentColor"', `stroke="${fgColor}"`);
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};

interface ErrorBoundaryState { hasError: boolean; error?: string }
class QRErrorBoundary extends Component<{ children: React.ReactNode; fallback: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error: error.message };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface QRPreviewProps {
  data: string;
  inputType: InputType;
  customization: QRCustomization;
  logoType: 'auto' | 'custom' | 'none';
  customLogoData?: string;
  onPreviewGenerated?: (dataUri: string) => void;
}

export function QRPreview({ data, inputType, customization, logoType, customLogoData, onPreviewGenerated }: QRPreviewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const maxBytes = QR_MAX_BYTES[customization.errorLevel] ?? 1273;
  const byteLength = new TextEncoder().encode(data).length;
  const isDataTooLong = byteLength > maxBytes;
  const isDataEmpty = !data || data.trim().length === 0;

  const logoSrc = logoType === 'custom' && customLogoData
    ? customLogoData
    : logoType === 'auto'
      ? getLogoDataUri(inputType, customization.fgColor)
      : undefined;

  useEffect(() => {
    if (onPreviewGenerated && canvasRef.current && !isDataTooLong && !isDataEmpty) {
      const canvas = canvasRef.current.querySelector('canvas');
      if (canvas) {
        setTimeout(() => {
          try {
            const uri = canvas.toDataURL('image/png');
            onPreviewGenerated(uri);
          } catch (e) {
            console.error('Failed to generate preview', e);
          }
        }, 150);
      }
    }
  }, [data, customization, logoSrc, onPreviewGenerated, isDataTooLong, isDataEmpty]);

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) { toast({ title: 'No QR code to download', variant: 'destructive' }); return; }
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qr-${Date.now()}.png`;
    link.href = url;
    link.click();
    toast({ title: 'Downloaded PNG successfully!' });
  };

  const handleDownloadSVG = () => {
    const svg = canvasRef.current?.querySelector('svg');
    if (!svg) { toast({ title: 'No QR code to download', variant: 'destructive' }); return; }
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `qr-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded SVG successfully!' });
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) { toast({ title: 'No QR code to copy', variant: 'destructive' }); return; }
    try {
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopied(true);
          toast({ title: 'Copied to clipboard!' });
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const renderData = data || 'https://qrpro.app';

  const qrProps = {
    value: renderData,
    size: customization.size,
    level: customization.errorLevel,
    bgColor: customization.bgColor,
    fgColor: customization.fgColor,
    marginSize: customization.padding,
    imageSettings: logoSrc
      ? { src: logoSrc, height: customization.size * 0.2, width: customization.size * 0.2, excavate: true }
      : undefined,
  };

  const tooLongFallback = (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ minHeight: 220, minWidth: 220 }}>
      <AlertTriangle className="w-10 h-10 text-destructive" />
      <p className="font-semibold text-destructive">Data too large for QR</p>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        Your input is {byteLength.toLocaleString()} bytes. The max for error level {customization.errorLevel} is {maxBytes.toLocaleString()} bytes.
        Try using a shorter URL, switching to error level L, or uploading a smaller file.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full gap-6">
      <motion.div
        key={renderData.slice(0, 40) + customization.fgColor + customization.size}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative p-4 rounded-2xl flex items-center justify-center bg-card shadow-2xl overflow-hidden border border-border"
        style={{ minHeight: 250, minWidth: 250 }}
      >
        {isDataTooLong ? (
          tooLongFallback
        ) : (
          <div ref={canvasRef} className="relative z-10">
            <QRErrorBoundary fallback={tooLongFallback}>
              <QRCodeSVG {...qrProps} className="rounded-lg shadow-sm" />
              <div className="hidden">
                <QRCodeCanvas {...qrProps} />
              </div>
            </QRErrorBoundary>
          </div>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        <Button
          onClick={handleDownloadPNG}
          disabled={isDataTooLong || isDataEmpty}
          className="hover-elevate shadow-md bg-gradient-to-r from-primary to-primary/80"
        >
          <Download className="w-4 h-4 mr-2" /> PNG
        </Button>
        <Button
          variant="secondary"
          onClick={handleDownloadSVG}
          disabled={isDataTooLong || isDataEmpty}
          className="hover-elevate shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" /> SVG
        </Button>
        <Button
          variant="outline"
          onClick={handleCopy}
          disabled={isDataTooLong || isDataEmpty}
          className="hover-elevate shadow-sm"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      {byteLength > maxBytes * 0.8 && !isDataTooLong && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
          Warning: Data is {byteLength.toLocaleString()} bytes — approaching the {maxBytes.toLocaleString()} byte limit for level {customization.errorLevel}.
        </p>
      )}
    </div>
  );
}
