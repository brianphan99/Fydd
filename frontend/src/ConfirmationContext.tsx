import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmationOptions) => {
    setOptions(options);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolver.current) resolver.current(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolver.current) resolver.current(true);
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" 
            onClick={handleCancel}
          />
          
          {/* Sheet */}
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 duration-300 ease-out">
            {/* Handle for mobile */}
            <div className="h-1.5 w-12 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />
            
            <div className="p-6 pt-4 sm:pt-6">
              {options.title && (
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {options.title}
                </h3>
              )}
              <p className="text-gray-600 text-lg leading-relaxed">
                {options.message}
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={handleConfirm}
                  className={`w-full py-4 sm:py-3 px-6 rounded-xl font-medium text-lg transition-all active:scale-[0.98] ${
                    options.isDestructive 
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200' 
                      : 'bg-black text-white hover:bg-zinc-800 shadow-lg shadow-zinc-200'
                  }`}
                >
                  {options.confirmLabel || 'Confirm'}
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full py-4 sm:py-3 px-6 rounded-xl font-medium text-lg text-gray-500 hover:bg-gray-50 transition-all active:scale-[0.98]"
                >
                  {options.cancelLabel || 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
};
