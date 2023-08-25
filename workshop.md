## Points

- say out loud to attendees: what is the focus?
- what's the difference?
- why on earth?
- multiple options: how far do you want to start?
- sustainability angle?
- web version: set up a link for sandbox
- show live view of dom inspector

## What to show

- how fast is it to interact with?
- some huge, silly re-render thing from react

## Setting up the project

# Getting started

```
npm create qwik@latest

```

# Route loaders

https://qwik.builder.io/docs/route-loader/

> Route Loaders can only be declared inside the src/routes folder,
> in a layout.tsx or index.tsx file, and they MUST be exported.

CHeckout useResource for non-ssr
console.log("moro")

# Gotchas

```
if you extract the event handler then you must manually wrap the event handler in the $(...handler...) so that it can be lazy attached.
```
