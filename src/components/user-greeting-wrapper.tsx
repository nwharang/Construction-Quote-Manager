import { auth } from "~/app/api/auth/[...nextauth]/auth";
import { UserGreeting } from "./user-greeting";

export async function UserGreetingWrapper() {
  const session = await auth();
  const userName = session?.user?.name ?? null;
  
  return <UserGreeting userName={userName} />;
} 