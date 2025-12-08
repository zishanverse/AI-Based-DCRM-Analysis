export interface DCRMDataPoint {
  time: number;
  resistanceCH1: number;
  resistanceCH2: number;
  resistanceCH3: number;
  resistanceCH4: number;
  resistanceCH5: number;
  resistanceCH6: number;
  travelT1: number;
  travelT2: number;
  travelT3: number;
  travelT4: number;
  travelT5: number;
  travelT6: number;
  currentCH1: number;
  currentCH2: number;
  currentCH3: number;
  currentCH4: number;
  currentCH5: number;
  currentCH6: number;
  coilCurrentC1: number;
  coilCurrentC2: number;
  coilCurrentC3: number;
  coilCurrentC4: number;
  coilCurrentC5: number;
  coilCurrentC6: number;
}

export interface TestResult {
  resistanceCH1Avg: number;
  resistanceCH2Avg: number;
  resistanceCH3Avg: number;
  resistanceCH4Avg: number;
  resistanceCH5Avg: number;
  resistanceCH6Avg: number;
  travelT1Max: number;
  travelT2Max: number;
  travelT3Max: number;
  travelT4Max: number;
  travelT5Max: number;
  travelT6Max: number;
  currentCH1Max: number;
  currentCH2Max: number;
  currentCH3Max: number;
  currentCH4Max: number;
  currentCH5Max: number;
  currentCH6Max: number;
  coilCurrentC1Avg: number;
  coilCurrentC2Avg: number;
  coilCurrentC3Avg: number;
  coilCurrentC4Avg: number;
  coilCurrentC5Avg: number;
  coilCurrentC6Avg: number;
  velocityT1Max: number;
  velocityT2Max: number;
  velocityT3Max: number;
  velocityT4Max: number;
  velocityT5Max: number;
  velocityT6Max: number;
}

export interface TestInfo {
  [key: string]: string;
}
