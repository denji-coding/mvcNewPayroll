// Philippine SSS 2024 Contribution Table
export function computeSSS(monthlySalary: number): { employee: number; employer: number } {
  const brackets = [
    { min: 0, max: 4249.99, msc: 4000, ee: 180, er: 380 },
    { min: 4250, max: 4749.99, msc: 4500, ee: 202.50, er: 427.50 },
    { min: 4750, max: 5249.99, msc: 5000, ee: 225, er: 475 },
    { min: 5250, max: 5749.99, msc: 5500, ee: 247.50, er: 522.50 },
    { min: 5750, max: 6249.99, msc: 6000, ee: 270, er: 570 },
    { min: 6250, max: 6749.99, msc: 6500, ee: 292.50, er: 617.50 },
    { min: 6750, max: 7249.99, msc: 7000, ee: 315, er: 665 },
    { min: 7250, max: 7749.99, msc: 7500, ee: 337.50, er: 712.50 },
    { min: 7750, max: 8249.99, msc: 8000, ee: 360, er: 760 },
    { min: 8250, max: 8749.99, msc: 8500, ee: 382.50, er: 807.50 },
    { min: 8750, max: 9249.99, msc: 9000, ee: 405, er: 855 },
    { min: 9250, max: 9749.99, msc: 9500, ee: 427.50, er: 902.50 },
    { min: 9750, max: 10249.99, msc: 10000, ee: 450, er: 950 },
    { min: 10250, max: 10749.99, msc: 10500, ee: 472.50, er: 997.50 },
    { min: 10750, max: 11249.99, msc: 11000, ee: 495, er: 1045 },
    { min: 11250, max: 11749.99, msc: 11500, ee: 517.50, er: 1092.50 },
    { min: 11750, max: 12249.99, msc: 12000, ee: 540, er: 1140 },
    { min: 12250, max: 12749.99, msc: 12500, ee: 562.50, er: 1187.50 },
    { min: 12750, max: 13249.99, msc: 13000, ee: 585, er: 1235 },
    { min: 13250, max: 13749.99, msc: 13500, ee: 607.50, er: 1282.50 },
    { min: 13750, max: 14249.99, msc: 14000, ee: 630, er: 1330 },
    { min: 14250, max: 14749.99, msc: 14500, ee: 652.50, er: 1377.50 },
    { min: 14750, max: 15249.99, msc: 15000, ee: 675, er: 1425 },
    { min: 15250, max: 15749.99, msc: 15500, ee: 697.50, er: 1472.50 },
    { min: 15750, max: 16249.99, msc: 16000, ee: 720, er: 1520 },
    { min: 16250, max: 16749.99, msc: 16500, ee: 742.50, er: 1567.50 },
    { min: 16750, max: 17249.99, msc: 17000, ee: 765, er: 1615 },
    { min: 17250, max: 17749.99, msc: 17500, ee: 787.50, er: 1662.50 },
    { min: 17750, max: 18249.99, msc: 18000, ee: 810, er: 1710 },
    { min: 18250, max: 18749.99, msc: 18500, ee: 832.50, er: 1757.50 },
    { min: 18750, max: 19249.99, msc: 19000, ee: 855, er: 1805 },
    { min: 19250, max: 19749.99, msc: 19500, ee: 877.50, er: 1852.50 },
    { min: 19750, max: 20249.99, msc: 20000, ee: 900, er: 1900 },
    { min: 20250, max: 20749.99, msc: 20500, ee: 922.50, er: 1947.50 },
    { min: 20750, max: 21249.99, msc: 21000, ee: 945, er: 1995 },
    { min: 21250, max: 21749.99, msc: 21500, ee: 967.50, er: 2042.50 },
    { min: 21750, max: 22249.99, msc: 22000, ee: 990, er: 2090 },
    { min: 22250, max: 22749.99, msc: 22500, ee: 1012.50, er: 2137.50 },
    { min: 22750, max: 23249.99, msc: 23000, ee: 1035, er: 2185 },
    { min: 23250, max: 23749.99, msc: 23500, ee: 1057.50, er: 2232.50 },
    { min: 23750, max: 24249.99, msc: 24000, ee: 1080, er: 2280 },
    { min: 24250, max: 24749.99, msc: 24500, ee: 1102.50, er: 2327.50 },
    { min: 24750, max: 25249.99, msc: 25000, ee: 1125, er: 2375 },
    { min: 25250, max: 25749.99, msc: 25500, ee: 1147.50, er: 2422.50 },
    { min: 25750, max: 26249.99, msc: 26000, ee: 1170, er: 2470 },
    { min: 26250, max: 26749.99, msc: 26500, ee: 1192.50, er: 2517.50 },
    { min: 26750, max: 27249.99, msc: 27000, ee: 1215, er: 2565 },
    { min: 27250, max: 27749.99, msc: 27500, ee: 1237.50, er: 2612.50 },
    { min: 27750, max: 28249.99, msc: 28000, ee: 1260, er: 2660 },
    { min: 28250, max: 28749.99, msc: 28500, ee: 1282.50, er: 2707.50 },
    { min: 28750, max: 29249.99, msc: 29000, ee: 1305, er: 2755 },
    { min: 29250, max: 29749.99, msc: 29500, ee: 1327.50, er: 2802.50 },
    { min: 29750, max: Infinity, msc: 30000, ee: 1350, er: 2850 },
  ];

  const bracket = brackets.find(b => monthlySalary >= b.min && monthlySalary <= b.max) || brackets[brackets.length - 1];
  return { employee: bracket.ee, employer: bracket.er };
}

