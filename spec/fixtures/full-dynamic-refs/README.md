# Reference-resolution fixtures

The regression matrix reuses `dynamicRef.json` and `recursiveRef.json` from the repository's existing JSON-Schema-Test-Suite submodule. The normal JSON Schema runner also exercises both drafts with `fullDynamicRefs` enabled, without the legacy reference-related skips.

`dynamicRef-extra.json`, `recursiveRef-extra.json`, and the schema in `remotes.json` supplement that pinned suite with cases from commit `c9510e3bf8a896c3cba4e08509cf752b4f30dff8`: pointer/boolean targets, detached anchors, intermediate resource scopes, the revised multiple-path dynamic case, and recursive cases using absolute IDs/direct resource references. These are published draft-2020-12 and draft-2019-09 cases, not draft-next. Existing cases with only description, dialect declaration, or equivalent URI-prefix changes are not duplicated. The upstream license is included as `LICENSE-test-suite`.

The OpenAPI document and schema-base fixtures are the published 3.1 schemas dated 2025-11-23; their dialect and vocabulary schemas are dated 2024-11-10. See <https://spec.openapis.org/oas/>. The OpenAPI license is included as `LICENSE-openapi`.

The focused tests inline the minimal reproduction of <https://github.com/ajv-validator/ajv/issues/1745>, a generic template, and an OpenAPI document. Both valid and invalid instances are tested to avoid mistaking permissive validation for correct reference resolution.
