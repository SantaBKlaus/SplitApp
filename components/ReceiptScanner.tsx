'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Loader2, Plus, Minus, Trash2, ScanLine, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { bauhausBtn, bauhausCard, modal } from '@/lib/animations';

interface ScannedItem {
    name: string;
    price: number;
    quantity: number;
}

interface TaxProfile {
    name: string;
    rate: number;
    isGlobal: boolean;
    isDouble?: boolean;
}

interface ReceiptScannerProps {
    onScanComplete: (items: ScannedItem[], serviceTax: number, taxProfiles: TaxProfile[]) => void;
    onClose: () => void;
}

export default function ReceiptScanner({ onScanComplete, onClose }: ReceiptScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [serviceTax, setServiceTax] = useState(0);
    const [taxProfiles, setTaxProfiles] = useState<TaxProfile[]>([]);
    const [step, setStep] = useState<'upload' | 'review'>('upload');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/scan-receipt', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.error) {
                alert('Failed to scan receipt: ' + data.error);
                setIsScanning(false);
                return;
            }

            setScannedItems(data.items || []);
            setServiceTax(data.serviceTax || 0);
            setTaxProfiles(data.taxProfiles || []);
            setStep('review');
        } catch (error) {
            console.error('Error scanning receipt:', error);
            alert('An error occurred while scanning the receipt.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleUpdateItem = (index: number, field: keyof ScannedItem, value: any) => {
        const newItems = [...scannedItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setScannedItems(newItems);
    };

    const handleDeleteItem = (index: number) => {
        const newItems = scannedItems.filter((_, i) => i !== index);
        setScannedItems(newItems);
    };

    const handleAddItem = () => {
        setScannedItems([...scannedItems, { name: '', price: 0, quantity: 1 }]);
    };

    const handleConfirm = () => {
        onScanComplete(scannedItems, serviceTax, taxProfiles);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                variants={modal}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-6 w-[95%] max-w-lg max-h-[90vh] overflow-y-auto relative z-10 shadow-[8px_8px_0px_0px_var(--shadow-color)] rounded-none"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-foreground flex items-center gap-2 uppercase">
                        <ScanLine className="w-6 h-6" />
                        Scan Receipt
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-none transition-colors"
                    >
                        <X className="w-6 h-6 text-foreground" />
                    </button>
                </div>

                {step === 'upload' ? (
                    <div className="space-y-6">
                        <div className="text-center space-y-4 py-8 border-2 border-dashed border-[var(--border-color)] bg-black/5 dark:bg-white/5 rounded-none">
                            {isScanning ? (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-bauhaus-blue" />
                                    <p className="font-bold text-foreground animate-pulse">Analyzing Receipt...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-center gap-4">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex flex-col items-center gap-2 p-4 bg-[var(--card-bg)] border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all rounded-none w-32"
                                        >
                                            <Camera className="w-8 h-8 text-foreground" />
                                            <span className="font-bold text-sm">Camera</span>
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex flex-col items-center gap-2 p-4 bg-[var(--card-bg)] border-2 border-[var(--border-color)] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all rounded-none w-32"
                                        >
                                            <Upload className="w-8 h-8 text-foreground" />
                                            <span className="font-bold text-sm">Upload</span>
                                        </button>
                                    </div>
                                    <p className="text-sm text-foreground/60 font-medium">
                                        Take a photo or upload an image
                                    </p>
                                </>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-3">
                            <div className="flex-1 flex items-center justify-between bg-bauhaus-yellow/20 p-3 border border-bauhaus-yellow rounded-none min-w-[200px]">
                                <span className="font-bold text-sm">Service Tax:</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={serviceTax}
                                        onChange={(e) => setServiceTax(parseFloat(e.target.value) || 0)}
                                        className="w-16 bg-transparent border-b border-black font-bold text-center focus:outline-none"
                                    />
                                    <span className="font-bold">%</span>
                                </div>
                            </div>

                            {taxProfiles.length > 0 && (
                                <div className="w-full space-y-2">
                                    <h3 className="text-xs font-bold uppercase text-foreground/60">Detected Taxes</h3>
                                    {taxProfiles.map((profile, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-bauhaus-blue/10 p-2 border border-bauhaus-blue rounded-none">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-bauhaus-blue" />
                                                <span className="font-bold text-sm">{profile.name}</span>
                                                {profile.isGlobal && <span className="text-[10px] bg-bauhaus-blue text-white px-1">GLOBAL</span>}
                                                {profile.isDouble && <span className="text-[10px] bg-bauhaus-yellow text-bauhaus-dark px-1">DOUBLE</span>}
                                            </div>
                                            <span className="font-bold text-sm">{profile.rate}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                            {scannedItems.map((item, index) => (
                                <div key={index} className="flex gap-2 items-start bg-black/5 dark:bg-white/5 p-2 rounded-none">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                                            className="w-full bg-transparent border-b border-[var(--border-color)] focus:border-bauhaus-blue outline-none font-bold text-sm"
                                            placeholder="Item Name"
                                        />
                                        <div className="flex gap-2">
                                            <div className="flex items-center border border-[var(--border-color)] bg-[var(--card-bg)]">
                                                <button
                                                    onClick={() => handleUpdateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                                                    className="px-2 hover:bg-black/10"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateItem(index, 'quantity', item.quantity + 1)}
                                                    className="px-2 hover:bg-black/10"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value))}
                                                className="w-20 bg-transparent border-b border-[var(--border-color)] focus:border-bauhaus-blue outline-none font-bold text-sm text-right"
                                                placeholder="Price"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteItem(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleAddItem}
                            className="w-full py-2 border-2 border-dashed border-[var(--border-color)] text-foreground/60 hover:text-foreground hover:border-foreground font-bold text-sm transition-all rounded-none"
                        >
                            + Add Missing Item
                        </button>

                        <div className="flex gap-3 pt-4 border-t-2 border-[var(--border-color)]">
                            <button
                                onClick={() => setStep('upload')}
                                className="flex-1 py-3 border-2 border-[var(--border-color)] font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all rounded-none"
                            >
                                RESCAN
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 py-3 bg-bauhaus-blue text-white border-2 border-[var(--border-color)] font-bold shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all rounded-none"
                            >
                                ADD ITEMS
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
