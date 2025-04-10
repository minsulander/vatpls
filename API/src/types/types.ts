export interface Controller {
  name: string;
  sign: string;
  cid: string;
  rating: Rating;
  callsign: string;
  frequency: string;
  position?: string;
  timestamp: string;
};

/** DB types */

export type State = "PAUSE" | "ACTIVE" | "OTHER";

// in
export interface IActivity {
  cid: string;
  callsign?: string;
  position?: string;
  in_list: State
};

// out
export interface OActivity {
  cid: string;
  callsign: string;
  position: string;
  session_start: Date;
  in_list: State
};

export type Rating = "OBS" | "S1" | "S2" | "S3" | "C1" | "C3" | "I1";

export interface SkeletonController {
  cid: string;
  name: string,
  sign: string;
  rating: Rating;
};

export type Endorsement = 'NIL' | 'T1 APP' | 'T2 APS' | 'T1 TWR' | 'SOLO GG TWR' | 'SOLO GG APP';

export interface NewController extends SkeletonController {
  endorsement: Endorsement[];
};

export interface ActiveController extends SkeletonController {
  in_list: State;
};

export interface OActive extends SkeletonController {
  callsign: string;
  position: string;
  endorsements: string;
  timestamp: string;
  in_list: State;
}