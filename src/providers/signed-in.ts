import { createContext, useContext } from 'react';

/** Separate from AuthProvider so public screens can ask without owning auth. */
export const SignedInContext = createContext(false);
export const useSignedIn = () => useContext(SignedInContext);
