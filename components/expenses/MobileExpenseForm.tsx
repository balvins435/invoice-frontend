'use client';

import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { ExpenseForm } from './ExpenseForm';

export const MobileExpenseForm = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg md:hidden">
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
        <div className="px-4 pb-6">
          <h2 className="mb-4 text-xl font-semibold">Add Expense</h2>
          <ExpenseForm 
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};