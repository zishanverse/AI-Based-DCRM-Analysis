const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const ACCESS_TOKEN_KEY = "dcrm.accessToken";
const USER_KEY = "dcrm.user";

export interface UserProfile {
  id: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!headers.has("Content-Type") && init.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const token = getStoredAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export async function login(stationId: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ station_id: stationId, password }),
  });

  persistAuth(data);
  return data;
}

export function persistAuth(payload: LoginResponse): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as UserProfile) : null;
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export interface DiagnosticsFeaturesResponse {
  features: string[];
}

export type DiagnosticsPayload = Record<string, number | string>;

export interface DiagnosticsResponse {
  diagnosis: string;
  confidence: number;
  secondary_diagnosis: string;
  probabilities: Record<string, number>;
  status: string;
}

export function getDiagnosticsFeatures() {
  return apiFetch<DiagnosticsFeaturesResponse>("/api/v1/diagnostics/features");
}

export function runDiagnostics(payload: DiagnosticsPayload) {
  return apiFetch<DiagnosticsResponse>("/api/v1/diagnostics/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface DiagnosticResult {
  rowIndex: number;
  diagnosis: string;
  confidence: number;
  secondary_diagnosis: string;
  probabilities: Record<string, number>;
  status: string;
}

export interface UploadResponse {
  assetId: string;
  publicId: string;
  secureUrl: string;
  bytes: number;
  format: string;
  diagnostics?: DiagnosticResult[];
  diagnosticsProcessedRows?: number;
  diagnosticsTotalRows?: number;
  advancedDiagnostics?: AdvancedDiagnosticResultDto[];
  waveformPreview?: WaveformPreviewDto;
}

export function uploadCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<UploadResponse>("/api/v1/uploads", {
    method: "POST",
    body: formData,
  });
}

export interface ClassifierResultDto {
  label: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface AutoencoderResultDto {
  isAnomaly: boolean;
  reconstructionError: number;
  threshold: number;
}

export interface AdvancedDiagnosticResultDto {
  rowIndex: number;
  xgboost: ClassifierResultDto;
  adaboost: ClassifierResultDto;
  autoencoder: AutoencoderResultDto;
}

export interface AdvancedModelArtifactDto {
  name: string;
  kind: string;
  sizeBytes: number;
  modifiedAt: string;
}

export interface AdvancedModelsStatusDto {
  directory: string;
  artifactCount: number;
  featureCount: number;
  classLabels: string[];
  availableModels: string[];
  artifacts: AdvancedModelArtifactDto[];
}

export interface AdvancedFeaturesResponseDto {
  features: string[];
  classLabels: string[];
  artifactCount: number;
  availableModels: string[];
}

export interface AdvancedPredictionPayload {
  features: Record<string, string | number>;
}

export interface AdvancedPredictionEnvelopeDto {
  requestedAt: string;
  featuresUsed: string[];
  availableModels: string[];
  result: AdvancedDiagnosticResultDto;
}

export interface AdvancedBatchRequest {
  rows: Record<string, string | number>[];
}

export interface AdvancedBatchEnvelopeDto {
  requestedAt: string;
  rowCount: number;
  availableModels: string[];
  results: AdvancedDiagnosticResultDto[];
}

export interface WaveformPointDto {
  timeMs: number;
  values: Record<string, number | null | undefined>;
}

export interface WaveformPreviewDto {
  rowCount: number;
  sourceName?: string;
  valueColumns: string[];
  columnMap?: Record<string, string>;
  points: WaveformPointDto[];
}

export function getAdvancedModelStatus() {
  return apiFetch<AdvancedModelsStatusDto>("/api/v1/new-models/status");
}

export function getAdvancedModelFeatures() {
  return apiFetch<AdvancedFeaturesResponseDto>("/api/v1/new-models/features");
}

export function runAdvancedModelSuite(features: AdvancedPredictionPayload["features"]) {
  return apiFetch<AdvancedPredictionEnvelopeDto>("/api/v1/new-models/predict", {
    method: "POST",
    body: JSON.stringify({ features }),
  });
}

export function runAdvancedBatchSuite(rows: AdvancedBatchRequest["rows"]) {
  return apiFetch<AdvancedBatchEnvelopeDto>("/api/v1/new-models/batch", {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
}

export interface HeatmapPointDto {
  lat: number;
  lon: number;
  intensity: number;
  severity: number;
  status: string;
  deviceId: string;
  timestamp: string | null;
  healthScore: number | null;
}

export interface HeatmapResponse {
  points: HeatmapPointDto[];
  total: number;
  generatedAt: string;
}

export function getHeatmapPoints(limit = 256) {
  const params = new URLSearchParams({ limit: String(limit) });
  return apiFetch<HeatmapResponse>(`/api/v1/heatmap/points?${params.toString()}`);
}
