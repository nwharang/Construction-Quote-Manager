import Link from "next/link";
import { Button, Card, CardBody, CardFooter, CardHeader } from "@nextui-org/react";
import { getServerAuthSession } from "~/server/auth-helpers";
import { Building2, FileText, ShoppingCart } from "lucide-react";

export default async function HomePage() {
  const session = await getServerAuthSession();

  return (
    <div className="container mx-auto py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Construction Quote Manager</h1>
        <p className="mx-auto max-w-2xl text-xl text-default-500">
          A simple, fast tool for construction workers to create job quotes.
        </p>
      </div>

      {session ? (
        <div>
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="flex flex-col">
              <CardHeader className="flex-row gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-bold">Manage Quotes</h2>
              </CardHeader>
              <CardBody>
                <p>View, create, and manage your construction quotes in one place.</p>
              </CardBody>
              <CardFooter>
                <Button as={Link} href="/quotes" color="primary" fullWidth>
                  View Quotes
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="flex-row gap-3">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-bold">Materials Catalog</h2>
              </CardHeader>
              <CardBody>
                <p>Maintain your product catalog for easy reference when creating quotes.</p>
              </CardBody>
              <CardFooter>
                <Button as={Link} href="/products" color="primary" fullWidth>
                  Manage Products
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="flex-row gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <h2 className="text-xl font-bold">Create New Quote</h2>
              </CardHeader>
              <CardBody>
                <p>Quickly create a new quote for your next construction project.</p>
              </CardBody>
              <CardFooter>
                <Button as={Link} href="/quotes/new" color="primary" fullWidth>
                  New Quote
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Card className="max-w-md">
            <CardHeader>
              <h2 className="text-2xl font-bold">Get Started</h2>
            </CardHeader>
            <CardBody>
              <p className="mb-4">
                Sign in to access your account and manage your construction quotes. New users can create an account to get started.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button as={Link} href="/auth/signin" color="primary" fullWidth>
                  Sign In
                </Button>
                <Button as={Link} href="/auth/signup" variant="flat" fullWidth>
                  Create Account
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
