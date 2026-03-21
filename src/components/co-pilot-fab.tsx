'use client';

import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { motion, AnimatePresence } from 'framer-motion';

export function CoPilotFab() {
  const { isCoPilotSidebarOpen, setIsCoPilotSidebarOpen } = useAppContext();

  return (
    <AnimatePresence>
      {!isCoPilotSidebarOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-full opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <Button
              size="lg"
              className="relative h-14 w-14 rounded-full shadow-2xl p-0 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border-none bg-primary text-primary-foreground"
              onClick={() => setIsCoPilotSidebarOpen(true)}
              aria-label="Open AI Co-pilot"
            >
              <Bot className="h-7 w-7" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
