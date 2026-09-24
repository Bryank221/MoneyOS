import { requireUser } from "@/lib/auth/session";
import { listCategories } from "@/lib/data/categories";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryManager } from "@/components/settings/category-manager";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const user = await requireUser();
  const categories = await listCategories(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account and categories." />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Default currency</p>
            <p className="font-medium">MYR (RM)</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Log out
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
