export type PortalName = 'admin' | 'transport';

export interface PortalSession {
  portal: PortalName;
  account: string;
  displayName: string;
  signedInAt: string;
}

export interface TransportRegistrationInput {
  displayName: string;
  account: string;
  password: string;
}
