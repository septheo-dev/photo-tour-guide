
import React from 'react';
import type { LandmarkInfo } from '../types';
import AudioPlayer from './AudioPlayer';
import { ArrowPathIcon, LinkIcon } from './Icons';

interface ResultDisplayProps {
  imageUrl: string;
  landmarkName: string;
  landmarkInfo: LandmarkInfo;
  audioData: string;
  onReset: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  imageUrl,
  landmarkName,
  landmarkInfo,
  audioData,
  onReset,
}) => {
  return (
    <div className="w-full animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          <img
            src={imageUrl}
            alt="Uploaded landmark"
            className="rounded-lg shadow-lg w-full h-auto object-cover max-h-[400px] border-4 border-slate-700"
          />
          <h2 className="text-3xl font-bold mt-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-400">{landmarkName}</h2>
        </div>
        <div className="flex flex-col">
          <AudioPlayer audioData={audioData} />
          <div className="bg-slate-900/50 p-4 rounded-lg mt-4 flex-grow max-h-[300px] overflow-y-auto border border-slate-700">
            <h3 className="text-xl font-semibold mb-2 text-slate-300">About this landmark:</h3>
            <p className="text-slate-400 whitespace-pre-wrap">{landmarkInfo.text}</p>
          </div>
           {landmarkInfo.sources.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-slate-300">Sources:</h4>
              <ul className="list-none p-0 mt-2 space-y-2">
                {/* FIX: Check for source.web.uri to ensure a valid link is available before rendering. */}
                {landmarkInfo.sources.map((source, index) => source.web && source.web.uri && (
                  <li key={index}>
                    <a
                      href={source.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                    >
                      <LinkIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{source.web.title || source.web.uri}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="text-center mt-8">
        <button
          onClick={onReset}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-sky-700 hover:to-indigo-700 transition-all shadow-lg"
        >
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          Analyze Another Photo
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay;
