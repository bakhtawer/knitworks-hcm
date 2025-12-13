
import React, { useState, useRef, useEffect } from 'react';
import { ScanFace, CheckCircle, Settings, Wifi, RefreshCw, Server, AlertCircle } from 'lucide-react';
import { Employee } from '../types';

export const FaceRecKiosk = ({ employees, onMarkAttendance }: { employees: Employee[], onMarkAttendance: (empId: string, type: 'IN' | 'OUT') => void }) => {
    // Mode: 'WEBCAM' (Browser) or 'DEVICE' (Third Party Hardware)
    const [mode, setMode] = useState<'WEBCAM' | 'DEVICE'>('WEBCAM');
    
    // Webcam State
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
    const [matchedEmp, setMatchedEmp] = useState<string>(''); 
    const [msg, setMsg] = useState('');

    // Device Config State
    const [deviceConfig, setDeviceConfig] = useState({ 
        ip: '192.168.1.201', 
        port: '4370', 
        type: 'ZK_TECO', // or HIKVISION
        apiKey: '******'
    });
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [syncLog, setSyncLog] = useState<string[]>([]);

    useEffect(() => {
        if (mode === 'WEBCAM') {
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
        }
    }, [mode]);

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

    const handleDeviceConnect = () => {
        setIsConnecting(true);
        // Simulate network connection
        setTimeout(() => {
            setIsConnecting(false);
            if (Math.random() > 0.1) {
                setIsConnected(true);
                setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] Connected to ${deviceConfig.type} at ${deviceConfig.ip}`, ...prev]);
            } else {
                setIsConnected(false);
                alert("Connection Timeout: Ensure device is on the same network.");
            }
        }, 1500);
    };

    const handleSync = () => {
        if (!isConnected) return;
        setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] Syncing attendance logs...`, ...prev]);
        setTimeout(() => {
            const randomCount = Math.floor(Math.random() * 5) + 1;
            setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] Synced ${randomCount} records successfully.`, ...prev]);
            alert(`Synced ${randomCount} attendance records from device.`);
        }, 2000);
    };

    return (
        <div className="h-full flex flex-col items-center">
            {/* Toggle Header */}
            <div className="bg-white p-1 rounded-lg border flex mb-6 shadow-sm">
                <button onClick={() => setMode('WEBCAM')} className={`px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${mode === 'WEBCAM' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}>
                    <ScanFace size={16}/> Browser Kiosk
                </button>
                <button onClick={() => setMode('DEVICE')} className={`px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${mode === 'DEVICE' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}>
                    <Server size={16}/> Hardware Integration
                </button>
            </div>

            {mode === 'WEBCAM' && (
                <div className="flex flex-col items-center justify-center w-full max-w-2xl space-y-6 animate-in fade-in">
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
            )}

            {mode === 'DEVICE' && (
                <div className="w-full max-w-3xl animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Configuration Panel */}
                        <div className="bg-white p-6 rounded-xl shadow-lg border">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                                <Settings className="text-slate-500"/> Device Configuration
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Device Type</label>
                                    <select className="w-full border p-2 rounded" value={deviceConfig.type} onChange={e => setDeviceConfig({...deviceConfig, type: e.target.value})}>
                                        <option value="ZK_TECO">ZKTeco Biometric (TFT/Face)</option>
                                        <option value="HIKVISION">Hikvision Face Terminal</option>
                                        <option value="DAHUA">Dahua Access Control</option>
                                        <option value="GENERIC_RTSP">Generic RTSP Camera</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">IP Address</label>
                                        <input className="w-full border p-2 rounded font-mono" value={deviceConfig.ip} onChange={e => setDeviceConfig({...deviceConfig, ip: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Port</label>
                                        <input className="w-full border p-2 rounded font-mono" value={deviceConfig.port} onChange={e => setDeviceConfig({...deviceConfig, port: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Key / Password</label>
                                    <input type="password" className="w-full border p-2 rounded font-mono" value={deviceConfig.apiKey} onChange={e => setDeviceConfig({...deviceConfig, apiKey: e.target.value})} />
                                </div>
                                
                                <button onClick={handleDeviceConnect} disabled={isConnecting} className={`w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 ${isConnected ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                                    {isConnecting ? <RefreshCw className="animate-spin" size={18}/> : isConnected ? <CheckCircle size={18}/> : <Wifi size={18}/>}
                                    {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Test Connection'}
                                </button>
                            </div>
                        </div>

                        {/* Status & Sync Panel */}
                        <div className="bg-slate-900 text-slate-300 p-6 rounded-xl shadow-lg border border-slate-700 flex flex-col">
                             <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                                 <h3 className="font-bold text-white flex items-center gap-2"><Server size={18}/> Live Logs</h3>
                                 <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}/>
                             </div>
                             
                             <div className="flex-1 font-mono text-xs overflow-y-auto h-48 space-y-1 mb-4">
                                 {syncLog.length === 0 && <span className="opacity-50 italic">No logs available. Connect a device to start.</span>}
                                 {syncLog.map((log, i) => (
                                     <div key={i} className="text-emerald-400 border-b border-slate-800 pb-1">{log}</div>
                                 ))}
                             </div>

                             <button onClick={handleSync} disabled={!isConnected} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:bg-slate-700">
                                 <RefreshCw size={18}/> Sync Logs Now
                             </button>
                        </div>
                    </div>
                    
                    <div className="mt-6 bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                        <AlertCircle className="text-amber-600 shrink-0 mt-1"/>
                        <div>
                            <h4 className="font-bold text-amber-800">Integration Note</h4>
                            <p className="text-sm text-amber-700 mt-1">
                                For real-world deployment, this module requires a Node.js middleware service (e.g., <span className="font-mono bg-amber-100 px-1 rounded">node-zklib</span>) running on the local network to bridge the communication between the browser-based cloud app and the physical biometric hardware via TCP/IP.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
