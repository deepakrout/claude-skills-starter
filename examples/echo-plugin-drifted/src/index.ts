import { registerPlugin } from '@capacitor/core';

export interface EchoPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}

export const Echo = registerPlugin<EchoPlugin>('Echo');
