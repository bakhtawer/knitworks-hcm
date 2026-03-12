
import React, { useState, useRef, useEffect } from 'react';
import { 
    ScanFace, CheckCircle, Settings, Wifi, RefreshCw, Server, 
    AlertCircle, XCircle, Terminal, Activity, Database, HardDrive, Cloud
} from 'lucide-react';
import { Employee } from '../types';

export const FaceRecKiosk = ({ employees, onMarkAttendance }: { employees: Employee[], onMarkAttendance: (empId: string, type: 'IN' | 'OUT') => void }) => {
    const [mode, setMode] = useState<'WEBCAM' | 'DEVICE' | 'ZKBIOTIME'>('WEBCAM');
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
    const [matchedEmp, setMatchedEmp] = useState<string>(''); 
    const [msg, setMsg] = useState('');

    // Device Config
    const [deviceConfig, setDeviceConfig] = useState({ 
        ip: '192.168.1.201', 
        port: '4370', 
        type: 'ZKTeco KF160'
    });

    // ZKBioTime Config
    const [zkConfig, setZkConfig] = useState({
        url: 'http://your-zkbiotime-server:8081',
        username: 'admin',
        password: ''
    });
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [bridgeStatus, setBridgeStatus] = useState<'DISCONNECTED' | 'CONNECTED'>('DISCONNECTED');
    const [syncLog, setSyncLog] = useState<string[]>([]);

    // Check if the local bridge server is running
    useEffect(() => {
        const checkBridge = async () => {
            try {
                const res = await fetch('/api/biometric/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ip: '0.0.0.0', port: '0' }) // Dummy to see if server responds
                });
                setBridgeStatus('CONNECTED');
            } catch (e) {
                setBridgeStatus('DISCONNECTED');
            }
        };
        const timer = setInterval(checkBridge, 5000);
        checkBridge();
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (mode === 'WEBCAM') {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
                .catch(() => setMsg("Camera unavailable."));
        }
    }, [mode]);

    const handleWebcamScan = (type: 'IN' | 'OUT') => {
        if (!matchedEmp) { alert("Select an employee for demo scanning."); return; }
        setStatus('SCANNING');
        setMsg(`Analyzing Face Patterns...`);
        setTimeout(() => {
             setStatus('SUCCESS');
             onMarkAttendance(matchedEmp, type);
             setMsg(`Identity Verified: ${type} logged.`);
             setTimeout(() => { setStatus('IDLE'); setMsg(''); }, 2000);
        }, 1500);
    };

    const handleDeviceConnect = async () => {
        setIsConnecting(true);
        setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] Attempting Handshake with ${deviceConfig.ip}...`, ...prev]);
        try {
            const res = await fetch('/api/biometric/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip: deviceConfig.ip, port: deviceConfig.port })
            });
            const data = await res.json();
            if (data.success) {
                setIsConnected(true);
                setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] SUCCESS: Established Link with ${data.device.name || 'KF160'}`, ...prev]);
            } else {
                throw new Error(data.error);
            }
        } catch (e: any) {
            setIsConnected(false);
            setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] ERROR: Connection Timeout. ${e.message}`, ...prev]);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSync = async () => {
        if (!zkConfig.url || !zkConfig.username || !zkConfig.password) {
            alert("Please provide ZKBioTime URL, Username and Password.");
            return;
        }
        setIsConnecting(true);
        setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] Connecting to ZKBioTime API at ${zkConfig.url}...`, ...prev]);
        try {
            const res = await fetch('/api/biometric/zkbiotime/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(zkConfig)
            });
            const data = await res.json();
            if (data.success) {
                setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] SUCCESS: Synced ${data.synced} records from ZKBioTime Cloud.`, ...prev]);
                alert(`Successfully synced ${data.synced} attendance records from ZKBioTime.`);
            } else {
                throw new Error(data.error);
            }
        } catch (e: any) {
            setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] ZKBIOTIME ERROR: ${e.message}`, ...prev]);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="h-full space-y-8">
            <div className="flex justify-center">
                <div className="bg-white p-1 rounded-xl border flex shadow-sm overflow-x-auto">
                    <button onClick={() => setMode('WEBCAM')} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${mode === 'WEBCAM' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <ScanFace size={18}/> Digital Kiosk
                    </button>
                    <button onClick={() => setMode('DEVICE')} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${mode === 'DEVICE' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <HardDrive size={18}/> KF160 Hardware
                    </button>
                    <button onClick={() => setMode('ZKBIOTIME')} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${mode === 'ZKBIOTIME' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <Cloud size={18}/> ZKBioTime Cloud
                    </button>
                </div>
            </div>

            {mode === 'WEBCAM' ? (
                <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-6">
                    <div className="relative w-full aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-slate-200">
                        <video ref={videoRef} autoPlay muted className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            {status === 'IDLE' && <div className="w-48 h-48 border border-white/10 rounded-full animate-[spin_10s_linear_infinite]"/>}
                            {status === 'SCANNING' && <div className="w-56 h-56 border-4 border-blue-500/50 rounded-full animate-pulse flex items-center justify-center">
                                <div className="w-40 h-1 bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-[bounce_2s_infinite]"/>
                            </div>}
                            {status === 'SUCCESS' && <div className="w-56 h-56 border-4 border-emerald-500 rounded-full flex items-center justify-center bg-emerald-500/20 animate-in zoom-in duration-300">
                                <CheckCircle size={80} className="text-emerald-500"/>
                            </div>}
                        </div>
                        {msg && <div className="absolute bottom-10 left-0 right-0 text-center animate-in fade-in slide-in-from-bottom-2">
                            <span className="bg-slate-900/90 backdrop-blur text-white px-8 py-3 rounded-full font-bold text-sm shadow-xl border border-white/10">{msg}</span>
                        </div>}
                    </div>
                    <div className="w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.2em] text-center">Identity Simulation (Demo Mode)</label>
                        <select className="w-full border border-slate-200 p-4 rounded-2xl bg-slate-50 font-bold mb-6 outline-none focus:border-blue-500 transition-all appearance-none text-center" value={matchedEmp} onChange={e => setMatchedEmp(e.target.value)}>
                            <option value="">-- Choose Employee to Scan --</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.id})</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleWebcamScan('IN')} className="bg-emerald-600 text-white py-6 rounded-2xl font-black text-xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95">CLOCK IN</button>
                            <button onClick={() => handleWebcamScan('OUT')} className="bg-red-600 text-white py-6 rounded-2xl font-black text-xl hover:bg-red-700 shadow-xl shadow-red-100 transition-all active:scale-95">CLOCK OUT</button>
                        </div>
                    </div>
                </div>
            ) : mode === 'DEVICE' ? (
                <div className="w-full max-w-5xl mx-auto space-y-6">
                    {/* Bridge Status Indicator */}
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${bridgeStatus === 'CONNECTED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        <div className="flex items-center gap-3">
                            <Activity size={20} className={bridgeStatus === 'CONNECTED' ? 'animate-pulse' : ''}/>
                            <span className="font-bold text-sm uppercase tracking-wider">Local Bridge Service: {bridgeStatus}</span>
                        </div>
                        {bridgeStatus === 'DISCONNECTED' && (
                            <div className="text-[10px] bg-red-600 text-white px-3 py-1 rounded-full font-bold animate-bounce">
                                Action Required: Start 'server/index.js'
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Device Management */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                            <h3 className="font-black text-2xl mb-8 flex items-center gap-3 text-slate-800 uppercase tracking-tight">
                                <Database className="text-blue-600"/> Hardware Link
                            </h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Device IP Address</label>
                                        <input className="w-full border border-slate-200 p-4 rounded-2xl font-mono text-sm focus:border-blue-500 outline-none bg-slate-50 transition-all" value={deviceConfig.ip} onChange={e => setDeviceConfig({...deviceConfig, ip: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Comm Port</label>
                                        <input className="w-full border border-slate-200 p-4 rounded-2xl font-mono text-sm focus:border-blue-500 outline-none bg-slate-50 transition-all" value={deviceConfig.port} onChange={e => setDeviceConfig({...deviceConfig, port: e.target.value})} />
                                    </div>
                                </div>
                                <button onClick={handleDeviceConnect} disabled={isConnecting || bridgeStatus === 'DISCONNECTED'} className={`w-full py-6 rounded-2xl font-black text-lg flex justify-center items-center gap-3 shadow-xl transition-all disabled:opacity-50 ${isConnected ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-900 text-white hover:bg-black shadow-slate-200'}`}>
                                    {isConnecting ? <RefreshCw className="animate-spin" size={24}/> : isConnected ? <CheckCircle size={24}/> : <Wifi size={24}/>}
                                    {isConnecting ? 'Linking...' : isConnected ? 'Connection Stable' : 'Test Device Link'}
                                </button>
                                
                                {bridgeStatus === 'DISCONNECTED' && (
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 items-start">
                                        <AlertCircle className="text-amber-600 shrink-0" size={18}/>
                                        <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                                            The browser cannot reach the KF160 directly. Please run <code className="bg-amber-100 px-1 rounded">node server/index.js</code> on your PC to enable this feature.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Monitor Console */}
                        <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl flex flex-col border border-slate-800">
                             <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                 <h3 className="font-bold text-white flex items-center gap-2 uppercase text-xs tracking-widest"><Terminal size={16} className="text-emerald-400"/> System Monitor</h3>
                                 <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-red-500 shadow-[0_0_12px_#ef4444]'}`}/>
                             </div>
                             <div className="flex-1 font-mono text-[10px] overflow-y-auto h-64 space-y-2 mb-6 scrollbar-hide">
                                 {syncLog.length === 0 ? <div className="text-slate-600 italic tracking-tighter">Ready for command...</div> : syncLog.map((log, i) => (
                                     <div key={i} className={`pb-2 border-b border-white/5 animate-in slide-in-from-left-2 duration-300 ${log.includes('ERROR') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                                        <span className="opacity-30 mr-2">&gt;</span>{log}
                                     </div>
                                 ))}
                             </div>
                             <button onClick={handleSync} disabled={!isConnected || isConnecting} className="w-full bg-emerald-500 text-slate-900 py-6 rounded-2xl font-black text-lg hover:bg-emerald-400 disabled:opacity-30 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
                                 <RefreshCw size={24} className={isConnecting ? 'animate-spin' : ''}/> Sync Cloud Database
                             </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-5xl mx-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* ZKBioTime Config */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                            <h3 className="font-black text-2xl mb-8 flex items-center gap-3 text-slate-800 uppercase tracking-tight">
                                <Cloud className="text-blue-600"/> ZKBioTime API
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Server URL</label>
                                    <input className="w-full border border-slate-200 p-4 rounded-2xl font-mono text-sm focus:border-blue-500 outline-none bg-slate-50 transition-all" value={zkConfig.url} onChange={e => setZkConfig({...zkConfig, url: e.target.value})} placeholder="http://1.2.3.4:8081" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Username</label>
                                    <input className="w-full border border-slate-200 p-4 rounded-2xl font-mono text-sm focus:border-blue-500 outline-none bg-slate-50 transition-all" value={zkConfig.username} onChange={e => setZkConfig({...zkConfig, username: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Password</label>
                                    <input type="password" className="w-full border border-slate-200 p-4 rounded-2xl font-mono text-sm focus:border-blue-500 outline-none bg-slate-50 transition-all" value={zkConfig.password} onChange={e => setZkConfig({...zkConfig, password: e.target.value})} />
                                </div>
                                <button onClick={handleSync} disabled={isConnecting} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-100">
                                    {isConnecting ? <RefreshCw className="animate-spin" size={24}/> : <RefreshCw size={24}/>}
                                    {isConnecting ? 'Syncing...' : 'Sync from ZKBioTime'}
                                </button>
                            </div>
                        </div>

                        {/* Monitor Console */}
                        <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl flex flex-col border border-slate-800">
                             <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                 <h3 className="font-bold text-white flex items-center gap-2 uppercase text-xs tracking-widest"><Terminal size={16} className="text-emerald-400"/> API Monitor</h3>
                             </div>
                             <div className="flex-1 font-mono text-[10px] overflow-y-auto h-64 space-y-2 mb-6 scrollbar-hide">
                                 {syncLog.length === 0 ? <div className="text-slate-600 italic tracking-tighter">Ready for command...</div> : syncLog.map((log, i) => (
                                     <div key={i} className={`pb-2 border-b border-white/5 animate-in slide-in-from-left-2 duration-300 ${log.includes('ERROR') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                                        <span className="opacity-30 mr-2">&gt;</span>{log}
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
