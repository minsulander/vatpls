export interface Controller {
  name: string;
  sign: string;
  cid: string;
  rating: "S1" | "S2" | "S3" | "C1" | "C3";
  callsign: string;
  frequency: string;
  position?: string;
  timestamp: string;
};

/** DB types */

type State = "PAUSE" | "ACTIVE" | "OTHER";

export interface IActivity {
  cid: string;
  callsign: string;
  position: string;
  session_start: Date;
  in_list: State
};

type Rating = "OBS" | "S1" | "S2" | "S3" | "C1" | "C3" | "I1";

export interface SkeletonController {
  cid: string;
  name: string,
  sign: string;
  rating: Rating;
};

export interface Endorsement {

};

export interface ActiveController extends SkeletonController {
  in_list: State;
};