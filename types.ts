
export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  FETCHING_INFO = 'FETCHING_INFO',
  GENERATING_SPEECH = 'GENERATING_SPEECH',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export type AppState = AppStatus;

export interface GroundingChunk {
  web?: {
    // FIX: Made uri and title optional to match the library type, resolving the assignment error in geminiService.
    uri?: string;
    title?: string;
  };
}

export interface LandmarkInfo {
  text: string;
  sources: GroundingChunk[];
}
