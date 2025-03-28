// Import the authOptions object which is used by server components that need auth
import { authOptions } from "~/pages/api/auth/[...nextauth]";

// Export auth functions for server-side usage
export { authOptions }; 