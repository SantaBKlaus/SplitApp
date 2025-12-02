import { BillItem, RoomParticipant, TaxProfile } from './firebase/firestore';

// Calculate tax amount for an item
export const calculateItemTax = (price: number, profile?: TaxProfile): number => {
    if (!profile) return 0;
    let tax = price * (profile.rate / 100);
    if (profile.isDouble) {
        tax *= 2; // Apply tax twice (e.g. Center & State)
    }
    return tax;
};

// Calculate the total bill amount including tax
export const calculateTotalBill = (items: BillItem[], taxProfiles: TaxProfile[] = [], serviceTaxRate: number = 0): number => {
    return items.reduce((total, item) => {
        const taxProfile = taxProfiles.find(p => p.id === item.taxProfileId);
        // If no specific profile, check for global profile
        const effectiveProfile = taxProfile || taxProfiles.find(p => p.isGlobal);
        const itemTotal = item.price * (item.quantity || 1);
        const tax = calculateItemTax(itemTotal, effectiveProfile);
        const totalWithTax = itemTotal + tax;
        const serviceTax = totalWithTax * (serviceTaxRate / 100);
        return total + totalWithTax + serviceTax;
    }, 0);
};

// Calculate individual share for a specific user including tax
export const calculateUserShare = (items: BillItem[], userId: string, taxProfiles: TaxProfile[] = [], serviceTaxRate: number = 0): number => {
    let userShare = 0;

    items.forEach((item) => {
        if (item.selectedBy.includes(userId)) {
            const numberOfPeople = item.selectedBy.length;
            if (numberOfPeople > 0) {
                const taxProfile = taxProfiles.find(p => p.id === item.taxProfileId);
                // If no specific profile, check for global profile
                const effectiveProfile = taxProfile || taxProfiles.find(p => p.isGlobal);
                const itemTotal = item.price * (item.quantity || 1);
                const tax = calculateItemTax(itemTotal, effectiveProfile);
                const totalWithTax = itemTotal + tax;
                const serviceTax = totalWithTax * (serviceTaxRate / 100);
                const finalItemCost = totalWithTax + serviceTax;
                userShare += finalItemCost / numberOfPeople;
            }
        }
    });

    return userShare;
};

// Calculate split breakdown for all participants
export const calculateSplitBreakdown = (
    items: BillItem[],
    participants: RoomParticipant[],
    taxProfiles: TaxProfile[] = [],
    serviceTaxRate: number = 0
): Record<string, number> => {
    const breakdown: Record<string, number> = {};

    participants.forEach((participant) => {
        breakdown[participant.userId] = calculateUserShare(items, participant.userId, taxProfiles, serviceTaxRate);
    });

    return breakdown;
};

// Format currency based on user's locale or specific currency
export const formatCurrency = (amount: number, currencyCode?: string): string => {
    if (typeof window === 'undefined') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode || 'USD',
        }).format(amount);
    }

    let currency = currencyCode || 'USD';
    const locale = navigator.language;

    if (!currencyCode) {
        if (locale === 'en-IN' || locale.startsWith('hi')) currency = 'INR';
        else if (locale === 'en-GB') currency = 'GBP';
        else if (locale === 'ja-JP') currency = 'JPY';
        else if (locale.includes('DE') || locale.includes('FR') || locale.includes('IT') || locale.includes('ES')) currency = 'EUR';
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

// Calculate total tax amount from all items
export const calculateTotalTax = (items: BillItem[], taxProfiles: TaxProfile[] = []): number => {
    return items.reduce((total, item) => {
        const taxProfile = taxProfiles.find(p => p.id === item.taxProfileId);
        const effectiveProfile = taxProfile || taxProfiles.find(p => p.isGlobal);
        const itemTotal = item.price * (item.quantity || 1);
        const tax = calculateItemTax(itemTotal, effectiveProfile);
        return total + tax;
    }, 0);
};

// Calculate total service charge from all items
export const calculateTotalServiceCharge = (items: BillItem[], taxProfiles: TaxProfile[] = [], serviceTaxRate: number = 0): number => {
    return items.reduce((total, item) => {
        const taxProfile = taxProfiles.find(p => p.id === item.taxProfileId);
        const effectiveProfile = taxProfile || taxProfiles.find(p => p.isGlobal);
        const itemTotal = item.price * (item.quantity || 1);
        const tax = calculateItemTax(itemTotal, effectiveProfile);
        const totalWithTax = itemTotal + tax;
        const serviceTax = totalWithTax * (serviceTaxRate / 100);
        return total + serviceTax;
    }, 0);
};

// Calculate subtotal (before tax and service charge)
export const calculateSubtotal = (items: BillItem[]): number => {
    return items.reduce((total, item) => {
        const itemTotal = item.price * (item.quantity || 1);
        return total + itemTotal;
    }, 0);
};

