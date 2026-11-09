import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/layouts/RootLayout";
import { useFetch } from "@/hooks/useFetch";
import { websiteStatus, requestWebsiteAccess } from "@/services/websiteAccess";
import { Button } from "@/components/ui/button";
import { DetailSkeleton } from "@/components/PageSkeleton";
import { Heading, Status, ErrorState } from "@/components/AccessUI";
import Home from "@/pages/Home";
import { toast } from "sonner";

export const route = {
  path: "/website-access",
  layout: "owner",
  access: "authenticated",
};

export const nav = {
  label: "Website account & access",
  icon: "Globe",
  order: 15,
  profiles: null,
};

export default function WebsiteAccess() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const { data, loading, error, run } = useFetch(websiteStatus, [user.userId || user.Id]);

  async function request() {
    setSaving(true);
    try {
      await requestWebsiteAccess();
      toast.success("Website request saved. The owner can now review it.");
      run();
    } catch (failure) {
      toast.error(failure.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <Heading
        title="Website account & access"
        description="Use the same account as your app. Website approval is recorded separately from phone approval."
      />
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-sm text-muted-foreground">
          {user.emailAddress || user.Email || user.Name}
        </p>
        {error ? (
          <ErrorState error={error} retry={run} />
        ) : loading && data === undefined ? (
          <DetailSkeleton />
        ) : (
          <div aria-busy={loading} className="space-y-4">
            <Status value={data?.status === "not-requested" ? "pending" : data?.status || "pending"} />
            <p className="text-sm text-muted-foreground">
              {data?.status === "not-requested"
                ? "Send a request for this browser."
                : "The saved status above belongs to this browser and account."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button disabled={saving || loading} onClick={request}>
                {saving ? "Saving request…" : "Request website access"}
              </Button>
              <Button variant="outline" disabled={saving || loading} onClick={run}>
                Check approval
              </Button>
            </div>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Website data delivery is still being connected to this approval system.
          An approved request does not yet unlock the separate clinical hosting.
        </p>
      </section>
      {user.profile === "Owner_c" && (
        <section className="space-y-4">
          <h2 className="font-heading text-xl">Owner controls</h2>
          <p className="text-sm text-muted-foreground">
            Website requests start with “Website”. Open a request to approve, reject or revoke access.
          </p>
          <Home />
          <Link to="/grants" className="text-primary underline">View saved grants</Link>
        </section>
      )}
    </div>
  );
}
