import growthDataRaw from './growth_data.json';
import splDataRaw from './spl_data.json';

export type Sex = 'male' | 'female';

const growthData = growthDataRaw as any;
const splData = splDataRaw as { min_age: number; mean: number; sd: number; label: string }[];

/**
 * Main SPL SDS Calculation Engine
 */
export const calculateSPLSDS = (spl: number, ageYears: number): { sds: number; label: string } | null => {
  // Find the correct age bracket (descending search)
  const bracket = [...splData].reverse().find(b => ageYears >= b.min_age);
  if (!bracket || bracket.sd === 0) return null;

  return {
    sds: (spl - bracket.mean) / bracket.sd,
    label: bracket.label
  };
};

/**
 * Standard LMS Formula for Z-score (WHO Standard)
 */
export const calculateLMS_Z = (value: number, L: number, M: number, S: number): number => {
  if (L === 0) return Math.log(value / M) / S;
  return (Math.pow(value / M, L) - 1) / (L * S);
};

/**
 * Standard Z-score Formula (Normal Distribution - IAP Standard)
 */
export const calculateStandardZ = (value: number, median: number, sd: number): number => {
  return (value - median) / sd;
};

/**
 * Main Height SDS Calculation Engine
 */
export const calculateHeightSDS = (height: number, ageYears: number, sex: Sex): { sds: number; standard: 'WHO' | 'IAP' } => {
  const genderData = growthData[sex];

  if (ageYears < 5) {
    const months = Math.round(ageYears * 12);
    const params = genderData.who.height[months];
    if (!params) return { sds: 0, standard: 'WHO' };
    return { 
      sds: calculateLMS_Z(height, params.L, params.M, params.S),
      standard: 'WHO'
    };
  } else {
    const roundedAge = Math.round(ageYears * 2) / 2;
    const params = genderData.iap.height[roundedAge.toFixed(1)];
    if (!params) return { sds: 0, standard: 'IAP' };
    return { 
      sds: calculateStandardZ(height, params.Median, params.SD),
      standard: 'IAP'
    };
  }
};

/**
 * Main Weight SDS Calculation Engine
 */
export const calculateWeightSDS = (weight: number, ageYears: number, sex: Sex): { sds: number; standard: 'WHO' | 'IAP' } => {
  const genderData = growthData[sex];

  if (ageYears < 5) {
    const months = Math.round(ageYears * 12);
    const params = genderData.who.weight[months];
    if (!params) return { sds: 0, standard: 'WHO' };
    return { 
      sds: calculateLMS_Z(weight, params.L, params.M, params.S),
      standard: 'WHO'
    };
  } else {
    const roundedAge = Math.round(ageYears * 2) / 2;
    const params = genderData.iap.weight[roundedAge.toFixed(1)];
    if (!params) return { sds: 0, standard: 'IAP' };
    return { 
      sds: calculateStandardZ(weight, params.Median, params.SD),
      standard: 'IAP'
    };
  }
};

/**
 * Calculate Height-Age and Weight-Age
 */
export const calculateAges = (value: number, type: 'height' | 'weight', sex: Sex): number => {
  const genderData = growthData[sex];
  let bestAge = 0;
  let minDiff = Infinity;

  // Search WHO (0-5y)
  Object.entries(genderData.who[type]).forEach(([month, params]: [string, any]) => {
    const diff = Math.abs(params.M - value);
    if (diff < minDiff) {
      minDiff = diff;
      bestAge = parseInt(month) / 12;
    }
  });

  // Search IAP (5-18y)
  Object.entries(genderData.iap[type]).forEach(([age, params]: [string, any]) => {
    const diff = Math.abs(params.Median - value);
    if (diff < minDiff) {
      minDiff = diff;
      bestAge = parseFloat(age);
    }
  });

  return bestAge;
};

/**
 * Target Height (TH) and TH SDS Calculation
 */
export const calculateTargetHeightData = (fatherHeight: number, motherHeight: number, sex: Sex) => {
  const factor = sex === 'male' ? 13 : -13;
  const mph = (fatherHeight + motherHeight + factor) / 2;
  const params18 = growthData[sex].iap.height["18.0"];
  const mean18 = params18.Median;
  const sd18 = params18.SD;
  const diff = mph - mean18;
  const targetHeight = mph - (0.2 * diff);
  const thSDS = calculateStandardZ(targetHeight, mean18, sd18);

  return {
    mph,
    targetHeight,
    thSDS,
    range: [mph - 8.5, mph + 8.5]
  };
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
