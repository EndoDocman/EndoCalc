import growthDataRaw from './growth_data.json';
import splDataRaw from './spl_data.json';

export type Sex = 'male' | 'female';

interface LMSParams { L: number; M: number; S: number; }
interface SDParams { Median: number; SD: number; }

interface GrowthData {
  male: {
    who: { height: Record<string, LMSParams>; weight: Record<string, LMSParams>; };
    iap: { height: Record<string, SDParams>; weight: Record<string, SDParams>; };
  };
  female: {
    who: { height: Record<string, LMSParams>; weight: Record<string, LMSParams>; };
    iap: { height: Record<string, SDParams>; weight: Record<string, SDParams>; };
  };
}

const growthData = growthDataRaw as unknown as GrowthData;
const splData = splDataRaw as { min_age: number; mean: number; sd: number; label: string }[];

/**
 * Biological Clamping Utility
 */
export const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

/**
 * Main SPL SDS Calculation Engine
 */
export const calculateSPLSDS = (spl: number, ageYears: number): { sds: number; label: string } | null => {
  const bracket = [...splData].reverse().find(b => ageYears >= b.min_age);
  if (!bracket || bracket.sd === 0) return null;
  return { sds: (spl - bracket.mean) / bracket.sd, label: bracket.label };
};

/**
 * Standard LMS Formula
 */
export const calculateLMS_Z = (value: number, L: number, M: number, S: number): number => {
  if (L === 0) return Math.log(value / M) / S;
  return (Math.pow(value / M, L) - 1) / (L * S);
};

/**
 * Standard Z-score Formula
 */
export const calculateStandardZ = (value: number, median: number, sd: number): number => {
  return (value - median) / sd;
};

/**
 * Main Height SDS Calculation Engine (Stable Rounding)
 */
export const calculateHeightSDS = (height: number, ageYears: number, sex: Sex): { sds: number; standard: 'WHO' | 'IAP' } => {
  const genderData = growthData[sex];

  if (ageYears < 5) {
    const months = Math.round(clamp(ageYears * 12, 0, 60));
    const params = genderData.who.height[months.toString()];
    if (!params) return { sds: 0, standard: 'WHO' };
    return { 
      sds: calculateLMS_Z(height, params.L, params.M, params.S),
      standard: 'WHO'
    };
  } else {
    const roundedAge = Math.round(clamp(ageYears, 5, 18) * 2) / 2;
    const params = genderData.iap.height[roundedAge.toFixed(1)];
    if (!params) return { sds: 0, standard: 'IAP' };
    return { 
      sds: calculateStandardZ(height, params.Median, params.SD),
      standard: 'IAP'
    };
  }
};

/**
 * Main Weight SDS Calculation Engine (Stable Rounding)
 */
export const calculateWeightSDS = (weight: number, ageYears: number, sex: Sex): { sds: number; standard: 'WHO' | 'IAP' } => {
  const genderData = growthData[sex];

  if (ageYears < 5) {
    const months = Math.round(clamp(ageYears * 12, 0, 60));
    const params = genderData.who.weight[months.toString()];
    if (!params) return { sds: 0, standard: 'WHO' };
    return { 
      sds: calculateLMS_Z(weight, params.L, params.M, params.S),
      standard: 'WHO'
    };
  } else {
    const roundedAge = Math.round(clamp(ageYears, 5, 18) * 2) / 2;
    const params = genderData.iap.weight[roundedAge.toFixed(1)];
    if (!params) return { sds: 0, standard: 'IAP' };
    return { 
      sds: calculateStandardZ(weight, params.Median, params.SD),
      standard: 'IAP'
    };
  }
};

export const calculateAges = (value: number, type: 'height' | 'weight', sex: Sex): number => {
  const genderData = growthData[sex];
  let bestAge = 0;
  let minDiff = Infinity;

  Object.entries(genderData.who[type]).forEach(([month, params]: [string, LMSParams]) => {
    const diff = Math.abs(params.M - value);
    if (diff < minDiff) { minDiff = diff; bestAge = parseInt(month) / 12; }
  });

  Object.entries(genderData.iap[type]).forEach(([age, params]: [string, SDParams]) => {
    const diff = Math.abs(params.Median - value);
    if (diff < minDiff) { minDiff = diff; bestAge = parseFloat(age); }
  });

  return bestAge;
};

export const calculateTargetHeightData = (fatherHeight: number, motherHeight: number, sex: Sex) => {
  const factor = sex === 'male' ? 13 : -13;
  const mph = (fatherHeight + motherHeight + factor) / 2;
  const params18 = growthData[sex].iap.height["18.0"];
  const diff = mph - params18.Median;
  const targetHeight = mph - (0.2 * diff);
  const thSDS = calculateStandardZ(targetHeight, params18.Median, params18.SD);

  return { mph, targetHeight, thSDS, range: [mph - 8.5, mph + 8.5] };
};

export const calculateBMI = (weight: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
};

export const zToPercentile = (z: number): string => {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const percentile = z > 0 ? (1 - p) * 100 : p * 100;
  if (percentile < 0.1) return '<0.1st';
  if (percentile > 99.9) return '>99.9th';
  return `${percentile.toFixed(1)}th`;
};
