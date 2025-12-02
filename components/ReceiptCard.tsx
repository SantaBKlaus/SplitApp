import React, { forwardRef } from 'react';
import { Room, BillItem, TaxProfile } from '@/lib/firebase/firestore';
import { formatCurrency, calculateUserShare, calculateItemTax, calculateTotalServiceCharge } from '@/lib/calculations';
import { Receipt, Sparkles } from 'lucide-react';

interface ReceiptCardProps {
    room: Room;
    items: BillItem[];
    userId: string;
    userName: string;
}

export const ReceiptCard = forwardRef<HTMLDivElement, ReceiptCardProps>(({ room, items, userId, userName }, ref) => {
    const userItems = items.filter(item => item.selectedBy.includes(userId));

    // Calculate totals for the user
    let subtotal = 0;
    let totalTax = 0;

    userItems.forEach(item => {
        const splitCount = item.selectedBy.length;
        const itemShare = (item.price * (item.quantity || 1)) / splitCount;
        subtotal += itemShare;

        // Calculate tax for this item share
        const taxProfile = room.taxProfiles?.find(p => p.id === item.taxProfileId) || room.taxProfiles?.find(p => p.isGlobal);
        if (taxProfile) {
            const taxAmount = calculateItemTax(itemShare, taxProfile);
            totalTax += taxAmount;
        }
    });

    // Service Tax
    const serviceTaxAmount = subtotal > 0 && room.serviceTaxRate ? (subtotal + totalTax) * (room.serviceTaxRate / 100) : 0;
    const total = subtotal + totalTax + serviceTaxAmount;

    return (
        <div ref={ref} className="bg-white text-black p-8 w-[400px] font-mono relative overflow-hidden">
            {/* Receipt Texture/Effect */}
            <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_10px)] opacity-10"></div>

            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-black pb-6 border-dashed">
                <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-full">
                        <Receipt className="w-6 h-6" />
                    </div>
                </div>
                <h1 className="text-2xl font-black uppercase tracking-wider mb-1">{room.name}</h1>
                <p className="text-sm opacity-60">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
                <p className="text-xs mt-2 font-bold bg-black text-white inline-block px-2 py-1">RECEIPT FOR: {userName.toUpperCase()}</p>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-8 min-h-[200px]">
                {userItems.length > 0 ? (
                    userItems.map(item => {
                        const splitCount = item.selectedBy.length;
                        const itemShare = (item.price * (item.quantity || 1)) / splitCount;
                        return (
                            <div key={item.id} className="flex justify-between items-start text-sm">
                                <div className="pr-4">
                                    <span className="font-bold">{item.name}</span>
                                    {splitCount > 1 && (
                                        <span className="block text-xs opacity-60">Split with {splitCount - 1} others</span>
                                    )}
                                </div>
                                <span className="font-bold">{formatCurrency(itemShare, room.currency)}</span>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center opacity-40 py-8 italic">No items selected</div>
                )}
            </div>

            {/* Totals */}
            <div className="border-t-2 border-black pt-4 border-dashed space-y-2 mb-8">
                <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, room.currency)}</span>
                </div>

                {/* Tax Breakdown */}
                {totalTax > 0 && (() => {
                    // Collect unique tax profiles used by user's items
                    const taxProfilesUsed = new Map<string, { profile: TaxProfile; amount: number }>();

                    userItems.forEach(item => {
                        const taxProfile = room.taxProfiles?.find(p => p.id === item.taxProfileId) || room.taxProfiles?.find(p => p.isGlobal);
                        if (taxProfile) {
                            const splitCount = item.selectedBy.length;
                            const itemShare = (item.price * (item.quantity || 1)) / splitCount;
                            const taxAmount = calculateItemTax(itemShare, taxProfile);

                            const existing = taxProfilesUsed.get(taxProfile.id);
                            if (existing) {
                                existing.amount += taxAmount;
                            } else {
                                taxProfilesUsed.set(taxProfile.id, { profile: taxProfile, amount: taxAmount });
                            }
                        }
                    });

                    return (
                        <>
                            {Array.from(taxProfilesUsed.values()).map(({ profile, amount }) => {
                                if (profile.isDouble) {
                                    // Show CGST and SGST separately
                                    const halfAmount = amount / 2;
                                    return (
                                        <React.Fragment key={profile.id}>
                                            <div className="flex justify-between text-sm">
                                                <span>CGST ({profile.rate}%)</span>
                                                <span>{formatCurrency(halfAmount, room.currency)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>SGST ({profile.rate}%)</span>
                                                <span>{formatCurrency(halfAmount, room.currency)}</span>
                                            </div>
                                        </React.Fragment>
                                    );
                                } else {
                                    // Show single tax line
                                    return (
                                        <div key={profile.id} className="flex justify-between text-sm">
                                            <span>{profile.name} ({profile.rate}%)</span>
                                            <span>{formatCurrency(amount, room.currency)}</span>
                                        </div>
                                    );
                                }
                            })}
                        </>
                    );
                })()}

                {serviceTaxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span>Service Charge ({room.serviceTaxRate}%)</span>
                        <span>{formatCurrency(serviceTaxAmount, room.currency)}</span>
                    </div>
                )}
                <div className="flex justify-between text-xl font-black mt-4 pt-4 border-t-2 border-black">
                    <span>TOTAL</span>
                    <span>{formatCurrency(total, room.currency)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs opacity-60 flex flex-col items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <p>Generated by Split App</p>
                <p className="font-mono">{room.code}</p>
            </div>

            {/* Bottom jagged edge effect */}
            <div className="absolute bottom-0 left-0 w-full h-4 bg-[linear-gradient(45deg,transparent_33.333%,#ffffff_33.333%,#ffffff_66.667%,transparent_66.667%),linear-gradient(-45deg,transparent_33.333%,#ffffff_33.333%,#ffffff_66.667%,transparent_66.667%)] bg-[length:20px_20px] bg-[position:0_10px]"></div>
        </div>
    );
});

ReceiptCard.displayName = 'ReceiptCard';
