import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, MapPin, User, FileImage, FileAudio, FileVideo, FileText, Type, UploadCloud, Save, Zap, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { InputType, QRCustomization } from '@/lib/types';
import { DEFAULT_CUSTOMIZATION, useQRStore } from '@/hooks/use-qr-store';
import { detectInputType, fileToBase64, formatBytes } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { QRPreview } from '@/components/qr/qr-preview';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useUpload } from '@workspace/object-storage-web';

const typeIcons = {
  text: Type,
  url: Link2,
  maps: MapPin,
  contact: User,
  image: FileImage,
  audio: FileAudio,
  video: FileVideo,
  document: FileText,
};

const FILE_SIZE_LIMITS: Record<string, number> = {
  image: 5 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
  video: 20 * 1024 * 1024,
  document: 5 * 1024 * 1024,
};

const FILE_SIZE_LABELS: Record<string, string> = {
  image: '5MB',
  audio: '10MB',
  video: '20MB',
  document: '5MB',
};

function getFileType(file: File): InputType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return 'document';
}

export default function GeneratePage() {
  const { settings, saveQR } = useQRStore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('content');
  const [inputType, setInputType] = useState<InputType>('url');
  const [data, setData] = useState('');
  const [fileName, setFileName] = useState<string>();
  const [uploadDone, setUploadDone] = useState(false);
  
  const [customization, setCustomization] = useState<QRCustomization>({
    ...DEFAULT_CUSTOMIZATION,
    fgColor: settings.defaultFgColor,
    bgColor: settings.defaultBgColor,
    size: settings.defaultSize,
    errorLevel: settings.defaultErrorLevel,
  });

  const [logoType, setLogoType] = useState<'auto' | 'custom' | 'none'>('auto');
  const [customLogoData, setCustomLogoData] = useState<string>();
  const [previewImage, setPreviewImage] = useState<string>();
  const [contact, setContact] = useState({ fn: '', tel: '', email: '', org: '', url: '' });

  const { uploadFile, isUploading, progress } = useUpload({
    basePath: '/api/storage',
    onSuccess: (response) => {
      const fileUrl = `${window.location.origin}/api/storage${response.objectPath}`;
      setData(fileUrl);
      setUploadDone(true);
    },
    onError: (err) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (inputType === 'contact') {
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.fn}\nTEL;TYPE=CELL:${contact.tel}\nEMAIL:${contact.email}\nORG:${contact.org}\nURL:${contact.url}\nEND:VCARD`;
      setData(vcard);
    }
  }, [contact, inputType]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setData(val);
    if (inputType === 'text' || inputType === 'url' || inputType === 'maps') {
      const detected = detectInputType(val);
      if (detected !== inputType && val.length > 5) {
        setInputType(detected);
      }
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const detectedType = getFileType(file);
    const limit = FILE_SIZE_LIMITS[detectedType] ?? 5 * 1024 * 1024;
    const limitLabel = FILE_SIZE_LABELS[detectedType] ?? '5MB';

    if (file.size > limit) {
      toast({
        title: "File too large",
        description: `Maximum size for ${detectedType} files is ${limitLabel}. Your file is ${formatBytes(file.size)}.`,
        variant: "destructive",
      });
      return;
    }

    setData('');
    setUploadDone(false);
    setFileName(`${file.name} (${formatBytes(file.size)})`);
    setInputType(detectedType);

    await uploadFile(file);
  };

  const handleClearFile = () => {
    setData('');
    setFileName(undefined);
    setUploadDone(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

  const handleSave = () => {
    if (!data) {
      toast({ title: "Please enter some content first", variant: "destructive" });
      return;
    }
    saveQR({
      title: fileName || (data.substring(0, 20) + '...'),
      inputType,
      rawData: data,
      customization,
      logoType,
      customLogoData,
      previewImage,
      fileName
    });
    toast({ title: "QR Code saved to History!" });
  };

  const handleCustomLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const b64 = await fileToBase64(file);
      setCustomLogoData(b64);
      setLogoType('custom');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-4rem)]">
      
      {/* Left Column: Controls */}
      <div className="flex-1 w-full lg:max-w-2xl flex flex-col gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Create New QR Code</h1>
          <p className="text-muted-foreground">Select content type, customize appearance, and generate instantly.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="content" className="rounded-lg">Content</TabsTrigger>
            <TabsTrigger value="colors" className="rounded-lg">Colors</TabsTrigger>
            <TabsTrigger value="logo" className="rounded-lg">Logo</TabsTrigger>
            <TabsTrigger value="options" className="rounded-lg">Options</TabsTrigger>
          </TabsList>

          <div className="mt-6 glass-panel p-6 rounded-2xl">
            {/* CONTENT TAB */}
            <TabsContent value="content" className="m-0 space-y-6">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(typeIcons) as InputType[]).map((type) => {
                  const Icon = typeIcons[type];
                  return (
                    <Button
                      key={type}
                      variant={inputType === type ? 'default' : 'outline'}
                      onClick={() => setInputType(type)}
                      className="capitalize flex-1 min-w-[100px] hover-elevate"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {type}
                    </Button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={inputType}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {(inputType === 'url' || inputType === 'text' || inputType === 'maps') && (
                    <div className="space-y-2">
                      <Label>Enter {inputType} content</Label>
                      {inputType === 'text' ? (
                        <Textarea 
                          value={data} 
                          onChange={handleTextChange} 
                          placeholder="Type your message here..."
                          className="min-h-[120px] resize-none bg-background/50"
                        />
                      ) : (
                        <Input 
                          value={data} 
                          onChange={handleTextChange} 
                          placeholder={inputType === 'url' ? 'https://example.com' : 'https://maps.google.com/...'}
                          className="bg-background/50"
                        />
                      )}
                    </div>
                  )}

                  {inputType === 'contact' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={contact.fn} onChange={e => setContact({...contact, fn: e.target.value})} placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={contact.tel} onChange={e => setContact({...contact, tel: e.target.value})} placeholder="+1 234 567 890" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={contact.email} onChange={e => setContact({...contact, email: e.target.value})} placeholder="john@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input value={contact.org} onChange={e => setContact({...contact, org: e.target.value})} placeholder="Acme Inc" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Website</Label>
                        <Input value={contact.url} onChange={e => setContact({...contact, url: e.target.value})} placeholder="https://johndoe.com" />
                      </div>
                    </div>
                  )}

                  {(['image', 'audio', 'video', 'document'].includes(inputType)) && (
                    <div className="space-y-4">
                      <div 
                        {...getRootProps()} 
                        className={cn(
                          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 ease-in-out flex flex-col items-center justify-center min-h-[200px]",
                          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
                          isUploading && "pointer-events-none opacity-70"
                        )}
                      >
                        <input {...getInputProps()} />
                        {isUploading ? (
                          <>
                            <Loader2 className="w-10 h-10 text-primary mb-4 animate-spin" />
                            <p className="font-medium mb-1">Uploading file...</p>
                            <div className="w-full max-w-xs bg-muted rounded-full h-2 mt-3">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
                            <p className="font-medium mb-1">Drag & drop your file here</p>
                            <p className="text-sm text-muted-foreground">or click to browse files</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Images up to 5MB · Audio up to 10MB · Video up to 20MB · Docs up to 5MB
                            </p>
                          </>
                        )}
                      </div>

                      {fileName && !isUploading && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-3 rounded-lg text-sm flex items-center justify-between",
                            uploadDone ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate mr-4">
                            {uploadDone && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                            <span className="font-medium truncate">{fileName}</span>
                            {uploadDone && <span className="text-xs shrink-0">Uploaded · QR ready</span>}
                          </div>
                          <Button variant="ghost" size="sm" onClick={handleClearFile} className="h-6 px-2 shrink-0">
                            <X className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* COLORS TAB */}
            <TabsContent value="colors" className="m-0 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Foreground Color</Label>
                  <div className="flex gap-3">
                    <Input 
                      type="color" 
                      value={customization.fgColor} 
                      onChange={e => setCustomization({...customization, fgColor: e.target.value})}
                      className="w-14 h-14 p-1 cursor-pointer"
                    />
                    <Input 
                      type="text" 
                      value={customization.fgColor} 
                      onChange={e => setCustomization({...customization, fgColor: e.target.value})}
                      className="flex-1 font-mono uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Background Color</Label>
                  <div className="flex gap-3">
                    <Input 
                      type="color" 
                      value={customization.bgColor} 
                      onChange={e => setCustomization({...customization, bgColor: e.target.value})}
                      className="w-14 h-14 p-1 cursor-pointer"
                    />
                    <Input 
                      type="text" 
                      value={customization.bgColor} 
                      onChange={e => setCustomization({...customization, bgColor: e.target.value})}
                      className="flex-1 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Use Gradient</Label>
                  <p className="text-sm text-muted-foreground">Apply a gradient to the QR code</p>
                </div>
                <Switch 
                  checked={customization.useGradient} 
                  onCheckedChange={c => setCustomization({...customization, useGradient: c})} 
                />
              </div>

              {customization.useGradient && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <Label>Gradient End Color</Label>
                  <div className="flex gap-3">
                    <Input 
                      type="color" 
                      value={customization.gradientColor2} 
                      onChange={e => setCustomization({...customization, gradientColor2: e.target.value})}
                      className="w-14 h-14 p-1 cursor-pointer"
                    />
                    <Input 
                      type="text" 
                      value={customization.gradientColor2} 
                      onChange={e => setCustomization({...customization, gradientColor2: e.target.value})}
                      className="flex-1 font-mono uppercase"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* LOGO TAB */}
            <TabsContent value="logo" className="m-0 space-y-6">
              <div className="space-y-4">
                <Label>Center Logo Options</Label>
                <div className="flex flex-col gap-3">
                  <Button 
                    variant={logoType === 'auto' ? 'default' : 'outline'} 
                    onClick={() => setLogoType('auto')}
                    className="justify-start hover-elevate"
                  >
                    <Zap className="w-4 h-4 mr-2" /> Auto-detect based on type
                  </Button>
                  <Button 
                    variant={logoType === 'none' ? 'default' : 'outline'} 
                    onClick={() => setLogoType('none')}
                    className="justify-start hover-elevate"
                  >
                    <X className="w-4 h-4 mr-2" /> No Logo
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={logoType === 'custom' ? 'default' : 'outline'} 
                      className="justify-start flex-1 hover-elevate relative overflow-hidden"
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleCustomLogoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="w-4 h-4 mr-2" /> 
                      {customLogoData ? 'Change Custom Logo' : 'Upload Custom Logo'}
                    </Button>
                  </div>
                </div>
                {logoType === 'custom' && customLogoData && (
                  <div className="mt-4 p-4 border rounded-xl flex items-center justify-center bg-background/50">
                    <img src={customLogoData} alt="Custom Logo Preview" className="max-h-20 object-contain rounded" />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* OPTIONS TAB */}
            <TabsContent value="options" className="m-0 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>QR Code Size ({customization.size}px)</Label>
                </div>
                <Slider 
                  value={[customization.size]} 
                  min={128} max={1024} step={8}
                  onValueChange={v => setCustomization({...customization, size: v[0]})} 
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Quiet Zone Padding ({customization.padding})</Label>
                </div>
                <Slider 
                  value={[customization.padding]} 
                  min={0} max={10} step={1}
                  onValueChange={v => setCustomization({...customization, padding: v[0]})} 
                />
              </div>

              <div className="space-y-3">
                <Label>Error Correction Level</Label>
                <Select 
                  value={customization.errorLevel} 
                  onValueChange={(v: any) => setCustomization({...customization, errorLevel: v})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Low (7%) - Best for simple URLs</SelectItem>
                    <SelectItem value="M">Medium (15%) - Standard</SelectItem>
                    <SelectItem value="Q">Quartile (25%) - Good with logos</SelectItem>
                    <SelectItem value="H">High (30%) - Heavy logos / dirty environment</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Higher levels allow the QR code to be scanned even if part of it is obscured by a logo.</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Right Column: Preview (Sticky) */}
      <div className="w-full lg:w-[400px] shrink-0">
        <div className="sticky top-24 flex flex-col gap-4">
          <div className="glass-panel p-6 rounded-3xl border border-primary/20 bg-gradient-to-b from-card to-background">
            <h3 className="font-display font-semibold text-lg mb-6 text-center">Live Preview</h3>
            
            <QRPreview 
              data={data}
              inputType={inputType}
              customization={customization}
              logoType={logoType}
              customLogoData={customLogoData}
              onPreviewGenerated={setPreviewImage}
            />
          </div>

          <Button 
            size="lg" 
            className="w-full font-bold text-lg h-14 hover-elevate shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-secondary text-white border-0"
            onClick={handleSave}
            disabled={!data || isUploading}
          >
            <Save className="w-5 h-5 mr-2" />
            Save to History
          </Button>
        </div>
      </div>
      
    </div>
  );
}
