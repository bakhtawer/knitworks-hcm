import { GoogleGenAI } from "@google/genai";
import { PayrollEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePayrollReport = async (payrollData: PayrollEntry[], month: string, comparisonData?: PayrollEntry[]): Promise<string> => {
  try {
    // Summarize current month
    const totalCost = payrollData.reduce((acc, curr) => acc + curr.grossSalary, 0);
    const totalOT = payrollData.reduce((acc, curr) => acc + curr.overtimePay, 0);
    const totalCash = payrollData.reduce((acc, curr) => acc + curr.cashSalary, 0);
    
    let comparisonText = "";
    if (comparisonData) {
        const prevCost = comparisonData.reduce((acc, curr) => acc + curr.grossSalary, 0);
        const diff = totalCost - prevCost;
        comparisonText = `Comparison with previous month: Variance of ${diff > 0 ? '+' : ''}${diff.toLocaleString()}.`;
    }

    const prompt = `
      You are the HR Director of KnitWorks Manufacturing. Analyze the payroll for ${month}.
      
      Key Data:
      - Total Payroll Cost: ${totalCost}
      - Total Cash Salary Payout: ${totalCash} (High priority to track)
      - Overtime Spend: ${totalOT}
      - Employee Count: ${payrollData.length}
      - ${comparisonText}

      Please provide a report including:
      1. **Executive Summary**: Overall financial health of this month's payroll.
      2. **Variance Analysis**: If comparison data exists, explain why costs went up/down (e.g. more OT, new hires).
      3. **Departmental Outliers**: Which department (Marketing vs Operations) has the highest spend per head?
      4. **Attendance Impact**: Note on deduction impacts due to the new "4th late = 1 day deduction" rule.
      
      Format: Markdown, professional, concise.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Unable to generate report.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Error: Could not connect to AI service for report generation.";
  }
};