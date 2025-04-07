import '@playwright/test';

declare global {
  namespace PlaywrightTest {
    interface Matchers<R, T> {
      /**
       * Checks if the received value is included in the expected array.
       * @param expected An array of expected values.
       */
      toBeOneOf(expected: T[]): R;
    }
  }
} 