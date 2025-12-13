
import React, { useState, useRef, useEffect } from 'react';
import { ScanFace, CheckCircle } from 'lucide-react';
import { Employee } from '../types';

export const FaceRecKiosk = ({ employees, onMarkAttendance }: { employees: Employee[], onMarkAttendance: (empId: string, type: 'IN' | 'OUT') => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
    const [matchedEmp, setMatchedEmp] = useState<string>(''); // For simulation
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera access denied", err);
                setMsg("Camera access denied or unavailable.");
            }
        };
        startCamera();
        return () => {
             // Cleanup tracks if needed
        };
    }, []);

    const handleScan = (type: 'IN' | 'OUT') => {
        if (!matchedEmp) {
            alert("For this simulation, please select an employee from the dropdown below to simulate a face match.");
            return;
        }
        setStatus('SCANNING');
        setMsg(`Scanning face for ${type}...`);
        
        setTimeout(() => {
             setStatus('SUCCESS');
             onMarkAttendance(matchedEmp, type);
             setMsg(`Successfully Marked ${type}`);
             setTimeout(() => {
                 setStatus('IDLE');
                 setMsg('');
             }, 3000);
        }, 1500);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover opacity-80" />
                
                {/* Overlay UI */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {status === 'IDLE' && <div className="w-64 h-64 border-2 border-white/30 rounded-full flex items-center justify-center"><ScanFace size={48} className="text-white/50"/></div>}
                    {status === 'SCANNING' && <div className="w-64 h-64 border-4 border-blue-500 rounded-full animate-pulse relative"><div className="absolute inset-0 bg-blue-500/10 rounded-full"/></div>}
                    {status === 'SUCCESS' && <div className="w-64 h-64 border-4 border-emerald-500 rounded-full flex items-center justify-center bg-emerald-500/20"><CheckCircle size={64} className="text-emerald-500"/></div>}
                </div>
                
                {msg && <div className="absolute bottom-8 left-0 right-0 text-center"><span className="bg-black/70 text-white px-4 py-2 rounded-full font-bold">{msg}</span></div>}
            </div>

            <div className="w-full bg-white p-6 rounded-xl shadow-lg border">
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Simulate Face Match For (Demo Only)</label>
                    <select className="w-full border p-3 rounded-lg bg-slate-50 font-bold" value={matchedEmp} onChange={e => setMatchedEmp(e.target.value)}>
                        <option value="">-- Select Employee to Simulate --</option>
                        {employees.slice(0, 20).map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.id})</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleScan('IN')} disabled={status !== 'IDLE'} className="bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 disabled:opacity-50">
                        CLOCK IN
                    </button>
                    <button onClick={() => handleScan('OUT')} disabled={status !== 'IDLE'} className="bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-50">
                        CLOCK OUT
                    </button>
                </div>
            </div>
        </div>
    );
};
