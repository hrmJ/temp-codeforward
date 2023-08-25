import { component$ } from "@builder.io/qwik";

export default component$<{ open: boolean }>((props) => {
  return (
    <dialog open={props.open}>
      What would you like to hear about:
      <textarea></textarea>
      <button>Let us know!</button>
    </dialog>
  );
});
