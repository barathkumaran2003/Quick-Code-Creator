import React from 'react';
import { motion } from 'framer-motion';
import { Save, Settings2, Palette, Shield } from 'lucide-react';
import { useQRStore, DEFAULT_CUSTOMIZATION } from '@/hooks/use-qr-store';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const { settings, setSettings } = useQRStore();
  const { toast } = useToast();
  
  const [localSettings, setLocalSettings] = React.useState(settings);

  const handleSave = () => {
    setSettings(localSettings);
    toast({ title: "Settings saved successfully" });
  };

  const handleReset = () => {
    setLocalSettings({
      defaultFgColor: DEFAULT_CUSTOMIZATION.fgColor,
      defaultBgColor: DEFAULT_CUSTOMIZATION.bgColor,
      defaultSize: DEFAULT_CUSTOMIZATION.size,
      defaultErrorLevel: DEFAULT_CUSTOMIZATION.errorLevel,
    });
    toast({ title: "Reset to defaults" });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure default values for new QR codes.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-border/50">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <Palette className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-display font-bold">Default Appearance</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label>Default Foreground Color</Label>
              <div className="flex gap-3">
                <Input 
                  type="color" 
                  value={localSettings.defaultFgColor} 
                  onChange={e => setLocalSettings({...localSettings, defaultFgColor: e.target.value})}
                  className="w-14 h-14 p-1 cursor-pointer"
                />
                <Input 
                  type="text" 
                  value={localSettings.defaultFgColor} 
                  onChange={e => setLocalSettings({...localSettings, defaultFgColor: e.target.value})}
                  className="flex-1 font-mono uppercase"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Default Background Color</Label>
              <div className="flex gap-3">
                <Input 
                  type="color" 
                  value={localSettings.defaultBgColor} 
                  onChange={e => setLocalSettings({...localSettings, defaultBgColor: e.target.value})}
                  className="w-14 h-14 p-1 cursor-pointer"
                />
                <Input 
                  type="text" 
                  value={localSettings.defaultBgColor} 
                  onChange={e => setLocalSettings({...localSettings, defaultBgColor: e.target.value})}
                  className="flex-1 font-mono uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-border/50">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <Settings2 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-display font-bold">Default Output Options</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label>Default Size (px)</Label>
              <Input 
                type="number" 
                min={128} max={1024} step={8}
                value={localSettings.defaultSize} 
                onChange={e => setLocalSettings({...localSettings, defaultSize: parseInt(e.target.value)})}
              />
            </div>

            <div className="space-y-3">
              <Label>Default Error Correction</Label>
              <Select 
                value={localSettings.defaultErrorLevel} 
                onValueChange={(v: any) => setLocalSettings({...localSettings, defaultErrorLevel: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Low (7%)</SelectItem>
                  <SelectItem value="M">Medium (15%)</SelectItem>
                  <SelectItem value="Q">Quartile (25%)</SelectItem>
                  <SelectItem value="H">High (30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-border/50 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-display font-bold">Privacy & Data</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Smart QR Generator Pro operates entirely in your browser. None of the data you enter, files you upload, or QR codes you generate are sent to any external server. Everything is stored locally on your device in your browser's LocalStorage.
          </p>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={handleReset} className="hover-elevate">
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="hover-elevate bg-primary text-primary-foreground shadow-lg shadow-primary/25 border-0">
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
