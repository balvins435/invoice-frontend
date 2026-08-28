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

## Feature-first clean architecture

New product work lives under `features/<feature>` and follows dependency direction:

```text
app/                         Route adapters and framework composition
features/
  dashboard/
    domain/                  Pure business rules, selectors, value normalization
    application/             Use cases and orchestration hooks
    infrastructure/          API and persistence adapters
    presentation/            Screens and feature-owned UI components
components/
  ui/                        Domain-independent design-system primitives
  business/                  Shared cross-feature business components
lib/                         Platform services, routing, session, HTTP client
types/                       Shared transport and domain contracts during migration
```

Dependencies point inward: presentation may call application code; application may
depend on domain contracts and injected infrastructure interfaces; domain code must
not import React, Next.js, Axios, browser storage, or UI components. App Router pages
should normally render one feature screen and contain no product logic.

The dashboard is the reference slice. `DashboardRepository` isolates the current
Axios service, `useDashboard` owns orchestration and async state, domain selectors
normalize API values, and presentation components render metrics and activity.
Future features should follow this structure incrementally rather than moving the
entire repository in one high-risk rewrite.

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

## Component contracts

### Modal

```tsx
<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Delete invoice"
  description="This action cannot be undone."
  size="sm"
  closeOnBackdrop={false}
>
  <DeleteInvoiceForm />
</Modal>
```

The dialog traps keyboard focus, closes on Escape, restores focus to the trigger,
locks background scrolling, and exposes stable title and description relationships.
Use `initialFocusRef` when the first interactive element is not the correct initial
focus target. Disable backdrop dismissal for destructive or multi-step workflows.

### Card composition

```tsx
<Card>
  <CardHeader>
    <div>
      <CardTitle>Recent invoices</CardTitle>
      <CardDescription>Latest activity for the active business.</CardDescription>
    </div>
    <Button variant="secondary" size="sm">View all</Button>
  </CardHeader>
  <CardContent>{/* bounded list or table */}</CardContent>
</Card>
```

Prefer composable card parts for product surfaces. The convenience `title`,
`subtitle`, and `actions` props remain supported for compact cases.

## State decision order

Resolve async screens in this order so stale data does not flash or disappear:

1. Initial loading with no usable data.
2. Blocking error with a recovery action.
3. Missing prerequisite, such as no business profile.
4. Required user choice, such as selecting one of several businesses.
5. Empty collection or empty filtered result.
6. Populated content, optionally with a non-blocking refresh indicator.

Empty filtered results should offer “Clear filters”; true empty datasets should
offer the primary creation action. Never describe a required selection as missing
data.

## API design rules

- Extend the native HTML props for the underlying element and forward its ref.
- Export prop interfaces for documentation, wrappers, and Storybook-style tooling.
- Keep domain data and network requests outside `components/ui`.
- Use semantic colors only when they communicate status or meaning.
- Keep icon-only controls at least 36 by 36 pixels and give them an accessible name.
- Preserve visible button labels during loading and set `aria-busy`.
- Connect labels, hints, and errors with stable generated IDs.
- Test keyboard navigation, 200% zoom, narrow mobile widths, dark mode, and long text.
