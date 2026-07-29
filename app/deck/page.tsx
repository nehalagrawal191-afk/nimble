import { redirect } from "next/navigation";

/** Canonical deck entry — always land on the static keynote HTML. */
export default function DeckPage() {
  redirect("/slides/index.html");
}
