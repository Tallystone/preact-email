import type { Scenarios } from '@tallystone/preact-email';

export type TestScenarios<Props> = Array<Scenarios<Props>[number] & {
  contains: string[];
  excludes: string[];
  asyncOnly?: boolean;
}>;
