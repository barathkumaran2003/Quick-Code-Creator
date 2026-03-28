import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Calendar, Download, Edit } from 'lucide-react';
import { useQRStore } from '@/hooks/use-qr-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InputType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLocation } from 'wouter';

export default function HistoryPage() {
  const { history, deleteQR, clearHistory } = useQRStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<InputType | 'all'>('all');

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.inputType === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (id: string) => {
    deleteQR(id);
    toast({ title: "Item deleted from history" });
  };

  const handleClearAll = () => {
    clearHistory();
    toast({ title: "History cleared successfully" });
  };

  // We don't implement "edit" seamlessly yet as it requires deep state hydratation in Generate page,
  // but we provide the button for future expansion or just copy data.
  // For now, edit just redirects to generate.
  const handleEdit = (item: any) => {
    toast({ title: "Feature coming soon", description: "Deep linking to edit state is in development." });
    setLocation('/generate');
  };

  const downloadImage = (base64: string, title: string) => {
    if(!base64) return;
    const link = document.createElement('a');
    link.download = `qr-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    link.href = base64;
    link.click();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">QR History</h1>
          <p className="text-muted-foreground">Manage and re-download your previously generated codes.</p>
        </div>
        
        {history.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="hover-elevate bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground">
                <Trash2 className="w-4 h-4 mr-2" /> Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-panel-heavy border-destructive/30">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your generated QR codes from local storage. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="hover-elevate">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover-elevate">Yes, delete all</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="glass-panel p-4 rounded-2xl mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search by title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-border/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {['all', 'url', 'text', 'contact', 'image', 'audio', 'video'].map((type) => (
            <Badge 
              key={type} 
              variant={filterType === type ? 'default' : 'outline'}
              className="cursor-pointer capitalize px-4 py-2 text-sm rounded-lg hover-elevate shrink-0 whitespace-nowrap"
              onClick={() => setFilterType(type as any)}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-display font-bold mb-2">No results found</h3>
          <p className="text-muted-foreground max-w-md">We couldn't find any QR codes matching your filters. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          <AnimatePresence>
            {filteredHistory.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <Card className="glass-panel overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
                  <div className="bg-muted/20 h-48 p-4 flex justify-center items-center relative border-b border-border/50">
                    {item.previewImage ? (
                      <img src={item.previewImage} alt="QR Preview" className="h-full object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-32 h-32 bg-background border rounded-xl flex items-center justify-center text-muted-foreground/30">No Preview</div>
                    )}
                    
                    {/* Hover Actions Overlay */}
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      {item.previewImage && (
                        <Button size="icon" variant="secondary" className="rounded-full shadow-lg hover-elevate" onClick={() => downloadImage(item.previewImage!, item.title)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="secondary" className="rounded-full shadow-lg hover-elevate" onClick={() => handleEdit(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="rounded-full shadow-lg hover-elevate" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h4 className="font-bold text-lg leading-tight truncate flex-1" title={item.title}>{item.title}</h4>
                      <Badge variant="outline" className="capitalize shrink-0 bg-background">{item.inputType}</Badge>
                    </div>
                    
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1.5" />
                      {new Date(item.createdAt).toLocaleString(undefined, { 
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
