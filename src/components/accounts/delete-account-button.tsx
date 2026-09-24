"use client";

import { DeleteButton } from "@/components/delete-button";
import { deleteAccountAction } from "@/lib/actions/accounts";

export function DeleteAccountButton({
  accountId,
  accountName,
}: {
  accountId: string;
  accountName: string;
}) {
  return (
    <DeleteButton
      action={() => deleteAccountAction(accountId)}
      title={`Delete ${accountName}?`}
      description="This also deletes every transaction linked to this account. This can't be undone."
    />
  );
}