// PhilHealth 2024 - 5% of monthly basic salary (2.5% employee share)
export function computePhilHealth(monthlySalary: number): { employee: number; employer: number } {
  const rate = 0.05;
  const minContribution = 500; // Minimum monthly premium
  const maxContribution = 5000; // Maximum monthly premium (based on 100k ceiling)
  
  let totalContribution = monthlySalary * rate;
  totalContribution = Math.max(minContribution, Math.min(maxContribution, totalContribution));
  
  const share = totalContribution / 2;
  return { employee: share, employer: share };
}

// Pag-IBIG 2024 - 2% employee, 2% employer (max 100 each based on 5k ceiling)
export function computePagIBIG(monthlySalary: number): { employee: number; employer: number } {
  const ceiling = 5000;
  const rate = 0.02;
  const maxContribution = 100;
  
  const base = Math.min(monthlySalary, ceiling);
  const contribution = Math.min(base * rate, maxContribution);
  
  return { employee: contribution, employer: contribution };
}

// BIR Withholding Tax 2024 (Monthly)
export function computeWithholdingTax(taxableIncome: number): number {
  // Annual tax brackets converted to monthly
  const brackets = [
    { min: 0, max: 20833, rate: 0, base: 0 },
    { min: 20833, max: 33333, rate: 0.15, base: 0 },
    { min: 33333, max: 66667, rate: 0.20, base: 1875 },
    { min: 66667, max: 166667, rate: 0.25, base: 8541.67 },
    { min: 166667, max: 666667, rate: 0.30, base: 33541.67 },
    { min: 666667, max: Infinity, rate: 0.35, base: 183541.67 },
  ];

  const bracket = brackets.find(b => taxableIncome > b.min && taxableIncome <= b.max) || brackets[0];
  
  if (taxableIncome <= 20833) return 0;
  
  const excess = taxableIncome - bracket.min;
  return bracket.base + (excess * bracket.rate);
}

export interface SalaryCalculationInput {
  basicMonthlySalary: number;
  daysWorked: number;
  overtimeHours: number;
  allowances: number;
  loanDeductions: number;
  otherDeductions: number;
  workingDaysPerMonth?: number; // Default 22
  leaveWithPayDays?: number;
  leaveWithoutPayDays?: number;
}

export interface SalaryCalculationResult {
  dailyRate: number;
  hourlyRate: number;
  basicPay: number;
  overtimePay: number;
  leaveWithPayEarnings: number;
  leaveWithoutPayDeduction: number;
  grossPay: number;
  sssContribution: number;
  philhealthContribution: number;
  pagibigContribution: number;
  withholdingTax: number;
  totalDeductions: number;
  netPay: number;
  // For display
  monthlyGross: number;
}

export function calculateSalary(input: SalaryCalculationInput): SalaryCalculationResult {
  const workingDays = input.workingDaysPerMonth || 22;
  const lwpDays = input.leaveWithPayDays || 0;
  const lwopDays = input.leaveWithoutPayDays || 0;
  
  // Calculate rates
  const dailyRate = input.basicMonthlySalary / workingDays;
  const hourlyRate = dailyRate / 8;
  
  // Calculate earnings
  const basicPay = dailyRate * input.daysWorked;
  const overtimePay = hourlyRate * 1.25 * input.overtimeHours;
  const leaveWithPayEarnings = dailyRate * lwpDays;
  // LWOP deduction is informational — those days simply aren't in daysWorked
  // but we show it as a line item for transparency
  const leaveWithoutPayDeduction = dailyRate * lwopDays;
  const grossPay = basicPay + overtimePay + leaveWithPayEarnings + input.allowances;
  
  // Monthly equivalent for contribution calculations (semi-monthly payroll)
  const monthlyGross = grossPay * 2;
  
  // Government contributions (employee share only, divided by 2 for semi-monthly)
  const sss = computeSSS(monthlyGross);
  const philhealth = computePhilHealth(monthlyGross);
  const pagibig = computePagIBIG(monthlyGross);
  
  const sssContribution = sss.employee / 2;
  const philhealthContribution = philhealth.employee / 2;
  const pagibigContribution = pagibig.employee / 2;
  
  // Taxable income (gross - mandatory deductions)
  const taxableIncome = grossPay - sssContribution - philhealthContribution - pagibigContribution;
  const withholdingTax = computeWithholdingTax(taxableIncome * 2) / 2; // Monthly tax / 2
  
  // Total deductions
  const totalDeductions = 
    sssContribution + 
    philhealthContribution + 
    pagibigContribution + 
    withholdingTax + 
    input.loanDeductions + 
    input.otherDeductions;
  
  // Net pay
  const netPay = grossPay - totalDeductions;
  
  return {
    dailyRate: Math.round(dailyRate * 100) / 100,
    hourlyRate: Math.round(hourlyRate * 100) / 100,
    basicPay: Math.round(basicPay * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    leaveWithPayEarnings: Math.round(leaveWithPayEarnings * 100) / 100,
    leaveWithoutPayDeduction: Math.round(leaveWithoutPayDeduction * 100) / 100,
    grossPay: Math.round(grossPay * 100) / 100,
    sssContribution: Math.round(sssContribution * 100) / 100,
    philhealthContribution: Math.round(philhealthContribution * 100) / 100,
    pagibigContribution: Math.round(pagibigContribution * 100) / 100,
    withholdingTax: Math.round(withholdingTax * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
    monthlyGross: Math.round(monthlyGross * 100) / 100,
  };
}
