
// --- Mock Email Service ---
export const sendEmailNotification = (to: string, subject: string, body: string) => {
    console.log(`[EMAIL SIMULATION] 
    TO: ${to} 
    SUBJECT: ${subject}
    BODY: ${body}
    -------------------------------------------`);
};

// --- CSV Download Helper ---
export const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
            const val = row[h];
            return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
