//
import { component$, useSignal } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import SuggestionPopup from "~/components/suggestion-popup";
import type { Repo } from "~/types";

export const useGuildList = routeLoader$(async () => {
  const reposUrl =
    "https://api.github.com/orgs/knowit-finland-javascript-guild/repos";
  const response = await fetch(reposUrl, {
    headers: { Accept: "application/json" },
  });
  return (await response.json()) as Repo[];
});

export default component$(() => {
  const guildListSignal = useGuildList();
  const suggestionOpen = useSignal(false);
  return (
    <section>
      <SuggestionPopup open={suggestionOpen.value} />
      <button onClick$={() => (suggestionOpen.value = !suggestionOpen.value)}>
        Suggest a guild
      </button>
      <ul>
        {guildListSignal.value.map((repo) => (
          <li key={repo.id}>
            {repo.name}
            <button>Rate this guild</button>
          </li>
        ))}
      </ul>
    </section>
  );
});
