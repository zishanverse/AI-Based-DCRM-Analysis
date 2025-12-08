import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { 
  Upload, 
  FileCheck, 
  FileX, 
  Trash2, 
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface DcrmFileUploadProps {
  visible: boolean;
  file: File | null;
  loading: boolean;
  error: string | null;
  stations: any[];
  breakers: any[];
  selectedStation: string;
  selectedBreaker: string;
  selectedBreakerDetails: any;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStationChange: (val: string) => void;
  onBreakerChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReferenceFileUpdated?: () => void; // Callback to refresh breaker details
}

export function DcrmFileUpload({
  visible,
  file,
  loading,
  error,
  stations,
  breakers,
  selectedStation,
  selectedBreaker,
  selectedBreakerDetails,
  onFileChange,
  onStationChange,
  onBreakerChange,
  onSubmit,
  onReferenceFileUpdated,
}: DcrmFileUploadProps) {
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [referenceSuccess, setReferenceSuccess] = useState<string | null>(null);
  const [showReferenceUpload, setShowReferenceUpload] = useState(false);

  if (!visible) return null;

  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setReferenceError("Please select a CSV file");
        setReferenceFile(null);
        return;
      }
      setReferenceFile(selectedFile);
      setReferenceError(null);
      setReferenceSuccess(null);
    }
  };

  const handleReferenceUpload = async () => {
    if (!referenceFile || !selectedBreaker) {
      setReferenceError("Please select a reference file");
      return;
    }

    setUploadingReference(true);
    setReferenceError(null);
    setReferenceSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", referenceFile);

      const response = await fetch(
        `/api/breakers/${selectedBreaker}/reference-file`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        setReferenceSuccess(result.message);
        setReferenceFile(null);
        setShowReferenceUpload(false);
        
        // Reset file input
        const fileInput = document.getElementById('reference-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Callback to refresh breaker details
        if (onReferenceFileUpdated) {
          onReferenceFileUpdated();
        }
      } else {
        setReferenceError(result.error || "Failed to upload reference file");
      }
    } catch (err) {
      console.error("Reference upload error:", err);
      setReferenceError("Network error. Please try again.");
    } finally {
      setUploadingReference(false);
    }
  };

  const handleDeleteReference = async () => {
    if (!selectedBreaker) return;
    
    if (!confirm("Are you sure you want to remove the reference file? This will affect future test comparisons.")) {
      return;
    }

    setUploadingReference(true);
    setReferenceError(null);

    try {
      const response = await fetch(
        `/api/breakers/${selectedBreaker}/reference-file`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        setReferenceSuccess("Reference file removed successfully");
        if (onReferenceFileUpdated) {
          onReferenceFileUpdated();
        }
      } else {
        setReferenceError(result.error || "Failed to remove reference file");
      }
    } catch (err) {
      console.error("Reference delete error:", err);
      setReferenceError("Network error. Please try again.");
    } finally {
      setUploadingReference(false);
    }
  };

  const hasReferenceFile = selectedBreakerDetails?.dataSource;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Upload Test CSV File</CardTitle>
        <CardDescription>
          Select a DCRM test CSV file to analyze and compare with reference data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Station and Breaker Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="station-select">Station</Label>
              <Select onValueChange={onStationChange} value={selectedStation}>
                <SelectTrigger id="station-select">
                  <SelectValue placeholder="Select Station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breaker-select">Breaker</Label>
              <Select
                onValueChange={onBreakerChange}
                value={selectedBreaker}
                disabled={!selectedStation}
              >
                <SelectTrigger id="breaker-select">
                  <SelectValue placeholder="Select Breaker" />
                </SelectTrigger>
                <SelectContent>
                  {breakers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Breaker Details and Reference File Management */}
          {selectedBreakerDetails && (
            <div className="space-y-4">
              {/* Breaker Details Card */}
              <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-blue-800">
                    Breaker Details
                  </h3>
                  {hasReferenceFile && (
                    <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" />
                      Reference Available
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="font-medium">Manufacturer:</span>{" "}
                    {selectedBreakerDetails.manufacturer}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>{" "}
                    {selectedBreakerDetails.type}
                  </div>
                  <div>
                    <span className="font-medium">Voltage:</span>{" "}
                    {selectedBreakerDetails.voltage} kV
                  </div>
                  <div>
                    <span className="font-medium">Model:</span>{" "}
                    {selectedBreakerDetails.model || "N/A"}
                  </div>
                </div>
              </div>

              {/* Reference File Section */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-800">
                      Ideal/Reference File
                    </h4>
                  </div>
                  
                  {hasReferenceFile && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReferenceUpload(!showReferenceUpload)}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Update
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteReference}
                        disabled={uploadingReference}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  )}
                  
                  {!hasReferenceFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReferenceUpload(!showReferenceUpload)}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload Reference
                    </Button>
                  )}
                </div>

                {/* Current Reference File Info */}
                {hasReferenceFile && !showReferenceUpload && (
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">File Name:</span>
                      <span className="text-gray-900">
                        {selectedBreakerDetails.dataSource.fileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">Status:</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                        <CheckCircle className="w-3 h-3" />
                        {selectedBreakerDetails.dataSource.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      URL: {selectedBreakerDetails.dataSource.fileUrl}
                    </div>
                  </div>
                )}

                {/* No Reference File Message */}
                {!hasReferenceFile && !showReferenceUpload && (
                  <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>
                      No reference file uploaded. Upload an ideal CSV file to enable
                      comparison analysis for future tests.
                    </p>
                  </div>
                )}

                {/* Reference File Upload Form */}
                {showReferenceUpload && (
                  <div className="space-y-3 mt-3 pt-3 border-t">
                    <div>
                      <Label htmlFor="reference-file" className="text-sm">
                        {hasReferenceFile ? 'Update' : 'Upload'} Reference CSV File
                      </Label>
                      <Input
                        id="reference-file"
                        type="file"
                        accept=".csv"
                        onChange={handleReferenceFileChange}
                        className="mt-1"
                      />
                      {referenceFile && (
                        <p className="text-xs text-gray-600 mt-1">
                          Selected: {referenceFile.name}
                        </p>
                      )}
                    </div>

                    {referenceError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{referenceError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleReferenceUpload}
                        disabled={!referenceFile || uploadingReference}
                        size="sm"
                      >
                        {uploadingReference ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-1" />
                            {hasReferenceFile ? 'Update' : 'Upload'}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowReferenceUpload(false);
                          setReferenceFile(null);
                          setReferenceError(null);
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {referenceSuccess && (
                  <Alert className="mt-3 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {referenceSuccess}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Test CSV File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Test CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={onFileChange}
              required
            />
            {file && (
              <p className="text-xs text-gray-600">
                Selected: {file.name}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={loading || !file || !selectedBreaker}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Analyze Test Data"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}