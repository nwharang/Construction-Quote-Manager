import { redirect } from "next/navigation";
import { Card, CardHeader, CardBody } from "@nextui-org/react";
import { getServerAuthSession } from "~/server/auth-helpers";

export default async function ProfilePage() {
  const session = await getServerAuthSession();
  
  if (!session?.user) {
    // Redirect to sign in if not authenticated
    redirect("/auth/signin");
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>
      
      <Card className="max-w-lg">
        <CardHeader>
          <h2 className="text-xl">User Information</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <p className="text-default-500">Name</p>
              <p className="font-medium">{session.user.name}</p>
            </div>
            <div>
              <p className="text-default-500">Email</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
            <div>
              <p className="text-default-500">User ID</p>
              <p className="font-medium">{session.user.id}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 