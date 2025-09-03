import { useState, useEffect, ReactNode } from 'react';

// Event-based payment modal system
const PAYMENT_MODAL_EVENT = 'openPaymentModal';

// Global event dispatcher
export const triggerPaymentModal = () => {
  window.dispatchEvent(new CustomEvent(PAYMENT_MODAL_EVENT));
};

interface PaymentModalProviderProps {
  children: ReactNode;
}

export function PaymentModalProvider({ children }: PaymentModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handlePaymentModalEvent = () => {
      console.log('Payment modal event received - opening modal');
      setIsOpen(true);
    };

    window.addEventListener(PAYMENT_MODAL_EVENT, handlePaymentModalEvent);
    
    return () => {
      window.removeEventListener(PAYMENT_MODAL_EVENT, handlePaymentModalEvent);
    };
  }, []);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {children}
    </>
  );
}

export function useGlobalPaymentModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handlePaymentModalEvent = () => {
      setIsOpen(true);
    };

    window.addEventListener(PAYMENT_MODAL_EVENT, handlePaymentModalEvent);
    
    return () => {
      window.removeEventListener(PAYMENT_MODAL_EVENT, handlePaymentModalEvent);
    };
  }, []);

  const openModal = () => {
    setIsOpen(true);
    triggerPaymentModal();
  };
  
  const closeModal = () => setIsOpen(false);

  return { isOpen, openModal, closeModal };
}