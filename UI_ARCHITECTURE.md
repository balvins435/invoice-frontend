# Frontend UI Architecture

## Layers

```text
App Router pages and layouts
        |
Feature components and data hooks
        |
components/ui primitives
        |
Tailwind theme and global design tokens
```

The `components/ui` package is domain-independent. It must not fetch data, import
route-specific business models, or make navigation decisions. Pages and feature
components own data and workflows, then compose shared primitives.

## Core APIs

### Button

```tsx
<Button variant="primary" loading={saving} disabled={!isValid} onClick={save}>
  Save invoice
</Button>
```

Loading sets `aria-busy`, disables duplicate submissions, and renders a consistent
progress indicator. Variants are `primary`, `secondary`, `danger`, `destructive`,
`outline`, `ghost`, and `link`.

### Input

```tsx
<Input
  id="client-email"
  label="Client email"
  type="email"
  autoComplete="email"
  error={errors.email}
  {...register('client_email')}
/>
```

Labels, validation messages, `aria-invalid`, and `aria-describedby` are connected
automatically. Password fields expose an accessible visibility toggle.

### Data states

```tsx
if (loading) return <LoadingState title="Loading invoices" />;
if (error) return <ErrorState description={error.message} onAction={refetch} />;
if (!invoices.length) return (
  <EmptyState
    title="No invoices yet"
    description="Create your first invoice to start billing customers."
    action={<Button onClick={openCreate}>Create invoice</Button>}
  />
);
```

`LoadingState`, `EmptyState`, and `ErrorState` provide consistent live regions,
recovery behavior, messaging, and responsive spacing.

### Page composition

`Page`, `PageHeader`, and `SectionHeader` standardize maximum width, responsive
padding, heading hierarchy, descriptions, and action placement.

### Modal

The modal exposes dialog semantics, escape handling, scroll locking, initial focus,
focus restoration, labelled titles/descriptions, and an accessible close control.

## Production conventions

- Every data surface handles loading, error, empty, and populated states explicitly.
- Loading controls prevent duplicate mutations and preserve their visible label.
- Icon-only controls require an accessible name.
- Forms use persistent labels; placeholders never replace labels.
- Tables must have semantic headers and a responsive card/list alternative when
  horizontal scrolling would hide primary actions.
- Use server pagination or virtualized rendering for unbounded datasets.
- Shared components accept native element props so product code keeps full browser
  and testing-library compatibility.
- Pages should import public components from `@/components/ui`, not private files.
