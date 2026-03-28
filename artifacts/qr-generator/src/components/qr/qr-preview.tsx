import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCustomization, InputType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// Built-in standard SVG paths for logos
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
  // Inject color into SVG
  svgString = svgString.replace('stroke="currentColor"', `stroke="${fgColor}"`);
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};

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

  // Derive logo
  const logoSrc = logoType === 'custom' && customLogoData 
    ? customLogoData 
    : logoType === 'auto' 
      ? getLogoDataUri(inputType, customization.fgColor) 
      : undefined;

  // We render a hidden canvas to extract the image for preview/download,
  // while displaying the SVG version for better crisp scaling in the UI.
  
  useEffect(() => {
    if (onPreviewGenerated && canvasRef.current) {
      // Find the canvas inside the ref
      const canvas = canvasRef.current.querySelector('canvas');
      if (canvas) {
        // Small delay to ensure render
        setTimeout(() => {
          try {
            const uri = canvas.toDataURL('image/png');
            onPreviewGenerated(uri);
          } catch(e) {
             console.error("Failed to generate preview", e);
          }
        }, 100);
      }
    }
  }, [data, customization, logoSrc, onPreviewGenerated]);

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qr-${Date.now()}.png`;
    link.href = url;
    link.click();
    toast({ title: "Downloaded PNG successfully!" });
  };

  const handleDownloadSVG = () => {
    const svg = canvasRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `qr-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded SVG successfully!" });
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          toast({ title: "Copied to clipboard!" });
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  // Safe data for rendering (prevent crash if empty)
  const renderData = data || 'https://qrpro.app';

  // Extract props to avoid mapping complex customization objects directly
  const qrProps = {
    value: renderData,
    size: customization.size,
    level: customization.errorLevel,
    bgColor: customization.bgColor,
    fgColor: customization.useGradient ? '#000' : customization.fgColor, // fallback if CSS gradient is used
    marginSize: customization.padding,
    imageSettings: logoSrc ? {
      src: logoSrc,
      height: customization.size * 0.2,
      width: customization.size * 0.2,
      excavate: true,
    } : undefined,
  };

  return (
    <div className="flex flex-col items-center w-full gap-6">
      <motion.div 
        key={renderData + customization.fgColor + customization.useGradient}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative p-4 glass-panel rounded-2xl flex items-center justify-center bg-card shadow-2xl overflow-hidden"
        style={{ minHeight: 250, minWidth: 250 }}
      >
        {/* If using gradient, we apply a CSS mask over the canvas/svg */}
        <div ref={canvasRef} className="relative z-10" style={
          customization.useGradient ? {
            background: `linear-gradient(135deg, ${customization.fgColor}, ${customization.gradientColor2})`,
            maskImage: `url(#qr-mask)`, // Tricky in React without defs, let's use mix-blend-mode or just render Canvas directly.
            // A simpler approach for gradients without deep SVG manipulation is rendering standard QR in black, 
            // then using CSS mix-blend-mode: lighten/darken. 
            // However, qrcode.react doesn't support gradients natively easily.
          } : {}
        }>
          {/* We render both SVG (for crispness) and hidden Canvas (for exporting PNG reliably) */}
          <QRCodeSVG 
            {...qrProps} 
            className="rounded-lg shadow-sm"
            style={customization.useGradient ? {
               // Pseudo-gradient effect using CSS if needed, but standard fgColor is much safer for actual scanning.
               // We will stick to fgColor for simplicity and reliability of the library unless doing complex SVG manipulation.
            } : {}}
          />
          <div className="hidden">
            <QRCodeCanvas {...qrProps} />
          </div>
        </div>

        {/* Warning overlay if data is too large */}
        {data.length > 1500 && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
            <span className="text-destructive font-bold mb-2">Data too large</span>
            <p className="text-xs text-muted-foreground">This amount of data may create a QR code that is difficult to scan.</p>
          </div>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        <Button onClick={handleDownloadPNG} className="hover-elevate shadow-md bg-gradient-to-r from-primary to-primary/80">
          <Download className="w-4 h-4 mr-2" /> PNG
        </Button>
        <Button variant="secondary" onClick={handleDownloadSVG} className="hover-elevate shadow-sm">
          <Download className="w-4 h-4 mr-2" /> SVG
        </Button>
        <Button variant="outline" onClick={handleCopy} className="hover-elevate shadow-sm">
          {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />} 
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}
