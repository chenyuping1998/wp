export type BloodMoonReviewWindow=Window&{
 bloodMoonReviewAudio?:()=>Promise<MediaStream>;
 bloodMoonReviewWin?:()=>Promise<void>;
 bloodMoonReviewPrepare?:()=>Promise<void>;
 bloodMoonReviewBegin?:()=>boolean;
 bloodMoonReviewEnd?:()=>void;
 bloodMoonReviewCaptureFrame?:()=>void;
};
