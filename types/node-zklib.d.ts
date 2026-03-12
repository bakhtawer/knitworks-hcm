declare module 'node-zklib' {
  class ZKLib {
    constructor(ip: string, port: number, timeout: number, inport: number);
    createSocket(): Promise<void>;
    getInfo(): Promise<any>;
    getAttendance(): Promise<{ data: any[] }>;
    disconnect(): Promise<void>;
  }
  export default ZKLib;
}
