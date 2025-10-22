
import React, { useState, useCallback } from 'react';
import { analyzeImage, fetchLandmarkInfo, generateSpeech } from './services/geminiService';
import type { LandmarkInfo, AppState } from './types';
import { AppStatus } from './types';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { CameraIcon, SparklesIcon, GlobeAltIcon, SpeakerWaveIcon } from './components/Icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [landmarkName, setLandmarkName] = useState<string | null>(null);
  const [landmarkInfo, setLandmarkInfo] = useState<LandmarkInfo | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          resolve('');
        }
      };
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleImageUpload = useCallback(async (file: File) => {
    setError(null);
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setAppState(AppStatus.ANALYZING);

    try {
      const imagePart = await fileToGenerativePart(file);

      // Step 1: Analyze image to get landmark name
      const name = await analyzeImage(imagePart);
      setLandmarkName(name);
      setAppState(AppStatus.FETCHING_INFO);

      // Step 2: Fetch landmark info using search grounding
      const info = await fetchLandmarkInfo(name);
      setLandmarkInfo(info);
      setAppState(AppStatus.GENERATING_SPEECH);

      // Step 3: Generate speech from the fetched info
      const audio = await generateSpeech(info.text);
      setAudioData(audio);
      setAppState(AppStatus.RESULT);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAppState(AppStatus.ERROR);
    }
  }, []);

  const handleReset = () => {
    setAppState(AppStatus.IDLE);
    setError(null);
    setImageFile(null);
    setImageUrl(null);
    setLandmarkName(null);
    setLandmarkInfo(null);
    setAudioData(null);
    if(imageUrl) URL.revokeObjectURL(imageUrl);
  };
  
  const renderContent = () => {
    switch (appState) {
      case AppStatus.IDLE:
        return <ImageUploader onImageUpload={handleImageUpload} />;
      case AppStatus.ANALYZING:
        return <LoadingSpinner text="Identifying landmark..." icon={<SparklesIcon className="w-8 h-8 mr-3" />} />;
      case AppStatus.FETCHING_INFO:
        return <LoadingSpinner text="Gathering historical facts..." icon={<GlobeAltIcon className="w-8 h-8 mr-3" />} />;
      case AppStatus.GENERATING_SPEECH:
        return <LoadingSpinner text="Creating audio narration..." icon={<SpeakerWaveIcon className="w-8 h-8 mr-3" />} />;
      case AppStatus.RESULT:
        if (imageUrl && landmarkName && landmarkInfo && audioData) {
          return (
            <ResultDisplay
              imageUrl={imageUrl}
              landmarkName={landmarkName}
              landmarkInfo={landmarkInfo}
              audioData={audioData}
              onReset={handleReset}
            />
          );
        }
        // Fallback to error if data is missing
        setError("Something went wrong while processing the results.");
        setAppState(AppStatus.ERROR);
        return null;
      case AppStatus.ERROR:
        return (
          <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
            <h2 className="text-2xl font-bold text-red-400 mb-4">An Error Occurred</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-2">
                <CameraIcon className="w-12 h-12 text-sky-400" />
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
                    Gemini Photo Tour Guide
                </h1>
            </div>
          <p className="text-slate-400 text-lg">Your AI-powered travel companion.</p>
        </header>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl shadow-2xl p-4 md:p-8 min-h-[50vh] flex items-center justify-center">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center text-slate-500 mt-8">
        <p>Built with React, Gemini, and Tailwind CSS.</p>
      </footer>
    </div>
  );
};

export default App;
