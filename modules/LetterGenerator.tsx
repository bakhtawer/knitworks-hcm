
import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { Employee, Position, LetterType } from '../types';
import { LETTER_TEMPLATES, POSITIONS } from '../constants';

export const LetterGenerator = ({ employees = [] }: { employees: Employee[] }) => {
    const [selectedEmp, setSelectedEmp] = useState('');
    const [selectedType, setSelectedType] = useState<LetterType>(LetterType.APPOINTMENT);
    const [preview, setPreview] = useState('');

    useEffect(() => {
        if (selectedEmp && selectedType) {
            const emp = employees.find(e => e.id === selectedEmp);
            const pos = POSITIONS.find(p => p.id === emp?.positionId);
            if (emp && pos) {
                let text = LETTER_TEMPLATES[selectedType];
                text = text.replace('{date}', new Date().toDateString())
                           .replace('{name}', `${emp.firstName} ${emp.lastName}`)
                           .replace('{position}', pos.title)
                           .replace('{department}', emp.department)
                           .replace('{joinDate}', emp.joinDate)
                           .replace('{salary}', pos.baseSalary.toString());
                setPreview(text);
            }
        }
    }, [selectedEmp, selectedType, employees]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-xl border space-y-4">
                <h3 className="font-bold text-lg">Letter Settings</h3>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Select Employee</label>
                    <select className="w-full border p-2 rounded" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}>
                        <option value="">-- Choose Employee --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Letter Type</label>
                    <select className="w-full border p-2 rounded" value={selectedType} onChange={e => setSelectedType(e.target.value as LetterType)}>
                        {Object.values(LetterType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <button onClick={() => window.print()} className="w-full bg-slate-800 text-white py-2 rounded font-bold flex items-center justify-center gap-2">
                    <Printer size={18}/> Print Letter
                </button>
            </div>
            <div className="md:col-span-2 bg-white p-8 rounded-xl border shadow-lg min-h-[500px]">
                {preview ? <pre className="whitespace-pre-wrap font-serif text-slate-800 leading-relaxed">{preview}</pre> : <div className="text-slate-400 italic text-center mt-20">Select an employee and letter type to preview.</div>}
            </div>
        </div>
    );
};
