import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { QrCode, Zap, Clock, ArrowRight, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { useQRStore } from '@/hooks/use-qr-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Dashboard() {
  const { history } = useQRStore();

  const totalGenerated = history.length;
  const recentHistory = history.slice(0, 4);

  // Calculate most popular type
  const typeCounts = history.reduce((acc, curr) => {
    acc[curr.inputType] = (acc[curr.inputType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostPopularType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-background to-secondary/10 border border-primary/10 p-8 md:p-12 mb-10 shadow-2xl glass-panel"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 tracking-tight">
            Next-Gen <span className="text-gradient">QR Codes</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Create stunning, highly customizable QR codes that stand out. Fully local, lightning fast, and beautifully designed.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/generate">
              <Button size="lg" className="hover-elevate font-semibold text-base h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 border-0">
                <Zap className="w-5 h-5 mr-2" /> Start Generating
              </Button>
            </Link>
            <Link href="/history">
              <Button size="lg" variant="outline" className="hover-elevate font-semibold text-base h-12 px-8 bg-background/50 backdrop-blur-sm border-primary/20">
                <Clock className="w-5 h-5 mr-2" /> View History
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-10">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={itemVariants}>
            <Card className="glass-panel overflow-hidden border-primary/10">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-2xl">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Generated</p>
                  <h3 className="text-3xl font-display font-bold">{totalGenerated}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="glass-panel overflow-hidden border-secondary/10">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-secondary/10 rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Most Popular Type</p>
                  <h3 className="text-3xl font-display font-bold capitalize">{mostPopularType}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-panel overflow-hidden border-accent/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 bg-accent rounded-2xl">
                  <Activity className="w-8 h-8 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Storage Status</p>
                  <h3 className="text-xl font-display font-bold text-green-500">Local Only</h3>
                  <p className="text-xs text-muted-foreground mt-1">100% Private</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent History */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Recent Creations</h2>
            <Link href="/history">
              <Button variant="ghost" className="hover-elevate group">
                View All <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {recentHistory.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl border-dashed border-2">
              <QrCode className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No QR codes yet</h3>
              <p className="text-muted-foreground mt-1 mb-6">Create your first QR code to see it here.</p>
              <Link href="/generate">
                <Button className="hover-elevate">Create Now</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentHistory.map((item) => (
                <motion.div key={item.id} variants={itemVariants}>
                  <Card className="glass-panel group overflow-hidden border-border/50 hover:border-primary/50 transition-colors duration-300 h-full flex flex-col cursor-pointer hover:shadow-xl hover:-translate-y-1">
                    <div className="bg-muted/30 p-6 flex justify-center items-center h-48 relative border-b border-border/50">
                      {item.previewImage ? (
                        <img src={item.previewImage} alt="QR Preview" className="w-32 h-32 object-contain rounded-xl shadow-lg transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <QrCode className="w-20 h-20 text-muted-foreground/30" />
                      )}
                      <div className="absolute top-3 right-3 bg-background/80 backdrop-blur text-xs px-2 py-1 rounded-full font-medium border border-border capitalize">
                        {item.inputType}
                      </div>
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <h4 className="font-bold text-lg truncate mb-1" title={item.title}>{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-auto">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
