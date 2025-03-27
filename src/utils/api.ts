import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "~/server/api/root";

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = {
  [TKey in keyof AppRouter]: {
    [TPath in keyof AppRouter[TKey]]: AppRouter[TKey][TPath] extends {
      input: infer Input;
    }
      ? Input
      : never;
  };
};

/**
 * Inference helper for outputs.
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = {
  [TKey in keyof AppRouter]: {
    [TPath in keyof AppRouter[TKey]]: AppRouter[TKey][TPath] extends {
      _def: { output: infer Output };
    }
      ? Output
      : never;
  };
}; 